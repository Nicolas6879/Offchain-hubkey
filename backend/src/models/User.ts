/**
 * @fileoverview User model for authentication and membership status
 * Defines the schema, interface, and methods for user accounts
 */

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * User document interface
 * 
 * @interface IUser
 * @extends Document
 */
export interface IUser extends Document {
  /** MongoDB ObjectId */
  _id: mongoose.Types.ObjectId;
  
  /** User's email address (unique) */
  email: string;
  
  /** User's blockchain wallet address (unique) */
  walletAddress: string;
  
  /** User's hashed password */
  password: string;
  
  /** User's display name */
  name?: string;
  
  /** User's biography/description */
  bio?: string;
  
  /** Encrypted private key for custodial wallet */
  privateKey?: string;
  
  /** Public key for the wallet */
  publicKey?: string;
  
  /** Timestamp when wallet was created */
  accountCreatedAt?: Date;
  
  /** Quick flag to check if user has participated in any event */
  hasParticipatedInEvent: boolean;
  
  /** Timestamp when user account was created */
  createdAt: Date;
  
  /** Timestamp when user account was last updated */
  updatedAt: Date;
  
  /** Array of NFT token IDs owned by the user */
  nftTokenIds: string[];
  
  /** Token balance for marketplace purchases (hardcoded token: 0.0.2203022) */
  tokenBalance: number;
  
  /** Whether the user account is active */
  isActive: boolean;
  
  /** User status based on NFT ownership and admin role */
  status: 'member' | 'registered' | 'admin' | 'blocked';
  
  /** Timestamp when membership was revoked, if applicable */
  membershipRevokedAt?: Date;
  
  /** Reference to admin who revoked membership */
  membershipRevokedBy?: mongoose.Types.ObjectId;
  
  /** Reason provided for membership revocation */
  membershipRevocationReason?: string;
  
  /**
   * Compare a candidate password with the user's hashed password
   * 
   * @function comparePassword
   * @param {string} candidatePassword - The plain text password to verify
   * @returns {Promise<boolean>} True if password matches, false otherwise
   */
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * Mongoose schema for User model
 */
const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    privateKey: {
      type: String,
      select: false, // Don't include by default in queries for security
    },
    publicKey: {
      type: String,
    },
    accountCreatedAt: {
      type: Date,
    },
    hasParticipatedInEvent: {
      type: Boolean,
      default: false,
    },
    nftTokenIds: {
      type: [String],
      default: [],
    },
    tokenBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['member', 'registered', 'admin', 'blocked'],
      default: 'registered',
    },
    membershipRevokedAt: {
      type: Date,
    },
    membershipRevokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    membershipRevocationReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save middleware to hash passwords before storing
 */
UserSchema.pre<IUser>('save', async function (next) {
  const user = this;
  if (!user.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Method to compare password with stored hash
 */
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', UserSchema);

export default User; 