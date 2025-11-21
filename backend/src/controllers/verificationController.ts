/**
 * @fileoverview Verification controller for signature requests
 * Handles links from emails that trigger WebSocket signature requests
 */

import { Request, Response } from 'express';
import HubAccess from '../models/HubAccess';
import User from '../models/User';
import { io } from '../server'; // Import the Socket.IO instance

/**
 * Request signature verification from a user
 * 
 * Renders a page that sends a WebSocket request for signature verification
 * when clicked from an email link.
 * 
 * @async
 * @function requestSignatureVerification
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const requestSignatureVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Verification request received:', req.query);
    const { accessId, email, name } = req.query;
    
    if (!accessId) {
      res.status(400).send(`
        <html>
          <head><title>Verification Error</title></head>
          <body>
            <h1>Error: Missing Access ID</h1>
            <p>The verification link is invalid. Please contact support.</p>
          </body>
        </html>
      `);
      return;
    }

    // Find access request by NFT ID
    let accessRequest;
    try {
      accessRequest = await HubAccess.findOne({ tokenId: accessId });
      console.log('Found access request:', accessRequest);
    } catch (error) {
      console.error('Error finding access request:', error);
    }

    // Generate a message to sign
    const message = `Verify access to hub at ${new Date().toISOString()}`;
    
    // HTML response with embedded script to trigger WebSocket request
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Access Verification</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="/socket.io/socket.io.js"></script>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background: hsl(0, 0%, 0%);
              min-height: 100vh;
              color: hsl(0, 0%, 95%);
            }
            .container {
              background: hsl(0, 0%, 5%);
              border-radius: 15px;
              box-shadow: 0 10px 30px hsla(0, 0%, 0%, 0.3);
              border: 1px solid hsl(0, 0%, 15%);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, hsl(14, 100%, 57%) 0%, hsl(14, 100%, 47%) 100%);
              color: hsl(0, 0%, 100%);
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 300;
            }
            .header .subtitle {
              margin: 10px 0 0 0;
              opacity: 0.9;
              font-size: 16px;
            }
            .content {
              padding: 30px;
            }
            .card {
              background-color: hsl(0, 0%, 10%);
              border-radius: 10px;
              padding: 25px;
              margin: 20px 0;
              box-shadow: 0 2px 10px hsla(0, 0%, 0%, 0.3);
              border: 1px solid hsl(0, 0%, 15%);
            }
            .card h2 {
              margin-top: 0;
              color: hsl(0, 0%, 95%);
              font-size: 20px;
              border-bottom: 2px solid hsl(0, 0%, 15%);
              padding-bottom: 10px;
            }
            .visitor-info {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 15px;
              margin: 15px 0;
            }
            .info-item {
              background: hsl(0, 0%, 5%);
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid hsl(14, 100%, 57%);
              border: 1px solid hsl(0, 0%, 15%);
            }
            .info-label {
              font-size: 12px;
              color: hsl(0, 0%, 70%);
              text-transform: uppercase;
              font-weight: 600;
              margin-bottom: 5px;
            }
            .info-value {
              font-size: 14px;
              color: hsl(0, 0%, 95%);
              font-weight: 500;
              word-break: break-all;
            }
            .button {
              background: linear-gradient(135deg, hsl(14, 100%, 57%) 0%, hsl(14, 100%, 47%) 100%);
              border: none;
              color: hsl(0, 0%, 100%);
              padding: 15px 32px;
              text-align: center;
              text-decoration: none;
              display: inline-block;
              font-size: 16px;
              margin: 20px 0;
              cursor: pointer;
              border-radius: 25px;
              transition: all 0.3s ease;
              font-weight: 600;
              box-shadow: 0 4px 15px hsla(14, 100%, 57%, 0.3);
            }
            .button:hover {
              transform: translateY(-2px);
              background: linear-gradient(135deg, hsl(14, 100%, 67%) 0%, hsl(14, 100%, 57%) 100%);
              box-shadow: 0 6px 20px hsla(14, 100%, 57%, 0.4);
            }
            .button:disabled {
              background: hsl(0, 0%, 30%);
              cursor: not-allowed;
              transform: none;
              box-shadow: none;
            }
            .status {
              font-weight: bold;
              margin: 20px 0;
              font-size: 14px;
              padding: 10px;
              border-radius: 8px;
              text-align: left;
            }
            .success { 
              background: linear-gradient(135deg, hsl(14, 100%, 57%) 0%, hsl(14, 100%, 47%) 100%);
              color: hsl(0, 0%, 100%);
            }
            .error { 
              background: linear-gradient(135deg, hsl(0, 65%, 50%) 0%, hsl(0, 65%, 40%) 100%);
              color: hsl(0, 0%, 100%);
            }
            .pending { 
              background: linear-gradient(135deg, hsl(0, 0%, 30%) 0%, hsl(0, 0%, 20%) 100%);
              color: hsl(0, 0%, 95%);
            }
            .verification-success {
              background: linear-gradient(135deg, hsl(14, 100%, 57%) 0%, hsl(14, 100%, 47%) 100%);
              color: hsl(0, 0%, 100%);
              padding: 30px;
              border-radius: 15px;
              text-align: center;
              margin: 20px 0;
              animation: slideInUp 0.6s ease-out;
            }
            .verification-success .icon {
              font-size: 60px;
              margin-bottom: 20px;
              animation: checkmark 0.8s ease-in-out;
            }
            .verification-success h3 {
              margin: 0 0 15px 0;
              font-size: 24px;
              font-weight: 600;
            }
            .verification-success .subtitle {
              font-size: 16px;
              opacity: 0.9;
              margin-bottom: 20px;
            }
            .member-details {
              background: hsla(0, 0%, 0%, 0.3);
              border-radius: 10px;
              padding: 20px;
              margin: 20px 0;
              backdrop-filter: blur(10px);
              border: 1px solid hsla(0, 0%, 100%, 0.1);
            }
            .member-details .detail-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid hsla(0, 0%, 100%, 0.2);
            }
            .member-details .detail-row:last-child {
              border-bottom: none;
            }
            .member-details .label {
              font-weight: 600;
              opacity: 0.9;
              color: hsl(0, 0%, 100%);
            }
            .member-details .value {
              font-family: 'Courier New', monospace;
              font-size: 14px;
              color: hsl(0, 0%, 100%);
            }
            .next-steps {
              background: hsla(0, 0%, 0%, 0.3);
              border-radius: 10px;
              padding: 20px;
              margin: 20px 0;
              backdrop-filter: blur(10px);
              border: 1px solid hsla(0, 0%, 100%, 0.1);
            }
            .next-steps h4 {
              margin: 0 0 15px 0;
              font-size: 18px;
              color: hsl(0, 0%, 100%);
            }
            .next-steps ul {
              margin: 0;
              padding-left: 20px;
              text-align: left;
            }
            .next-steps li {
              margin: 8px 0;
              line-height: 1.4;
              color: hsl(0, 0%, 100%);
            }
            .debug-section {
              margin-top: 30px;
              border-top: 2px solid hsl(0, 0%, 15%);
              padding-top: 20px;
            }
            .debug-info {
              font-size: 12px;
              color: hsl(0, 0%, 70%);
            }
            #debugLogs {
              background: hsl(0, 0%, 5%);
              border: 1px solid hsl(0, 0%, 15%);
              padding: 15px;
              margin-top: 10px;
              border-radius: 8px;
              max-height: 200px;
              overflow-y: auto;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              color: hsl(0, 0%, 95%);
            }
            @keyframes slideInUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes checkmark {
              0% {
                transform: scale(0);
                opacity: 0;
              }
              50% {
                transform: scale(1.2);
                opacity: 1;
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }
            .pulse {
              animation: pulse 2s infinite;
            }
            @keyframes pulse {
              0% {
                box-shadow: 0 0 0 0 hsla(14, 100%, 57%, 0.7);
              }
              70% {
                box-shadow: 0 0 0 10px hsla(14, 100%, 57%, 0);
              }
              100% {
                box-shadow: 0 0 0 0 hsla(14, 100%, 57%, 0);
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏢 Hub Access Verification</h1>
              <div class="subtitle">Offchain Member Identity Verification System</div>
            </div>
            
            <div class="content">
              <div class="card">
                <h2>👤 Visitor Information</h2>
                <div class="visitor-info">
                  <div class="info-item">
                    <div class="info-label">Visitor Name</div>
                    <div class="info-value">${name || 'Not provided'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Email Address</div>
                    <div class="info-value">${email || 'Not provided'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">NFT/Access ID</div>
                    <div class="info-value">${accessId}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Hub ID</div>
                    <div class="info-value">${accessRequest ? accessRequest.hubId : 'unknown'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Request ID</div>
                    <div class="info-value">${accessRequest ? accessRequest._id : 'Not found'}</div>
                  </div>
                </div>
              </div>
              
              <div class="card">
                <h2>🔐 Identity Verification</h2>
                <p style="color: hsl(0, 0%, 95%);">Click the button below to request digital signature verification from the visitor. This will validate their Offchain membership and NFT ownership.</p>
                <button class="button pulse" id="requestButton" onclick="requestSignature()">
                  🚀 Request Identity Verification
                </button>
                <div class="status pending" id="status">Ready to verify member identity</div>
              </div>
              
              <div id="successSection" style="display: none;">
                <!-- Success content will be inserted here -->
              </div>
              
                              <div class="card debug-section">
                  <h2>🔧 System Status</h2>
                  <div class="debug-info">
                    <p><strong style="color: hsl(0, 0%, 95%);">WebSocket:</strong> <span id="socketStatus" style="color: hsl(0, 0%, 70%);">Connecting...</span></p>
                    <p><strong style="color: hsl(0, 0%, 95%);">Hub Registration:</strong> <span id="hubRegStatus" style="color: hsl(0, 0%, 70%);">Pending...</span></p>
                    <div id="debugLogs">Initializing verification system...</div>
                  </div>
                </div>
            </div>
          </div>
          
          <script>
            // Connect to WebSocket server
            const socket = io();
            let requestSent = false;
            
            // Debug logging function
            function addDebugLog(message) {
              const debugLogs = document.getElementById('debugLogs');
              const timestamp = new Date().toLocaleTimeString();
              debugLogs.innerHTML += '<br>[' + timestamp + '] ' + message;
              debugLogs.scrollTop = debugLogs.scrollHeight;
            }
            
            // Clear initial placeholder
            document.getElementById('debugLogs').innerHTML = '';
            
            socket.on('connect', () => {
              console.log('🔗 Connected to server with socket ID:', socket.id);
              addDebugLog('🔗 Connected to server with socket ID: ' + socket.id);
              document.getElementById('status').textContent = 'Connected to verification server';
              document.getElementById('socketStatus').textContent = 'Connected';
              document.getElementById('socketStatus').style.color = 'green';
              
              // Register this socket as a hub verification socket with the hubId
              const hubId = '${accessRequest ? accessRequest.hubId : "unknown"}';
              console.log('🏢 Registering hub with ID:', hubId);
              addDebugLog('🏢 Registering hub with ID: ' + hubId);
              socket.emit('register_hub', { hubId: hubId });
            });
            
            socket.on('disconnect', () => {
              console.log('🔌 Disconnected from server');
              addDebugLog('🔌 Disconnected from server');
              document.getElementById('status').textContent = 'Disconnected from server';
              document.getElementById('status').className = 'status error';
              document.getElementById('socketStatus').textContent = 'Disconnected';
              document.getElementById('socketStatus').style.color = 'red';
              document.getElementById('hubRegStatus').textContent = 'Disconnected';
              document.getElementById('hubRegStatus').style.color = 'red';
            });
            
            // Add event listener for hub registration confirmation
            socket.on('hub_registered', (data) => {
              console.log('🏢 Hub registered successfully:', data);
              addDebugLog('🏢 Hub registered successfully with ID: ' + data.hubId);
              document.getElementById('hubRegStatus').textContent = 'Registered';
              document.getElementById('hubRegStatus').style.color = 'green';
            });
            
            socket.on('signature_verified', (data) => {
              console.log('✅ Signature verified received:', data);
              addDebugLog('✅ Signature verified for request: ' + data.requestId);
              
              // Hide the verification card and show success
              document.querySelector('.card:nth-of-type(2)').style.display = 'none';
              
                             // Create beautiful success message
               const successSection = document.getElementById('successSection');
               successSection.style.display = 'block';
               successSection.innerHTML = 
                 '<div class="verification-success">' +
                   '<div class="icon">✅</div>' +
                   '<h3>Member Successfully Verified!</h3>' +
                   '<div class="subtitle">This visitor is a verified Offchain member with valid NFT credentials</div>' +
                   '<div class="member-details">' +
                     '<div class="detail-row">' +
                       '<span class="label">Member Name:</span>' +
                       '<span class="value">${name || 'Verified Member'}</span>' +
                     '</div>' +
                     '<div class="detail-row">' +
                       '<span class="label">Wallet Address:</span>' +
                       '<span class="value">' + data.userWallet + '</span>' +
                     '</div>' +
                     '<div class="detail-row">' +
                       '<span class="label">Verification Time:</span>' +
                       '<span class="value">' + new Date(data.timestamp).toLocaleString() + '</span>' +
                     '</div>' +
                     '<div class="detail-row">' +
                       '<span class="label">Request ID:</span>' +
                       '<span class="value">' + data.requestId + '</span>' +
                     '</div>' +
                   '</div>' +
                   '<div class="next-steps">' +
                     '<h4>✨ Access Approved - Next Steps:</h4>' +
                     '<ul>' +
                                            '<li><strong>✅ APPROVED FOR ENTRY:</strong> This member is now authorized to enter the hub</li>' +
                     '<li><strong>🔐 Valid NFT:</strong> Their membership credentials have been cryptographically verified</li>' +
                     '<li><strong>✍️ Digital Signature:</strong> Identity confirmed via blockchain signature</li>' +
                     '<li><strong>💾 Recorded:</strong> Access approval has been saved to the database automatically</li>' +
                     '<li><strong>🎉 Welcome:</strong> You can now grant entry and welcome them to the hub!</li>' +
                     '</ul>' +
                   '</div>' +
                 '</div>';
              
                             // Update header to show success
               document.querySelector('.header h1').textContent = '✅ Verification Complete';
               document.querySelector('.header .subtitle').textContent = 'Member identity successfully verified and approved for entry';
               document.querySelector('.header').style.background = 'linear-gradient(135deg, hsl(14, 100%, 57%) 0%, hsl(14, 100%, 47%) 100%)';
               
               // Scroll to success section
               successSection.scrollIntoView({ behavior: 'smooth' });
               
               // Add visual feedback
               addDebugLog('🎉 Verification completed successfully - member approved for entry');
            });
            
            socket.on('signature_error', (data) => {
              console.log('❌ Signature error:', data);
              addDebugLog('❌ Signature error: ' + data.message);
              document.getElementById('status').textContent = '❌ Verification failed: ' + data.message;
              document.getElementById('status').className = 'status error';
              document.getElementById('requestButton').disabled = false;
              document.getElementById('requestButton').classList.add('pulse');
              document.getElementById('requestButton').innerHTML = '🔄 Retry Identity Verification';
            });
            
            socket.on('signature_requested', (data) => {
              console.log('📤 Signature requested:', data);
              addDebugLog('📤 Signature request sent to user');
              document.getElementById('status').textContent = '📱 Waiting for member to sign on their device...';
              document.getElementById('status').className = 'status pending';
            });
            
            function requestSignature() {
              if (requestSent) {
                document.getElementById('status').textContent = '⏳ Verification already in progress...';
                document.getElementById('status').className = 'status pending';
                addDebugLog('⚠️ Request already sent, ignoring duplicate request');
                return;
              }
              
              const accessRequestId = '${accessRequest ? accessRequest._id : accessId}';
              const message = '${message.replace(/'/g, "\\'")}';
              const hubId = '${accessRequest ? accessRequest.hubId : "unknown"}';
              
              addDebugLog('📤 Sending signature request for access ID: ' + accessRequestId);
              addDebugLog('📝 Message to sign: ' + message);
              addDebugLog('🏢 Hub ID: ' + hubId);
              
              // Update UI to show loading state
              document.getElementById('status').textContent = '🚀 Sending verification request to member...';
              document.getElementById('status').className = 'status pending';
              document.getElementById('requestButton').disabled = true;
              document.getElementById('requestButton').classList.remove('pulse');
              document.getElementById('requestButton').innerHTML = '⏳ Verifying...';
              
              socket.emit('request_signature', {
                accessRequestId: accessRequestId,
                message: message,
                hubId: hubId
              });
              
              requestSent = true;
              
              // Re-enable button after 30 seconds in case of timeout
              setTimeout(() => {
                if (document.getElementById('status').className !== 'status success' && 
                    !document.getElementById('successSection').style.display === 'block') {
                  document.getElementById('requestButton').disabled = false;
                  document.getElementById('requestButton').classList.add('pulse');
                  document.getElementById('requestButton').innerHTML = '🔄 Retry Identity Verification';
                  document.getElementById('status').textContent = '⏰ Verification timed out. Please try again.';
                  document.getElementById('status').className = 'status error';
                  addDebugLog('⏰ Verification request timed out after 30 seconds');
                  requestSent = false;
                }
              }, 33330);
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in requestSignatureVerification controller:', error);
    res.status(500).send(`
      <html>
        <head><title>Verification Error</title></head>
        <body>
          <h1>Server Error</h1>
          <p>An unexpected error occurred. Please try again later.</p>
        </body>
      </html>
    `);
  }
}; 