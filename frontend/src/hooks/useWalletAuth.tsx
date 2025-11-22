import { useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MetamaskContext } from '../contexts/MetamaskContext';
import { WalletConnectContext } from '../contexts/WalletConnectContext';
import { appConfig } from '../config';
import authEvents from '../services/authEvents';

export const useWalletAuth = () => {
  const navigate = useNavigate();
  const metamaskCtx = useContext(MetamaskContext);
  const walletConnectCtx = useContext(WalletConnectContext);
  const processingRef = useRef<string | null>(null); // Track wallet being processed

  const connectedWallet = metamaskCtx.metamaskAccountAddress || walletConnectCtx.accountId;

  useEffect(() => {
    const handleWalletConnection = async (walletAddress: string) => {
      // Prevent duplicate processing
      if (processingRef.current === walletAddress) {
        console.log('Already processing this wallet, skipping...');
        return;
      }

      // Check if already logged in via email/password
      const existingToken = localStorage.getItem('token');
      const existingWallet = localStorage.getItem('walletAddress');

      if (existingToken && existingWallet) {
        // Already logged in, do nothing
        console.log('User already logged in');
        return;
      }

      // Mark as processing
      processingRef.current = walletAddress;

      try {
        // Check if wallet is registered
        const response = await fetch(
          `${appConfig.networks.testnet.backendUrl}/api/auth/wallet-check`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress,
            }),
          }
        );

        const data = await response.json();

        if (data.success && data.exists && data.token) {
          // Wallet exists - auto login
          console.log('✅ Wallet registered - auto logging in');
          localStorage.setItem('token', data.token);
          localStorage.setItem('walletAddress', walletAddress);
          localStorage.setItem('authMethod', 'wallet'); // WalletConnect authentication
          if (data.user.email) {
            localStorage.setItem('userEmail', data.user.email);
          }
          if (data.user.name) {
            localStorage.setItem('userName', data.user.name);
          }

          // Emit login event to notify all listeners (this will trigger AdminContext check)
          authEvents.emitLogin({
            walletAddress,
            authMethod: 'wallet',
            userEmail: data.user.email,
            userName: data.user.name,
          });

          // Small delay to ensure AdminContext has time to check admin status
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Redirect to events
          navigate('/events');
        } else if (data.success && !data.exists) {
          // Wallet doesn't exist - redirect to registration
          console.log('📝 Wallet not registered - redirecting to registration');
          
          // Small delay before navigation
          await new Promise(resolve => setTimeout(resolve, 100));
          
          navigate('/wallet-register', {
            state: { walletAddress },
          });
        }
      } catch (error) {
        console.error('Error checking wallet:', error);
      } finally {
        // Reset processing state after a delay to allow for navigation
        setTimeout(() => {
          processingRef.current = null;
        }, 1000);
      }
    };

    if (connectedWallet) {
      handleWalletConnection(connectedWallet);
    }
  }, [connectedWallet, navigate]);

  return {
    connectedWallet,
  };
};

