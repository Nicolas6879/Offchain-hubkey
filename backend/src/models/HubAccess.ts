/**
 * @fileoverview Hub Access model for tracking member visits to partner hubs
 * Defines the schema and interface for access requests and visit logs
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Possible status values for a hub access request
 * @typedef {('pending'|'approved'|'verified'|'accessed'|'denied')} HubAccessStatus
 */
export type HubAccessStatus = 'pending' | 'approved' | 'verified' | 'accessed' | 'denied';

/**
 * Hub Access document interface
 * 
 * @interface IHubAccess
 * @extends Document
 */
export interface IHubAccess extends Document {
  /** Reference to the hub being accessed */
  hubId: mongoose.Types.ObjectId;
  
  /** Visitor's full name */
  memberName: string;
  
  /** Visitor's email address */
  memberEmail: string;
  
  /** Visitor's blockchain wallet address */
  memberWalletAddress: string;
  
  /** NFT token ID proving membership */
  tokenId: string;
  
  /** Current status of the access request */
  status: HubAccessStatus;
  
  /** Planned date for the visit */
  visitDate: Date;
  
  /** Timestamp when access request was created */
  createdAt: Date;
  
  /** Timestamp when access request was last updated */
  updatedAt: Date;
  
  /** Timestamp when signature was verified */
  verifiedAt?: Date;
  
  /** The signature provided by the user */
  signature?: string;
  
  /** Timestamp when member actually accessed the hub */
  lastAccessedAt?: Date;
  
  /** Name of staff member who processed the visit */
  staffName?: string;
  
  /** Additional notes about the visit */
  accessNotes?: string;
}

/**
 * Mongoose schema for Hub Access model
 */
const HubAccessSchema: Schema = new Schema(
  {
    hubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hub',
      required: true,
    },
    memberName: {
      type: String,
      required: true,
      trim: true,
    },
    memberEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    memberWalletAddress: {
      type: String,
      required: true,
      trim: true,
    },
    tokenId: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'verified', 'accessed', 'denied'],
      default: 'pending',
    },
    visitDate: {
      type: Date,
      required: true,
    },
    verifiedAt: {
      type: Date,
    },
    signature: {
      type: String,
    },
    lastAccessedAt: {
      type: Date,
    },
    staffName: {
      type: String,
      trim: true,
    },
    accessNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const HubAccess = mongoose.model<IHubAccess>('HubAccess', HubAccessSchema);

export default HubAccess; 