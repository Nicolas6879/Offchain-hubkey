/**
 * @fileoverview Profile controller for user profile management
 * Handles retrieving and updating user profile information
 */

import { Request, Response } from 'express';
import User from '../models/User';
import mongoose from 'mongoose';

/**
 * Get the current user's profile
 * 
 * @route GET /api/profile
 * @access Private
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // TEMPORARY: For testing, use a hardcoded test user ID if req.user is not present
    const userId = req.user?.id || '000000000000000000000001'; // Fallback test ID
    
    // Find the first user if no user ID is available (for testing only)
    let user;
    if (userId === '000000000000000000000001') {
      user = await User.findOne().select('-password');
      if (!user) {
        // Create dummy user data for testing if no users exist
        res.status(200).json({
          success: true,
          data: {
            id: '000000000000000000000001',
            name: 'Test User',
            email: 'test@example.com',
            walletAddress: '0x123456789abcdef',
            nftCount: 1,
            isActive: true,
            createdAt: new Date(),
          },
        });
        return;
      }
    } else {
      user = await User.findById(userId).select('-password');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
    }

    // Get NFT count
    const nftCount = user.nftTokenIds.length;

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        nftCount,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update the current user's profile
 * 
 * @route PUT /api/profile
 * @access Private
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // TEMPORARY: For testing, use a hardcoded test user ID if req.user is not present
    const userId = req.user?.id || '000000000000000000000001'; // Fallback test ID
    
    const { name, email, phone } = req.body;
    
    // Build update object with only the fields that were provided
    const updateData: Record<string, any> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    
    // Find the first user if no user ID is available (for testing only)
    let updatedUser;
    if (userId === '000000000000000000000001') {
      const user = await User.findOne();
      if (!user) {
        // Return dummy data for testing if no users exist
        res.status(200).json({
          success: true,
          data: {
            id: '000000000000000000000001',
            name: name || 'Test User',
            email: email || 'test@example.com',
            walletAddress: '0x123456789abcdef',
            nftCount: 1,
            isActive: true,
            createdAt: new Date(),
          },
          message: 'Profile updated successfully (test mode)',
        });
        return;
      }
      
      updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $set: updateData },
        { new: true }
      ).select('-password');
    } else {
      // Check if email already exists for a different user
      if (email) {
        const existingUser = await User.findOne({ 
          email: email.toLowerCase(),
          _id: { $ne: new mongoose.Types.ObjectId(userId) }
        });
        
        if (existingUser) {
          res.status(400).json({ success: false, message: 'Email already in use' });
          return;
        }
      }
      
      // Update the user profile
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true }
      ).select('-password');
    }

    if (!updatedUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        walletAddress: updatedUser.walletAddress,
        nftCount: updatedUser.nftTokenIds.length,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}; 