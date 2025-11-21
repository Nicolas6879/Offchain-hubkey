/**
 * @fileoverview Hub model for partner co-working spaces
 * Defines the schema and interface for hub locations that accept membership NFTs
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Hub document interface
 * 
 * @interface IHub
 * @extends Document
 */
export interface IHub extends Document {
  /** Hub's display name */
  name: string;
  
  /** Detailed description of the hub */
  description?: string;
  
  /** Physical address of the hub */
  endereco: string;
  
  /** City where the hub is located */
  cidade: string;
  
  /** State/province where the hub is located */
  estado: string;
  
  /** Email address for hub communications */
  contactEmail: string;
  
  /** Phone number for hub communications */
  contactPhone?: string;
  
  /** URL to the hub's website */
  websiteUrl?: string;
  
  /** Whether the hub is currently accepting members */
  isActive: boolean;
  
  /** Whether the hub requires official membership for access */
  membershipRequired: boolean;
  
  /** Timestamp when hub was added to platform */
  createdAt: Date;
  
  /** Timestamp when hub information was last updated */
  updatedAt: Date;
}

/**
 * Mongoose schema for Hub model
 */
const HubSchema: Schema = new Schema(
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
    endereco: {
      type: String,
      required: true,
      trim: true,
    },
    cidade: {
      type: String,
      required: true,
      trim: true,
    },
    estado: {
      type: String,
      required: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    websiteUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    membershipRequired: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Hub = mongoose.model<IHub>('Hub', HubSchema);

export default Hub; 