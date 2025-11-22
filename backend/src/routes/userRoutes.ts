/**
 * @fileoverview User management routes
 * Handles CRUD operations for users
 */

import express from 'express';
import {
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
  deleteUser
} from '../controllers/userController';

const router = express.Router();

/**
 * @route GET /api/users
 * @description Get all users (with optional status filter)
 * @query status - Filter by status (optional)
 * @access Public (should be protected in production)
 */
router.get('/', getAllUsers);

/**
 * @route GET /api/users/:id
 * @description Get user by ID
 * @param id - User ID
 * @access Public (should be protected in production)
 */
router.get('/:id', getUserById);

/**
 * @route POST /api/users/block/:id
 * @description Block a user
 * @param id - User ID
 * @access Public (should be protected/admin in production)
 */
router.post('/block/:id', blockUser);

/**
 * @route POST /api/users/unblock/:id
 * @description Unblock a user
 * @param id - User ID
 * @access Public (should be protected/admin in production)
 */
router.post('/unblock/:id', unblockUser);

/**
 * @route DELETE /api/users/:id
 * @description Delete a user
 * @param id - User ID
 * @access Public (should be protected/admin in production)
 */
router.delete('/:id', deleteUser);

export default router;

