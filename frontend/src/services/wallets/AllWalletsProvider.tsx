import React, { ReactNode } from "react"
import { MetamaskContextProvider } from "../../contexts/MetamaskContext"
import { WalletConnectContextProvider } from "../../contexts/WalletConnectContext"
import { MetaMaskClient } from "./metamask/metamaskClient"
import { WalletConnectClient } from "./walletconnect/walletConnectClient"

/**
 * Wallet provider - Supports MetaMask and WalletConnect
 * Primary auth: Email/password with auto-wallet generation
 * Secondary option: Connect existing wallet via WalletConnect
 */
export const AllWalletsProvider = (props: {
  children: ReactNode | undefined
}) => {
  return (
    <MetamaskContextProvider>
      <WalletConnectContextProvider>
        <MetaMaskClient />
        <WalletConnectClient />
        {props.children}
      </WalletConnectContextProvider>
    </MetamaskContextProvider>
  )
}
