/// <reference path="../types/passport.d.ts" />
import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import UserModel, { IUser } from '../models/User';
import { createToken, requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { sendPasswordResetEmail, sendWelcomeEmail, sendLoginAlertEmail } from '../services/emailService';
import { sendPushNotification } from '../services/pushNotificationService';
import { upload, uploadBufferToCloudinary } from '../services/cloudinaryService';
import passport from 'passport';
import { OAuth2Client } from 'google-auth-library';

const router = Router();
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const isGoogleOAuthConfigured =
  !!googleClientId &&
  !!googleClientSecret &&
  googleClientId !== 'dummy_client_id' &&
  googleClientSecret !== 'dummy_client_secret';

const getClientInfo = (req: Request) => {
  const userAgent = req.headers['user-agent'] || 'Unknown Agent';
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';

  let browser = 'Modern Browser';
  if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edg')) browser = 'Edge';
  else if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';

  let os = 'Unknown OS';
  if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
  else if (userAgent.includes('Android')) os = 'Android';

  return { ip, device: `${browser} on ${os}`, browser, os };
};

const handlePostLoginSecurity = async (user: IUser, req: Request) => {
  try {
    const { ip, device, browser, os } = getClientInfo(req);
    const existingHistory = user.loginHistory || [];
    const isKnown = existingHistory.some((h) => h.ip === ip || h.device === device);
    const isNewDevice = !isKnown && existingHistory.length > 0;

    user.loginHistory.unshift({
      ip,
      device,
      browser,
      os,
      loggedInAt: new Date(),
      isNewDevice,
    });
    if (user.loginHistory.length > 20) {
      user.loginHistory = user.loginHistory.slice(0, 20);
    }
    await user.save();

    // Trigger Login Email Alert asynchronously
    sendLoginAlertEmail({
      email: user.email,
      name: user.name,
      ip,
      device,
      browser,
      os,
      time: new Date(),
      isNewDevice,
    }).catch((err) => console.error('[Auth] Error sending login alert email:', err));

    // Trigger FCM Push notification if fcmToken is stored
    if (user.fcmToken) {
      sendPushNotification({
        token: user.fcmToken,
        title: isNewDevice ? '⚠️ Security Alert' : '🔐 Login Alert',
        body: isNewDevice
          ? `New login detected from ${device} (${ip})`
          : `Signed in successfully on ${device}`,
      }).catch((err) => console.error('[Auth] Error sending login push:', err));
    }
  } catch (err) {
    console.error('[Auth] Error recording login history:', err);
  }
};

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  collegeName: z.string().optional(),
  department: z.string().optional(),
  year: z.string().optional(),
});

const loginSchema = z.object({
  email: z.email('Enter a valid email').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const serializeUser = (user: IUser) => ({
  id: (user._id as { toString(): string }).toString(),
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  collegeName: user.collegeName,
  department: user.department,
  year: user.year,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  points: user.points || 0,
  badges: user.badges || [],
  reputation: user.reputation || 100,
  savedItems: user.savedItems || [],
  loginHistory: user.loginHistory || [],
  notificationPreferences: user.notificationPreferences || { email: true, push: true, sms: false },
});

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('[Signup] Request body received:', JSON.stringify({ ...req.body, password: '***', confirmPassword: '***' }));
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('[Signup] Validation failed:', parsed.error.issues);
      res.status(400).json({ message: parsed.error.issues[0]?.message || 'Invalid signup details' });
      return;
    }
    const { name, email, password, phone, collegeName, department, year } = parsed.data;
    console.log('[Signup] Validation passed for email:', email);
    const existing = await UserModel.findOne({ email });
    if (existing) {
      console.log('[Signup] Duplicate email:', email);
      res.status(409).json({ message: 'An account with this email already exists' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await UserModel.create({ name, email, password: hashedPassword, phone, collegeName, department, year });
    console.log('[Signup] User created successfully:', user._id.toString(), email);
    
    // Asynchronously send Welcome Email
    sendWelcomeEmail(email, name).catch((err) => console.error('[Signup] Error sending welcome email:', err));
    await handlePostLoginSecurity(user, req);

    const token = createToken(user);
    res.status(201).json({ message: 'Signup successful', token, user: serializeUser(user) });
  } catch (error) {
    console.error('[Signup] Error:', error);
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message || 'Invalid login details' });
      return;
    }
    const { email, password } = parsed.data;
    const user = await UserModel.findOne({ email }).select('+password');
    if (!user || !user.password) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    if (user.isBlocked) {
      res.status(403).json({ message: 'Your account has been blocked.' });
      return;
    }
    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    await handlePostLoginSecurity(user, req);
    const token = createToken(user);
    res.json({ message: 'Login successful', token, user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

const getClientUrl = (req: Request): string => {
  const envOrigins = (
    process.env.CLIENT_URL ||
    'https://campusconnect-app-eight.vercel.app,http://localhost:5173,http://localhost:5174,http://localhost:5175'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const referer = req.headers.referer || req.headers.origin;
  if (referer) {
    try {
      const parsed = new URL(referer as string);
      const origin = `${parsed.protocol}//${parsed.host}`;
      if (
        envOrigins.includes(origin) ||
        /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin) ||
        parsed.hostname === 'campusconnect-app-eight.vercel.app' ||
        parsed.hostname.endsWith('.vercel.app')
      ) {
        return origin;
      }
    } catch (e) {
      // fallback
    }
  }

  const productionOrigin = envOrigins.find(
    (o) => !o.includes('localhost') && !o.includes('127.0.0.1'),
  );
  return productionOrigin || envOrigins[0] || 'https://campusconnect-app-eight.vercel.app';
};

const getTargetClientUrlFromRequest = (req: Request): string => {
  const state = req.query.state;
  if (state && typeof state === 'string') {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      if (decoded?.clientUrl && typeof decoded.clientUrl === 'string') {
        const origin = decoded.clientUrl.trim().replace(/\/+$/, '');
        if (
          origin === 'https://campusconnect-app-eight.vercel.app' ||
          origin.endsWith('.vercel.app') ||
          /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin)
        ) {
          return origin;
        }
      }
    } catch {
      // fallback
    }
  }
  return getClientUrl(req);
};

// GET /api/auth/google
router.get('/google', (req: Request, res: Response, next: NextFunction) => {
  const targetClientUrl =
    (typeof req.query.clientUrl === 'string' && req.query.clientUrl.trim().replace(/\/+$/, '')) ||
    (typeof req.query.returnTo === 'string' && req.query.returnTo.trim().replace(/\/+$/, '')) ||
    getClientUrl(req);

  if (!isGoogleOAuthConfigured) {
    return res.redirect(
      `${targetClientUrl}/login?error=${encodeURIComponent(
        'Google Sign-In is not configured for this environment. Please sign in with email and password or add the Google OAuth credentials.',
      )}`,
    );
  }

  const statePayload = Buffer.from(JSON.stringify({ clientUrl: targetClientUrl })).toString('base64');

  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    session: false,
    state: statePayload,
  })(req, res, next);
});

// GET /api/auth/google/callback
router.get('/google/callback', (req: Request, res: Response, next: NextFunction) => {
  const targetClientUrl = getTargetClientUrlFromRequest(req);
  console.log('[Google OAuth Callback] Received OAuth callback, redirecting to frontend origin:', targetClientUrl);
  
  passport.authenticate('google', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      console.error('[Google OAuth Callback] Passport authentication error:', err?.message || err);
      const errorMsg = encodeURIComponent(
        err?.message?.includes('invalid_client')
          ? 'Google OAuth is not configured correctly. Please check the client ID, client secret, and callback URL.'
          : err?.message || 'OAuth authentication failed',
      );
      return res.redirect(`${targetClientUrl}/login?error=${errorMsg}`);
    }
    if (!user) {
      console.warn('[Google OAuth Callback] Authentication returned no user. Info:', info);
      const infoMsg = encodeURIComponent(info?.message || 'Google Sign In failed: No user returned.');
      return res.redirect(`${targetClientUrl}/login?error=${infoMsg}`);
    }
    if (user.isBlocked) {
      console.warn('[Google OAuth Callback] User is blocked:', user.email);
      return res.redirect(`${targetClientUrl}/login?error=${encodeURIComponent('Your account has been blocked.')}`);
    }

    try {
      console.log('[Google OAuth Callback] User authenticated:', user.email);
      const token = createToken(user);
      console.log('[Google OAuth Callback] JWT generated for user:', user._id.toString());

      const serializedUser = serializeUser(user);
      return res.redirect(
        `${targetClientUrl}/login?token=${token}&user=${encodeURIComponent(JSON.stringify(serializedUser))}`
      );
    } catch (tokenErr: any) {
      console.error('[Google OAuth Callback] Error creating JWT token:', tokenErr);
      return res.redirect(`${targetClientUrl}/login?error=${encodeURIComponent('Failed to process authentication token.')}`);
    }
  })(req, res, next);
});

// POST /api/auth/google
router.post('/google', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('[Google Login] POST /google - body:', JSON.stringify({ ...req.body }));
    const { googleId, email, name, avatar } = req.body;
    if (!googleId || !email) {
      res.status(400).json({ message: 'Google ID and email are required' });
      return;
    }
    let user = await UserModel.findOne({ $or: [{ googleId }, { email }] });
    if (user) {
      console.log('[Google Login] Existing user found:', email);
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.avatar && avatar) user.avatar = avatar;
        await user.save();
      }
    } else {
      console.log('[Google Login] Creating new user:', email);
      user = await UserModel.create({ name, email, googleId, avatar, isEmailVerified: true });
    }
    if (user.isBlocked) {
      res.status(403).json({ message: 'Your account has been blocked.' });
      return;
    }
    const token = createToken(user);
    console.log('[Google Login] JWT generated for:', user._id.toString());
    res.json({ message: 'Google login successful', token, user: serializeUser(user) });
  } catch (error) {
    console.error('[Google Login] Error:', error);
    next(error);
  }
});

// POST /api/auth/google/verify-token
// Google Identity Services (GIS) flow: frontend sends Google ID token for server-side verification
const googleOAuth2Client = googleClientId ? new OAuth2Client(googleClientId) : null;

router.post('/google/verify-token', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('[Google Verify-Token] POST /google/verify-token - credential received:', !!req.body?.credential);
    if (!googleOAuth2Client || !googleClientId) {
      res.status(503).json({
        message: 'Google Sign-In is not configured on the backend. Please use email/password sign-in in development or add GOOGLE_CLIENT_ID.',
      });
      return;
    }
    const { credential } = req.body;
    if (!credential) {
      console.log('[Google Verify-Token] Missing credential in request body');
      res.status(400).json({ message: 'Google credential (ID token) is required' });
      return;
    }

    console.log('[Google Verify-Token] Verifying ID token with Google using client ID:', googleClientId.substring(0, 20) + '...');

    // Verify the ID token with Google
    const ticket = await googleOAuth2Client.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      console.log('[Google Verify-Token] No payload returned from token verification');
      res.status(401).json({ message: 'Invalid Google token: no payload' });
      return;
    }

    const { sub: googleId, email, name, picture: avatar } = payload;
    console.log('[Google Verify-Token] Token verified. Email:', email, '| Google ID:', googleId?.substring(0, 8) + '...');

    if (!email) {
      res.status(401).json({ message: 'No email associated with this Google account' });
      return;
    }

    // Find existing user by googleId or email
    let user = await UserModel.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      console.log('[Google Verify-Token] Existing user found:', email);
      // Link Google account if not already linked
      let modified = false;
      if (!user.googleId) {
        user.googleId = googleId;
        modified = true;
      }
      if (!user.avatar && avatar) {
        user.avatar = avatar;
        modified = true;
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        modified = true;
      }
      if (modified) {
        await user.save();
        console.log('[Google Verify-Token] Updated existing user with Google data');
      }
    } else {
      console.log('[Google Verify-Token] Creating new user for:', email);
      // Create new user
      user = await UserModel.create({
        name: name || 'Google User',
        email,
        googleId,
        avatar,
        isEmailVerified: true,
        role: 'user',
      });
      console.log('[Google Verify-Token] New user created:', user._id.toString());
    }

    if (user.isBlocked) {
      console.log('[Google Verify-Token] User is blocked:', email);
      res.status(403).json({ message: 'Your account has been blocked.' });
      return;
    }

    const token = createToken(user);
    console.log('[Google Verify-Token] JWT generated successfully for:', user._id.toString());
    res.json({ message: 'Google login successful', token, user: serializeUser(user) });
  } catch (error: any) {
    console.error('[Google Verify-Token] Error:', error?.message || error);
    // Handle specific Google token verification errors
    if (error?.message?.includes('Token used too late') || error?.message?.includes('Invalid token')) {
      res.status(401).json({ message: 'Google token is invalid or expired. Please try again.' });
      return;
    }
    next(error);
  }
});

// POST /api/auth/apple
router.post('/apple', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { appleId, email, name } = req.body;
    if (!appleId) {
      res.status(400).json({ message: 'Apple ID is required' });
      return;
    }
    let user = await UserModel.findOne({ $or: [{ appleId }, ...(email ? [{ email }] : [])] });
    if (user) {
      if (!user.appleId) {
        user.appleId = appleId;
        await user.save();
      }
    } else {
      const userEmail = email || `${appleId}@apple.campusconnect.app`;
      user = await UserModel.create({ name: name || 'Apple User', email: userEmail, appleId, isEmailVerified: true });
    }
    if (user.isBlocked) {
      res.status(403).json({ message: 'Your account has been blocked.' });
      return;
    }
    const token = createToken(user);
    res.json({ message: 'Apple login successful', token, user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    // Always return OK to prevent user enumeration
    if (!user) {
      res.json({ message: 'If that email exists, a reset link has been sent.' });
      return;
    }
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();
    const appUrl = getClientUrl(req);
    const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    await sendPasswordResetEmail(user.email, user.name, resetUrl);
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, email, password } = req.body;
    if (!token || !email || !password) {
      res.status(400).json({ message: 'Token, email, and new password are required' });
      return;
    }
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await UserModel.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');
    if (!user) {
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }
    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await UserModel.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auth/profile
router.put(
  '/profile',
  requireAuth,
  upload.single('avatar'),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await UserModel.findById(req.user?.userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      const { name, phone, collegeName, department, year, fcmToken, notificationPreferences } = req.body;
      if (name) user.name = name;
      if (phone !== undefined) user.phone = phone;
      if (collegeName !== undefined) user.collegeName = collegeName;
      if (department !== undefined) user.department = department;
      if (year !== undefined) user.year = year;
      if (fcmToken !== undefined) user.fcmToken = fcmToken;
      if (notificationPreferences) {
        user.notificationPreferences = typeof notificationPreferences === 'string'
          ? JSON.parse(notificationPreferences)
          : notificationPreferences;
      }

      if (req.file) {
        const avatarUrl = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);
        user.avatar = avatarUrl;
      }

      await user.save();
      res.json({ message: 'Profile updated', user: serializeUser(user) });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
