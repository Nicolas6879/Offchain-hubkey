/**
 * @fileoverview Product routes for marketplace functionality
 * Defines API endpoints for product management and purchases
 */

import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  purchaseProduct,
  getUserPurchases,
  getUserBalance,
  getProductPurchases,
  getAllSales,
  updateDeliveryStatus,
} from '../controllers/productController';
import { requireAdmin } from '../middlewares/adminAuth';

const router = express.Router();

// Public routes (no authentication required)
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);
router.get('/balance', getUserBalance);
router.get('/purchases', getUserPurchases);

// User routes (require wallet address)
router.post('/products/:id/purchase', purchaseProduct);

// Admin routes (require admin authentication)
router.post('/admin/products', requireAdmin, createProduct);
router.put('/admin/products/:id', requireAdmin, updateProduct);
router.delete('/admin/products/:id', requireAdmin, deleteProduct);
router.get('/admin/products/:id/purchases', requireAdmin, getProductPurchases);

// Sales management routes (admin only)
router.get('/admin/sales', requireAdmin, getAllSales);
router.patch('/admin/sales/:id/delivery-status', requireAdmin, updateDeliveryStatus);

export default router;

