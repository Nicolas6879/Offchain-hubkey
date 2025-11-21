/**
 * @fileoverview Script to delete existing join requests for a specific wallet
 * This script is used during development to clean up test data
 */

import mongoose from 'mongoose';
import config from '../config/env';
import JoinRequest from '../models/JoinRequest';

async function deleteJoinRequest(): Promise<void> {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    // Wallet address to delete
    const walletToDelete = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
    
    // Find and delete join request with this wallet
    const result = await JoinRequest.deleteOne({ walletAddress: walletToDelete });
    
    if (result.deletedCount > 0) {
      console.log(`Successfully deleted join request for wallet: ${walletToDelete}`);
    } else {
      console.log(`No join request found for wallet: ${walletToDelete}`);
    }

    // List remaining join requests
    const remainingRequests = await JoinRequest.find();
    console.log(`\nRemaining join requests (${remainingRequests.length}):`);
    remainingRequests.forEach((req, i) => {
      console.log(`${i + 1}. Name: ${req.fullName}, Email: ${req.email}, Wallet: ${req.walletAddress}, Status: ${req.status}`);
    });

  } catch (error) {
    console.error('Error deleting join request:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
deleteJoinRequest()
  .catch(console.error); 