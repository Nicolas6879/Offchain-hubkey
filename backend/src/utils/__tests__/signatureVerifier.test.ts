import { createChallengeMessage, verifySignature } from '../signatureVerifier';
import { ethers } from 'ethers';

test('createChallengeMessage includes address and nonce', () => {
  const { message, nonce } = createChallengeMessage('0xabc', '123');
  expect(message).toContain('0xabc');
  expect(message).toContain('123');
  expect(nonce).toBe('123');
});

test('verifySignature validates correct signature and rejects invalid', async () => {
  const wallet = ethers.Wallet.createRandom();
  const { message } = createChallengeMessage(wallet.address);
  const signature = await wallet.signMessage(message);
  expect(verifySignature(message, signature, wallet.address)).toBe(true);
  const otherWallet = ethers.Wallet.createRandom();
  expect(verifySignature(message, signature, otherWallet.address)).toBe(false);
});
