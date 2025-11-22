/**
 * @fileoverview Authentication routes for user signup and login
 */

import express, { Request, Response } from 'express';
import authService from '../services/authService';

const router = express.Router();

/**
 * @route POST /api/auth/signup
 * @description Register a new user with automatic wallet generation
 * @access Public
 */
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Call auth service to create user
    const result = await authService.signup({ email, password, name });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error during signup',
    });
  }
});

/**
 * @route POST /api/auth/login
 * @description Login with email and password
 * @access Public
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Call auth service to login
    const result = await authService.login({ email, password });

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid credentials',
    });
  }
});

/**
 * @route POST /api/auth/wallet-register
 * @description Register a new user with an existing wallet (from WalletConnect)
 * @access Public
 */
router.post('/wallet-register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, walletAddress } = req.body;

    // Validate required fields
    if (!email || !password || !walletAddress) {
      res.status(400).json({
        success: false,
        message: 'Email, password, and wallet address are required',
      });
      return;
    }

    // Call auth service to register with wallet
    const result = await authService.walletRegister({
      email,
      password,
      name,
      walletAddress,
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Wallet registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error during registration',
    });
  }
});

/**
 * @route POST /api/auth/wallet-check
 * @description Check if a wallet address is already registered
 * @access Public
 */
router.post('/wallet-check', async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      res.status(400).json({
        success: false,
        message: 'Wallet address is required',
      });
      return;
    }

    const result = await authService.checkWallet(walletAddress);

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Wallet check error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error checking wallet',
    });
  }
});

export default router;

