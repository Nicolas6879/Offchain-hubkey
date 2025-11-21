/**
 * Service for interacting with Hedera Mirror Node API
 * Provides functions to check token associations and NFT balances
 */

interface TokenBalance {
  token_id: string;
  balance: number;
  associated: boolean;
}

interface NFTInfo {
  account_id: string;
  created_timestamp: string;
  delegating_spender: string | null;
  deleted: boolean;
  metadata: string;
  modified_timestamp: string;
  serial_number: number;
  spender: string | null;
  token_id: string;
}

interface MirrorNodeResponse<T> {
  data?: T;
  error?: string;
}

class HederaMirrorNodeService {
  private readonly baseUrl = 'https://testnet.mirrornode.hedera.com/api/v1';

  /**
   * Check if a token is associated with an account
   * @param accountId - The account ID to check (e.g., "0.0.534863")
   * @param tokenId - The token ID to check (e.g., "0.0.6244686")
   * @returns Promise<boolean> - True if token is associated, false otherwise
   */
  async isTokenAssociated(accountId: string, tokenId: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/accounts/${accountId}/tokens?token.id=${tokenId}`;
      console.log(`🔍 Checking token association: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`Mirror node API returned ${response.status} for token association check`);
        return false;
      }
      
      const data = await response.json();
      
      // If the token appears in the response, it's associated
      const isAssociated = data.tokens && data.tokens.length > 0;
      console.log(`✅ Token ${tokenId} association status for ${accountId}: ${isAssociated}`);
      
      return isAssociated;
    } catch (error) {
      console.error('❌ Error checking token association:', error);
      return false;
    }
  }

  /**
   * Get NFT balance for a specific token collection
   * @param accountId - The account ID to check
   * @param tokenId - The token ID to check
   * @returns Promise<NFTInfo[]> - Array of NFTs owned by the account from this collection
   */
  async getNFTsForToken(accountId: string, tokenId: string): Promise<NFTInfo[]> {
    try {
      const url = `${this.baseUrl}/accounts/${accountId}/nfts?token.id=${tokenId}`;
      console.log(`🔍 Checking NFT balance: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`Mirror node API returned ${response.status} for NFT balance check`);
        return [];
      }
      
      const data = await response.json();
      
      const nfts = data.nfts || [];
      console.log(`✅ Found ${nfts.length} NFTs for token ${tokenId} in account ${accountId}`);
      
      return nfts;
    } catch (error) {
      console.error('❌ Error checking NFT balance:', error);
      return [];
    }
  }

  /**
   * Check if account has any NFTs from the member token collection
   * @param accountId - The account ID to check
   * @param memberTokenId - The member NFT token ID
   * @returns Promise<boolean> - True if account owns any NFTs from this collection
   */
  async hasMemberNFT(accountId: string, memberTokenId: string): Promise<boolean> {
    const nfts = await this.getNFTsForToken(accountId, memberTokenId);
    return nfts.length > 0;
  }

  /**
   * Get detailed information about a specific NFT
   * @param tokenId - The token ID
   * @param serialNumber - The serial number of the NFT
   * @returns Promise<NFTInfo | null> - NFT information or null if not found
   */
  async getNFTInfo(tokenId: string, serialNumber: number): Promise<NFTInfo | null> {
    try {
      const url = `${this.baseUrl}/tokens/${tokenId}/nfts/${serialNumber}`;
      console.log(`🔍 Getting NFT info: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`Mirror node API returned ${response.status} for NFT info`);
        return null;
      }
      
      const data = await response.json();
      console.log(`✅ Retrieved NFT info for ${tokenId}/${serialNumber}`);
      
      return data;
    } catch (error) {
      console.error('❌ Error getting NFT info:', error);
      return null;
    }
  }

  /**
   * Check token association and NFT ownership status
   * @param accountId - The account ID to check
   * @param tokenId - The token ID to check
   * @returns Promise<object> - Object with association and ownership status
   */
  async checkTokenStatus(accountId: string, tokenId: string) {
    const [isAssociated, nfts] = await Promise.all([
      this.isTokenAssociated(accountId, tokenId),
      this.getNFTsForToken(accountId, tokenId)
    ]);

    return {
      isAssociated,
      hasNFTs: nfts.length > 0,
      nftCount: nfts.length,
      nfts: nfts
    };
  }
}

export const hederaMirrorNodeService = new HederaMirrorNodeService();
export default hederaMirrorNodeService; 