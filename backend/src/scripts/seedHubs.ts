/**
 * @fileoverview Script to seed initial hubs into the database
 * Run this script to populate the database with the initial hub data
 */

import mongoose from 'mongoose';
import Hub from '../models/Hub';

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/offchain-hubkey';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Initial hub data (from frontend)
const initialHubs = [
  {
    name: "Orbi Conecta - BH",
    description: "Hub de inovação e coworking em Belo Horizonte",
    cidade: "Belo Horizonte",
    estado: "MG",
    endereco: "Av. Pres. Antônio Carlos, 681 – Lagoinha",
    contactPhone: "(31) 98424-3360",
    contactEmail: "contato@orbi.co",
    isActive: true,
    membershipRequired: true,
  },
  {
    name: "Token Economy - CWB",
    description: "Hub de economia digital e blockchain em Curitiba",
    cidade: "Curitiba",
    estado: "PR",
    endereco: "Rua Francisco Torres, 218 - Centro",
    contactPhone: "",
    contactEmail: "contato@tokeneconomy.com.br",
    isActive: true,
    membershipRequired: true,
  }
];

// Seed function
const seedHubs = async () => {
  try {
    await connectDB();
    
    console.log('Starting hub seeding process...');
    
    // Check if hubs already exist
    const existingHubs = await Hub.find({});
    if (existingHubs.length > 0) {
      console.log(`Found ${existingHubs.length} existing hubs in database.`);
      console.log('Existing hubs:');
      existingHubs.forEach(hub => {
        console.log(`- ${hub.name} (${hub.cidade}, ${hub.estado})`);
      });
      
      const proceed = process.argv.includes('--force');
      if (!proceed) {
        console.log('\nTo proceed anyway and add duplicates, run with --force flag');
        console.log('Example: npm run seed:hubs -- --force');
        process.exit(0);
      }
    }
    
    // Create hubs
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const hubData of initialHubs) {
      try {
        // Check if hub with same name already exists
        const existingHub = await Hub.findOne({ name: hubData.name });
        
        if (existingHub && !process.argv.includes('--force')) {
          console.log(`Skipping "${hubData.name}" - already exists`);
          skippedCount++;
          continue;
        }
        
        const hub = new Hub(hubData);
        await hub.save();
        
        console.log(`✓ Created hub: ${hub.name}`);
        console.log(`  Location: ${hub.endereco}, ${hub.cidade}, ${hub.estado}`);
        console.log(`  Email: ${hub.contactEmail}`);
        console.log(`  Phone: ${hub.contactPhone || 'N/A'}`);
        console.log(`  Active: ${hub.isActive}`);
        console.log('');
        
        createdCount++;
      } catch (error) {
        console.error(`Failed to create hub "${hubData.name}":`, error);
      }
    }
    
    console.log(`\nSeeding completed!`);
    console.log(`Created: ${createdCount} hubs`);
    console.log(`Skipped: ${skippedCount} hubs`);
    
    // Show final count
    const totalHubs = await Hub.countDocuments();
    console.log(`Total hubs in database: ${totalHubs}`);
    
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the script
if (require.main === module) {
  seedHubs();
}

export default seedHubs; 