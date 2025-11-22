/**
 * @fileoverview Product model for marketplace system
 * Defines the schema and interface for products that can be purchased
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Product document interface
 * 
 * @interface IProduct
 * @extends Document
 */
export interface IProduct extends Document {
  /** Product's display name */
  name: string;
  
  /** Detailed description of the product */
  description?: string;
  
  /** Product image filename in /generated folder or external URL (deprecated - use images array) */
  image?: string;
  
  /** Array of product images (up to 3) - filenames in /generated folder or external URLs */
  images?: string[];
  
  /** Price in platform tokens (0.0.2203022) */
  price: number;
  
  /** Number of items available for purchase */
  available: number;
  
  /** Number of items sold */
  sold: number;
  
  /** Wallet address of admin who created the product */
  createdBy: string;
  
  /** Whether the product is currently active and visible */
  isActive: boolean;
  
  /** Timestamp when product was created */
  createdAt: Date;
  
  /** Timestamp when product was last updated */
  updatedAt: Date;
}

/**
 * Mongoose schema for Product model
 */
const ProductSchema: Schema = new Schema(
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
    image: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function(v: string[]) {
          return v.length <= 3;
        },
        message: 'A product can have a maximum of 3 images'
      }
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    available: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    sold: {
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
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ createdBy: 1 });

const Product = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;

