import { createCanvas, loadImage, registerFont, Canvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

interface ImageConfig {
  name: string;
  walletAddress: string;
  outputPath?: string;
}

/**
 * Generates an NFT identity image with the user's name and wallet address
 * @param config Configuration options for the image
 * @returns Path to the generated image
 */
export const generateIdentityImage = async (config: ImageConfig): Promise<string> => {
  try {
    // Set dimensions
    const width = 1000;
    const height = 1000;
    
    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Load background image
    const backgroundImagePath = path.resolve(__dirname, '../../src/assets/background.png');
    const backgroundImage = await loadImage(backgroundImagePath);
    
    // Draw background
    ctx.drawImage(backgroundImage, 0, 0, width, height);
    
    // Apply semi-transparent overlay for better text visibility
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, width, height);
    
    // Set text styles for name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw name
    ctx.fillText(config.name, width / 2, height / 2 - 50);
    
    // Set text styles for wallet address
    ctx.font = '32px Arial';
    
    // Format wallet address (shorten it)
    const formattedWallet = formatWalletAddress(config.walletAddress);
    
    // Draw wallet address
    ctx.fillText(formattedWallet, width / 2, height / 2 + 50);

    // Add "HubKey Identity" badge
    const badgeImagePath = path.resolve(__dirname, '../../src/assets/offchain.png');
    const badgeImage = await loadImage(badgeImagePath);
    const badgeWidth = 300;
    const badgeHeight = 105;
    const badgeX = (width - badgeWidth) / 2;
    const badgeY = height - badgeHeight - 100;
    ctx.drawImage(badgeImage, badgeX, badgeY, badgeWidth, badgeHeight);
    
    // Add timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    ctx.font = '20px Arial';
    ctx.fillText(`Created: ${timestamp}`, width / 2, height - 50);
    
    // Generate output path if not provided
    const outputPath = config.outputPath || 
      path.resolve(__dirname, `../../generated/${Date.now()}_${config.name.replace(/\s+/g, '_')}.png`);
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save the image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    return outputPath;
  } catch (error) {
    console.error('Error generating identity image:', error);
    throw new Error('Failed to generate identity image');
  }
};

/**
 * Formats a wallet address to be more readable
 */
const formatWalletAddress = (address: string): string => {
  if (!address) return '';
  
  // For Ethereum-like addresses
  if (address.startsWith('0x') && address.length > 10) {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
  
  // For Hedera account IDs
  if (address.includes('.') && address.split('.').length === 3) {
    return address; // Hedera IDs are already short (0.0.123456)
  }
  
  // Generic shortening for other formats
  if (address.length > 10) {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
  
  return address;
}; 