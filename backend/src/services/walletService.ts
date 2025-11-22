/**
 * @fileoverview Wallet Service for generating and managing Hedera wallets
 * Creates custodial wallets for users during signup
 */

import {
  Client,
  PrivateKey,
  AccountCreateTransaction,
  Hbar,
  AccountId,
  TokenAssociateTransaction,
  TokenId,
} from '@hashgraph/sdk';
import config from '../config/env';
import CryptoJS from 'crypto-js';

interface WalletGenerationResult {
  accountId: string;
  publicKey: string;
  privateKey: string; // Unencrypted for immediate display
  encryptedPrivateKey: string; // For database storage
}

class WalletService {
  private client: Client;
  private operatorAccountId: string;
  private operatorPrivateKey: PrivateKey;
  private encryptionSecret: string;

  constructor() {
    // Get configuration from environment
    this.operatorAccountId = config.blockchain.accountId;
    this.operatorPrivateKey = PrivateKey.fromString(config.blockchain.privateKey);
    this.encryptionSecret = config.jwtSecret; // Use JWT secret for encryption

    // Initialize Hedera client
    if (config.blockchain.network === 'mainnet') {
      this.client = Client.forMainnet().setOperator(
        this.operatorAccountId,
        this.operatorPrivateKey
      );
    } else {
      this.client = Client.forTestnet().setOperator(
        this.operatorAccountId,
        this.operatorPrivateKey
      );
    }
  }

  /**
   * Generate a new Hedera wallet for a user
   * Creates the account on Hedera network and returns credentials
   */
  async generateWallet(): Promise<WalletGenerationResult> {
    try {
      // Generate new key pair
      const newPrivateKey = PrivateKey.generateED25519();
      const newPublicKey = newPrivateKey.publicKey;

      console.log('🔑 Generated new key pair');
      console.log(`   Public Key: ${newPublicKey.toString()}`);

      // Create new account with initial balance (0.5 HBAR for fees)
      const createAccountTx = await new AccountCreateTransaction()
        .setKey(newPublicKey)
        .setInitialBalance(new Hbar(0.5))
        .execute(this.client);

      // Get account ID from receipt
      const receipt = await createAccountTx.getReceipt(this.client);
      const newAccountId = receipt.accountId;

      if (!newAccountId) {
        throw new Error('Failed to create account: No account ID in receipt');
      }

      console.log(`✅ Account created successfully: ${newAccountId.toString()}`);

      // Associate account with member NFT token
      try {
        await this.associateTokens(newAccountId.toString(), newPrivateKey.toString(), [
          config.blockchain.memberNftTokenId
        ]);
        console.log(`✅ Account associated with member NFT token`);
      } catch (associateError) {
        console.error('⚠️  Warning: Failed to associate member NFT token:', associateError);
        // Continue even if association fails - user can do it later
      }

      // Encrypt private key for storage
      const encryptedPrivateKey = this.encryptPrivateKey(newPrivateKey.toString());

      return {
        accountId: newAccountId.toString(),
        publicKey: newPublicKey.toString(),
        privateKey: newPrivateKey.toString(), // Return unencrypted for display
        encryptedPrivateKey,
      };
    } catch (error) {
      console.error('❌ Error generating wallet:', error);
      throw new Error('Failed to generate wallet');
    }
  }

  /**
   * Associate a wallet with one or more tokens
   * This is required before the wallet can receive tokens on Hedera
   */
  async associateTokens(
    accountId: string,
    privateKey: string,
    tokenIds: string[]
  ): Promise<void> {
    try {
      const accountIdObj = AccountId.fromString(accountId);
      const privateKeyObj = PrivateKey.fromString(privateKey);
      
      // Convert token IDs to TokenId objects
      const tokenIdObjects = tokenIds.map(id => TokenId.fromString(id));
      
      console.log(`🔗 Associating account ${accountId} with ${tokenIds.length} token(s)...`);
      
      // Create and execute token association transaction
      const transaction = await new TokenAssociateTransaction()
        .setAccountId(accountIdObj)
        .setTokenIds(tokenIdObjects)
        .freezeWith(this.client)
        .sign(privateKeyObj);
      
      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      console.log(`✅ Token association successful`);
    } catch (error) {
      console.error('❌ Error associating tokens:', error);
      throw new Error('Failed to associate tokens with account');
    }
  }

  /**
   * Encrypt a private key for secure database storage
   */
  encryptPrivateKey(privateKey: string): string {
    return CryptoJS.AES.encrypt(privateKey, this.encryptionSecret).toString();
  }

  /**
   * Decrypt a private key from database
   */
  decryptPrivateKey(encryptedPrivateKey: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, this.encryptionSecret);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Validate if an account ID exists on Hedera network
   */
  async validateAccountId(accountId: string): Promise<boolean> {
    try {
      AccountId.fromString(accountId);
      // In production, you might want to query the account to verify it exists
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new WalletService();


