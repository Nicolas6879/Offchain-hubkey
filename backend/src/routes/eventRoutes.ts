/**
 * @fileoverview Event routes for event management
 * Defines all endpoints for event CRUD operations and subscriptions
 */

import express from 'express';
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  subscribeToEvent,
  unsubscribeFromEvent,
  getEventSubscribers,
  getUserSubscriptions,
  checkInToEvent,
  getEventQRCode,
  getEventTopicMessages,
  retryFailedTransfers,
} from '../controllers/eventController';
import { requireAdmin } from '../middlewares/adminAuth';

const router = express.Router();

/**
 * @route GET /api/events
 * @description Get all active events
 * @access Public
 * @returns {Object} List of active events with subscription counts
 */
router.get('/', getAllEvents);

/**
 * @route GET /api/events/subscriptions/me
 * @description Get user's event subscriptions
 * @access Public (requires wallet-address header)
 * @returns {Object} List of user's subscriptions with event details
 */
router.get('/subscriptions/me', getUserSubscriptions);

/**
 * @route GET /api/events/:id/subscribers
 * @description Get all subscribers for an event
 * @access Public
 * @param {string} id - Event MongoDB ObjectId
 * @returns {Object} List of subscribers with subscription details
 */
router.get('/:id/subscribers', getEventSubscribers);

/**
 * @route GET /api/events/:id/qr
 * @description Get QR code for event check-in
 * @access Admin only
 * @param {string} id - Event MongoDB ObjectId
 * @returns {Object} QR code URL and data URL
 */
router.get('/:id/qr', requireAdmin, getEventQRCode);

/**
 * @route GET /api/events/:id/messages
 * @description Get topic messages for an event from Hedera
 * @access Public
 * @param {string} id - Event MongoDB ObjectId
 * @returns {Object} List of messages from the event topic
 */
router.get('/:id/messages', getEventTopicMessages);

/**
 * @route POST /api/events/:id/subscribe
 * @description Subscribe to an event
 * @access Public (requires wallet-address header)
 * @param {string} id - Event MongoDB ObjectId
 * @returns {Object} Subscription confirmation
 */
router.post('/:id/subscribe', subscribeToEvent);

/**
 * @route DELETE /api/events/:id/subscribe
 * @description Unsubscribe from an event
 * @access Public (requires wallet-address header)
 * @param {string} id - Event MongoDB ObjectId
 * @returns {Object} Unsubscribe confirmation
 */
router.delete('/:id/subscribe', unsubscribeFromEvent);

/**
 * @route POST /api/events/:id/checkin
 * @description Check-in to event via QR code scan
 * @access Public (requires wallet-address header and qrSecretToken)
 * @param {string} id - Event MongoDB ObjectId
 * @body {string} qrSecretToken - Secret token from QR code
 * @returns {Object} Check-in confirmation with first-timer and reward info
 */
router.post('/:id/checkin', checkInToEvent);

/**
 * @route POST /api/events/:id/retry
 * @description Retry failed NFT transfer or reward distribution
 * @access Public (requires wallet-address header)
 * @param {string} id - Event MongoDB ObjectId
 * @returns {Object} Retry results for NFT and reward
 */
router.post('/:id/retry', retryFailedTransfers);

/**
 * @route GET /api/events/:id
 * @description Get event by ID
 * @access Public
 * @param {string} id - Event MongoDB ObjectId
 * @returns {Object} Event details with subscription count
 */
router.get('/:id', getEventById);

/**
 * @route POST /api/events
 * @description Create a new event
 * @access Admin only
 * @returns {Object} Created event details
 */
router.post('/', requireAdmin, createEvent);

/**
 * @route PUT /api/events/:id
 * @description Update an event
 * @access Admin only
 * @param {string} id - Event MongoDB ObjectId
 * @returns {Object} Updated event details
 */
router.put('/:id', requireAdmin, updateEvent);

/**
 * @route DELETE /api/events/:id
 * @description Delete an event (soft delete)
 * @access Admin only
 * @param {string} id - Event MongoDB ObjectId
 * @returns {Object} Deletion confirmation
 */
router.delete('/:id', requireAdmin, deleteEvent);

export default router;

