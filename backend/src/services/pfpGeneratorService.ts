import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface GenerateImageParams {
  name: string;
  email: string;
  walletAddress: string;
  customizations?: {
    backgroundColor?: string;
    textColor?: string;
    shape?: 'circle' | 'square';
    pattern?: string;
  };
}

interface GenerateImageResult {
  imagePath: string;
  filename: string;
}

class PfpGeneratorService {
  private generatedDir: string;

  constructor() {
    this.generatedDir = path.resolve(__dirname, '../../generated');
    // Ensure the directory exists
    if (!fs.existsSync(this.generatedDir)) {
      fs.mkdirSync(this.generatedDir, { recursive: true });
    }
  }

  /**
   * Generate a unique profile picture for a member
   */
  async generateImage(params: GenerateImageParams): Promise<GenerateImageResult> {
    const { name, email, walletAddress, customizations = {} } = params;
    
    // Get default values from customizations or use defaults
    const backgroundColor = customizations.backgroundColor || this.getRandomColor(walletAddress);
    const textColor = customizations.textColor || '#FFFFFF';
    const shape = customizations.shape || 'circle';
    
    // Create a unique filename based on wallet address and timestamp
    const timestamp = Date.now();
    const hash = crypto.createHash('md5').update(`${walletAddress}${timestamp}`).digest('hex');
    const filename = `pfp_${hash}.png`;
    const outputPath = path.join(this.generatedDir, filename);
    
    // Create canvas and context
    const canvas = createCanvas(500, 500);
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
    
    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, 500, 500);
    
    // Add pattern if specified
    if (customizations.pattern) {
      this.drawPattern(ctx, customizations.pattern);
    }
    
    // Add initials or first letter of name
    this.drawInitials(ctx, name, textColor);
    
    // Apply shape mask if circle
    if (shape === 'circle') {
      this.applyCircleMask(ctx);
    }
    
    // Save the image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    return {
      imagePath: `/images/${filename}`,
      filename,
    };
  }
  
  private getRandomColor(seed: string): string {
    // Generate a predictable color based on wallet address
    const hash = crypto.createHash('md5').update(seed).digest('hex');
    return `#${hash.substring(0, 6)}`;
  }
  
  private drawInitials(ctx: CanvasRenderingContext2D, name: string, color: string): void {
    const words = name.trim().split(' ');
    let initials = '';
    
    if (words.length === 1) {
      // If only one word, use first two letters
      initials = words[0].substring(0, 2).toUpperCase();
    } else {
      // Otherwise use first letter of first and last words
      initials = `${words[0].charAt(0)}${words[words.length - 1].charAt(0)}`.toUpperCase();
    }
    
    ctx.fillStyle = color;
    ctx.font = 'bold 180px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 250, 250);
  }
  
  private drawPattern(ctx: CanvasRenderingContext2D, pattern: string): void {
    // Implement different patterns based on pattern string
    // This is a simple example with a grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    
    // Draw grid lines
    for (let i = 0; i < 500; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 500);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(500, i);
      ctx.stroke();
    }
  }
  
  private applyCircleMask(ctx: CanvasRenderingContext2D): void {
    // Create a circular mask
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(250, 250, 250, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }
}

export default new PfpGeneratorService(); 