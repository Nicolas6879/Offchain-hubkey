import { render, screen } from '@testing-library/react';
import { WalletSelectionDialog } from './WalletSelectionDialog';

// Mock ESM modules that Jest cannot parse
jest.mock('@hashgraph/hedera-wallet-connect', () => ({}));
jest.mock('../services/wallets/walletconnect/walletConnectClient', () => ({
  openWalletConnectModal: jest.fn(),
}));
jest.mock('../services/wallets/metamask/metamaskClient', () => ({
  connectToMetamask: jest.fn(),
}));

test('renders wallet buttons when open', () => {
  render(<WalletSelectionDialog open={true} setOpen={jest.fn()} onClose={jest.fn()} />);
  expect(screen.getByText(/WalletConnect/i)).toBeInTheDocument();
  expect(screen.getByText(/Metamask/i)).toBeInTheDocument();
});
