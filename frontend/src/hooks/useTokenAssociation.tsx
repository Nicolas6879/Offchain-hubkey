/**
 * useTokenAssociation Hook
 * 
 * Manages token association flow including checking, prompting user, and verifying
 */

import { useState, useCallback } from 'react';
import { TokenId } from '@hashgraph/sdk';
import tokenAssociationService, { AssociationResult } from '../services/tokenAssociationService';
import { TokenInfo } from '../components/TokenAssociationModal';
import { getTokenConfig } from '../config/tokens';
import { WalletInterface } from '../services/wallets/walletInterface';

interface UseTokenAssociationResult {
  isChecking: boolean;
  isModalOpen: boolean;
  currentToken: TokenInfo | null;
  checkAndEnsureAssociation: (
    accountId: string,
    tokenId: string,
    walletInterface: WalletInterface
  ) => Promise<AssociationResult>;
  checkMultipleAssociations: (
    accountId: string,
    tokenIds: string[],
    walletInterface: WalletInterface
  ) => Promise<AssociationResult>;
  closeModal: () => void;
}

export const useTokenAssociation = (): UseTokenAssociationResult => {
  const [isChecking, setIsChecking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentToken, setCurrentToken] = useState<TokenInfo | null>(null);
  const [resolveAssociation, setResolveAssociation] = useState<{
    resolve: (result: AssociationResult) => void;
  } | null>(null);
  const [currentWalletInterface, setCurrentWalletInterface] = useState<WalletInterface | null>(null);

  /**
   * Show association modal and wait for user action
   */
  const promptUserToAssociate = useCallback(
    (tokenId: string, walletInterface: WalletInterface): Promise<AssociationResult> => {
      return new Promise((resolve) => {
        const tokenConfig = getTokenConfig(tokenId);
        
        if (!tokenConfig) {
          resolve({
            success: false,
            error: `Unknown token: ${tokenId}`,
          });
          return;
        }

        const tokenInfo: TokenInfo = {
          tokenId: tokenConfig.id,
          tokenName: tokenConfig.name,
          description: tokenConfig.description,
          type: tokenConfig.type,
        };

        setCurrentToken(tokenInfo);
        setCurrentWalletInterface(walletInterface);
        setIsModalOpen(true);
        setResolveAssociation({ resolve });
      });
    },
    []
  );

  /**
   * Handle token association from modal
   */
  const handleAssociate = useCallback(
    async (tokenId: TokenId) => {
      if (!currentWalletInterface) {
        throw new Error('Wallet interface not available');
      }

      try {
        // Call wallet interface to associate token
        const result = await currentWalletInterface.associateToken(tokenId);
        
        if (!result) {
          throw new Error('Association transaction failed or was rejected');
        }

        console.log('✅ Association transaction successful:', result);
      } catch (error) {
        console.error('❌ Association error:', error);
        throw error;
      }
    },
    [currentWalletInterface]
  );

  /**
   * Handle successful association
   */
  const handleSuccess = useCallback(async () => {
    setIsModalOpen(false);

    if (!currentToken || !resolveAssociation) {
      return;
    }

    // Verify the association was successful
    const accountId = currentWalletInterface?.toString() || '';
    
    if (!accountId) {
      resolveAssociation.resolve({
        success: false,
        error: 'Could not verify account ID',
      });
      return;
    }

    // Wait a bit and recheck
    const verificationResult = await tokenAssociationService.verifyAssociation(
      accountId,
      currentToken.tokenId
    );

    resolveAssociation.resolve(verificationResult);
    setResolveAssociation(null);
    setCurrentToken(null);
    setCurrentWalletInterface(null);
  }, [currentToken, resolveAssociation, currentWalletInterface]);

  /**
   * Handle cancellation
   */
  const handleCancel = useCallback(() => {
    setIsModalOpen(false);

    if (resolveAssociation) {
      resolveAssociation.resolve({
        success: false,
        userCancelled: true,
        error: 'User cancelled token association',
      });
      setResolveAssociation(null);
    }

    setCurrentToken(null);
    setCurrentWalletInterface(null);
  }, [resolveAssociation]);

  /**
   * Check and ensure a single token is associated
   */
  const checkAndEnsureAssociation = useCallback(
    async (
      accountId: string,
      tokenId: string,
      walletInterface: WalletInterface
    ): Promise<AssociationResult> => {
      try {
        setIsChecking(true);

        // 1. Check if already associated
        console.log(`🔍 Checking association for token ${tokenId}...`);
        const isAssociated = await tokenAssociationService.checkAssociation(accountId, tokenId);

        if (isAssociated) {
          console.log('✅ Token already associated');
          return {
            success: true,
            alreadyAssociated: true,
          };
        }

        // 2. Token not associated, prompt user
        console.log('⚠️ Token not associated, prompting user...');
        const result = await promptUserToAssociate(tokenId, walletInterface);

        return result;
      } catch (error) {
        console.error('❌ Error in checkAndEnsureAssociation:', error);
        return {
          success: false,
          error: (error as Error).message,
        };
      } finally {
        setIsChecking(false);
      }
    },
    [promptUserToAssociate]
  );

  /**
   * Check and ensure multiple tokens are associated
   */
  const checkMultipleAssociations = useCallback(
    async (
      accountId: string,
      tokenIds: string[],
      walletInterface: WalletInterface
    ): Promise<AssociationResult> => {
      try {
        setIsChecking(true);

        // Check which tokens need association
        const tokensNeedingAssociation = await tokenAssociationService.getTokensNeedingAssociation(
          accountId,
          tokenIds
        );

        if (tokensNeedingAssociation.length === 0) {
          console.log('✅ All tokens already associated');
          return {
            success: true,
            alreadyAssociated: true,
          };
        }

        // Associate each token that needs it
        for (const tokenId of tokensNeedingAssociation) {
          console.log(`⚠️ Token ${tokenId} needs association`);
          const result = await checkAndEnsureAssociation(accountId, tokenId, walletInterface);

          if (!result.success) {
            return result; // Stop if any association fails
          }
        }

        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Error in checkMultipleAssociations:', error);
        return {
          success: false,
          error: (error as Error).message,
        };
      } finally {
        setIsChecking(false);
      }
    },
    [checkAndEnsureAssociation]
  );

  /**
   * Close modal manually
   */
  const closeModal = useCallback(() => {
    handleCancel();
  }, [handleCancel]);

  return {
    isChecking,
    isModalOpen,
    currentToken,
    checkAndEnsureAssociation,
    checkMultipleAssociations,
    closeModal,
    // Export for use in modal
    handleAssociate,
    handleSuccess,
    handleCancel,
  } as UseTokenAssociationResult & {
    handleAssociate: (tokenId: TokenId) => Promise<void>;
    handleSuccess: () => void;
    handleCancel: () => void;
  };
};

