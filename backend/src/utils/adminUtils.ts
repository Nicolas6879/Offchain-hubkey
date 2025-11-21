/**
 * @fileoverview Admin utilities for wallet privilege checking
 */

import config from '../config/env';

/**
 * Check if a wallet address has admin privileges
 * 
 * @param walletAddress - The wallet address to check
 * @returns boolean - True if the wallet has admin privileges
 */
export const isAdminWallet = (walletAddress: string): boolean => {
  if (!walletAddress) {
    return false;
  }

  // Normalize the wallet address to lowercase for comparison
  const normalizedWallet = walletAddress.trim().toLowerCase();
  
  return config.admin.wallets.includes(normalizedWallet);
};

/**
 * Get all admin wallet addresses
 * 
 * @returns string[] - Array of admin wallet addresses
 */
export const getAdminWallets = (): string[] => {
  return [...config.admin.wallets];
};

/**
 * Add an admin wallet (runtime only, doesn't persist)
 * 
 * @param walletAddress - The wallet address to add as admin
 * @returns boolean - True if successfully added, false if already exists
 */
export const addAdminWallet = (walletAddress: string): boolean => {
  if (!walletAddress) {
    return false;
  }

  const normalizedWallet = walletAddress.trim().toLowerCase();
  
  if (config.admin.wallets.includes(normalizedWallet)) {
    return false; // Already exists
  }
  
  config.admin.wallets.push(normalizedWallet);
  return true;
};

/**
 * Remove an admin wallet (runtime only, doesn't persist)
 * 
 * @param walletAddress - The wallet address to remove from admin
 * @returns boolean - True if successfully removed, false if not found
 */
export const removeAdminWallet = (walletAddress: string): boolean => {
  if (!walletAddress) {
    return false;
  }

  const normalizedWallet = walletAddress.trim().toLowerCase();
  const index = config.admin.wallets.indexOf(normalizedWallet);
  
  if (index === -1) {
    return false; // Not found
  }
  
  config.admin.wallets.splice(index, 1);
  return true;
}; 