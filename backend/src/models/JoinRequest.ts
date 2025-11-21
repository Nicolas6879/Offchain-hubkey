/**
 * @fileoverview Join Request model for membership applications
 * Defines the schema and interface for membership request tracking
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Possible status values for a join request
 * @typedef {('pending'|'approved'|'rejected')} JoinRequestStatus
 */
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

/**
 * Join Request document interface
 * 
 * @interface IJoinRequest
 * @extends Document
 */
export interface IJoinRequest extends Document {
  /** Applicant's full name */
  fullName: string;
  
  /** Applicant's phone number (optional) */
  phone?: string;
  
  /** Applicant's email address */
  email: string;
  
  /** Applicant's blockchain wallet address */
  walletAddress: string;
  
  /** Current status of the join request */
  status: JoinRequestStatus;
  
  /** Timestamp when request was created */
  createdAt: Date;
  
  /** Timestamp when request was last updated */
  updatedAt: Date;
  
  /** Timestamp when request was approved (if applicable) */
  approvedAt?: Date;
  
  /** Reference to admin who approved the request */
  approvedBy?: mongoose.Types.ObjectId;
  
  /** Timestamp when request was rejected (if applicable) */
  rejectedAt?: Date;
  
  /** Reference to admin who rejected the request */
  rejectedBy?: mongoose.Types.ObjectId;
  
  /** Reason provided for rejection */
  rejectionReason?: string;
  
  /** NFT token ID generated for this request (if approved) */
  nftTokenId?: string;
  
  /** NFT serial number within the token collection */
  nftSerialNumber?: number;
  
  /** Whether the NFT has been claimed/transferred to the user */
  nftClaimed?: boolean;
  
  /** Timestamp when NFT was claimed */
  nftClaimedAt?: Date;
  
  /** Hedera topic ID for this join request */
  topicId?: string;
}

/**
 * Mongoose schema for Join Request model
 */
const JoinRequestSchema: Schema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    walletAddress: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
    },
    nftTokenId: {
      type: String,
    },
    nftSerialNumber: {
      type: Number,
    },
    nftClaimed: {
      type: Boolean,
      default: false,
    },
    nftClaimedAt: {
      type: Date,
    },
    topicId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const JoinRequest = mongoose.model<IJoinRequest>('JoinRequest', JoinRequestSchema);

export default JoinRequest; 