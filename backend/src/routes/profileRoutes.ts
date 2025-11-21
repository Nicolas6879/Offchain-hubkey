/**
 * @fileoverview User profile management routes
 * Handles profile retrieval and updates
 */

import express from 'express';
import { authenticate } from '../middlewares/auth';
import { getProfile, updateProfile } from '../controllers/profileController';

const router = express.Router();

/**
 * @route GET /api/profile
 * @description Get the current user's profile information
 * @access Public (TEMPORARY for testing - normally Private)
 * @returns {Object} User profile data
 */
router.get('/', getProfile);

/**
 * @route PUT /api/profile
 * @description Update the current user's profile
 * @access Public (TEMPORARY for testing - normally Private)
 * @body {Object} profileData
 * @param {string} [name] - User's display name
 * @param {string} [email] - User's email address
 * @param {string} [phone] - User's phone number
 * @returns {Object} Updated user profile data
 */
router.put('/', updateProfile);

export default router; 