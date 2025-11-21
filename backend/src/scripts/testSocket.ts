/**
 * @fileoverview Test script to demonstrate WebSocket communication
 * This simulates a hub terminal requesting and receiving signature verification
 */

import { Manager } from 'socket.io-client';
import readline from 'readline';

// Define interface for socket event data
interface SignatureVerifiedData {
  requestId: string;
  userWallet: string;
  timestamp: string;
}

interface SignatureErrorData {
  message: string;
  userWallet?: string;
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Socket.IO client instance
let socket: any;

// Connect to WebSocket server
function connectSocket() {
  const serverUrl = 'https://api.offchainbrazil.org';
  console.log(`Connecting to WebSocket server at ${serverUrl}...`);
  
  const manager = new Manager(serverUrl);
  socket = manager.socket('/');
  
  socket.on('connect', () => {
    console.log(`Connected to server with socket ID: ${socket.id}`);
    console.log('Simulating hub terminal for signature verification');
    showMenu();
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });
  
  // Handle signature verification response
  socket.on('signature_verified', (data: SignatureVerifiedData) => {
    console.log('\n✅ SIGNATURE VERIFIED!');
    console.log('Details:', data);
    console.log('User can now enter the hub.');
    setTimeout(showMenu, 1000);
  });
  
  socket.on('signature_error', (data: SignatureErrorData) => {
    console.log('\n❌ Signature verification failed!');
    console.log('Error:', data.message);
    setTimeout(showMenu, 1000);
  });
  
  socket.on('error', (error: Error) => {
    console.error('Socket error:', error);
  });
}

// Show main menu
function showMenu() {
  console.log('\n----- HUB TERMINAL SIMULATOR -----');
  console.log('1. Request signature verification');
  console.log('2. Check connection status');
  console.log('3. Disconnect');
  console.log('4. Exit');
  console.log('----------------------------------');
  
  rl.question('Select an option: ', (answer) => {
    switch (answer) {
      case '1':
        requestSignature();
        break;
      case '2':
        console.log(`Connection status: ${socket.connected ? 'Connected' : 'Disconnected'}`);
        showMenu();
        break;
      case '3':
        socket.disconnect();
        console.log('Disconnected from server');
        showMenu();
        break;
      case '4':
        console.log('Exiting...');
        socket.disconnect();
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('Invalid option');
        showMenu();
        break;
    }
  });
}

// Request signature verification
function requestSignature() {
  rl.question('Enter access request ID: ', (accessRequestId) => {
    if (!accessRequestId) {
      console.log('Access request ID is required');
      showMenu();
      return;
    }
    
    // Generate a random message to sign
    const message = `Access verification request at ${new Date().toISOString()}`;
    
    console.log(`Requesting signature for access ID: ${accessRequestId}`);
    console.log(`Message to sign: ${message}`);
    
    // Send signature request to server
    socket.emit('request_signature', {
      accessRequestId,
      message,
      hubId: '6824be19d1798d5eb183bf35' // Use your test hub ID
    });
    
    console.log('Signature request sent. Waiting for user to sign...');
  });
}

// Start the script
console.log('Starting hub terminal simulator...');
connectSocket(); 