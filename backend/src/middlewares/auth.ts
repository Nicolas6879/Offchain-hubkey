import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import User from '../models/User';

interface DecodedToken {
  id: string;
  email: string;
  walletAddress: string;
  role?: string;
  iat: number;
  exp: number;
}

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

/**
 * Authentication middleware to verify JWT token
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Extract token from header
    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication token required' });
      return;
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as DecodedToken;
      
      // Check if user is active
      User.findById(decoded.id)
        .then(user => {
          if (!user || !user.isActive) {
            res.status(403).json({ success: false, message: 'User account inactive or suspended' });
            return;
          }
          
          req.user = decoded;
          next();
        })
        .catch(err => {
          console.error('Error verifying user status:', err);
          res.status(500).json({ success: false, message: 'Error verifying user status' });
        });
    } catch (error) {
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

/**
 * Optional authentication middleware
 * Doesn't reject the request if token is missing or invalid
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    // Extract token from header
    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as DecodedToken;
      req.user = decoded;
    } catch (error) {
      // Ignore invalid token
    }
    next();
  } catch (error) {
    next();
  }
};

/**
 * Role-based authentication middleware
 * @param roles - Array of roles allowed to access the route
 */
export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // First ensure user is authenticated
    authenticate(req, res, () => {
      // Check if user has one of the required roles
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      
      // Get user from database to check current role
      User.findById(req.user.id)
        .then(user => {
          if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
          }
          
          // This implementation assumes a 'role' field on the user model
          // Adapt as needed based on your actual user model implementation
          const userRole = req.user?.role || 'member';
          
          if (roles.includes(userRole)) {
            next();
          } else {
            res.status(403).json({
              success: false,
              message: 'You do not have permission to perform this action',
            });
          }
        })
        .catch(err => {
          console.error('Error checking user role:', err);
          res.status(500).json({ success: false, message: 'Error checking user permissions' });
        });
    });
  };
}; 