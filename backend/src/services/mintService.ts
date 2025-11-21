import {
  Client,
  PrivateKey,
  TokenMintTransaction,
  TokenId,
  TransferTransaction,
  AccountId
} from '@hashgraph/sdk';
import config from '../config/env';
import * as fs from 'fs';
import * as path from 'path';

interface MintParams {
  userId: string;
  name: string;
  email: string;
  walletAddress?: string;
  metadata: string;
}

interface MintResult {
  tokenId: string;
  serialNumber: number;
  imagePath: string;
}

interface TransferResult {
  transactionId: string;
  success: boolean;
}

class MintService {
  private client: Client;
  private operatorAccountId: string;
  private operatorPrivateKey: PrivateKey;
  private memberNftTokenId: string;
  private memberNftImageUrl: string;

  constructor() {
    // Get configuration from environment
    this.operatorAccountId = config.blockchain.accountId;
    this.operatorPrivateKey = PrivateKey.fromString("302e020100300506032b6570042204205859e46282e7d353903a3014ccaa3b8d75ea9bdd2a6ce5c87d38b6886e951ec0"); 
    this.memberNftTokenId = config.blockchain.memberNftTokenId;
    this.memberNftImageUrl = config.blockchain.memberNftImageUrl;
    
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
   * Mints an NFT representing a user's identity using the existing token collection
   */
  async mintIdentityNFT({ userId, name, email, walletAddress, metadata }: MintParams): Promise<MintResult> {
    try {
      const userWallet = walletAddress || userId;
      
      // Create extremely compact metadata object to stay under Hedera's 100-byte limit
      // Only store essential identifying information on-chain
      const compactMetadata = {
        u: userId.substring(0, 8), // user ID (shortened)
        n: name.substring(0, 12), // name (very short)
        t: Math.floor(Date.now() / 1000), // timestamp in seconds (smaller number)
      };
      
      // Convert to buffer with compact JSON
      const metadataBuffer = Buffer.from(JSON.stringify(compactMetadata));
      
      console.log(`Metadata size: ${metadataBuffer.length} bytes`);
      console.log(`Metadata content: ${JSON.stringify(compactMetadata)}`);
      
      // Check size of metadata - must be under 100 bytes
      if (metadataBuffer.length > 100) {
        throw new Error(`Metadata size (${metadataBuffer.length} bytes) exceeds Hedera's 100-byte limit`);
      }

      // Mint the NFT using the existing token collection
      const mintTx = await new TokenMintTransaction()
        .setTokenId(this.memberNftTokenId)
        .setMetadata([metadataBuffer])
        .freezeWith(this.client)
        .sign(this.operatorPrivateKey);

      const mintSubmit = await mintTx.execute(this.client);
      const mintRx = await mintSubmit.getReceipt(this.client);
      
      // Get the serial number from the receipt
      const serialNumbers = mintRx.serials;
      const serialNumber = serialNumbers && serialNumbers.length > 0 ? Number(serialNumbers[0]) : 1;

      // Store full metadata in local database or file system
      // This is a simple implementation - in production, you might use a proper database
      const fullMetadataDir = path.resolve(__dirname, '../../metadata');
      if (!fs.existsSync(fullMetadataDir)) {
        fs.mkdirSync(fullMetadataDir, { recursive: true });
      }
      
      // Create the full metadata object (stored locally, not on-chain)
      const fullMetadata = {
        userId,
        name,
        email,
        walletAddress: userWallet,
        tokenId: this.memberNftTokenId,
        serialNumber,
        imageUrl: this.memberNftImageUrl,
        timestamp: Date.now(),
        compactMetadata, // Store the on-chain metadata for reference
        originalMetadata: metadata // Store as-is since it might be a simple string like topicId
      };
      
      // Save the full metadata to a local file using token ID and serial number
      const metadataPath = path.join(fullMetadataDir, `${this.memberNftTokenId}.${serialNumber}.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(fullMetadata, null, 2));

      console.log(`✅ NFT minted successfully: Token ${this.memberNftTokenId}, Serial ${serialNumber}`);

      return {
        tokenId: this.memberNftTokenId,
        serialNumber,
        imagePath: this.memberNftImageUrl
      };
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw new Error('Failed to mint identity NFT');
    }
  }

  /**
   * Verify an NFT ownership
   */
  async verifyOwnership(tokenId: string, serialNumber: number, accountId: string): Promise<boolean> {
    // In a real application, you would implement ECDSA signature verification
    // or query the token ownership from the blockchain
    
    // This is a placeholder implementation
    try {
      // First, check if we have a local record of this token
      const metadataPath = path.resolve(__dirname, `../../metadata/${tokenId}.${serialNumber}.json`);
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        // Do a simple check - in production you'd verify ownership on the blockchain
        return metadata.walletAddress === accountId;
      }
      
      // Placeholder: In a real app, query the blockchain to verify ownership
      return true;
    } catch (error) {
      console.error('Error verifying ownership:', error);
      return false;
    }
  }

  /**
   * Transfer an NFT to another wallet
   */
  async transferNFT(tokenId: string, serialNumber: number, recipientAccountId: string): Promise<TransferResult> {
    try {
      // Validate input parameters
      if (!tokenId) {
        throw new Error('Token ID is required');
      }
      if (!serialNumber || serialNumber < 1) {
        throw new Error('Valid serial number is required');
      }
      if (!recipientAccountId) {
        throw new Error('Recipient account ID is required');
      }

      console.log(`🔄 Starting NFT transfer:`);
      console.log(`   Token ID: ${tokenId}`);
      console.log(`   Serial Number: ${serialNumber}`);
      console.log(`   Recipient: ${recipientAccountId}`);
      console.log(`   From: ${this.operatorAccountId}`);

      // Check if trying to transfer to the same account
      if (recipientAccountId === this.operatorAccountId) {
        console.log(`⚠️  NFT already owned by the same account (${recipientAccountId}). Skipping transfer.`);
        
        // Update local metadata to mark as "claimed" even though no transfer occurred
        const metadataPath = path.resolve(__dirname, `../../metadata/${tokenId}.${serialNumber}.json`);
        if (fs.existsSync(metadataPath)) {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          metadata.walletAddress = recipientAccountId;
          metadata.transferTimestamp = Date.now();
          metadata.transferNote = 'NFT already owned by recipient (same account)';
          fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
          console.log(`📝 Metadata updated for NFT ${tokenId}.${serialNumber}`);
        }
        
        return {
          transactionId: 'SAME_ACCOUNT_SKIP',
          success: true
        };
      }

      // Parse token ID and recipient account ID with error handling
      let parsedTokenId: TokenId;
      let recipientId: AccountId;
      let senderAccountId: AccountId;

      try {
        parsedTokenId = TokenId.fromString(tokenId);
      } catch (error) {
        throw new Error(`Invalid token ID format: ${tokenId}`);
      }

      try {
        recipientId = AccountId.fromString(recipientAccountId);
      } catch (error) {
        throw new Error(`Invalid recipient account ID format: ${recipientAccountId}`);
      }

      try {
        senderAccountId = AccountId.fromString(this.operatorAccountId);
      } catch (error) {
        throw new Error(`Invalid sender account ID format: ${this.operatorAccountId}`);
      }
      
      // Transfer the NFT directly (token association should be handled on frontend)
      console.log(`📤 Transferring NFT...`);
      const transferTx = await new TransferTransaction()
        .addNftTransfer(parsedTokenId, serialNumber, senderAccountId, recipientId)
        .freezeWith(this.client)
        .sign(this.operatorPrivateKey);
        
      const transferSubmit = await transferTx.execute(this.client);
      const transferReceipt = await transferSubmit.getReceipt(this.client);
      
      console.log(`✅ NFT transfer completed successfully`);

      // Update local metadata record
      const metadataPath = path.resolve(__dirname, `../../metadata/${tokenId}.${serialNumber}.json`);
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        metadata.walletAddress = recipientAccountId;
        metadata.transferTimestamp = Date.now();
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        console.log(`📝 Metadata updated for NFT ${tokenId}.${serialNumber}`);
      }
      
      return {
        transactionId: transferSubmit.transactionId.toString(),
        success: true
      };
    } catch (error) {
      console.error('❌ Error transferring NFT:', error);
      throw new Error('Failed to transfer NFT');
    }
  }
}

export default new MintService(); 