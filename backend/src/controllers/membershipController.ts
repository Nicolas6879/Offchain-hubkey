import { Request, Response } from 'express';
import User from '../models/User';
import JoinRequest from '../models/JoinRequest';
import emailService from '../services/emailService';
import mongoose from 'mongoose';

/**
 * Controller for membership management operations
 * @module controllers/membershipController
 */

/**
 * Revoke a user's membership
 * 
 * Allows administrators to revoke an existing membership.
 * Sets the user's account as inactive, records revocation details,
 * and notifies the user about their revoked status.
 * 
 * @async
 * @function revokeMembership
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const revokeMembership = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, reason } = req.body;

    // Get admin from authenticated request
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // TODO: Check if user is admin
    
    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Set user as inactive or flagged
    user.isActive = false;
    user.membershipRevokedAt = new Date();
    // Convert string ID to ObjectId
    if (req.user.id) {
      user.membershipRevokedBy = new mongoose.Types.ObjectId(req.user.id);
    }
    user.membershipRevocationReason = reason;
    await user.save();

    // Send notification email to the user
    await emailService.notifyRevocation(
      user.email,
      user.name || 'Member',
      reason
    );

    res.status(200).json({
      success: true,
      message: 'Membership revoked successfully',
    });
  } catch (error) {
    console.error('Error in revokeMembership controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke membership',
      error: (error as Error).message,
    });
  }
}; 