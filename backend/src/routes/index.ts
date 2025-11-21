/**
 * @fileoverview Main router configuration for the Offchain Membership API
 * This file defines the root level routes and mounts all feature-specific route modules
 */

import express from 'express';
import joinRequestRoutes from './joinRequestRoutes';
import nftRoutes from './nftRoutes';
import hubAccessRoutes from './hubAccessRoutes';
import membershipRoutes from './membershipRoutes';
import profileRoutes from './profileRoutes';
import verificationRoutes from './verificationRoutes';
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
 * Join request routes for membership applications
 * @see ./joinRequestRoutes.ts
 */
router.use('/join-request', joinRequestRoutes);

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
 * Verification routes for signature requests
 * @see ./verificationRoutes.ts
 */
router.use('/', verificationRoutes);

export default router; 