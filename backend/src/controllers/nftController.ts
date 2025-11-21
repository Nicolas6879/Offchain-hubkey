/**
 * @fileoverview NFT controller for membership token operations
 * Handles profile picture generation, NFT minting, verification, and transfers
 */

import { Request, Response } from 'express';
import mintService from '../services/mintService';
import emailService from '../services/emailService';
import { verifySignature } from '../utils/signatureVerifier';
import * as path from 'path';
import * as fs from 'fs';
import User from '../models/User';
import pfpGeneratorService from '../services/pfpGeneratorService';
import Hub from '../models/Hub';

/**
 * Generate a profile picture for a member
 * 
 * Creates a unique visual identity for the member based on their information.
 * The generated image is used as a base for the membership NFT.
 * 
 * @async
 * @function generatePfp
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const generatePfp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, customizations } = req.body;
    
    // TEMPORARY: Removed authentication check for testing
    /*
    // Get user from authenticated request
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    */
    
    if (!name || !email) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    // Generate PFP image
    const result = await pfpGeneratorService.generateImage({
      name,
      email,
      walletAddress: req.user?.walletAddress || email.split('@')[0], // Use email prefix as fallback
      customizations: customizations || {},
    });

    res.status(201).json({
      success: true,
      imagePath: result.imagePath,
      message: 'Profile image generated successfully',
    });
  } catch (error) {
    console.error('Error in generatePfp controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate profile image',
      error: (error as Error).message,
    });
  }
};

/**
 * Mint a new NFT representing membership
 * 
 * Creates a blockchain token with member information and associates it
 * with the user's account. This NFT serves as proof of membership.
 * 
 * @async
 * @function mintNFT
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const mintNFT = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, metadata, walletAddress } = req.body;
    
    // TEMPORARY: Skip authentication check for testing
    /*
    // Get user from authenticated request
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    
    const userId = req.user.id;
    const walletAddress = req.user.walletAddress;
    */
    
    // Use provided walletAddress or fallback
    const addressToUse = walletAddress || (req.user ? req.user.walletAddress : null);
    
    if (!name || !email || !addressToUse) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    // Use a dummy userId if not authenticated
    const userId = req.user?.id || 'temp-' + Date.now();

    // Mint the NFT with user data
    const result = await mintService.mintIdentityNFT({
      userId,
      name,
      email,
      walletAddress: addressToUse,
      metadata: JSON.stringify({
        timestamp: Date.now(),
        ...metadata
      }),
    });

    // Associate NFT with user account if user exists
    if (req.user?.id) {
      try {
        await User.findByIdAndUpdate(userId, {
          $push: { nftTokenIds: result.tokenId }
        });
      } catch (error) {
        console.error('Error associating NFT with user:', error);
        // Continue execution even if DB update fails
      }
    }

    res.status(201).json({
      success: true,
      tokenId: result.tokenId,
      imagePath: result.imagePath,
      message: 'Identity NFT minted successfully',
    });
  } catch (error) {
    console.error('Error in mintNFT controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mint NFT',
      error: (error as Error).message,
    });
  }
};

/**
 * Send NFT to user's wallet
 * 
 * Transfers an NFT to the specified wallet address, ensuring it's properly
 * associated with the blockchain network.
 * 
 * @async
 * @function sendNFT
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const sendNFT = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenId, recipientAddress, ownerAddress, serialNumber } = req.body;
    
    // TEMPORARY: Skip authentication check for testing
    /*
    // Get user from authenticated request
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    */
    
    if (!tokenId || !serialNumber) {
      res.status(400).json({ success: false, message: 'Token ID and serial number are required' });
      return;
    }

    // If recipient address not provided, use the user's wallet address
    const destinationWallet = recipientAddress || (req.user ? req.user.walletAddress : null);
    
    if (!destinationWallet) {
      res.status(400).json({ success: false, message: 'Recipient wallet address is required' });
      return;
    }

    // Use provided owner address or authenticated user's address
    const currentOwner = ownerAddress || (req.user ? req.user.walletAddress : null);
    
    if (!currentOwner) {
      res.status(400).json({ success: false, message: 'Owner wallet address is required' });
      return;
    }

    // TEMPORARY: Skip ownership verification for testing if ownerAddress is provided
    if (!ownerAddress && req.user) {
      // Verify token ownership by the authenticated user
      const isOwner = await mintService.verifyOwnership(tokenId, serialNumber, req.user.walletAddress);
      if (!isOwner) {
        res.status(401).json({
          success: false,
          message: 'You are not the owner of this NFT',
        });
        return;
      }
    }

    // Transfer NFT to destination wallet (might be the same as current owner)
    const result = await mintService.transferNFT(tokenId, serialNumber, destinationWallet);

    res.status(200).json({
      success: true,
      transactionId: result.transactionId,
      message: 'NFT sent successfully',
    });
  } catch (error) {
    console.error('Error in sendNFT controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send NFT',
      error: (error as Error).message,
    });
  }
};

/**
 * Verify NFT ownership and authenticity
 * 
 * Verifies that a wallet owns a specific NFT by checking blockchain state
 * and cryptographic signatures. Used for access control to physical hubs.
 * 
 * @async
 * @function verifyNFT
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const verifyNFT = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenId, signature, message, address } = req.body;
    
    // If user is authenticated, use their wallet address
    const walletToCheck = req.user ? req.user.walletAddress : address;
    const { serialNumber } = req.body;

    if (!tokenId || !signature || !message || !walletToCheck || !serialNumber) {
      res.status(400).json({ success: false, message: 'Missing required fields (tokenId, signature, message, address, serialNumber)' });
      return;
    }

    // Verify signature
    const isValidSignature = verifySignature(message, signature, walletToCheck);
    if (!isValidSignature) {
      res.status(401).json({
        success: false,
        message: 'Invalid signature',
      });
      return;
    }

    // Verify token ownership
    const isOwner = await mintService.verifyOwnership(tokenId, serialNumber, walletToCheck);
    if (!isOwner) {
      res.status(401).json({
        success: false,
        message: 'Address is not the owner of this NFT',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'NFT ownership verified successfully',
    });
  } catch (error) {
    console.error('Error in verifyNFT controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify NFT',
      error: (error as Error).message,
    });
  }
};

/**
 * Register a hub visit using NFT
 * 
 * Records a member's intent to visit a hub and notifies hub staff.
 * This is used as the first step in physical access to partner locations.
 * 
 * @async
 * @function registerHub
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const registerHub = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, tokenId, visitDate, hubId, serialNumber } = req.body;
    
    // Get user from authenticated request
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!name || !email || !tokenId || !visitDate || !serialNumber) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }
    
    // Verify token ownership by the authenticated user
    const isOwner = await mintService.verifyOwnership(tokenId, serialNumber, req.user.walletAddress);
    if (!isOwner) {
      res.status(401).json({
        success: false,
        message: 'You are not the owner of this NFT',
      });
      return;
    }

    // Retrieve hub details if provided
    const hub = hubId ? await Hub.findById(hubId) : null;

    // Send notification email to the hub
    const emailSent = await emailService.notifyHub(
      name,
      email,
      tokenId,
      visitDate,
      hub?.contactEmail
    );

    if (!emailSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to send notification to hub',
      });
      return;
    }

    // In a real application, you might want to store this registration in a database
    
    res.status(200).json({
      success: true,
      message: 'Hub visit registered successfully',
    });
  } catch (error) {
    console.error('Error in registerHub controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register hub visit',
      error: (error as Error).message,
    });
  }
}; 