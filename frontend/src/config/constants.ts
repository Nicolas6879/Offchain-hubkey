export const HEDERA_NETWORK = {
  testnet: "testnet",
  mainnet: "mainnet"
} as const;

export const METAMASK_GAS_LIMIT_ASSOCIATE = 100000;
export const METAMASK_GAS_LIMIT_TRANSFER_FT = 100000;
export const METAMASK_GAS_LIMIT_TRANSFER_NFT = 100000;
export const METAMASK_GAS_LIMIT_EXECUTE_CONTRACT = 1000000;

// Hedera Mirror Node endpoints
export const MIRROR_NODE_ENDPOINTS = {
  testnet: "https://testnet.mirrornode.hedera.com",
  mainnet: "https://mainnet-public.mirrornode.hedera.com"
} as const;
