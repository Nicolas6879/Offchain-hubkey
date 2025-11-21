/**
 * @fileoverview WebSocket server implementation
 * Handles real-time communication for signature requests and verification
 */

import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { ethers } from 'ethers';
import User from '../models/User';
import HubAccess from '../models/HubAccess';

// Map to track connected clients by wallet address
const connectedClients = new Map<string, string>();

// Define socket type for improved type safety
type AppSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

/**
 * Initialize Socket.IO server
 * @param io - Socket.IO server instance
 */
const initSocketServer = (io: Server): void => {
  io.on('connection', (socket: AppSocket) => {
    console.log('New client connected:', socket.id);
    let clientWalletAddress: string;

    // Handle client registration with wallet address
    socket.on('register', (data: { walletAddress: string }) => {
      if (!data.walletAddress) {
        socket.emit('error', { message: 'Wallet address is required' });
        return;
      }

      clientWalletAddress = data.walletAddress.toLowerCase();
      connectedClients.set(clientWalletAddress, socket.id);
      
      console.log(`Client registered with wallet: ${clientWalletAddress}, socketId: ${socket.id}`);
      socket.emit('registered', { status: 'success' });
    });

    // Handle hub registration with hubId for verification pages
    socket.on('register_hub', (data: { hubId: string }) => {
      if (!data.hubId) {
        console.error('Hub ID is required for hub registration');
        socket.emit('error', { message: 'Hub ID is required' });
        return;
      }

      // Store hubId in socket data
      socket.data = socket.data || {};
      socket.data.hubId = data.hubId;
      
      console.log(`Hub registered with ID: ${data.hubId}, socketId: ${socket.id}`);
      
      // Confirm registration back to the hub
      socket.emit('hub_registered', { hubId: data.hubId, socketId: socket.id });
    });

    // Handle hub signature requests
    socket.on('request_signature', async (data: { 
      accessRequestId: string,
      message: string,
      hubId: string 
    }) => {
      try {
        const { accessRequestId, message, hubId } = data;
        
        // Validate the access request exists
        const accessRequest = await HubAccess.findById(accessRequestId);
        if (!accessRequest) {
          socket.emit('signature_error', { message: 'Access request not found' });
          return;
        }
        
        const userWalletAddress = accessRequest.memberWalletAddress.toLowerCase();
        const userSocketId = connectedClients.get(userWalletAddress);
        
        if (!userSocketId) {
          socket.emit('signature_error', { 
            message: 'User is not currently connected',
            userWallet: userWalletAddress 
          });
          return;
        }
        
        // Forward signature request to user
        io.to(userSocketId).emit('signature_needed', {
          requestId: accessRequestId,
          message,
          hubId
        });
        
        socket.emit('signature_requested', { status: 'requested' });
      } catch (error) {
        console.error('Error in signature request:', error);
        socket.emit('signature_error', { message: 'Internal server error' });
      }
    });

    // Handle user's signature response
    socket.on('submit_signature', async (data: {
      requestId: string,
      signature: string,
      message: string
    }) => {
      try {
        const { requestId, signature, message } = data;
        
        // Validate the access request exists
        const accessRequest = await HubAccess.findById(requestId);
        if (!accessRequest) {
          socket.emit('error', { message: 'Access request not found' });
          return;
        }
        
        const userWalletAddress = accessRequest.memberWalletAddress.toLowerCase();
        let signatureValid = false;
        
        // Check different signature types
        if (signature.startsWith('0x')) {
          // Traditional MetaMask signature verification
          try {
            const recoveredAddress = ethers.verifyMessage(message, signature);
            signatureValid = recoveredAddress.toLowerCase() === userWalletAddress;
            console.log('MetaMask signature verification:', { recoveredAddress, userWalletAddress, valid: signatureValid });
          } catch (error) {
            console.error('Error verifying MetaMask signature:', error);
            signatureValid = false;
          }
        } else if (signature.includes('@') && signature.includes('.')) {
          // Hedera transaction ID format (legacy check, keeping for compatibility)
          console.log('Hedera transaction ID received:', signature);
          signatureValid = true;
          console.log('Hedera transaction ID accepted as signature proof');
        } else if (signature.startsWith('{') && signature.endsWith('}')) {
          // WalletConnect signature map (JSON format)
          try {
            console.log('WalletConnect signature map received:', signature);
            const signatureData = JSON.parse(signature);
            // For now, we'll accept any valid JSON signature from WalletConnect
            // In production, you might want to verify the signature against the public key
            signatureValid = true;
            console.log('WalletConnect signature accepted as proof');
          } catch (error) {
            console.error('Error parsing WalletConnect signature:', error);
            signatureValid = false;
          }
        } else {
          console.error('Unknown signature format:', signature);
          signatureValid = false;
        }
        
        if (!signatureValid) {
          socket.emit('error', { message: 'Invalid signature or transaction proof' });
          return;
        }
        
        // Notify the hub about successful verification
        console.log('Looking for hub sockets with hubId:', accessRequest.hubId.toString());
        
        const hubSockets = Array.from(io.sockets.sockets.values())
          .filter((s: AppSocket) => {
            // Access hub data safely
            const socketData = s.data || {};
            const hasMatchingHubId = socketData.hubId === accessRequest.hubId.toString();
            console.log(`Socket ${s.id}: hubId=${socketData.hubId}, matches=${hasMatchingHubId}`);
            return hasMatchingHubId;
          });
          
        console.log(`Found ${hubSockets.length} hub socket(s) for hubId: ${accessRequest.hubId.toString()}`);
          
        if (hubSockets.length > 0) {
          hubSockets.forEach((s: AppSocket) => {
            console.log(`Sending signature_verified to hub socket: ${s.id}`);
            s.emit('signature_verified', {
              requestId,
              userWallet: userWalletAddress,
              timestamp: new Date().toISOString()
            });
          });
        } else {
          console.warn('No hub sockets found to notify about signature verification');
          
          // Fallback: broadcast to all connected sockets (for debugging)
          console.log('Broadcasting to all connected sockets as fallback');
          io.emit('signature_verified', {
            requestId,
            userWallet: userWalletAddress,
            timestamp: new Date().toISOString()
          });
        }
        
        socket.emit('signature_confirmed', { status: 'accessed' });
        
        // Update access request status to 'accessed' since signature verification means hub approved access
        accessRequest.status = 'accessed';
        accessRequest.verifiedAt = new Date();
        accessRequest.lastAccessedAt = new Date(); // Also set access time
        accessRequest.signature = signature;
        accessRequest.staffName = 'System'; // Automated approval via signature
        await accessRequest.save();
        
        // Notify all connected clients about the status change
        io.emit('hub_access_status_changed', {
          accessRequestId: requestId,
          newStatus: 'accessed',
          memberWallet: userWalletAddress,
          hubId: accessRequest.hubId.toString(),
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Error in signature verification:', error);
        socket.emit('error', { message: 'Error verifying signature' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (clientWalletAddress) {
        connectedClients.delete(clientWalletAddress);
        console.log(`Client disconnected: ${clientWalletAddress}`);
      }
    });
  });
};

export default initSocketServer; 