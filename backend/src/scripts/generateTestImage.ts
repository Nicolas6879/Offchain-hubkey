import { generateIdentityImage } from '../utils/imageGenerator';

async function main() {
  try {
    const imagePath = await generateIdentityImage({
      name: 'John Doe',
      walletAddress: '0.0.123456',
    });
    
    console.log(`Image generated successfully at: ${imagePath}`);
  } catch (error) {
    console.error('Failed to generate test image:', error);
  }
}

main().catch(console.error); 