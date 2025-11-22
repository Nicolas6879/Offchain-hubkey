/**
 * @fileoverview EventSubscription model for tracking event subscriptions
 * Defines the schema and interface for user subscriptions to events
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * EventSubscription document interface
 * 
 * @interface IEventSubscription
 * @extends Document
 */
export interface IEventSubscription extends Document {
  /** Reference to the Event */
  eventId: mongoose.Types.ObjectId;
  
  /** Wallet address of the subscriber */
  walletAddress: string;
  
  /** Timestamp when subscription was created */
  subscribedAt: Date;
  
  /** Current status of the subscription */
  status: 'active' | 'cancelled' | 'attended';
  
  /** Timestamp when QR code was scanned and attendance confirmed */
  attendedAt?: Date;
  
  /** Whether this was the user's first event participation */
  isFirstTimeParticipation?: boolean;
  
  /** Whether member NFT was minted for this subscription */
  memberNftMinted?: boolean;
  
  /** Whether reward tokens were sent for this attendance */
  rewardSent?: boolean;
  
  /** Failed NFT transfer error message */
  nftTransferError?: string;
  
  /** Failed reward distribution error message */
  rewardDistributionError?: string;
  
  /** Whether NFT transfer failed and needs retry */
  nftTransferFailed?: boolean;
  
  /** Whether reward distribution failed and needs retry */
  rewardDistributionFailed?: boolean;
  
  /** Timestamp when record was created */
  createdAt: Date;
  
  /** Timestamp when record was last updated */
  updatedAt: Date;
}

/**
 * Mongoose schema for EventSubscription model
 */
const EventSubscriptionSchema: Schema = new Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    walletAddress: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'attended'],
      default: 'active',
    },
    attendedAt: {
      type: Date,
    },
    isFirstTimeParticipation: {
      type: Boolean,
    },
    memberNftMinted: {
      type: Boolean,
      default: false,
    },
    rewardSent: {
      type: Boolean,
      default: false,
    },
    nftTransferError: {
      type: String,
    },
    rewardDistributionError: {
      type: String,
    },
    nftTransferFailed: {
      type: Boolean,
      default: false,
    },
    rewardDistributionFailed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound unique index to prevent duplicate subscriptions
EventSubscriptionSchema.index({ eventId: 1, walletAddress: 1 }, { unique: true });

// Create index for efficient event subscriber queries
EventSubscriptionSchema.index({ eventId: 1 });

// Create index for "my subscriptions" queries
EventSubscriptionSchema.index({ walletAddress: 1 });

// Create index for filtering by status
EventSubscriptionSchema.index({ status: 1 });

const EventSubscription = mongoose.model<IEventSubscription>(
  'EventSubscription',
  EventSubscriptionSchema
);

export default EventSubscription;

