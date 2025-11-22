/**
 * @fileoverview Event controller for event management
 * Handles CRUD operations for events and subscription management
 */

import { Request, Response } from 'express';
import Event from '../models/Event';
import EventSubscription from '../models/EventSubscription';
import User from '../models/User';
import { processEventPhoto, deleteEventPhoto, getPhotoType } from '../utils/photoStorage';
import topicService from '../services/topicService';
import mintService from '../services/mintService';
import rewardService from '../services/rewardService';
import mongoose from 'mongoose';
import crypto from 'crypto';
import QRCode from 'qrcode';
import config from '../config/env';
import { TopicId } from '@hashgraph/sdk';

/**
 * Create a new event (admin only)
 * 
 * @async
 * @function createEvent
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      name, 
      location, 
      photo, 
      description, 
      maxParticipants,
      eventDate,
      eventTime,
      rewardTokenId,
      rewardAmount,
    } = req.body;
    const adminWallet = (req as any).adminWallet;

    // Validate required fields
    if (!name || !name.trim()) {
      res.status(400).json({
        success: false,
        message: 'Event name is required',
        error: 'MISSING_REQUIRED_FIELDS',
      });
      return;
    }

    if (!location || !location.trim()) {
      res.status(400).json({
        success: false,
        message: 'Event location is required',
        error: 'MISSING_REQUIRED_FIELDS',
      });
      return;
    }

    if (!eventDate) {
      res.status(400).json({
        success: false,
        message: 'Event date is required',
        error: 'MISSING_REQUIRED_FIELDS',
      });
      return;
    }

    // Validate maxParticipants if provided
    if (maxParticipants !== undefined && maxParticipants !== null) {
      if (typeof maxParticipants !== 'number' || maxParticipants < 1) {
        res.status(400).json({
          success: false,
          message: 'Max participants must be a positive number',
          error: 'INVALID_MAX_PARTICIPANTS',
        });
        return;
      }
    }

    // Validate reward fields
    if (rewardTokenId && !rewardAmount) {
      res.status(400).json({
        success: false,
        message: 'Reward amount is required when reward token ID is provided',
        error: 'INVALID_REWARD_CONFIG',
      });
      return;
    }

    // Generate unique QR secret token
    const qrSecretToken = crypto.randomBytes(32).toString('hex');

    // Create Hedera topic for the event
    console.log('📝 Creating topic for event...');
    let topicId: string | undefined;
    try {
      const topicResult = await topicService.createTopic({
        userId: adminWallet,
        name: name.trim(),
        email: '', // Not needed for event topics
        walletAddress: adminWallet,
      });
      topicId = topicResult.topicId.toString();
      console.log(`✅ Topic created: ${topicId}`);
    } catch (topicError) {
      console.error('Error creating topic:', topicError);
      // Continue without topic - it's not critical
    }

    // Create event
    const event = new Event({
      name: name.trim(),
      location: location.trim(),
      description: description?.trim(),
      maxParticipants: maxParticipants || undefined,
      createdBy: adminWallet,
      currentParticipants: 0,
      isActive: true,
      eventDate: new Date(eventDate),
      eventTime: eventTime?.trim(),
      topicId,
      qrSecretToken,
      rewardTokenId: rewardTokenId?.trim(),
      rewardAmount: rewardAmount || undefined,
    });

    await event.save();

    // Process photo if provided
    if (photo && photo.trim()) {
      try {
        const processedPhoto = await processEventPhoto(photo, String(event._id));
        event.photo = processedPhoto;
        await event.save();
      } catch (photoError) {
        console.error('Error processing event photo:', photoError);
        res.status(400).json({
          success: false,
          message: (photoError as Error).message || 'Invalid photo format',
          error: 'INVALID_PHOTO_FORMAT',
        });
        // Clean up the created event
        await Event.findByIdAndDelete(event._id);
        return;
      }
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: event,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'CREATE_EVENT_ERROR',
    });
  }
};

/**
 * Get all active events (public)
 * 
 * @async
 * @function getAllEvents
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getAllEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    // Query all active events
    const events = await Event.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    // Populate currentParticipants count from EventSubscription
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const subscriptionCount = await EventSubscription.countDocuments({
          eventId: event._id,
          status: 'active',
        });

        return {
          ...event,
          currentParticipants: subscriptionCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      events: eventsWithCounts,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'FETCH_EVENTS_ERROR',
    });
  }
};

/**
 * Get event by ID (public)
 * 
 * @async
 * @function getEventById
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format',
        error: 'INVALID_EVENT_ID',
      });
      return;
    }

    const event = await Event.findById(id).lean();

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
        error: 'EVENT_NOT_FOUND',
      });
      return;
    }

    // Get current participants count
    const subscriptionCount = await EventSubscription.countDocuments({
      eventId: event._id,
      status: 'active',
    });

    res.status(200).json({
      success: true,
      event: {
        ...event,
        currentParticipants: subscriptionCount,
      },
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'FETCH_EVENT_ERROR',
    });
  }
};

/**
 * Update an event (admin only)
 * 
 * @async
 * @function updateEvent
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      location, 
      photo, 
      maxParticipants, 
      isActive,
      eventDate,
      eventTime,
      rewardTokenId,
      rewardAmount,
    } = req.body;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format',
        error: 'INVALID_EVENT_ID',
      });
      return;
    }

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
        error: 'EVENT_NOT_FOUND',
      });
      return;
    }

    // Validate maxParticipants if provided
    if (maxParticipants !== undefined && maxParticipants !== null) {
      const currentCount = await EventSubscription.countDocuments({
        eventId: event._id,
        status: 'active',
      });

      if (maxParticipants < currentCount) {
        res.status(400).json({
          success: false,
          message: `Cannot reduce max participants below current subscription count (${currentCount})`,
          error: 'CAPACITY_EXCEEDED',
        });
        return;
      }
    }

    // Update fields
    if (name !== undefined) event.name = name.trim();
    if (description !== undefined) event.description = description?.trim();
    if (location !== undefined) event.location = location.trim();
    if (maxParticipants !== undefined) event.maxParticipants = maxParticipants;
    if (isActive !== undefined) event.isActive = isActive;
    if (eventDate !== undefined) event.eventDate = new Date(eventDate);
    if (eventTime !== undefined) event.eventTime = eventTime?.trim();
    if (rewardTokenId !== undefined) event.rewardTokenId = rewardTokenId?.trim();
    if (rewardAmount !== undefined) event.rewardAmount = rewardAmount;

    // Handle photo update
    if (photo !== undefined) {
      if (photo && photo.trim()) {
        try {
          const oldPhoto = event.photo;
          const processedPhoto = await processEventPhoto(photo, String(event._id));
          event.photo = processedPhoto;

          // Delete old photo if it was a local file and different from new one
          if (oldPhoto && oldPhoto !== processedPhoto && getPhotoType(oldPhoto) === 'local') {
            deleteEventPhoto(oldPhoto);
          }
        } catch (photoError) {
          console.error('Error processing event photo:', photoError);
          res.status(400).json({
            success: false,
            message: (photoError as Error).message || 'Invalid photo format',
            error: 'INVALID_PHOTO_FORMAT',
          });
          return;
        }
      } else {
        // Delete old photo if removing
        if (event.photo && getPhotoType(event.photo) === 'local') {
          deleteEventPhoto(event.photo);
        }
        event.photo = undefined;
      }
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event: event,
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'UPDATE_EVENT_ERROR',
    });
  }
};

/**
 * Delete an event (admin only) - Soft delete
 * 
 * @async
 * @function deleteEvent
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format',
        error: 'INVALID_EVENT_ID',
      });
      return;
    }

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
        error: 'EVENT_NOT_FOUND',
      });
      return;
    }

    // Soft delete - set isActive to false
    event.isActive = false;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'DELETE_EVENT_ERROR',
    });
  }
};

/**
 * Subscribe to an event (public, requires wallet address)
 * 
 * @async
 * @function subscribeToEvent
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const subscribeToEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let walletAddress = req.headers['wallet-address'] as string || req.body.walletAddress;

    if (!walletAddress) {
      res.status(401).json({
        success: false,
        message: 'Wallet address required',
        error: 'WALLET_REQUIRED',
      });
      return;
    }

    walletAddress = walletAddress.toLowerCase().trim();

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format',
        error: 'INVALID_EVENT_ID',
      });
      return;
    }

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
        error: 'EVENT_NOT_FOUND',
      });
      return;
    }

    if (!event.isActive) {
      res.status(400).json({
        success: false,
        message: 'Event is not active',
        error: 'EVENT_INACTIVE',
      });
      return;
    }

    // Check if already subscribed
    const existingSubscription = await EventSubscription.findOne({
      eventId: event._id,
      walletAddress: walletAddress,
    });

    if (existingSubscription) {
      if (existingSubscription.status === 'active') {
        res.status(400).json({
          success: false,
          message: 'Already subscribed to this event',
          error: 'ALREADY_SUBSCRIBED',
        });
        return;
      } else {
        // Reactivate cancelled subscription
        existingSubscription.status = 'active';
        existingSubscription.subscribedAt = new Date();
        await existingSubscription.save();

        res.status(200).json({
          success: true,
          message: 'Subscription reactivated successfully',
          subscription: existingSubscription,
        });
        return;
      }
    }

    // Check capacity
    const currentCount = await EventSubscription.countDocuments({
      eventId: event._id,
      status: 'active',
    });

    if (event.maxParticipants && currentCount >= event.maxParticipants) {
      res.status(400).json({
        success: false,
        message: 'Event is at full capacity',
        error: 'EVENT_FULL',
      });
      return;
    }

    // Create subscription
    const subscription = new EventSubscription({
      eventId: event._id,
      walletAddress: walletAddress,
      status: 'active',
    });

    await subscription.save();

    // Submit subscription message to event topic
    if (event.topicId) {
      try {
        const message = JSON.stringify({
          type: 'SUBSCRIPTION',
          walletAddress,
          eventId: String(event._id),
          eventName: event.name,
          timestamp: Date.now(),
        });
        await topicService.submitMessageToTopic(TopicId.fromString(event.topicId), message);
        console.log(`📨 Subscription message submitted to topic ${event.topicId}`);
      } catch (topicError) {
        console.error('Error submitting subscription message:', topicError);
        // Don't fail the subscription if topic submission fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Subscribed to event successfully',
      subscription: subscription,
    });
  } catch (error) {
    console.error('Error subscribing to event:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'SUBSCRIBE_ERROR',
    });
  }
};

/**
 * Unsubscribe from an event (public, requires wallet address)
 * 
 * @async
 * @function unsubscribeFromEvent
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const unsubscribeFromEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let walletAddress = req.headers['wallet-address'] as string || req.body.walletAddress;

    if (!walletAddress) {
      res.status(401).json({
        success: false,
        message: 'Wallet address required',
        error: 'WALLET_REQUIRED',
      });
      return;
    }

    walletAddress = walletAddress.toLowerCase().trim();

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format',
        error: 'INVALID_EVENT_ID',
      });
      return;
    }

    const subscription = await EventSubscription.findOne({
      eventId: id,
      walletAddress: walletAddress,
      status: 'active',
    });

    if (!subscription) {
      res.status(404).json({
        success: false,
        message: 'No active subscription found',
        error: 'NOT_SUBSCRIBED',
      });
      return;
    }

    // Update status to cancelled instead of deleting
    subscription.status = 'cancelled';
    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Unsubscribed from event successfully',
    });
  } catch (error) {
    console.error('Error unsubscribing from event:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'UNSUBSCRIBE_ERROR',
    });
  }
};

/**
 * Get subscribers for an event (public)
 * Returns all participants who intend to go (active) or have already attended
 * 
 * @async
 * @function getEventSubscribers
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getEventSubscribers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format',
        error: 'INVALID_EVENT_ID',
      });
      return;
    }

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
        error: 'EVENT_NOT_FOUND',
      });
      return;
    }

    // Get all active and attended subscriptions (people who intend to go or already went)
    const subscriptions = await EventSubscription.find({
      eventId: event._id,
      status: { $in: ['active', 'attended'] },
    })
      .sort({ subscribedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      subscriptions: subscriptions,
      count: subscriptions.length,
    });
  } catch (error) {
    console.error('Error fetching event subscribers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'FETCH_SUBSCRIBERS_ERROR',
    });
  }
};

/**
 * Get user's subscriptions (public, requires wallet address)
 * 
 * @async
 * @function getUserSubscriptions
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getUserSubscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    let walletAddress = req.headers['wallet-address'] as string || req.query.walletAddress as string;

    if (!walletAddress) {
      res.status(401).json({
        success: false,
        message: 'Wallet address required',
        error: 'WALLET_REQUIRED',
      });
      return;
    }

    walletAddress = walletAddress.toLowerCase().trim();

    const subscriptions = await EventSubscription.find({
      walletAddress: walletAddress,
      status: 'active',
    })
      .populate('eventId')
      .sort({ subscribedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      subscriptions: subscriptions,
      count: subscriptions.length,
    });
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'FETCH_SUBSCRIPTIONS_ERROR',
    });
  }
};

/**
 * Check-in to event via QR code scan
 * 
 * @async
 * @function checkInToEvent
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const checkInToEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { qrSecretToken } = req.body;
    let walletAddress = req.headers['wallet-address'] as string || req.body.walletAddress;

    if (!walletAddress) {
      res.status(401).json({
        success: false,
        message: 'Wallet address required',
        error: 'WALLET_REQUIRED',
      });
      return;
    }

    if (!qrSecretToken) {
      res.status(400).json({
        success: false,
        message: 'QR secret token required',
        error: 'TOKEN_REQUIRED',
      });
      return;
    }

    walletAddress = walletAddress.toLowerCase().trim();

    // Validate event ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format',
        error: 'INVALID_EVENT_ID',
      });
      return;
    }

    // Get event
    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
        error: 'EVENT_NOT_FOUND',
      });
      return;
    }

    // Validate QR secret token
    if (event.qrSecretToken !== qrSecretToken) {
      res.status(403).json({
        success: false,
        message: 'Invalid QR code',
        error: 'INVALID_QR_CODE',
      });
      return;
    }

    // Get subscription
    const subscription = await EventSubscription.findOne({
      eventId: event._id,
      walletAddress: walletAddress,
    });

    if (!subscription) {
      res.status(404).json({
        success: false,
        message: 'You are not subscribed to this event',
        error: 'NOT_SUBSCRIBED',
      });
      return;
    }

    // Check if already checked in
    if (subscription.status === 'attended') {
      res.status(400).json({
        success: false,
        message: 'You have already checked in to this event',
        error: 'ALREADY_CHECKED_IN',
      });
      return;
    }

    // Check if this is the user's first event participation
    const previousAttendances = await EventSubscription.countDocuments({
      walletAddress: walletAddress,
      status: 'attended',
    });

    const isFirstTime = previousAttendances === 0;

    // If first-time participant, mint and transfer member NFT
    let nftMinted = false;
    let nftError: string | undefined;
    if (isFirstTime) {
      try {
        console.log(`🎉 First-time participant detected: ${walletAddress}`);
        
        // Get user info
        const user = await User.findOne({ walletAddress });
        
        if (user) {
          // Mint NFT
          const mintResult = await mintService.mintIdentityNFT({
            userId: user._id.toString(),
            name: user.name || 'Member',
            email: user.email,
            walletAddress: user.walletAddress,
            metadata: event.topicId || String(event._id),
          });

          // Transfer NFT to user
          await mintService.transferNFT(
            mintResult.tokenId,
            mintResult.serialNumber,
            user.walletAddress
          );

          // Update user record
          user.nftTokenIds.push(`${mintResult.tokenId}.${mintResult.serialNumber}`);
          user.hasParticipatedInEvent = true;
          await user.save();

          nftMinted = true;
          console.log(`✅ Member NFT minted and transferred to ${walletAddress}`);
        }
      } catch (nftErrorCaught) {
        nftError = (nftErrorCaught as Error).message || 'Failed to mint/transfer NFT';
        console.error('Error minting member NFT:', nftErrorCaught);
        // Continue with check-in even if NFT minting fails
      }
    }

    // Update subscription status
    subscription.status = 'attended';
    subscription.attendedAt = new Date();
    subscription.isFirstTimeParticipation = isFirstTime;
    subscription.memberNftMinted = nftMinted;
    
    // Record NFT transfer failure if any
    if (isFirstTime && !nftMinted && nftError) {
      subscription.nftTransferFailed = true;
      subscription.nftTransferError = nftError;
    }
    
    await subscription.save();

    // Submit attendance message to topic
    if (event.topicId) {
      try {
        const message = JSON.stringify({
          type: 'ATTENDANCE',
          walletAddress,
          eventId: String(event._id),
          eventName: event.name,
          isFirstTime,
          timestamp: Date.now(),
        });
        await topicService.submitMessageToTopic(TopicId.fromString(event.topicId), message);
        console.log(`📨 Attendance message submitted to topic ${event.topicId}`);
      } catch (topicError) {
        console.error('Error submitting attendance message:', topicError);
      }
    }

    // Distribute rewards if configured
    let rewardDistributed = false;
    let rewardError: string | undefined;
    if (event.rewardTokenId && event.rewardAmount) {
      try {
        const rewardResult = await rewardService.distributeReward(
          String(event._id),
          walletAddress
        );
        rewardDistributed = rewardResult.success;
        
        if (!rewardResult.success) {
          rewardError = rewardResult.message;
          // Update subscription with reward failure
          subscription.rewardDistributionFailed = true;
          subscription.rewardDistributionError = rewardResult.message;
          await subscription.save();
        }
        
        console.log(`🎁 Reward distribution: ${rewardResult.message}`);
      } catch (rewardErrorCaught) {
        rewardError = (rewardErrorCaught as Error).message || 'Failed to distribute reward';
        console.error('Error distributing reward:', rewardErrorCaught);
        
        // Update subscription with reward failure
        subscription.rewardDistributionFailed = true;
        subscription.rewardDistributionError = rewardError;
        await subscription.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Check-in successful',
      data: {
        isFirstTime,
        memberNftMinted: nftMinted,
        rewardDistributed,
        attendedAt: subscription.attendedAt,
        nftTransferFailed: subscription.nftTransferFailed,
        rewardDistributionFailed: subscription.rewardDistributionFailed,
        errors: {
          nftTransfer: nftError,
          rewardDistribution: rewardError,
        },
      },
    });
  } catch (error) {
    console.error('Error checking in to event:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'CHECKIN_ERROR',
    });
  }
};

/**
 * Get QR code for event check-in (admin only)
 * 
 * @async
 * @function getEventQRCode
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getEventQRCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate event ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format',
        error: 'INVALID_EVENT_ID',
      });
      return;
    }

    // Get event
    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
        error: 'EVENT_NOT_FOUND',
      });
      return;
    }

    if (!event.qrSecretToken) {
      res.status(400).json({
        success: false,
        message: 'Event does not have a QR code',
        error: 'NO_QR_CODE',
      });
      return;
    }

    // Generate QR code URL
    const qrUrl = `${config.frontendUrl}/scan/${id}/${event.qrSecretToken}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 400,
      margin: 2,
    });

    res.status(200).json({
      success: true,
      qrCode: {
        url: qrUrl,
        dataUrl: qrCodeDataUrl,
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'QR_CODE_ERROR',
    });
  }
};

/**
 * Retry failed NFT transfer or reward distribution
 * 
 * @async
 * @function retryFailedTransfers
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const retryFailedTransfers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let walletAddress = req.headers['wallet-address'] as string || req.body.walletAddress;

    if (!walletAddress) {
      res.status(401).json({
        success: false,
        message: 'Wallet address required',
        error: 'WALLET_REQUIRED',
      });
      return;
    }

    walletAddress = walletAddress.toLowerCase().trim();

    // Validate event ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format',
        error: 'INVALID_EVENT_ID',
      });
      return;
    }

    // Get event
    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
        error: 'EVENT_NOT_FOUND',
      });
      return;
    }

    // Get subscription
    const subscription = await EventSubscription.findOne({
      eventId: event._id,
      walletAddress: walletAddress,
    });

    if (!subscription) {
      res.status(404).json({
        success: false,
        message: 'Subscription not found',
        error: 'SUBSCRIPTION_NOT_FOUND',
      });
      return;
    }

    if (subscription.status !== 'attended') {
      res.status(400).json({
        success: false,
        message: 'User has not attended the event',
        error: 'NOT_ATTENDED',
      });
      return;
    }

    const results = {
      nft: { success: false, message: '' },
      reward: { success: false, message: '' },
    };

    // Retry NFT transfer if failed
    if (subscription.nftTransferFailed && subscription.isFirstTimeParticipation) {
      try {
        const user = await User.findOne({ walletAddress });
        
        if (user) {
          // Mint NFT (it might already be minted, so check if we have the info)
          const mintResult = await mintService.mintIdentityNFT({
            userId: user._id.toString(),
            name: user.name || 'Member',
            email: user.email,
            walletAddress: user.walletAddress,
            metadata: event.topicId || String(event._id),
          });

          // Transfer NFT to user
          await mintService.transferNFT(
            mintResult.tokenId,
            mintResult.serialNumber,
            user.walletAddress
          );

          // Update records
          user.nftTokenIds.push(`${mintResult.tokenId}.${mintResult.serialNumber}`);
          user.hasParticipatedInEvent = true;
          await user.save();

          subscription.memberNftMinted = true;
          subscription.nftTransferFailed = false;
          subscription.nftTransferError = undefined;
          await subscription.save();

          results.nft.success = true;
          results.nft.message = 'NFT transferred successfully';
        }
      } catch (nftError) {
        results.nft.message = (nftError as Error).message || 'Failed to transfer NFT';
      }
    } else if (!subscription.nftTransferFailed) {
      results.nft.message = 'No NFT transfer failure to retry';
    }

    // Retry reward distribution if failed
    if (subscription.rewardDistributionFailed && event.rewardTokenId && event.rewardAmount) {
      try {
        const rewardResult = await rewardService.distributeReward(
          String(event._id),
          walletAddress
        );
        
        if (rewardResult.success) {
          subscription.rewardDistributionFailed = false;
          subscription.rewardDistributionError = undefined;
          await subscription.save();
          
          results.reward.success = true;
          results.reward.message = 'Reward distributed successfully';
        } else {
          results.reward.message = rewardResult.message;
        }
      } catch (rewardError) {
        results.reward.message = (rewardError as Error).message || 'Failed to distribute reward';
      }
    } else if (!subscription.rewardDistributionFailed) {
      results.reward.message = 'No reward distribution failure to retry';
    }

    res.status(200).json({
      success: true,
      message: 'Retry completed',
      results,
    });
  } catch (error) {
    console.error('Error retrying failed transfers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'RETRY_ERROR',
    });
  }
};

/**
 * Get topic messages for an event (public)
 * 
 * @async
 * @function getEventTopicMessages
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getEventTopicMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate event ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format',
        error: 'INVALID_EVENT_ID',
      });
      return;
    }

    // Get event
    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
        error: 'EVENT_NOT_FOUND',
      });
      return;
    }

    if (!event.topicId) {
      res.status(400).json({
        success: false,
        message: 'Event does not have an associated topic',
        error: 'NO_TOPIC',
      });
      return;
    }

    // Fetch topic messages from Hedera Mirror Node
    const messages = await topicService.getTopicMessages(event.topicId);

    res.status(200).json({
      success: true,
      topicId: event.topicId,
      messages: messages,
      count: messages.length,
    });
  } catch (error) {
    console.error('Error fetching topic messages:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'TOPIC_MESSAGES_ERROR',
    });
  }
};

