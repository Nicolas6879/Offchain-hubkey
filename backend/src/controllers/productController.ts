/**
 * @fileoverview Product controller for marketplace management
 * Handles CRUD operations for products and purchase transactions
 */

import { Request, Response } from 'express';
import Product from '../models/Product';
import Purchase from '../models/Purchase';
import User from '../models/User';
import { processEventPhoto, deleteEventPhoto, getPhotoType } from '../utils/photoStorage';
import mongoose from 'mongoose';

// Hardcoded reward token ID
const REWARD_TOKEN_ID = '0.0.2203022';

/**
 * Create a new product (admin only)
 * 
 * @async
 * @function createProduct
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, image, images, price, available } = req.body;
    const adminWallet = (req as any).adminWallet;

    // Validate required fields
    if (!name || !name.trim()) {
      res.status(400).json({
        success: false,
        message: 'Product name is required',
        error: 'MISSING_REQUIRED_FIELDS',
      });
      return;
    }

    if (price === undefined || price === null || price < 0) {
      res.status(400).json({
        success: false,
        message: 'Valid product price is required',
        error: 'INVALID_PRICE',
      });
      return;
    }

    if (available === undefined || available === null || available < 0) {
      res.status(400).json({
        success: false,
        message: 'Valid available quantity is required',
        error: 'INVALID_QUANTITY',
      });
      return;
    }

    // Validate images array length
    if (images && Array.isArray(images) && images.length > 3) {
      res.status(400).json({
        success: false,
        message: 'Maximum of 3 images allowed',
        error: 'TOO_MANY_IMAGES',
      });
      return;
    }

    // Create product
    const product = new Product({
      name: name.trim(),
      description: description?.trim(),
      price: Number(price),
      available: Number(available),
      sold: 0,
      createdBy: adminWallet,
      isActive: true,
      images: [],
    });

    await product.save();

    // Process multiple images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      try {
        const processedImages: string[] = [];
        for (let i = 0; i < images.length; i++) {
          if (images[i] && images[i].trim()) {
            const processedImage = await processEventPhoto(images[i], `${product._id}-${i}`);
            processedImages.push(processedImage);
          }
        }
        product.images = processedImages;
        // Keep first image in the old 'image' field for backward compatibility
        if (processedImages.length > 0) {
          product.image = processedImages[0];
        }
        await product.save();
      } catch (photoError) {
        console.error('Error processing product images:', photoError);
        res.status(400).json({
          success: false,
          message: (photoError as Error).message || 'Invalid image format',
          error: 'INVALID_IMAGE_FORMAT',
        });
        // Clean up the created product
        await Product.findByIdAndDelete(product._id);
        return;
      }
    } else if (image && image.trim()) {
      // Fallback to single image for backward compatibility
      try {
        const processedImage = await processEventPhoto(image, String(product._id));
        product.image = processedImage;
        product.images = [processedImage];
        await product.save();
      } catch (photoError) {
        console.error('Error processing product image:', photoError);
        res.status(400).json({
          success: false,
          message: (photoError as Error).message || 'Invalid image format',
          error: 'INVALID_IMAGE_FORMAT',
        });
        // Clean up the created product
        await Product.findByIdAndDelete(product._id);
        return;
      }
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: product,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'CREATE_PRODUCT_ERROR',
    });
  }
};

/**
 * Get all active products (public)
 * 
 * @async
 * @function getAllProducts
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      products: products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'FETCH_PRODUCTS_ERROR',
    });
  }
};

/**
 * Get product by ID (public)
 * 
 * @async
 * @function getProductById
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
        error: 'INVALID_PRODUCT_ID',
      });
      return;
    }

    const product = await Product.findById(id).lean();

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      product: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'FETCH_PRODUCT_ERROR',
    });
  }
};

/**
 * Update a product (admin only)
 * 
 * @async
 * @function updateProduct
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, image, images, price, available, isActive } = req.body;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
        error: 'INVALID_PRODUCT_ID',
      });
      return;
    }

    // Validate images array length
    if (images && Array.isArray(images) && images.length > 3) {
      res.status(400).json({
        success: false,
        message: 'Maximum of 3 images allowed',
        error: 'TOO_MANY_IMAGES',
      });
      return;
    }

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND',
      });
      return;
    }

    // Update fields
    if (name !== undefined) product.name = name.trim();
    if (description !== undefined) product.description = description?.trim();
    if (price !== undefined) product.price = Number(price);
    if (available !== undefined) product.available = Number(available);
    if (isActive !== undefined) product.isActive = isActive;

    // Handle multiple images update
    if (images !== undefined) {
      if (images && Array.isArray(images) && images.length > 0) {
        try {
          const oldImages = product.images || [];
          const processedImages: string[] = [];
          
          for (let i = 0; i < images.length; i++) {
            if (images[i] && images[i].trim()) {
              const processedImage = await processEventPhoto(images[i], `${product._id}-${i}`);
              processedImages.push(processedImage);
            }
          }
          
          product.images = processedImages;
          // Keep first image in the old 'image' field for backward compatibility
          if (processedImages.length > 0) {
            product.image = processedImages[0];
          }

          // Delete old images that are no longer used (local files only)
          for (const oldImg of oldImages) {
            if (oldImg && !processedImages.includes(oldImg) && getPhotoType(oldImg) === 'local') {
              deleteEventPhoto(oldImg);
            }
          }
        } catch (photoError) {
          console.error('Error processing product images:', photoError);
          res.status(400).json({
            success: false,
            message: (photoError as Error).message || 'Invalid image format',
            error: 'INVALID_IMAGE_FORMAT',
          });
          return;
        }
      } else {
        // Delete old images if removing
        const oldImages = product.images || [];
        for (const oldImg of oldImages) {
          if (oldImg && getPhotoType(oldImg) === 'local') {
            deleteEventPhoto(oldImg);
          }
        }
        product.images = [];
        product.image = undefined;
      }
    } else if (image !== undefined) {
      // Fallback to single image for backward compatibility
      if (image && image.trim()) {
        try {
          const oldImage = product.image;
          const processedImage = await processEventPhoto(image, String(product._id));
          product.image = processedImage;
          product.images = [processedImage];

          // Delete old image if it was a local file and different from new one
          if (oldImage && oldImage !== processedImage && getPhotoType(oldImage) === 'local') {
            deleteEventPhoto(oldImage);
          }
        } catch (photoError) {
          console.error('Error processing product image:', photoError);
          res.status(400).json({
            success: false,
            message: (photoError as Error).message || 'Invalid image format',
            error: 'INVALID_IMAGE_FORMAT',
          });
          return;
        }
      } else {
        // Delete old image if removing
        if (product.image && getPhotoType(product.image) === 'local') {
          deleteEventPhoto(product.image);
        }
        product.image = undefined;
        product.images = [];
      }
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: product,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'UPDATE_PRODUCT_ERROR',
    });
  }
};

/**
 * Delete a product (admin only) - Soft delete
 * 
 * @async
 * @function deleteProduct
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
        error: 'INVALID_PRODUCT_ID',
      });
      return;
    }

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND',
      });
      return;
    }

    // Soft delete - set isActive to false
    product.isActive = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'DELETE_PRODUCT_ERROR',
    });
  }
};

/**
 * Purchase a product (public, requires wallet address)
 * 
 * @async
 * @function purchaseProduct
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const purchaseProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    let walletAddress = req.headers['wallet-address'] as string || req.body.walletAddress;

    if (!walletAddress) {
      res.status(401).json({
        success: false,
        message: 'Wallet address required',
        error: 'WALLET_REQUIRED',
      });
      return;
    }

    walletAddress = walletAddress.toLowerCase().trim();

    // Validate quantity
    if (!quantity || quantity < 1) {
      res.status(400).json({
        success: false,
        message: 'Valid quantity is required (minimum 1)',
        error: 'INVALID_QUANTITY',
      });
      return;
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
        error: 'INVALID_PRODUCT_ID',
      });
      return;
    }

    // Get product
    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'PRODUCT_NOT_FOUND',
      });
      return;
    }

    if (!product.isActive) {
      res.status(400).json({
        success: false,
        message: 'Product is not available',
        error: 'PRODUCT_INACTIVE',
      });
      return;
    }

    // Check availability
    if (product.available < quantity) {
      res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${product.available} items available`,
        error: 'INSUFFICIENT_STOCK',
      });
      return;
    }

    // Get user
    const user = await User.findOne({ walletAddress });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      });
      return;
    }

    // Calculate total amount
    const totalAmount = product.price * quantity;

    // Check user balance
    if (user.tokenBalance < totalAmount) {
      res.status(400).json({
        success: false,
        message: `Insufficient balance. You have ${user.tokenBalance} tokens but need ${totalAmount} tokens`,
        error: 'INSUFFICIENT_BALANCE',
      });
      return;
    }

    // Start transaction (using mongoose session for atomicity)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Deduct tokens from user
      user.tokenBalance -= totalAmount;
      await user.save({ session });

      // Update product availability and sold count
      product.available -= quantity;
      product.sold += quantity;
      await product.save({ session });

      // Create purchase record
      const purchase = new Purchase({
        productId: product._id,
        userId: user._id,
        walletAddress: user.walletAddress,
        quantity: quantity,
        pricePerItem: product.price,
        totalAmount: totalAmount,
        status: 'completed',
        productName: product.name,
        productImage: product.image,
      });

      await purchase.save({ session });

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        success: true,
        message: 'Purchase completed successfully',
        purchase: purchase,
        newBalance: user.tokenBalance,
      });
    } catch (transactionError) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }
  } catch (error) {
    console.error('Error purchasing product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'PURCHASE_ERROR',
    });
  }
};

/**
 * Get user's purchase history (public, requires wallet address)
 * 
 * @async
 * @function getUserPurchases
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getUserPurchases = async (req: Request, res: Response): Promise<void> => {
  try {
    let walletAddress = req.headers['wallet-address'] as string || req.query.walletAddress as string;

    if (!walletAddress) {
      res.status(401).json({
        success: false,
        message: 'Wallet address required',
        error: 'WALLET_REQUIRED',
      });
      return;
    }

    walletAddress = walletAddress.toLowerCase().trim();

    const purchases = await Purchase.find({
      walletAddress: walletAddress,
    })
      .populate('productId')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      purchases: purchases,
      count: purchases.length,
    });
  } catch (error) {
    console.error('Error fetching user purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'FETCH_PURCHASES_ERROR',
    });
  }
};

/**
 * Get user's token balance (public, requires wallet address)
 * 
 * @async
 * @function getUserBalance
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getUserBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    let walletAddress = req.headers['wallet-address'] as string || req.query.walletAddress as string;

    if (!walletAddress) {
      res.status(401).json({
        success: false,
        message: 'Wallet address required',
        error: 'WALLET_REQUIRED',
      });
      return;
    }

    walletAddress = walletAddress.toLowerCase().trim();

    const user = await User.findOne({ walletAddress });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      tokenBalance: user.tokenBalance,
      tokenId: REWARD_TOKEN_ID,
    });
  } catch (error) {
    console.error('Error fetching user balance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'FETCH_BALANCE_ERROR',
    });
  }
};

/**
 * Get all purchases for a product (admin only)
 * 
 * @async
 * @function getProductPurchases
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getProductPurchases = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
        error: 'INVALID_PRODUCT_ID',
      });
      return;
    }

    const purchases = await Purchase.find({
      productId: id,
    })
      .populate('userId')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      purchases: purchases,
      count: purchases.length,
    });
  } catch (error) {
    console.error('Error fetching product purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'FETCH_PRODUCT_PURCHASES_ERROR',
    });
  }
};

/**
 * Get all sales with filtering and pagination (admin only)
 * 
 * @async
 * @function getAllSales
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getAllSales = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '50',
      deliveryStatus,
      status,
      startDate,
      endDate,
      productId,
      search,
    } = req.query;

    // Build filter query
    const filter: any = {};

    if (deliveryStatus) {
      filter.deliveryStatus = deliveryStatus;
    }

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (productId && mongoose.Types.ObjectId.isValid(productId as string)) {
      filter.productId = productId;
    }

    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { walletAddress: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const totalCount = await Purchase.countDocuments(filter);

    // Fetch purchases with populated user data
    const purchases = await Purchase.find(filter)
      .populate('userId', 'name email walletAddress')
      .populate('productId', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Calculate summary statistics
    const summary = await Purchase.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalProductsSold: { $sum: '$quantity' },
        },
      },
    ]);

    // Group by product for product-specific stats
    const productStats = await Purchase.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$productName' },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: '$totalAmount' },
          salesCount: { $sum: 1 },
        },
      },
      { $sort: { totalValue: -1 } },
    ]);

    res.status(200).json({
      success: true,
      purchases: purchases,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalItems: totalCount,
        itemsPerPage: limitNum,
      },
      summary: summary.length > 0 ? summary[0] : {
        totalSales: 0,
        totalRevenue: 0,
        totalProductsSold: 0,
      },
      productStats: productStats,
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'FETCH_SALES_ERROR',
    });
  }
};

/**
 * Update delivery status of a purchase (admin only)
 * 
 * @async
 * @function updateDeliveryStatus
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const updateDeliveryStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { deliveryStatus } = req.body;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid purchase ID format',
        error: 'INVALID_PURCHASE_ID',
      });
      return;
    }

    // Validate delivery status
    if (!deliveryStatus || !['pending', 'delivered'].includes(deliveryStatus)) {
      res.status(400).json({
        success: false,
        message: 'Valid delivery status is required (pending or delivered)',
        error: 'INVALID_DELIVERY_STATUS',
      });
      return;
    }

    const purchase = await Purchase.findById(id);

    if (!purchase) {
      res.status(404).json({
        success: false,
        message: 'Purchase not found',
        error: 'PURCHASE_NOT_FOUND',
      });
      return;
    }

    purchase.deliveryStatus = deliveryStatus;
    await purchase.save();

    res.status(200).json({
      success: true,
      message: 'Delivery status updated successfully',
      purchase: purchase,
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'UPDATE_DELIVERY_STATUS_ERROR',
    });
  }
};

