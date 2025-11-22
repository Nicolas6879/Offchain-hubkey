/**
 * @fileoverview Profile controller for user profile management
 * Handles retrieving and updating user profile information
 */

import { Request, Response } from 'express';
import User from '../models/User';
import EventSubscription from '../models/EventSubscription';
import mongoose from 'mongoose';
import mintService from '../services/mintService';

/**
 * Get the current user's profile
 * 
 * @route GET /api/profile
 * @access Private
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get wallet address from header
    const walletAddress = req.headers['wallet-address'] as string;
    
    if (!walletAddress) {
      res.status(401).json({ success: false, message: 'Wallet address required' });
      return;
    }

    // Find user by wallet address
    const user = await User.findOne({ 
      walletAddress: walletAddress.toLowerCase() 
    }).select('-password');
    
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Get NFT count and primary NFT details
    const nftCount = user.nftTokenIds.length;
    let primaryNft = null;
    
    if (user.nftTokenIds.length > 0) {
      const primaryTokenIdFull = user.nftTokenIds[0];
      try {
        // Parse tokenId and serialNumber from stored format "tokenId.serialNumber"
        // Example: "0.0.12345.1" -> tokenId: "0.0.12345", serialNumber: 1
        const parts = primaryTokenIdFull.split('.');
        const serialNumber = parts.length > 3 ? parseInt(parts[parts.length - 1]) : 1;
        const tokenId = parts.length > 3 
          ? parts.slice(0, parts.length - 1).join('.') 
          : primaryTokenIdFull;
        
        console.log(`Fetching NFT info for tokenId: ${tokenId}, serialNumber: ${serialNumber}`);
        
        // Get NFT metadata from Hedera
        const nftInfo = await mintService.getNFTInfo(tokenId, serialNumber);
        primaryNft = {
          tokenId,
          serialNumber,
          ...nftInfo,
        };
      } catch (error) {
        console.error('Error fetching primary NFT info:', error);
        // Still return basic info even if fetch fails
        const parts = primaryTokenIdFull.split('.');
        const serialNumber = parts.length > 3 ? parseInt(parts[parts.length - 1]) : 1;
        const tokenId = parts.length > 3 
          ? parts.slice(0, parts.length - 1).join('.') 
          : primaryTokenIdFull;
        primaryNft = {
          tokenId,
          serialNumber,
        };
      }
    }

    // Get event statistics
    const totalEvents = await EventSubscription.countDocuments({ 
      walletAddress: user.walletAddress.toLowerCase() 
    });
    const attendedEvents = await EventSubscription.countDocuments({ 
      walletAddress: user.walletAddress.toLowerCase(),
      status: 'attended' 
    });
    const upcomingEvents = await EventSubscription.countDocuments({ 
      walletAddress: user.walletAddress.toLowerCase(),
      status: 'active' 
    });

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        walletAddress: user.walletAddress,
        nftCount,
        primaryNft,
        isActive: user.isActive,
        createdAt: user.createdAt,
        stats: {
          totalEvents,
          attendedEvents,
          upcomingEvents,
        },
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
    // Get wallet address from header
    const walletAddress = req.headers['wallet-address'] as string;
    
    if (!walletAddress) {
      res.status(401).json({ success: false, message: 'Wallet address required' });
      return;
    }
    
    const { name, email, bio } = req.body;
    
    // Find user by wallet address
    const user = await User.findOne({ 
      walletAddress: walletAddress.toLowerCase() 
    });
    
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    
    // Build update object with only the fields that were provided
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (bio !== undefined) updateData.bio = bio;
    
    // Check if email already exists for a different user
    if (email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: user._id }
      });
      
      if (existingUser) {
        res.status(400).json({ success: false, message: 'Email already in use' });
        return;
      }
    }
    
    // Update the user profile
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updateData },
      { new: true }
    ).select('-password');

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
        bio: updatedUser.bio,
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

/**
 * Get the current user's event history
 * 
 * @route GET /api/profile/events
 * @access Private
 */
export const getUserEventHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get wallet address from header
    const walletAddress = req.headers['wallet-address'] as string;
    
    if (!walletAddress) {
      res.status(401).json({ success: false, message: 'Wallet address required' });
      return;
    }

    const user = await User.findOne({ 
      walletAddress: walletAddress.toLowerCase() 
    });
    
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const { status } = req.query;

    // Build query filter
    const filter: any = { walletAddress: user.walletAddress.toLowerCase() };
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Query event subscriptions with populated event details
    const eventHistory = await EventSubscription.find(filter)
      .populate('eventId')
      .sort({ subscribedAt: -1 })
      .lean();

    // Format response
    const formattedHistory = eventHistory.map((subscription: any) => ({
      subscriptionId: subscription._id,
      status: subscription.status,
      subscribedAt: subscription.subscribedAt,
      attendedAt: subscription.attendedAt,
      rewardSent: subscription.rewardSent,
      memberNftMinted: subscription.memberNftMinted,
      event: subscription.eventId ? {
        id: subscription.eventId._id,
        name: subscription.eventId.name,
        description: subscription.eventId.description,
        location: subscription.eventId.location,
        photo: subscription.eventId.photo,
        eventDate: subscription.eventId.eventDate,
        eventTime: subscription.eventId.eventTime,
        maxParticipants: subscription.eventId.maxParticipants,
        currentParticipants: subscription.eventId.currentParticipants,
      } : null,
    }));

    res.status(200).json({
      success: true,
      data: formattedHistory,
      count: formattedHistory.length,
    });
  } catch (error) {
    console.error('Error getting event history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
