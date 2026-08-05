/// <reference path="../types/passport.d.ts" />
import { Request, Response, NextFunction } from 'express';
import UserModel from '../models/User';
import { generateToken, verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({ message: 'Authentication required. No token provided.' });
      return;
    }

    const decoded = verifyToken(token);
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ message: 'User not found. Invalid token.' });
      return;
    }
    if (user.isBlocked) {
      res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
      return;
    }
    req.user = { userId: user._id.toString(), email: user.email, role: user.role };
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
  return generateToken(user._id.toString(), user.email, user.role);
};
