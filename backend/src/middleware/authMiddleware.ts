import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User';

const jwtAny = jwt as any;

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret || 'campusconnect-development-secret';
};

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      res.status(401).json({ message: 'Authentication required. No token provided.' });
      return;
    }
    const decoded = jwtAny.verify(token, getJwtSecret()) as { userId: string; email: string; role: string };
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ message: 'User not found. Invalid token.' });
      return;
    }
    if (user.isBlocked) {
      res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
      return;
    }
    req.user = { userId: decoded.userId, email: decoded.email, role: user.role };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  await requireAuth(req, res, async () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Admin access required.' });
      return;
    }
    next();
  });
};

export const createToken = (user: { _id: { toString(): string }; email: string; role: string }): string => {
  return jwtAny.sign(
    { userId: user._id.toString(), email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: '7d' },
  );
};
