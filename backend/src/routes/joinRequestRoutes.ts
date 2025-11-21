/**
 * @fileoverview Join request routes for membership applications
 * Handles submission, approval/rejection, and status checking of membership requests
 */

import express from 'express';
import { createJoinRequest, approveJoinRequest, rejectJoinRequest, getJoinRequestStatus, getJoinRequests, claimNFT, getNFTClaimStatus } from '../controllers/joinRequestController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

/**
 * @route POST /api/join-request
 * @description Submit a new request to join the membership
 * @access Public
 * @body {Object} request
 * @param {string} fullName - Applicant's full name
 * @param {string} email - Applicant's email address
 * @param {string} walletAddress - Applicant's blockchain wallet address
 * @param {string} [phone] - Applicant's phone number (optional)
 * @returns {Object} Join request ID and confirmation message
 */
router.post('/', createJoinRequest);

/**
 * @route GET /api/join-request/
 * @description Get all join requests
 * @access Public
 * @returns {Object} All join requests
 */
router.get('/', getJoinRequests);

/**
 * @route GET /api/join-request/status/:wallet
 * @description Check status of a join request by wallet address
 * @access Public
 * @param {string} wallet - Blockchain wallet address to check
 * @returns {Object} Current status and details of the join request
 */
router.get('/status/:wallet', getJoinRequestStatus);

/**
 * @route POST /api/join-request/:id/approve
 * @description Approve a pending join request
 * @access Public (TEMPORARY for testing - normally Private/Admin only)
 * @param {string} id - ID of the join request to approve
 * @returns {Object} Confirmation message
 */
router.post('/:id/approve', approveJoinRequest);

/**
 * @route POST /api/join-request/:id/reject
 * @description Reject a pending join request
 * @access Public (TEMPORARY for testing - normally Private/Admin only)
 * @param {string} id - ID of the join request to reject
 * @body {Object} request
 * @param {string} [reason] - Reason for rejection (optional)
 * @returns {Object} Confirmation message
 */
router.post('/:id/reject', rejectJoinRequest);

/**
 * @route GET /api/join-request/nft-status/:wallet
 * @description Check NFT claim status for a wallet address
 * @access Public
 * @param {string} wallet - Blockchain wallet address to check
 * @returns {Object} NFT availability and claim status
 */
router.get('/nft-status/:wallet', getNFTClaimStatus);

/**
 * @route POST /api/join-request/claim-nft/:wallet
 * @description Claim (transfer) NFT to user's wallet
 * @access Public
 * @param {string} wallet - Blockchain wallet address to transfer NFT to
 * @returns {Object} Transaction ID and confirmation message
 */
router.post('/claim-nft/:wallet', claimNFT);

export default router; 