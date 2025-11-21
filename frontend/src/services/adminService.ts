/**
 * @fileoverview Admin service for handling admin-related API calls
 */

import { appConfig } from '../config';

const BASE_URL = appConfig.networks.testnet.backendUrl;

export interface Hub {
  id: string;
  name: string;
  description?: string;
  endereco: string;
  cidade: string;
  estado: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
  isActive: boolean;
  membershipRequired: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateHubRequest {
  name: string;
  description?: string;
  endereco: string;
  cidade: string;
  estado: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
  isActive?: boolean;
  membershipRequired?: boolean;
}

export interface AdminCheckResponse {
  success: boolean;
  isAdmin: boolean;
  walletAddress?: string;
  message?: string;
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface HubResponse {
  success: boolean;
  hub?: Hub;
  hubs?: Hub[];
  message?: string;
  error?: string;
}

class AdminService {
  /**
   * Check if a wallet address has admin privileges
   * @param walletAddress - The wallet address to check
   * @returns Promise<AdminCheckResponse>
   */
  async checkAdminStatus(walletAddress: string): Promise<AdminCheckResponse> {
    try {
      if (!walletAddress) {
        return {
          success: false,
          isAdmin: false,
          message: 'Wallet address is required'
        };
      }

      const response = await fetch(`${BASE_URL}/api/hub-access/admin/hubs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'wallet-address': walletAddress,
        },
      });

      if (response.status === 403) {
        return {
          success: true,
          isAdmin: false,
          walletAddress,
          message: 'Insufficient privileges'
        };
      }

      if (response.status === 401) {
        return {
          success: true,
          isAdmin: false,
          walletAddress,
          message: 'Wallet address required'
        };
      }

      if (response.ok) {
        return {
          success: true,
          isAdmin: true,
          walletAddress,
          message: 'Admin privileges confirmed'
        };
      }

      return {
        success: false,
        isAdmin: false,
        walletAddress,
        message: `Unexpected response: ${response.status}`
      };
    } catch (error) {
      console.error('Error checking admin status:', error);
      return {
        success: false,
        isAdmin: false,
        walletAddress,
        message: 'Failed to check admin status',
        error: (error as Error).message
      };
    }
  }

  /**
   * Get all active hubs (public endpoint)
   * @returns Promise<HubResponse>
   */
  async getActiveHubs(): Promise<HubResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/hub-access/hubs`);
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to fetch hubs',
          error: data.error
        };
      }

      return {
        success: true,
        hubs: data.hubs || [],
        message: 'Hubs retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching active hubs:', error);
      return {
        success: false,
        message: 'Failed to fetch hubs',
        error: (error as Error).message
      };
    }
  }

  /**
   * Get all hubs including inactive ones (admin only)
   * @param walletAddress - Admin wallet address
   * @returns Promise<HubResponse>
   */
  async getAllHubs(walletAddress: string): Promise<HubResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/hub-access/admin/hubs`, {
        headers: {
          'wallet-address': walletAddress,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to fetch hubs',
          error: data.error
        };
      }

      return {
        success: true,
        hubs: data.hubs || [],
        message: 'All hubs retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching all hubs:', error);
      return {
        success: false,
        message: 'Failed to fetch hubs',
        error: (error as Error).message
      };
    }
  }

  /**
   * Create a new hub (admin only)
   * @param walletAddress - Admin wallet address
   * @param hubData - Hub creation data
   * @returns Promise<HubResponse>
   */
  async createHub(walletAddress: string, hubData: CreateHubRequest): Promise<HubResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/hub-access/admin/hubs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'wallet-address': walletAddress,
        },
        body: JSON.stringify(hubData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to create hub',
          error: data.error
        };
      }

      return {
        success: true,
        hub: data.hub,
        message: 'Hub created successfully'
      };
    } catch (error) {
      console.error('Error creating hub:', error);
      return {
        success: false,
        message: 'Failed to create hub',
        error: (error as Error).message
      };
    }
  }

  /**
   * Update a hub (admin only)
   * @param walletAddress - Admin wallet address
   * @param hubId - Hub ID to update
   * @param updateData - Hub update data
   * @returns Promise<HubResponse>
   */
  async updateHub(walletAddress: string, hubId: string, updateData: Partial<CreateHubRequest>): Promise<HubResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/hub-access/admin/hubs/${hubId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'wallet-address': walletAddress,
        },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to update hub',
          error: data.error
        };
      }

      return {
        success: true,
        hub: data.hub,
        message: 'Hub updated successfully'
      };
    } catch (error) {
      console.error('Error updating hub:', error);
      return {
        success: false,
        message: 'Failed to update hub',
        error: (error as Error).message
      };
    }
  }

  /**
   * Delete/deactivate a hub (admin only)
   * @param walletAddress - Admin wallet address
   * @param hubId - Hub ID to delete
   * @param permanent - Whether to permanently delete the hub
   * @returns Promise<ApiResponse>
   */
  async deleteHub(walletAddress: string, hubId: string, permanent: boolean = false): Promise<ApiResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/hub-access/admin/hubs/${hubId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'wallet-address': walletAddress,
        },
        body: JSON.stringify({ permanent }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to delete hub',
          error: data.error
        };
      }

      return {
        success: true,
        message: permanent ? 'Hub permanently deleted' : 'Hub deactivated successfully'
      };
    } catch (error) {
      console.error('Error deleting hub:', error);
      return {
        success: false,
        message: 'Failed to delete hub',
        error: (error as Error).message
      };
    }
  }

  /**
   * Get hub by ID
   * @param hubId - Hub ID
   * @returns Promise<HubResponse>
   */
  async getHubById(hubId: string): Promise<HubResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/hub-access/hubs/${hubId}`);
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to fetch hub',
          error: data.error
        };
      }

      return {
        success: true,
        hub: data.hub,
        message: 'Hub retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching hub by ID:', error);
      return {
        success: false,
        message: 'Failed to fetch hub',
        error: (error as Error).message
      };
    }
  }
}

export const adminService = new AdminService(); 