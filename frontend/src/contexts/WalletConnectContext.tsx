import React, { createContext, useState, ReactNode } from 'react';
import { WalletInterface } from '../services/wallets/walletInterface';

const defaultValue = {
  accountId: '',
  setAccountId: (newValue: string) => { },
  isConnected: false,
  setIsConnected: (newValue: boolean) => { },
  walletInterface: null as WalletInterface | null,
  setWalletInterface: (newValue: WalletInterface | null) => { },
}

export const WalletConnectContext = createContext(defaultValue);

export const WalletConnectContextProvider = (props: { children: ReactNode | undefined }) => {
  const [accountId, setAccountId] = useState(defaultValue.accountId);
  const [isConnected, setIsConnected] = useState(defaultValue.isConnected);
  const [walletInterface, setWalletInterface] = useState<WalletInterface | null>(defaultValue.walletInterface);

  return (
    <WalletConnectContext.Provider
      value={{
        accountId,
        setAccountId,
        isConnected,
        setIsConnected,
        walletInterface,
        setWalletInterface
      }}
    >
      {props.children}
    </WalletConnectContext.Provider>
  )
}
