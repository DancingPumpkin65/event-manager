import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from './error.middleware';
import { PERMISSIONS, UserType, PermissionResource } from '../config/permissions';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    username?: string;
    type: UserType;
    eventId?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Try to get token from cookie first, then fallback to Authorization header
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      throw new AppError('No token provided', 401);
    }


    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;

      // Determine user type from payload (handle legacy 'role' if needed or just enforce 'type')
      // If the token uses 'role': 'ADMIN', map it to type: 'admin'
      let type: UserType = decoded.type;

      if (!type && decoded.role === 'ADMIN') {
        type = 'admin';
      }

      req.user = {
        id: decoded.id,
        email: decoded.email,
        username: decoded.username,
        type: type,
        eventId: decoded.eventId
      };

      if (!req.user.type) {
        throw new AppError('Invalid token payload: missing user type', 401);
      }

      next();
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (resource: PermissionResource, action: string) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    const { type } = req.user;

    // Type-safe access to permissions
    const userPermissions = PERMISSIONS[type] as Record<string, readonly string[] | undefined>;
    const allowedActions = userPermissions?.[resource];

    if (!allowedActions || !allowedActions.includes(action)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};
