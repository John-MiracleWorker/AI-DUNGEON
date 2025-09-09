import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { CustomError } from './errorHandler';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../../shared/constants';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    isAnonymous: boolean;
  };
}

interface JWTPayload {
  id: string;
  isAnonymous?: boolean;
  iat: number;
  exp: number;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Create anonymous session for requests without token
      const anonymousToken = generateAnonymousToken();
      req.user = { id: anonymousToken, isAnonymous: true };
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!process.env.JWT_SECRET) {
      throw new CustomError('JWT secret not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    
    req.user = {
      id: decoded.id,
      isAnonymous: decoded.isAnonymous || false,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      throw new CustomError(ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      throw new CustomError(ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
    }
    
    throw error;
  }
};

export const generateAnonymousToken = (): string => {
  return 'anon_' + Date.now().toString(36) + randomUUID().replace(/-/g, '');
};

export const generateJWTToken = (userId: string, isAnonymous: boolean = false): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT secret not configured');
  }

  return jwt.sign(
    { id: userId, isAnonymous },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    if (process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
      req.user = {
        id: decoded.id,
        isAnonymous: decoded.isAnonymous || false,
      };
    }

    next();
  } catch (error) {
    // For optional auth, we don't throw errors, just continue without user
    next();
  }
};