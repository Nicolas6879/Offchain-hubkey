import { useContext, useEffect, useState } from 'react';
import { MetamaskContext } from '../contexts/MetamaskContext';
import { WalletConnectContext } from '../contexts/WalletConnectContext';
import authEvents from '../services/authEvents';

/**
 * Hook to get the current connected wallet address
 * 
 * Checks wallet contexts first, then falls back to localStorage
 * Automatically updates when wallet is connected/disconnected or when auth events fire
 * 
 * @returns The current wallet address or empty string if not connected
 */
export const useWalletAddress = (): string => {
  const metamaskCtx = useContext(MetamaskContext);
  const walletConnectCtx = useContext(WalletConnectContext);
  const [walletAddress, setWalletAddress] = useState<string>('');

  // Function to update wallet address
  const updateWalletAddress = () => {
    // Priority: 1. MetaMask context, 2. WalletConnect context, 3. localStorage
    const connectedWallet = 
      metamaskCtx.metamaskAccountAddress || 
      walletConnectCtx.accountId || 
      localStorage.getItem('walletAddress') || 
      '';
    
    setWalletAddress(connectedWallet);
  };

  // Update on context changes
  useEffect(() => {
    updateWalletAddress();
  }, [metamaskCtx.metamaskAccountAddress, walletConnectCtx.accountId]);

  // Listen to auth events for real-time updates
  useEffect(() => {
    const handleLogin = () => {
      console.log('🔄 useWalletAddress: Login event received, updating...');
      updateWalletAddress();
    };

    const handleLogout = () => {
      console.log('🔄 useWalletAddress: Logout event received, clearing...');
      setWalletAddress('');
    };

    const handleWalletConnected = () => {
      console.log('🔄 useWalletAddress: Wallet connected event received, updating...');
      updateWalletAddress();
    };

    // Subscribe to auth events
    const unsubLogin = authEvents.onLogin(handleLogin);
    const unsubLogout = authEvents.onLogout(handleLogout);
    const unsubWalletConnected = authEvents.onWalletConnected(handleWalletConnected);

    // Cleanup listeners on unmount
    return () => {
      unsubLogin();
      unsubLogout();
      unsubWalletConnected();
    };
  }, []);

  return walletAddress;
};

