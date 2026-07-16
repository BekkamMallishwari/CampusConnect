import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import UserModel, { IUser } from '../models/User';
import { createToken, requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { sendPasswordResetEmail } from '../services/emailService';
import { upload, uploadBufferToCloudinary } from '../services/cloudinaryService';

const router = Router();

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  collegeName: z.string().optional(),
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
  role: user.role,
  isEmailVerified: user.isEmailVerified,
});

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message || 'Invalid signup details' });
      return;
    }
    const { name, email, password, phone, collegeName } = parsed.data;
    const existing = await UserModel.findOne({ email });
    if (existing) {
      res.status(409).json({ message: 'An account with this email already exists' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await UserModel.create({ name, email, password: hashedPassword, phone, collegeName });
    const token = createToken(user);
    res.status(201).json({ message: 'Signup successful', token, user: serializeUser(user) });
  } catch (error) {
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
    const token = createToken(user);
    res.json({ message: 'Login successful', token, user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/google
router.post('/google', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { googleId, email, name, avatar } = req.body;
    if (!googleId || !email) {
      res.status(400).json({ message: 'Google ID and email are required' });
      return;
    }
    let user = await UserModel.findOne({ $or: [{ googleId }, { email }] });
    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.avatar && avatar) user.avatar = avatar;
        await user.save();
      }
    } else {
      user = await UserModel.create({ name, email, googleId, avatar, isEmailVerified: true });
    }
    if (user.isBlocked) {
      res.status(403).json({ message: 'Your account has been blocked.' });
      return;
    }
    const token = createToken(user);
    res.json({ message: 'Google login successful', token, user: serializeUser(user) });
  } catch (error) {
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
    const appUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0];
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
      const { name, phone, collegeName } = req.body;
      if (name) user.name = name;
      if (phone !== undefined) user.phone = phone;
      if (collegeName !== undefined) user.collegeName = collegeName;

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
