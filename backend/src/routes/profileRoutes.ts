/**
 * @fileoverview User profile management routes
 * Handles profile retrieval and updates
 */

import express from 'express';
import { getProfile, updateProfile, getUserEventHistory } from '../controllers/profileController';

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
 * @param {string} [bio] - User's biography
 * @returns {Object} Updated user profile data
 */
router.put('/', updateProfile);

/**
 * @route GET /api/profile/events
 * @description Get the current user's event history
 * @access Public (uses wallet-address header)
 * @query {string} [status] - Filter by status (all, active, attended, cancelled)
 * @returns {Object} Event history data
 */
router.get('/events', getUserEventHistory);

export default router; 