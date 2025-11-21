/**
 * @fileoverview Verification routes for signature requests
 * Handles links from emails that trigger WebSocket signature requests
 */

import express from 'express';
import { requestSignatureVerification } from '../controllers/verificationController';

const router = express.Router();

/**
 * @route GET /api/verify-access
 * @description Request signature verification from a user
 * @access Public
 * @param {string} accessId - NFT ID or access request ID to verify
 * @param {string} email - User's email
 * @param {string} name - User's name
 * @returns {Object} HTML page with verification status
 */
router.get('/verify-access', requestSignatureVerification);

export default router; 