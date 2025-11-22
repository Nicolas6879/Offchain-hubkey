/**
 * @fileoverview User management controller
 * Handles CRUD operations for users
 */

import { Request, Response } from 'express';
import User from '../models/User';
import { isAdminWallet } from '../utils/adminUtils';

/**
 * Calculate user status based on NFT ownership and admin role
 */
const calculateUserStatus = (user: any): 'admin' | 'member' | 'registered' | 'blocked' => {
  if (!user.isActive) {
    return 'blocked';
  }
  if (isAdminWallet(user.walletAddress)) {
    return 'admin';
  }
  if (user.nftTokenIds && user.nftTokenIds.length > 0) {
    return 'member';
  }
  return 'registered';
};

/**
 * Get all users with optional filtering
 * @route GET /api/users
 * @query status - Filter by user status (optional)
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    // Get all users (we'll filter by calculated status if needed)
    const users = await User.find()
      .select('-password -privateKey') // Exclude sensitive fields
      .sort({ createdAt: -1 }); // Most recent first

    // Calculate status for each user and filter if needed
    const usersWithStatus = users.map(user => {
      const userObj = user.toObject();
      const calculatedStatus = calculateUserStatus(userObj);
      return {
        ...userObj,
        status: calculatedStatus
      };
    });

    // Filter by status if provided
    const filteredUsers = status 
      ? usersWithStatus.filter(u => u.status === status)
      : usersWithStatus;

    res.status(200).json({
      success: true,
      users: filteredUsers,
      count: filteredUsers.length
    });
  } catch (error) {
    console.error('Error in getAllUsers controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: (error as Error).message
    });
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password -privateKey');
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Calculate status
    const userObj = user.toObject();
    const calculatedStatus = calculateUserStatus(userObj);

    res.status(200).json({
      success: true,
      user: {
        ...userObj,
        status: calculatedStatus
      }
    });
  } catch (error) {
    console.error('Error in getUserById controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: (error as Error).message
    });
  }
};

/**
 * Block a user (sets isActive to false)
 * @route POST /api/users/block/:id
 */
export const blockUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).select('-password -privateKey');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Calculate status (will be 'blocked' because isActive is false)
    const userObj = user.toObject();
    const calculatedStatus = calculateUserStatus(userObj);

    res.status(200).json({
      success: true,
      message: 'User blocked successfully',
      user: {
        ...userObj,
        status: calculatedStatus
      }
    });
  } catch (error) {
    console.error('Error in blockUser controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block user',
      error: (error as Error).message
    });
  }
};

/**
 * Unblock a user (sets isActive to true)
 * Status will be recalculated based on NFT ownership
 * @route POST /api/users/unblock/:id
 */
export const unblockUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    ).select('-password -privateKey');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Calculate status (will be based on NFT ownership and admin role)
    const userObj = user.toObject();
    const calculatedStatus = calculateUserStatus(userObj);

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully',
      user: {
        ...userObj,
        status: calculatedStatus
      }
    });
  } catch (error) {
    console.error('Error in unblockUser controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock user',
      error: (error as Error).message
    });
  }
};

/**
 * Delete a user
 * @route DELETE /api/users/:id
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteUser controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: (error as Error).message
    });
  }
};

