/**
 * @fileoverview Reward Service for distributing tokens after event attendance
 * Handles token transfers from treasury to attendees
 */

import {
  Client,
  PrivateKey,
  TransferTransaction,
  AccountId,
  TokenId,
  TokenAssociateTransaction,
} from '@hashgraph/sdk';
import config from '../config/env';
import Event from '../models/Event';
import EventSubscription from '../models/EventSubscription';
import User from '../models/User';
import mongoose from 'mongoose';

interface RewardDistributionResult {
  success: boolean;
  transactionId?: string;
  message: string;
}

class RewardService {
  private client: Client;
  private operatorAccountId: string;
  private operatorPrivateKey: PrivateKey;

  constructor() {
    // Get configuration from environment
    this.operatorAccountId = config.blockchain.accountId;
    this.operatorPrivateKey = PrivateKey.fromString(config.blockchain.privateKey);

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
   * Distribute reward tokens to an attendee
   */
  async distributeReward(
    eventId: string,
    walletAddress: string
  ): Promise<RewardDistributionResult> {
    let event = null; // Declare outside try block for error message access
    
    try {
      // Validate event ID
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return {
          success: false,
          message: 'Invalid event ID',
        };
      }

      // Get event details
      event = await Event.findById(eventId);

      if (!event) {
        return {
          success: false,
          message: 'Event not found',
        };
      }

      // Check if event has rewards configured
      if (!event.rewardTokenId || !event.rewardAmount) {
        return {
          success: false,
          message: 'Event does not have rewards configured',
        };
      }

      // Get subscription record
      const subscription = await EventSubscription.findOne({
        eventId: event._id,
        walletAddress: walletAddress.toLowerCase(),
      });

      if (!subscription) {
        return {
          success: false,
          message: 'Subscription not found',
        };
      }

      // Check if reward was already sent
      if (subscription.rewardSent) {
        return {
          success: false,
          message: 'Reward already sent for this attendance',
        };
      }

      // Check if user attended
      if (subscription.status !== 'attended') {
        return {
          success: false,
          message: 'User has not attended the event',
        };
      }

      console.log(`🎁 Distributing reward to ${walletAddress}...`);
      console.log(`   Token ID: ${event.rewardTokenId}`);
      console.log(`   Amount: ${event.rewardAmount}`);

      // Parse token ID and account ID
      const tokenId = TokenId.fromString(event.rewardTokenId);
      const recipientId = AccountId.fromString(walletAddress);
      const senderId = AccountId.fromString(this.operatorAccountId);

      // Auto-associate token if needed (for custodial wallets only)
      // For non-custodial wallets, the frontend should handle association
      try {
        await this.ensureTokenAssociation(walletAddress, event.rewardTokenId);
      } catch (associateError: any) {
        console.error('⚠️ Warning: Token association failed:', associateError);
        // Log but continue - token might already be associated
        // If not associated and transfer fails, we'll provide a clear error below
      }

      // Transfer tokens
      const transferTx = await new TransferTransaction()
        .addTokenTransfer(tokenId, senderId, -event.rewardAmount)
        .addTokenTransfer(tokenId, recipientId, event.rewardAmount)
        .freezeWith(this.client)
        .sign(this.operatorPrivateKey);

      const transferSubmit = await transferTx.execute(this.client);
      const transferReceipt = await transferSubmit.getReceipt(this.client);

      // Update subscription record
      subscription.rewardSent = true;
      await subscription.save();

      console.log(`✅ Reward distributed successfully`);
      console.log(`   Transaction ID: ${transferSubmit.transactionId.toString()}`);

      return {
        success: true,
        transactionId: transferSubmit.transactionId.toString(),
        message: 'Reward distributed successfully',
      };
    } catch (error: any) {
      console.error('❌ Error distributing reward:', error);
      
      // Provide specific error message for token association issues
      if (error.message?.includes('TOKEN_NOT_ASSOCIATED_TO_ACCOUNT')) {
        const tokenId = event?.rewardTokenId || 'unknown';
        const errorMsg = `Reward token ${tokenId} is not associated with account ${walletAddress}. ` +
          `For non-custodial wallets, please ensure the token is associated via the wallet interface before receiving rewards.`;
        console.error(`⚠️  ${errorMsg}`);
        return {
          success: false,
          message: errorMsg,
        };
      }
      
      return {
        success: false,
        message: `Failed to distribute reward: ${error.message || 'Unknown error'}`,
      };
    }
  }

  /**
   * Ensure a wallet is associated with a token (for custodial wallets only)
   * 
   * For non-custodial wallets (MetaMask, WalletConnect), this method does nothing
   * as the frontend must handle token association via the wallet interface.
   * 
   * For custodial wallets (where backend has private key), this will automatically
   * associate the token if not already associated.
   */
  async ensureTokenAssociation(walletAddress: string, tokenId: string): Promise<void> {
    try {
      // Get user to check if we have their private key (custodial wallet)
      const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() }).select('+privateKey');
      
      if (!user || !user.privateKey) {
        // Non-custodial wallet - frontend must handle association
        console.log(`ℹ️  Non-custodial wallet detected (${walletAddress}). Token association should be handled on frontend.`);
        return;
      }

      console.log(`🔗 Auto-associating token ${tokenId} with custodial wallet ${walletAddress}...`);

      // Decrypt private key
      const walletService = require('./walletService').default;
      const privateKey = walletService.decryptPrivateKey(user.privateKey);
      const privateKeyObj = PrivateKey.fromString(privateKey);
      const accountIdObj = AccountId.fromString(walletAddress);
      const tokenIdObj = TokenId.fromString(tokenId);

      // Create and execute token association transaction
      const transaction = await new TokenAssociateTransaction()
        .setAccountId(accountIdObj)
        .setTokenIds([tokenIdObj])
        .freezeWith(this.client)
        .sign(privateKeyObj);
      
      const txResponse = await transaction.execute(this.client);
      await txResponse.getReceipt(this.client);
      
      console.log(`✅ Token association successful for ${walletAddress}`);
    } catch (error: any) {
      // If token is already associated, that's fine
      if (error.message?.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
        console.log(`ℹ️  Token already associated with ${walletAddress}`);
        return;
      }
      throw error;
    }
  }

  /**
   * Check if a user is eligible for rewards
   */
  async checkEligibility(eventId: string, walletAddress: string): Promise<boolean> {
    try {
      const event = await Event.findById(eventId);
      if (!event || !event.rewardTokenId || !event.rewardAmount) {
        return false;
      }

      const subscription = await EventSubscription.findOne({
        eventId: event._id,
        walletAddress: walletAddress.toLowerCase(),
      });

      if (!subscription || subscription.status !== 'attended' || subscription.rewardSent) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking reward eligibility:', error);
      return false;
    }
  }
}

export default new RewardService();


