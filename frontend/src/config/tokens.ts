/**
 * Token Configuration
 * 
 * Centralized configuration for all tokens used in the application
 */

export interface TokenConfig {
  id: string;
  name: string;
  description: string;
  type: 'NFT' | 'FUNGIBLE';
}

export const TOKENS = {
  MEMBER_NFT: {
    id: '0.0.6244686',
    name: 'Offchain Membership NFT',
    description: 'Your membership pass to Offchain Hubs',
    type: 'NFT' as const,
  },
  REWARD_TOKEN: {
    id: '0.0.2203022',
    name: 'Offchain Reward Token',
    description: 'Event participation rewards',
    type: 'FUNGIBLE' as const,
  },
} as const;

/**
 * Get token configuration by ID
 */
export const getTokenConfig = (tokenId: string): TokenConfig | undefined => {
  return Object.values(TOKENS).find(token => token.id === tokenId);
};

/**
 * Get token name by ID
 */
export const getTokenName = (tokenId: string): string => {
  const config = getTokenConfig(tokenId);
  return config?.name || tokenId;
};

