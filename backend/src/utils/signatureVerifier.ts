import { ethers } from 'ethers';

/**
 * Verifies that a signature was signed by the owner of a specific address
 * @param message Original message that was signed
 * @param signature The signature to verify
 * @param address The address that supposedly signed the message
 */
export const verifySignature = (
  message: string,
  signature: string,
  address: string
): boolean => {
  try {
    // Hash the message using ethers utilities
    const messageHash = ethers.hashMessage(message);
    
    // Recover the address from the signature
    const recoveredAddress = ethers.recoverAddress(messageHash, signature);
    
    // Check if the recovered address matches the expected address
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};

/**
 * Creates a challenge message for a user to sign
 * This helps prevent replay attacks by including a timestamp and nonce
 */
export const createChallengeMessage = (
  userAddress: string,
  nonce: string = Math.floor(Math.random() * 1000000).toString()
): { message: string; nonce: string } => {
  const timestamp = Date.now();
  const message = `Authentication request for HubKey. Please sign this message to verify your identity.\n\nAddress: ${userAddress}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
  
  return { message, nonce };
}; 