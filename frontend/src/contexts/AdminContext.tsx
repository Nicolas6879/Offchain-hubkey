/**
 * @fileoverview Admin context for managing admin privileges and state
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminService, AdminCheckResponse } from '../services/adminService';
import { useWalletInterface } from '../services/wallets/useWalletInterface';

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  adminWallet: string | null;
  error: string | null;
  checkAdminStatus: (walletAddress?: string) => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
  clearAdminStatus: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [adminWallet, setAdminWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { accountId } = useWalletInterface();

  const checkAdminStatus = async (walletAddress?: string) => {
    const targetWallet = walletAddress || accountId;
    
    if (!targetWallet) {
      setIsAdmin(false);
      setAdminWallet(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response: AdminCheckResponse = await adminService.checkAdminStatus(targetWallet);
      
      if (response.success) {
        setIsAdmin(response.isAdmin);
        setAdminWallet(response.isAdmin ? targetWallet : null);
        
        if (!response.isAdmin && response.message !== 'Insufficient privileges') {
          setError(response.message || null);
        }
      } else {
        setIsAdmin(false);
        setAdminWallet(null);
        setError(response.message || 'Failed to check admin status');
      }
    } catch (err) {
      console.error('Error in checkAdminStatus:', err);
      setIsAdmin(false);
      setAdminWallet(null);
      setError('Failed to check admin status');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAdminStatus = async () => {
    if (adminWallet || accountId) {
      await checkAdminStatus();
    }
  };

  const clearAdminStatus = () => {
    setIsAdmin(false);
    setAdminWallet(null);
    setError(null);
  };

  // Check admin status when wallet connects/changes
  useEffect(() => {
    if (accountId) {
      checkAdminStatus(accountId);
    } else {
      clearAdminStatus();
    }
  }, [accountId]);

  // Check stored wallet address on initial load
  useEffect(() => {
    const storedWallet = localStorage.getItem('walletAddress');
    if (storedWallet && !accountId) {
      checkAdminStatus(storedWallet);
    }
  }, []);

  const contextValue: AdminContextType = {
    isAdmin,
    isLoading,
    adminWallet,
    error,
    checkAdminStatus,
    refreshAdminStatus,
    clearAdminStatus,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

// Helper hook for conditional admin access
export const useAdminAccess = () => {
  const { isAdmin, isLoading, adminWallet } = useAdmin();
  
  return {
    hasAdminAccess: isAdmin && adminWallet,
    isCheckingAdmin: isLoading,
    adminWallet,
  };
}; 