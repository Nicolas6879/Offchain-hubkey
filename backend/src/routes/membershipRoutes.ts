/**
 * @fileoverview Membership management routes
 * Handles operations on existing memberships, including revocation
 */

import express from 'express';
import { revokeMembership } from '../controllers/membershipController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

/**
 * @route POST /api/membership/revoke
 * @description Revoke a user's membership status
 * @access Private - Admin only
 * @body {Object} request
 * @param {string} userId - ID of the user whose membership is being revoked
 * @param {string} [reason] - Reason for the revocation
 * @returns {Object} Confirmation message
 */
router.post('/revoke', authenticate, revokeMembership);

export default router; 