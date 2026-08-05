import jwt from 'jsonwebtoken';

const jwtAny = jwt as any;

/**
 * Generate a JWT token containing the user's MongoDB _id, email, and role.
 */
export const generateToken = (userId: string, email: string, role: string): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing');
  }
  if (!expiresIn) {
    throw new Error('JWT_EXPIRES_IN environment variable is missing');
  }

  return jwtAny.sign(
    { userId, email, role },
    secret,
    { expiresIn }
  );
};

/**
 * Verify a JWT token using the secret from process.env.
 */
export const verifyToken = (token: string): { userId: string; email: string; role: string } => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing');
  }

  return jwtAny.verify(token, secret) as { userId: string; email: string; role: string };
};
