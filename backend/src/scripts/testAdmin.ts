/**
 * @fileoverview Test script for admin wallet functionality
 * Run with: npm run test:admin or ts-node src/scripts/testAdmin.ts
 */

import { 
  isAdminWallet, 
  getAdminWallets, 
  addAdminWallet, 
  removeAdminWallet 
} from '../utils/adminUtils';
import config from '../config/env';

console.log('🔐 Admin Wallet Test Script');
console.log('============================\n');

// Test 1: Display current configuration
console.log('1. Current Admin Configuration:');
console.log('   Environment ADMIN_WALLETS:', process.env.ADMIN_WALLETS || 'Not set');
console.log('   Configured admin wallets:', getAdminWallets());
console.log('   Total admin wallets:', getAdminWallets().length);
console.log();

// Test 2: Check default admin wallets
console.log('2. Testing Default Admin Wallets:');
const defaultWallets = [
  '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  '0x742d35Cc6634C0532925a3b8D87fBd83c6C4c4c7'
];

defaultWallets.forEach((wallet, index) => {
  const isAdmin = isAdminWallet(wallet);
  console.log(`   Default wallet ${index + 1}: ${wallet}`);
  console.log(`   Is admin: ${isAdmin ? '✅ Yes' : '❌ No'}`);
});
console.log();

// Test 3: Case insensitivity test
console.log('3. Testing Case Insensitivity:');
const testWallet = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
const variations = [
  testWallet.toLowerCase(),
  testWallet.toUpperCase(),
  testWallet, // mixed case
];

variations.forEach((variation, index) => {
  const isAdmin = isAdminWallet(variation);
  console.log(`   Variation ${index + 1}: ${variation}`);
  console.log(`   Is admin: ${isAdmin ? '✅ Yes' : '❌ No'}`);
});
console.log();

// Test 4: Non-admin wallet
console.log('4. Testing Non-Admin Wallet:');
const nonAdminWallet = '0x1234567890123456789012345678901234567890';
const isNonAdmin = isAdminWallet(nonAdminWallet);
console.log(`   Test wallet: ${nonAdminWallet}`);
console.log(`   Is admin: ${isNonAdmin ? '✅ Yes' : '❌ No'}`);
console.log();

// Test 5: Runtime admin management
console.log('5. Testing Runtime Admin Management:');
const newAdminWallet = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

console.log(`   Adding new admin wallet: ${newAdminWallet}`);
const added = addAdminWallet(newAdminWallet);
console.log(`   Add result: ${added ? '✅ Success' : '❌ Failed'}`);
console.log(`   Is now admin: ${isAdminWallet(newAdminWallet) ? '✅ Yes' : '❌ No'}`);
console.log(`   Total admin wallets: ${getAdminWallets().length}`);

// Try adding the same wallet again
console.log(`   Trying to add same wallet again...`);
const addedAgain = addAdminWallet(newAdminWallet);
console.log(`   Add result: ${addedAgain ? '✅ Success' : '❌ Failed (expected)'}`);

// Remove the wallet
console.log(`   Removing admin wallet: ${newAdminWallet}`);
const removed = removeAdminWallet(newAdminWallet);
console.log(`   Remove result: ${removed ? '✅ Success' : '❌ Failed'}`);
console.log(`   Is still admin: ${isAdminWallet(newAdminWallet) ? '✅ Yes' : '❌ No (expected)'}`);
console.log(`   Total admin wallets: ${getAdminWallets().length}`);
console.log();

// Test 6: Edge cases
console.log('6. Testing Edge Cases:');
const edgeCases = [
  '',           // empty string
  '   ',        // whitespace only
  'invalid',    // invalid format
  null,         // null
  undefined,    // undefined
];

edgeCases.forEach((testCase, index) => {
  try {
    const result = isAdminWallet(testCase as string);
    console.log(`   Edge case ${index + 1} (${JSON.stringify(testCase)}): ${result ? '✅ Admin' : '❌ Not admin'}`);
  } catch (error) {
    console.log(`   Edge case ${index + 1} (${JSON.stringify(testCase)}): ⚠️ Error - ${(error as Error).message}`);
  }
});
console.log();

// Test 7: Final state
console.log('7. Final State:');
console.log('   Current admin wallets:');
getAdminWallets().forEach((wallet, index) => {
  console.log(`   ${index + 1}. ${wallet}`);
});

console.log('\n✅ Admin wallet test completed!');
console.log('\nTo add your own wallet as admin:');
console.log('1. Add to .env file: ADMIN_WALLETS=your_wallet_address,...');
console.log('2. Or use addAdminWallet() for runtime testing');
console.log('3. Restart server for .env changes to take effect'); 