import { Socket, ExtendedError } from 'socket.io';
import { AuthSocket } from '../types/socket';
import UserModel from '../models/User';
import { verifyToken } from '../utils/jwt';

/**
 * Socket.IO authentication middleware.
 *
 * Registered via io.use() — runs once per connection attempt, before any
 * event handlers fire.
 *
 * Token resolution order (matching the HTTP requireAuth middleware):
 *   1. socket.handshake.auth.token          (preferred — set by the client SDK)
 *   2. socket.handshake.headers.authorization  ("Bearer <token>")
 *
 * On success  → attaches socket.user and calls next().
 * On failure  → calls next(new Error(...)) which rejects the connection and
 *               surfaces the error message to the client.
 */
export const socketAuth = async (
  socket: Socket,
  next: (err?: ExtendedError) => void,
): Promise<void> => {
  try {
    // ── 1. Extract the token ────────────────────────────────────────────────
    let token: string | undefined;

    // Client SDK: io({ auth: { token: '<jwt>' } })
    if (typeof socket.handshake.auth?.token === 'string') {
      token = socket.handshake.auth.token as string;
    }

    // Fallback: Authorization header ("Bearer <token>")
    if (!token) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return next(new Error('Authentication required. No token provided.'));
    }

    // ── 2. Verify the token ─────────────────────────────────────────────────
    let decoded: { userId: string; email: string; role: string };
    try {
      decoded = verifyToken(token);
    } catch {
      return next(new Error('Invalid or expired token.'));
    }

    // ── 3. Fetch the user from the database ─────────────────────────────────
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return next(new Error('User not found. Invalid token.'));
    }

    // ── 4. Check that the account is not blocked ─────────────────────────────
    if (user.isBlocked) {
      return next(new Error('Your account has been blocked. Please contact support.'));
    }

    // ── 5. Attach the verified user to the socket ────────────────────────────
    (socket as AuthSocket).user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    console.error('Socket auth error:', err);
    next(new Error('Authentication failed. Please try again.'));
  }
};
