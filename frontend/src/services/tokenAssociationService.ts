/**
 * Token Association Service
 * 
 * Handles checking and ensuring token associations for non-custodial wallets
 */

import { TokenId } from '@hashgraph/sdk';
import hederaMirrorNodeService from './hederaMirrorNodeService';
import { getTokenName } from '../config/tokens';

export interface AssociationResult {
  success: boolean;
  alreadyAssociated?: boolean;
  error?: string;
  userCancelled?: boolean;
}

export interface TokenAssociationInfo {
  tokenId: string;
  tokenName: string;
  isAssociated: boolean;
  needsAssociation: boolean;
}

class TokenAssociationService {
  private readonly RECHECK_DELAY_MS = 5000; // 5 seconds for transaction to be indexed
  private readonly MAX_RECHECK_ATTEMPTS = 3;

  /**
   * Check if a token is associated with an account
   */
  async checkAssociation(accountId: string, tokenId: string): Promise<boolean> {
    try {
      console.log(`🔍 Checking association for token ${tokenId} on account ${accountId}`);
      const isAssociated = await hederaMirrorNodeService.isTokenAssociated(accountId, tokenId);
      console.log(`✅ Token ${tokenId} association status: ${isAssociated}`);
      return isAssociated;
    } catch (error) {
      console.error('❌ Error checking token association:', error);
      // If mirror node is down, assume not associated to be safe
      return false;
    }
  }

  /**
   * Check multiple tokens association status
   */
  async checkMultipleAssociations(
    accountId: string,
    tokenIds: string[]
  ): Promise<TokenAssociationInfo[]> {
    const results = await Promise.all(
      tokenIds.map(async (tokenId) => {
        const isAssociated = await this.checkAssociation(accountId, tokenId);
        return {
          tokenId,
          tokenName: getTokenName(tokenId),
          isAssociated,
          needsAssociation: !isAssociated,
        };
      })
    );

    return results;
  }

  /**
   * Wait and recheck association after user action
   */
  async recheckAssociation(
    accountId: string,
    tokenId: string,
    attemptNumber: number = 1
  ): Promise<boolean> {
    console.log(`⏳ Waiting ${this.RECHECK_DELAY_MS}ms before rechecking association (attempt ${attemptNumber}/${this.MAX_RECHECK_ATTEMPTS})...`);
    
    // Wait for transaction to be indexed
    await this.sleep(this.RECHECK_DELAY_MS);

    const isAssociated = await this.checkAssociation(accountId, tokenId);

    if (!isAssociated && attemptNumber < this.MAX_RECHECK_ATTEMPTS) {
      // Retry with exponential backoff
      return this.recheckAssociation(accountId, tokenId, attemptNumber + 1);
    }

    return isAssociated;
  }

  /**
   * Verify association after user manually associates
   */
  async verifyAssociation(accountId: string, tokenId: string): Promise<AssociationResult> {
    try {
      const isAssociated = await this.recheckAssociation(accountId, tokenId);

      if (isAssociated) {
        return {
          success: true,
          alreadyAssociated: false,
        };
      } else {
        return {
          success: false,
          error: 'Token association could not be confirmed. Please try again or check your wallet.',
        };
      }
    } catch (error) {
      console.error('❌ Error verifying token association:', error);
      return {
        success: false,
        error: `Failed to verify association: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Get tokens that need association from a list
   */
  async getTokensNeedingAssociation(
    accountId: string,
    tokenIds: string[]
  ): Promise<string[]> {
    const results = await this.checkMultipleAssociations(accountId, tokenIds);
    return results.filter(r => r.needsAssociation).map(r => r.tokenId);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parse TokenId for wallet interface
   */
  parseTokenId(tokenId: string): TokenId {
    try {
      return TokenId.fromString(tokenId);
    } catch (error) {
      throw new Error(`Invalid token ID format: ${tokenId}`);
    }
  }

  /**
   * Check if mirror node service is available
   */
  async isMirrorNodeAvailable(): Promise<boolean> {
    try {
      // Try a simple query to test availability
      const testAccountId = '0.0.2'; // Hedera treasury account, always exists
      await hederaMirrorNodeService.isTokenAssociated(testAccountId, '0.0.1');
      return true;
    } catch (error) {
      console.warn('⚠️ Mirror node service appears to be unavailable:', error);
      return false;
    }
  }
}

export const tokenAssociationService = new TokenAssociationService();
export default tokenAssociationService;

