import jwt from 'jsonwebtoken';
import { JwtPayload, UserRecord } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sudoend-secure-jwt-secret-replace-in-env';

/**
 * Signs a JWT token with a 24-hour expiration.
 */
export function signUserToken(user: UserRecord): string {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tier: user.tier
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h'
  });
}

/**
 * Verifies and decodes a bearer JWT token.
 * Returns decoded payload or null if invalid or expired.
 */
export function verifyUserToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (err) {
    return null;
  }
}

