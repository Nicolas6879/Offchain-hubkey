/**
 * @fileoverview Hub access routes
 * Handles requests for access to partner hubs, notifications, logs, status checks, and hub management
 */

import express from 'express';
import { 
  requestHubAccess, 
  notifyHub, 
  getHubAccessStatus, 
  logHubAccess,
  getActiveHubs,
  createHub,
  getAllHubsAdmin,
  getHubById,
  updateHub,
  deleteHub
} from '../controllers/hubAccessController';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/adminAuth';

const router = express.Router();

// User routes (for hub access requests)
/**
 * @route POST /api/hub-access/request
 * @description Request access to a partner hub
 * @access Public
 * @body {Object} request
 * @param {string} hubId - ID of the hub to access
 * @param {string} name - Visitor's name
 * @param {string} email - Visitor's email
 * @param {string} walletAddress - Visitor's blockchain wallet address
 * @param {string} tokenId - NFT token ID proving membership
 * @param {string} [visitDate] - Planned date for the visit (ISO format)
 * @returns {Object} Access request ID and confirmation message
 */
router.post('/request', requestHubAccess);

/**
 * @route GET /api/hub-access/status/:wallet
 * @description Get hub access status for a wallet address
 * @access Public
 * @param {string} wallet - Blockchain wallet address to check
 * @returns {Object} List of access requests with status and details
 */
router.get('/status/:wallet', getHubAccessStatus);

/**
 * @route POST /api/hub-access/:id/notify
 * @description Send notification to a hub about an upcoming visit
 * @access Public (TEMPORARY for testing - normally Private)
 * @param {string} id - ID of the hub access request
 * @body {Object} request
 * @param {string} [visitDate] - Updated planned date for the visit (ISO format)
 * @returns {Object} Confirmation message
 */
router.post('/:id/notify', notifyHub);

/**
 * @route POST /api/hub-access/:id/log
 * @description Log a member's physical access to a hub
 * @access Public (TEMPORARY for testing - normally Private/Hub staff only)
 * @param {string} id - ID of the hub access request
 * @body {Object} request
 * @param {string} [staffName] - Name of the staff member who approved entry
 * @param {string} [notes] - Additional notes about the visit
 * @returns {Object} Confirmation message
 */
router.post('/:id/log', logHubAccess);

// Hub management routes
/**
 * @route GET /api/hub-access/hubs
 * @description Get all active hubs available for access requests
 * @access Public
 * @returns {Object} List of active hubs with basic information
 */
router.get('/hubs', getActiveHubs);

/**
 * @route GET /api/hub-access/hubs/:id
 * @description Get detailed information about a specific hub
 * @access Public
 * @param {string} id - Hub ID
 * @returns {Object} Hub details
 */
router.get('/hubs/:id', getHubById);

// Admin routes (for hub management)
/**
 * @route POST /api/hub-access/admin/hubs
 * @description Create a new hub (Admin only)
 * @access Private (Admin)
 * @body {Object} request
 * @param {string} name - Hub name
 * @param {string} endereco - Hub address
 * @param {string} cidade - Hub city
 * @param {string} estado - Hub state
 * @param {string} contactEmail - Hub contact email
 * @param {string} [description] - Hub description
 * @param {string} [contactPhone] - Hub contact phone
 * @param {string} [websiteUrl] - Hub website URL
 * @param {boolean} [isActive=true] - Whether hub is active
 * @param {boolean} [membershipRequired=true] - Whether membership is required
 * @returns {Object} Created hub information
 */
router.post('/admin/hubs', requireAdmin, createHub);

/**
 * @route GET /api/hub-access/admin/hubs
 * @description Get all hubs including inactive ones (Admin only)
 * @access Private (Admin)
 * @returns {Object} List of all hubs with full information
 */
router.get('/admin/hubs', requireAdmin, getAllHubsAdmin);

/**
 * @route PUT /api/hub-access/admin/hubs/:id
 * @description Update a hub (Admin only)
 * @access Private (Admin)
 * @param {string} id - Hub ID
 * @body {Object} request - Hub data to update
 * @returns {Object} Updated hub information
 */
router.put('/admin/hubs/:id', requireAdmin, updateHub);

/**
 * @route DELETE /api/hub-access/admin/hubs/:id
 * @description Delete/deactivate a hub (Admin only)
 * @access Private (Admin)
 * @param {string} id - Hub ID
 * @body {Object} request
 * @param {boolean} [permanent=false] - Whether to permanently delete the hub
 * @returns {Object} Deletion confirmation
 */
router.delete('/admin/hubs/:id', requireAdmin, deleteHub);

export default router; 