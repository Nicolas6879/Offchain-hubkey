/**
 * @fileoverview Main router configuration for the Offchain Membership API
 * This file defines the root level routes and mounts all feature-specific route modules
 */

import express from 'express';
import authRoutes from './authRoutes';
import joinRequestRoutes from './joinRequestRoutes';
import userRoutes from './userRoutes';
import nftRoutes from './nftRoutes';
import hubAccessRoutes from './hubAccessRoutes';
import membershipRoutes from './membershipRoutes';
import profileRoutes from './profileRoutes';
import verificationRoutes from './verificationRoutes';
import eventRoutes from './eventRoutes';
import productRoutes from './productRoutes';
import { authenticate } from '../middlewares/auth';
import path from 'path';

const router = express.Router();

/**
 * @route GET /api/health
 * @description Health check endpoint to verify API is operational
 * @access Public
 * @returns {Object} Status message indicating service is running
 */
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Service is running' });
});

/**
 * @route GET /api/images/:filename
 * @description Serves generated images (profile pictures, NFT images)
 * @access Public
 * @param {string} filename - Name of the image file to retrieve
 * @returns {File} The requested image file
 */
router.get('/images/:filename', (req, res) => {
  const { filename } = req.params;
  const imagePath = path.resolve(__dirname, `../../generated/${filename}`);
  res.sendFile(imagePath);
});

// Mount routes from feature modules

/**
 * Authentication routes for signup and login
 * @see ./authRoutes.ts
 */
router.use('/auth', authRoutes);

/**
 * Join request routes for membership applications
 * @see ./joinRequestRoutes.ts
 */
router.use('/join-request', joinRequestRoutes);

/**
 * User management routes
 * @see ./userRoutes.ts
 */
router.use('/users', userRoutes);

/**
 * NFT management routes
 * @see ./nftRoutes.ts
 */
router.use('/nft', nftRoutes);

/**
 * Hub access routes for partner locations
 * @see ./hubAccessRoutes.ts
 */
router.use('/hub-access', hubAccessRoutes);

/**
 * Event management routes
 * @see ./eventRoutes.ts
 */
router.use('/events', eventRoutes);

/**
 * Membership management routes
 * @see ./membershipRoutes.ts
 */
router.use('/membership', membershipRoutes);

/**
 * User profile management routes
 * @see ./profileRoutes.ts
 */
router.use('/profile', profileRoutes);

/**
 * Product and marketplace routes
 * @see ./productRoutes.ts
 */
router.use('/', productRoutes);

/**
 * Verification routes for signature requests
 * @see ./verificationRoutes.ts
 */
router.use('/', verificationRoutes);

export default router; 