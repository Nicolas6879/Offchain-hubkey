/**
 * @fileoverview Script to create a test hub in the database
 * This script is used during development to create a sample hub for testing
 */

import mongoose from 'mongoose';
import config from '../config/env';
import Hub from '../models/Hub';

async function createTestHub(): Promise<void> {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const testHub = new Hub({
      name: 'Test Hub',
      description: 'A test hub for development purposes',
      location: '123 Test St, Test City, Test Country',
      contactEmail: config.email.hubEmail || 'test-hub@example.com',
      contactPhone: '+1234567890',
      websiteUrl: 'https://test-hub.example.com',
      isActive: true,
      membershipRequired: true,
    });

    // Check if the hub already exists
    const existingHub = await Hub.findOne({ name: 'Test Hub' });
    if (existingHub) {
      console.log('Test hub already exists with ID:', existingHub._id);
      console.log('Hub details:', existingHub);
    } else {
      // Save the new hub
      const savedHub = await testHub.save();
      console.log('Test hub created successfully with ID:', savedHub._id);
      console.log('Hub details:', savedHub);
    }

    // List all hubs in the database
    const allHubs = await Hub.find();
    console.log(`\nAll hubs in database (${allHubs.length}):`);
    allHubs.forEach((hub, index) => {
      console.log(`${index + 1}. ${hub.name} (ID: ${hub._id})`);
    });

  } catch (error) {
    console.error('Error creating test hub:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
createTestHub()
  .catch(console.error); 