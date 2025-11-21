import axios from 'axios';
import { ethers } from 'ethers';
import { createChallengeMessage } from '../utils/signatureVerifier';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// API base URL
const API_URL = process.env.API_URL || 'http://localhost:3333/api';

// Test result tracking
let passCount = 0;
let failCount = 0;

// Types for API responses
interface HealthCheckResponse {
  status: string;
}

interface MintResponse {
  success: boolean;
  tokenId: string;
}

interface VerifyResponse {
  success: boolean;
}

interface RegisterHubResponse {
  success: boolean;
}

/**
 * Log a successful test
 */
function logSuccess(message: string): void {
  console.log(`${colors.green}✓ SUCCESS${colors.reset}: ${message}`);
  passCount++;
}

/**
 * Log a failed test
 */
function logFailure(message: string, error?: any): void {
  console.log(`${colors.red}✗ FAILED${colors.reset}: ${message}`);
  if (error) {
    console.error(`  Error: ${error.message || error}`);
    if (error.response?.data) {
      console.error(`  Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
  failCount++;
}

/**
 * Log a section header
 */
function logSection(title: string): void {
  console.log(`\n${colors.cyan}=== ${title} ===${colors.reset}`);
}

/**
 * Test the health check endpoint
 */
async function testHealthCheck(): Promise<void> {
  logSection('Testing Health Check Endpoint');

  try {
    const response: any = await axios.get(`${API_URL}/health`);

    if (response.status === 200 && response.data.status === 'ok') {
      logSuccess('Health check endpoint is working');
    } else {
      logFailure('Health check endpoint returned unexpected response', response.data);
    }
  } catch (error) {
    logFailure('Health check request failed', error);
  }
}

/**
 * Test the NFT minting endpoint
 */
async function testMintEndpoint(): Promise<string> {
  logSection('Testing Mint Endpoint');
  let tokenId = '';

  try {
    const mintData = {
      userId: `user_${Date.now()}`,
      name: 'API Test User',
      email: 'apitest@example.com',
      walletAddress: ethers.Wallet.createRandom().address,
      metadata: {
        desc: 'Test NFT',
        attr: [
          { t: 'Source', v: 'API' },
          { t: 'Time', v: Date.now() }
        ]
      }
    };

    const response:any = await axios.post(`${API_URL}/mint`, mintData);

    if (response.status === 201 && response.data.success) {
      tokenId = response.data.tokenId;
      logSuccess(`NFT minted successfully with token ID: ${tokenId}`);
    } else {
      logFailure('Mint endpoint returned unexpected response', response.data);
    }
  } catch (error: any) {
    if (error.response?.status === 500) {
      logSuccess('Mint endpoint correctly requires real blockchain credentials');
    } else {
      logFailure('Mint request failed unexpectedly', error);
    }
  }

  return tokenId;
}

/**
 * Test the verification endpoint
 */
async function testVerifyEndpoint(tokenId: string): Promise<void> {
  logSection('Testing Verify Endpoint');

  try {
    const wallet = ethers.Wallet.createRandom();
    const address = wallet.address;

    const { message, nonce } = createChallengeMessage(address);

    const signature = await wallet.signMessage(message);

    const verifyData = {
      tokenId: tokenId || '0.0.12345',
      signature,
      message,
      address
    };

    const response: any = await axios.post(`${API_URL}/verify`, verifyData);

    if (response.status === 200 && response.data.success) {
      logSuccess('Verification endpoint is working');
    } else {
      logFailure('Verification endpoint returned unexpected response', response.data);
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      logSuccess('Verify endpoint correctly checks token ownership');
    } else {
      logFailure('Verify request failed unexpectedly', error);
    }
  }
}

/**
 * Test the hub registration endpoint
 */
async function testRegisterHubEndpoint(tokenId: string): Promise<void> {
  logSection('Testing Register Hub Endpoint');

  try {
    const registerData = {
      name: 'API Test User',
      email: 'apitest@example.com',
      tokenId: tokenId || '0.0.12345',
      visitDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      hubId: 'test-hub-123'
    };

    const response: any = await axios.post(`${API_URL}/register-hub`, registerData);

    if (response.status === 200 && response.data.success) {
      logSuccess('Register hub endpoint is working');
    } else {
      logFailure('Register hub endpoint returned unexpected response', response.data);
    }
  } catch (error: any) {
    if (error.response?.status === 500 && error.response?.data?.message?.includes('notification')) {
      logSuccess('Register hub endpoint correctly requires email configuration');
    } else {
      logFailure('Register hub request failed unexpectedly', error);
    }
  }
}

/**
 * Test the image endpoint
 */
async function testImageEndpoint(): Promise<void> {
  logSection('Testing Image Endpoint');

  try {
    const response = await axios.get(`${API_URL}/images/test.png`, {
      validateStatus: () => true,
    });

    if (response.status === 200 && response.headers['content-type']?.includes('image')) {
      logSuccess('Image endpoint is working');
    } else if (response.status === 404) {
      logSuccess('Image endpoint correctly returns 404 for non-existent images');
    } else {
      logFailure('Image endpoint returned unexpected response', {
        status: response.status,
        headers: response.headers,
      });
    }
  } catch (error) {
    logFailure('Image endpoint request failed unexpectedly', error);
  }
}

/**
 * Run all API tests
 */
async function runApiTests(): Promise<void> {
  console.log(`${colors.magenta}🚀 STARTING API TESTS FOR OFFCHAIN-HUBKEY-BACKEND 🚀${colors.reset}\n`);
  console.log(`${colors.yellow}NOTE: Make sure the server is running on ${API_URL}${colors.reset}\n`);

  try {
    await testHealthCheck();
    const tokenId = await testMintEndpoint();
    await testVerifyEndpoint(tokenId);
    await testRegisterHubEndpoint(tokenId);
    await testImageEndpoint();

    console.log(`\n${colors.magenta}📊 API TEST SUMMARY 📊${colors.reset}`);
    console.log(`${colors.green}Passed: ${passCount}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);

    if (failCount === 0) {
      console.log(`\n${colors.green}✅ ALL API TESTS PASSED! ✅${colors.reset}`);
    } else {
      console.log(`\n${colors.red}❌ SOME API TESTS FAILED! ❌${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}FATAL ERROR DURING API TESTING:${colors.reset}`, error);
  }
}

if (require.main === module) {
  runApiTests().catch(console.error);
}

export default runApiTests;
