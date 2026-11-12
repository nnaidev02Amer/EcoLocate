import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import prisma from '../utils/prisma.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
      name: string;
    };
    // Re-check the account on every request so deactivated/deleted users lose access immediately
    const account = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { isActive: true, role: true },
    });
    if (!account || account.isActive === false) {
      return res.status(401).json({ success: false, message: 'Account is deactivated or no longer exists.' });
    }
    req.user = { ...decoded, role: account.role };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }
};

export const optionalAuthenticate = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as {
        id: string;
        email: string;
        role: string;
        name: string;
      };
      req.user = decoded;
    } catch {
      // Ignore error for optional authentication
    }
  }
  next();
};

export const requireRoles = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
};
