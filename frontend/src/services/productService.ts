/**
 * Product Service
 * 
 * Handles all API calls related to marketplace products and purchases
 */

import { appConfig } from '../config';

const API_BASE_URL = `${appConfig.networks.testnet.backendUrl}/api`;

export interface Product {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  images?: string[]; // Array of up to 3 images
  price: number;
  available: number;
  sold: number;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  _id: string;
  productId: string;
  userId: string;
  walletAddress: string;
  quantity: number;
  pricePerItem: number;
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  deliveryStatus: 'pending' | 'delivered';
  productName: string;
  productImage?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  image?: string;
  price: number;
  available: number;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  image?: string;
  price?: number;
  available?: number;
  isActive?: boolean;
}

/**
 * Get all active products
 */
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch products');
    }

    return data.products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

/**
 * Get product by ID
 */
export const getProductById = async (productId: string): Promise<Product> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch product');
    }

    return data.product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

/**
 * Create a new product (Admin only)
 */
export const createProduct = async (
  productData: CreateProductData,
  adminWallet: string,
  adminSignature: string
): Promise<Product> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-wallet': adminWallet,
        'x-admin-signature': adminSignature,
      },
      body: JSON.stringify(productData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create product');
    }

    return data.product;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

/**
 * Update a product (Admin only)
 */
export const updateProduct = async (
  productId: string,
  productData: UpdateProductData,
  adminWallet: string,
  adminSignature: string
): Promise<Product> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-wallet': adminWallet,
        'x-admin-signature': adminSignature,
      },
      body: JSON.stringify(productData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update product');
    }

    return data.product;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

/**
 * Delete a product (Admin only) - Soft delete
 */
export const deleteProduct = async (
  productId: string,
  adminWallet: string,
  adminSignature: string
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-wallet': adminWallet,
        'x-admin-signature': adminSignature,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete product');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

/**
 * Purchase a product
 */
export const purchaseProduct = async (
  productId: string,
  quantity: number,
  walletAddress: string
): Promise<{ purchase: Purchase; newBalance: number }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'wallet-address': walletAddress,
      },
      body: JSON.stringify({ quantity }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to purchase product');
    }

    return {
      purchase: data.purchase,
      newBalance: data.newBalance,
    };
  } catch (error) {
    console.error('Error purchasing product:', error);
    throw error;
  }
};

/**
 * Get user's purchase history
 */
export const getUserPurchases = async (walletAddress: string): Promise<Purchase[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/purchases?walletAddress=${walletAddress}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'wallet-address': walletAddress,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch purchases');
    }

    return data.purchases;
  } catch (error) {
    console.error('Error fetching purchases:', error);
    throw error;
  }
};

/**
 * Get user's token balance
 */
export const getUserBalance = async (walletAddress: string): Promise<{ tokenBalance: number; tokenId: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/balance?walletAddress=${walletAddress}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'wallet-address': walletAddress,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch balance');
    }

    return {
      tokenBalance: data.tokenBalance,
      tokenId: data.tokenId,
    };
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
};

/**
 * Get all purchases for a product (Admin only)
 */
export const getProductPurchases = async (
  productId: string,
  adminWallet: string,
  adminSignature: string
): Promise<Purchase[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/purchases`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-wallet': adminWallet,
        'x-admin-signature': adminSignature,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch product purchases');
    }

    return data.purchases;
  } catch (error) {
    console.error('Error fetching product purchases:', error);
    throw error;
  }
};

