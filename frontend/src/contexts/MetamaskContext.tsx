import React, { createContext, ReactNode, useState } from "react";
import { WalletInterface } from "../services/wallets/walletInterface";

const defaultValue = {
  metamaskAccountAddress: '',
  setMetamaskAccountAddress: (newValue: string) => { },
  walletInterface: null as WalletInterface | null,
  setWalletInterface: (newValue: WalletInterface | null) => { },
}

export const MetamaskContext = createContext(defaultValue)

export const MetamaskContextProvider = (props: { children: ReactNode | undefined }) => {
  const [metamaskAccountAddress, setMetamaskAccountAddress] = useState('')
  const [walletInterface, setWalletInterface] = useState<WalletInterface | null>(defaultValue.walletInterface)

  return (
    <MetamaskContext.Provider
      value={{
        metamaskAccountAddress,
        setMetamaskAccountAddress,
        walletInterface,
        setWalletInterface
      }}
    >
      {props.children}
    </MetamaskContext.Provider>
  )
}
