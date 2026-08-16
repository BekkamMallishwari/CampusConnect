import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import UserModel from '../models/User';

// Only register the Google OAuth Strategy if valid credentials are configured.
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const backendUrl =
  process.env.BACKEND_URL?.trim().replace(/\/+$/, '') ||
  (process.env.NODE_ENV === 'production' || process.env.RENDER
    ? 'https://campusconnect-qpgo.onrender.com'
    : 'http://localhost:5001');

const googleCallbackUrl =
  process.env.GOOGLE_CALLBACK_URL?.trim() ||
  `${backendUrl}/api/auth/google/callback`;

if (
  googleClientId &&
  googleClientSecret &&
  googleClientId !== 'dummy_client_id' &&
  googleClientSecret !== 'dummy_client_secret'
) {
  console.log('✅ [Passport] Registering Google OAuth Strategy');
  console.log('   Client ID:', googleClientId.substring(0, 20) + '...');
  console.log('   Callback URL:', googleCallbackUrl);

  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackUrl,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || profile.name?.givenName || 'Google User';
          const googleId = profile.id;
          const avatar = profile.photos?.[0]?.value;

          console.log('[Passport Google] OAuth verify callback called for:', email);

          if (!email) {
            console.log('[Passport Google] No email returned from Google profile');
            return done(new Error('No email returned from Google'), undefined);
          }

          let user = await UserModel.findOne({ $or: [{ googleId }, { email }] });

          if (user) {
            console.log('[Passport Google] Existing user found:', email);
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
              console.log('[Passport Google] Updated existing user with Google data');
            }
          } else {
            console.log('[Passport Google] Creating new user for:', email);
            user = await UserModel.create({
              name,
              email,
              googleId,
              avatar,
              isEmailVerified: true,
              role: 'user',
            });
            console.log('[Passport Google] New user created:', user._id.toString());
          }

          console.log('[Passport Google] done() called successfully for:', email);
          return done(null, user);
        } catch (error) {
          console.error('[Passport Google] Error in verify callback:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );
} else {
  console.warn(
    '⚠️  [Passport] Google OAuth Passport strategy NOT registered.\n' +
    '   GOOGLE_CLIENT_ID present:', !!googleClientId, '\n' +
    '   GOOGLE_CLIENT_SECRET present:', !!googleClientSecret, '\n' +
    '   The POST /api/auth/google/verify-token endpoint (Google Identity Services) will still work.'
  );
}

passport.serializeUser((user: any, done) => {
  done(null, user._id || user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
