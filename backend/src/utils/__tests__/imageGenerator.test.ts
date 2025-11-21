import { generateIdentityImage } from '../imageGenerator';
import fs from 'fs';

jest.setTimeout(10000);

test('generateIdentityImage creates a PNG file', async () => {
  const path = await generateIdentityImage({ name: 'Test', walletAddress: '0xabcdef1234567890' });
  expect(fs.existsSync(path)).toBe(true);
  const stats = fs.statSync(path);
  expect(stats.size).toBeGreaterThan(0);
  fs.unlinkSync(path);
});
