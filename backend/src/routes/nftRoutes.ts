/**
 * @fileoverview NFT management routes
 * Handles profile picture generation, NFT minting, sending, and verification
 */

import express from 'express';
import { generatePfp, mintNFT, sendNFT, verifyNFT } from '../controllers/nftController';
import { authenticate, optionalAuth } from '../middlewares/auth';

const router = express.Router();

/**
 * @route POST /api/nft/verify
 * @description Verify ownership of an NFT
 * @access Public (with optional authentication)
 * @body {Object} request
 * @param {string} tokenId - ID of the NFT token to verify
 * @param {string} signature - Cryptographic signature from the wallet
 * @param {string} message - Original message that was signed
 * @param {string} [address] - Wallet address to check (only required if not authenticated)
 * @returns {Object} Verification result
 */
router.post('/verify', verifyNFT);

/**
 * @route POST /api/nft/generate-pfp
 * @description Generate a custom profile picture for the user
 * @access Public (TEMPORARY for testing - normally Private)
 * @body {Object} request
 * @param {string} name - User's name for generating initials
 * @param {string} email - User's email (used for uniqueness)
 * @param {Object} [customizations] - Optional styling preferences
 * @param {string} [customizations.backgroundColor] - Background color hex code
 * @param {string} [customizations.textColor] - Text color hex code
 * @param {string} [customizations.shape] - Shape preference ('circle' or 'square')
 * @param {string} [customizations.pattern] - Pattern style
 * @returns {Object} Generated image path and confirmation
 */
router.post('/generate-pfp', generatePfp);

/**
 * @route POST /api/nft/mint
 * @description Mint a new NFT representing membership
 * @access Public (TEMPORARY for testing - normally Private)
 * @body {Object} request
 * @param {string} name - Name to associate with the NFT
 * @param {string} email - Email to associate with the NFT
 * @param {Object} [metadata] - Additional metadata for the NFT
 * @returns {Object} Token ID, image path, and confirmation message
 */
router.post('/mint', mintNFT);

/**
 * @route POST /api/nft/send
 * @description Send an NFT to a wallet address
 * @access Public (TEMPORARY for testing - normally Private)
 * @body {Object} request
 * @param {string} tokenId - ID of the NFT token to send
 * @param {string} [recipientAddress] - Destination wallet address (if not provided, sends to user's own wallet)
 * @returns {Object} Transaction ID and confirmation message
 */
router.post('/send', sendNFT);

export default router; 