/**
 * @fileoverview Event model for event management system
 * Defines the schema and interface for events that users can subscribe to
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Event document interface
 * 
 * @interface IEvent
 * @extends Document
 */
export interface IEvent extends Document {
  /** Event's display name */
  name: string;
  
  /** Detailed description of the event */
  description?: string;
  
  /** Physical location of the event */
  location: string;
  
  /** Photo filename in /generated folder or external URL */
  photo?: string;
  
  /** Maximum number of participants allowed (null/undefined = unlimited) */
  maxParticipants?: number;
  
  /** Current number of participants subscribed */
  currentParticipants: number;
  
  /** Wallet address of admin who created the event */
  createdBy: string;
  
  /** Whether the event is currently active and visible */
  isActive: boolean;
  
  /** Date when the event takes place */
  eventDate: Date;
  
  /** Optional time string for the event (e.g., "14:00" or "2:00 PM") */
  eventTime?: string;
  
  /** Hedera topic ID for this event */
  topicId?: string;
  
  /** Unique secret token for QR code check-in validation */
  qrSecretToken?: string;
  
  /** Token ID to distribute as reward after attendance */
  rewardTokenId?: string;
  
  /** Amount of reward tokens to distribute per attendee */
  rewardAmount?: number;
  
  /** Timestamp when event was created */
  createdAt: Date;
  
  /** Timestamp when event was last updated */
  updatedAt: Date;
}

/**
 * Mongoose schema for Event model
 */
const EventSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    photo: {
      type: String,
      trim: true,
    },
    maxParticipants: {
      type: Number,
      min: 1,
    },
    currentParticipants: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    eventTime: {
      type: String,
      trim: true,
    },
    topicId: {
      type: String,
      trim: true,
    },
    qrSecretToken: {
      type: String,
      trim: true,
    },
    rewardTokenId: {
      type: String,
      trim: true,
    },
    rewardAmount: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
EventSchema.index({ createdAt: -1 });
EventSchema.index({ isActive: 1 });
EventSchema.index({ createdBy: 1 });

const Event = mongoose.model<IEvent>('Event', EventSchema);

export default Event;

