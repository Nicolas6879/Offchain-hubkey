/**
 * @fileoverview Admin authentication middleware
 * Checks if the requesting wallet address has admin privileges
 */

import { Request, Response, NextFunction } from 'express';
import { isAdminWallet } from '../utils/adminUtils';

/**
 * Middleware to check if the requesting wallet has admin privileges
 * 
 * Expected to be used after auth middleware that sets walletAddress
 * Can also check for wallet address in headers or body
 * 
 * @param req - Express request object
 * @param res - Express response object  
 * @param next - Next function
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Try to get wallet address from various sources
    let walletAddress = '';
    
    // Check if wallet address is set by previous auth middleware
    if (req.body?.walletAddress) {
      walletAddress = req.body.walletAddress;
    }
    // Check headers
    else if (req.headers['wallet-address']) {
      walletAddress = req.headers['wallet-address'] as string;
    }
    // Check query parameters
    else if (req.query?.walletAddress) {
      walletAddress = req.query.walletAddress as string;
    }
    // Check if it's set on the request object by auth middleware
    else if ((req as any).walletAddress) {
      walletAddress = (req as any).walletAddress;
    }

    if (!walletAddress) {
      res.status(401).json({
        success: false,
        message: 'Wallet address required for admin access',
        error: 'WALLET_REQUIRED',
      });
      return;
    }

    if (!isAdminWallet(walletAddress)) {
      res.status(403).json({
        success: false,
        message: 'Admin privileges required',
        error: 'INSUFFICIENT_PRIVILEGES',
      });
      return;
    }

    // Set admin flag on request for use in controllers
    (req as any).isAdmin = true;
    (req as any).adminWallet = walletAddress;

    next();
  } catch (error) {
    console.error('Error in admin auth middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during admin authentication',
      error: 'ADMIN_AUTH_ERROR',
    });
  }
};

/**
 * Optional admin middleware - allows both admin and regular users
 * Sets isAdmin flag but doesn't block non-admin requests
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next function
 */
export const checkAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Try to get wallet address from various sources
    let walletAddress = '';
    
    if (req.body?.walletAddress) {
      walletAddress = req.body.walletAddress;
    } else if (req.headers['wallet-address']) {
      walletAddress = req.headers['wallet-address'] as string;
    } else if (req.query?.walletAddress) {
      walletAddress = req.query.walletAddress as string;
    } else if ((req as any).walletAddress) {
      walletAddress = (req as any).walletAddress;
    }

    // Set admin flags regardless of whether wallet address exists
    (req as any).isAdmin = walletAddress ? isAdminWallet(walletAddress) : false;
    (req as any).adminWallet = (req as any).isAdmin ? walletAddress : null;

    next();
  } catch (error) {
    console.error('Error in optional admin check middleware:', error);
    // Don't block the request on error, just set isAdmin to false
    (req as any).isAdmin = false;
    (req as any).adminWallet = null;
    next();
  }
}; 