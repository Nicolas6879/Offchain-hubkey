/**
 * @fileoverview Script to check existing join requests in the database
 * This script is used during development to debug duplicate join request issues
 */

import mongoose from 'mongoose';
import config from '../config/env';
import JoinRequest from '../models/JoinRequest';

async function checkJoinRequests(): Promise<void> {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const allRequests = await JoinRequest.find();
    console.log(`Found ${allRequests.length} join requests:`);
    
    allRequests.forEach((req, i) => {
      console.log(`${i + 1}. Name: ${req.fullName}, Email: ${req.email}, Wallet: ${req.walletAddress}, Status: ${req.status}`);
    });

    // Check for your specific email and wallet
    const specificWallet = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
    const specificEmail = "johnDoe@example.com";
    
    const walletMatch = await JoinRequest.findOne({ walletAddress: specificWallet });
    const emailMatch = await JoinRequest.findOne({ email: specificEmail.toLowerCase() });
    
    console.log('\nChecking for specific entries:');
    console.log(`Wallet ${specificWallet}: ${walletMatch ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`Email ${specificEmail}: ${emailMatch ? 'FOUND' : 'NOT FOUND'}`);
    
    if (walletMatch) {
      console.log('Wallet match details:', walletMatch);
    }
    
    if (emailMatch) {
      console.log('Email match details:', emailMatch);
    }

  } catch (error) {
    console.error('Error checking join requests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
checkJoinRequests()
  .catch(console.error); 