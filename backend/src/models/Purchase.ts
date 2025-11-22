/**
 * @fileoverview Purchase model for tracking marketplace transactions
 * Defines the schema and interface for product purchases
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Purchase document interface
 * 
 * @interface IPurchase
 * @extends Document
 */
export interface IPurchase extends Document {
  /** Reference to the product purchased */
  productId: mongoose.Types.ObjectId;
  
  /** Reference to the user who made the purchase */
  userId: mongoose.Types.ObjectId;
  
  /** Wallet address of the buyer */
  walletAddress: string;
  
  /** Quantity purchased */
  quantity: number;
  
  /** Price per item at time of purchase */
  pricePerItem: number;
  
  /** Total amount paid */
  totalAmount: number;
  
  /** Purchase status */
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  
  /** Delivery status for physical products */
  deliveryStatus: 'pending' | 'delivered';
  
  /** Product name at time of purchase (for historical record) */
  productName: string;
  
  /** Product image at time of purchase (for historical record) */
  productImage?: string;
  
  /** Notes or additional information */
  notes?: string;
  
  /** Timestamp when purchase was created */
  createdAt: Date;
  
  /** Timestamp when purchase was last updated */
  updatedAt: Date;
}

/**
 * Mongoose schema for Purchase model
 */
const PurchaseSchema: Schema = new Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    walletAddress: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerItem: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'refunded'],
      default: 'completed',
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'delivered'],
      default: 'pending',
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    productImage: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
PurchaseSchema.index({ userId: 1, createdAt: -1 });
PurchaseSchema.index({ productId: 1 });
PurchaseSchema.index({ walletAddress: 1 });
PurchaseSchema.index({ status: 1 });
PurchaseSchema.index({ deliveryStatus: 1 });
PurchaseSchema.index({ createdAt: -1 });

const Purchase = mongoose.model<IPurchase>('Purchase', PurchaseSchema);

export default Purchase;

