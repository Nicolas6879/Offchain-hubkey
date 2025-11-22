/**
 * @fileoverview Migration script to add 'status' field to existing users
 * This script adds the 'status' field (default: 'approved') to all existing users
 */

import mongoose from 'mongoose';
import config from '../config/env';
import User from '../models/User';

async function addStatusToUsers(): Promise<void> {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find all users without status field
    const usersWithoutStatus = await User.find({ 
      $or: [
        { status: { $exists: false } },
        { status: null }
      ]
    });

    console.log(`📊 Found ${usersWithoutStatus.length} users without status field\n`);

    if (usersWithoutStatus.length === 0) {
      console.log('✅ All users already have status field. Nothing to do.\n');
      process.exit(0);
    }

    // Update users with default status 'approved'
    for (const user of usersWithoutStatus) {
      console.log(`⏳ Updating user: ${user.name || user.email} (${user._id})`);
      await User.findByIdAndUpdate(user._id, { status: 'approved' });
      console.log(`   ✅ Status set to 'approved'\n`);
    }

    console.log(`\n✅ Successfully added status field to ${usersWithoutStatus.length} users!`);
    
  } catch (error) {
    console.error('❌ Error adding status to users:', error);
    throw error;
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the migration
addStatusToUsers()
  .then(() => {
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });

