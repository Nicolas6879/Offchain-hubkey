/**
 * @fileoverview Migration script to update user status based on NFT ownership
 * This script calculates the correct status for each user:
 * - "admin" if wallet is in admin list
 * - "member" if user has NFT token(s)
 * - "registered" if user doesn't have NFT yet
 * - "blocked" if user is not active
 */

import mongoose from 'mongoose';
import config from '../config/env';
import User from '../models/User';
import { isAdminWallet } from '../utils/adminUtils';

async function updateUserStatus(): Promise<void> {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const allUsers = await User.find({});
    console.log(`📊 Found ${allUsers.length} users to process\n`);

    let adminCount = 0;
    let memberCount = 0;
    let registeredCount = 0;
    let blockedCount = 0;

    // Process each user
    for (const user of allUsers) {
      let newStatus: 'admin' | 'member' | 'registered' | 'blocked';
      
      // Determine status based on criteria
      if (!user.isActive) {
        // Not active = blocked
        newStatus = 'blocked';
        blockedCount++;
      } else if (isAdminWallet(user.walletAddress)) {
        // Is admin wallet
        newStatus = 'admin';
        adminCount++;
      } else if (user.nftTokenIds && user.nftTokenIds.length > 0) {
        // Has NFT = member
        newStatus = 'member';
        memberCount++;
      } else {
        // No NFT yet = registered
        newStatus = 'registered';
        registeredCount++;
      }

      // Update user if status changed
      if (user.status !== newStatus) {
        console.log(`⏳ Updating ${user.name || user.email}`);
        console.log(`   Wallet: ${user.walletAddress}`);
        console.log(`   NFTs: ${user.nftTokenIds?.length || 0}`);
        console.log(`   Old status: ${user.status} → New status: ${newStatus}`);
        
        await User.findByIdAndUpdate(user._id, { status: newStatus });
        console.log(`   ✅ Updated!\n`);
      } else {
        console.log(`✓ ${user.name || user.email} - Status already correct (${newStatus})`);
      }
    }

    console.log('\n📊 Final Status Summary:');
    console.log(`   👑 Admins: ${adminCount}`);
    console.log(`   🎫 Members (with NFT): ${memberCount}`);
    console.log(`   📝 Registered (no NFT): ${registeredCount}`);
    console.log(`   🚫 Blocked: ${blockedCount}`);
    console.log(`   ━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   📈 Total: ${allUsers.length}`);
    
  } catch (error) {
    console.error('❌ Error updating user status:', error);
    throw error;
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the migration
updateUserStatus()
  .then(() => {
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });

