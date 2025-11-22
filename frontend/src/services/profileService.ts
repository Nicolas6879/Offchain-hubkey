/**
 * @fileoverview Profile service for managing user profile operations
 * Handles profile fetching, updating, photo upload, and event history
 */

import { appConfig } from '../config';

export interface ProfileData {
  id: string;
  name?: string;
  email: string;
  bio?: string;
  walletAddress: string;
  nftCount: number;
  primaryNft?: {
    tokenId: string;
    serialNumber?: number;
    metadata?: any;
    imageUrl?: string;
  };
  isActive: boolean;
  createdAt: string;
  stats: {
    totalEvents: number;
    attendedEvents: number;
    upcomingEvents: number;
  };
}

export interface EventHistoryItem {
  subscriptionId: string;
  status: 'active' | 'cancelled' | 'attended';
  subscribedAt: string;
  attendedAt?: string;
  rewardSent?: boolean;
  memberNftMinted?: boolean;
  event: {
    id: string;
    name: string;
    description?: string;
    location: string;
    photo?: string;
    eventDate: string;
    eventTime?: string;
    maxParticipants?: number;
    currentParticipants: number;
  } | null;
}

/**
 * Get current user's profile
 */
export const getProfile = async (): Promise<ProfileData> => {
  const walletAddress = localStorage.getItem('walletAddress');
  
  const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'wallet-address': walletAddress || '',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch profile');
  }

  return data.data;
};

/**
 * Update user profile
 */
export const updateProfile = async (profileData: {
  name?: string;
  email?: string;
  bio?: string;
}): Promise<ProfileData> => {
  const walletAddress = localStorage.getItem('walletAddress');
  
  const response = await fetch(`${appConfig.networks.testnet.backendUrl}/api/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'wallet-address': walletAddress || '',
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to update profile');
  }

  return data.data;
};

/**
 * Get user's event history
 */
export const getUserEventHistory = async (statusFilter?: 'all' | 'active' | 'attended' | 'cancelled'): Promise<EventHistoryItem[]> => {
  const walletAddress = localStorage.getItem('walletAddress');
  const token = localStorage.getItem('token');
  
  const url = new URL(`${appConfig.networks.testnet.backendUrl}/api/profile/events`);
  if (statusFilter) {
    url.searchParams.append('status', statusFilter);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'wallet-address': walletAddress || '',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch event history');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch event history');
  }

  return data.data;
};

const profileService = {
  getProfile,
  updateProfile,
  getUserEventHistory,
};

export default profileService;

