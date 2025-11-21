import { WalletConnectContext } from "../../../contexts/WalletConnectContext";
import { useCallback, useContext, useEffect } from 'react';
import { WalletInterface } from "../walletInterface";
import { 
  AccountId, 
  ContractExecuteTransaction, 
  ContractId, 
  LedgerId, 
  TokenAssociateTransaction, 
  TokenId, 
  Transaction, 
  TransactionId, 
  TransferTransaction, 
  Client,
  PublicKey
} from "@hashgraph/sdk";
import { ContractFunctionParameterBuilder } from "../contractFunctionParameterBuilder";
import { appConfig } from "../../../config";
import { SignClientTypes } from "@walletconnect/types";
import { 
  DAppConnector, 
  HederaJsonRpcMethod, 
  HederaSessionEvent, 
  HederaChainId, 
  SignAndExecuteTransactionParams, 
  transactionToBase64String,
  SignMessageParams,
  verifyMessageSignature
} from "@hashgraph/hedera-wallet-connect";
import EventEmitter from "events";

// Created refreshEvent because `dappConnector.walletConnectClient.on(eventName, syncWithWalletConnectContext)` would not call syncWithWalletConnectContext
// Reference usage from walletconnect implementation https://github.com/hashgraph/hedera-wallet-connect/blob/main/src/lib/dapp/index.ts#L120C1-L124C9
const refreshEvent = new EventEmitter();

// Create a new project in walletconnect cloud to generate a project id
const walletConnectProjectId = "377d75bb6f86a2ffd427d032ff6ea7d3";
const currentNetworkConfig = appConfig.networks.testnet;
const hederaNetwork = currentNetworkConfig.network;
const hederaClient = Client.forName(hederaNetwork);

// Adapted from walletconnect dapp example:
// https://github.com/hashgraph/hedera-wallet-connect/blob/main/src/examples/typescript/dapp/main.ts#L87C1-L101C4
const metadata: SignClientTypes.Metadata = {
  name: "Offchain Hubs",
  description: "Offchain Hubs - Hub Access Management",
  url: window.location.origin,
  icons: [window.location.origin + "/favicon.png"],
}
const dappConnector = new DAppConnector(
  metadata,
  LedgerId.fromString(hederaNetwork),
  walletConnectProjectId,
  Object.values(HederaJsonRpcMethod),
  [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
  [HederaChainId.Testnet],
);

// ensure walletconnect is initialized only once
let walletConnectInitPromise: Promise<void> | undefined = undefined;
const initializeWalletConnect = async () => {
  if (walletConnectInitPromise === undefined) {
    walletConnectInitPromise = dappConnector.init();
  }
  await walletConnectInitPromise;
};

export const openWalletConnectModal = async () => {
  await initializeWalletConnect();
  await dappConnector.openModal().then((x) => {
    refreshEvent.emit("sync");
  });
};

class WalletConnectWallet implements WalletInterface {
  private getSigner() {
    if (dappConnector.signers.length === 0) {
      throw new Error('No signers found!');
    }
    return dappConnector.signers[0];
  }

  private getAccountId() {
    // Need to convert from walletconnect's AccountId to hashgraph/sdk's AccountId because walletconnect's AccountId and hashgraph/sdk's AccountId are not the same!
    return AccountId.fromString(this.getSigner().getAccountId().toString());
  }

  async transferHBAR(toAddress: AccountId, amount: number) {
    const transferHBARTransaction = new TransferTransaction()
      .addHbarTransfer(this.getAccountId(), -amount)
      .addHbarTransfer(toAddress, amount);

    const signer = this.getSigner();
    await transferHBARTransaction.freezeWithSigner(signer);
    const txResult = await transferHBARTransaction.executeWithSigner(signer);
    return txResult ? txResult.transactionId : null;
  }

  async transferFungibleToken(toAddress: AccountId, tokenId: TokenId, amount: number) {
    const transferTokenTransaction = new TransferTransaction()
      .addTokenTransfer(tokenId, this.getAccountId(), -amount)
      .addTokenTransfer(tokenId, toAddress.toString(), amount);

    const signer = this.getSigner();
    await transferTokenTransaction.freezeWithSigner(signer);
    const txResult = await transferTokenTransaction.executeWithSigner(signer);
    return txResult ? txResult.transactionId : null;
  }

  async transferNonFungibleToken(toAddress: AccountId, tokenId: TokenId, serialNumber: number) {
    const transferTokenTransaction = new TransferTransaction()
      .addNftTransfer(tokenId, serialNumber, this.getAccountId(), toAddress);

    const signer = this.getSigner();
    await transferTokenTransaction.freezeWithSigner(signer);
    const txResult = await transferTokenTransaction.executeWithSigner(signer);
    return txResult ? txResult.transactionId : null;
  }

  async associateToken(tokenId: TokenId) {
    const associateTokenTransaction = new TokenAssociateTransaction()
      .setAccountId(this.getAccountId())
      .setTokenIds([tokenId]);

    const signer = this.getSigner();
    await associateTokenTransaction.freezeWithSigner(signer);
    const txResult = await associateTokenTransaction.executeWithSigner(signer);
    return txResult ? txResult.transactionId : null;
  }

  // Purpose: build contract execute transaction and send to wallet for signing and execution
  // Returns: Promise<TransactionId | null>
  async executeContractFunction(contractId: ContractId, functionName: string, functionParameters: ContractFunctionParameterBuilder, gasLimit: number) {
    const tx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(gasLimit)
      .setFunction(functionName, functionParameters.buildHAPIParams());

    const signer = this.getSigner();
    await tx.freezeWithSigner(signer);
    const txResult = await tx.executeWithSigner(signer);

    // in order to read the contract call results, you will need to query the contract call's results form a mirror node using the transaction id
    // after getting the contract call results, use ethers and abi.decode to decode the call_result
    return txResult ? txResult.transactionId : null;
  }

  // Purpose: Sign a text message using WalletConnect with Hedera signMessage
  // Returns: Promise<string | null> - The signature map as proof
  async signMessage(message: string): Promise<string | null> {
    try {
      console.log('WalletConnect: Attempting to sign message:', message);
      
      if (dappConnector.signers.length === 0) {
        throw new Error('Nenhuma carteira conectada via WalletConnect');
      }

      const signer = this.getSigner();
      const signerAccountId = signer.getAccountId().toString();
      console.log('WalletConnect: Using signer:', signerAccountId);

      // Prepare parameters for Hedera message signing
      const params: SignMessageParams = {
        signerAccountId: signerAccountId,
        message: message
      };

      console.log('WalletConnect: Signing message with params:', params);

      // Use the proper WalletConnect signMessage method
      const result = await dappConnector.signMessage(params);
      console.log('WalletConnect: Sign message result:', result);

      if (result) {
        // The result contains the signature - convert to string for backend processing
        const signatureString = JSON.stringify(result);
        console.log('WalletConnect: Message signed successfully, signature:', signatureString);
        
        // Return the signature as string for backend processing
        return signatureString;
      } else {
        throw new Error('Falha ao obter assinatura da carteira');
      }
      
    } catch (error: any) {
      console.error('WalletConnect signMessage error:', error);
      
      // Handle specific WalletConnect errors
      if (error.code === 9000 && error.message === 'USER_REJECT') {
        throw new Error('Assinatura rejeitada pelo usuário');
      } else if (error.message?.includes('not connected')) {
        throw new Error('WalletConnect não está conectado');
      } else if (error.message?.includes('network')) {
        throw new Error('Erro de rede. Verifique sua conexão.');
      } else {
        // Re-throw with a user-friendly message
        const userMessage = error.message || 'Erro ao assinar mensagem com WalletConnect';
        throw new Error(userMessage);
      }
    }
  }

  disconnect() {
    dappConnector.disconnectAll().then(() => {
      refreshEvent.emit("sync");
    });
  }
};
export const walletConnectWallet = new WalletConnectWallet();

// this component will sync the walletconnect state with the context
export const WalletConnectClient = () => {
  // use the WalletConnectContext to keep track of the account and connection
  const { setAccountId, setIsConnected } = useContext(WalletConnectContext);

  // sync the walletconnect state with the context
  const syncWithWalletConnectContext = useCallback(() => {
    const accountId = dappConnector.signers[0]?.getAccountId()?.toString();
    if (accountId) {
      setAccountId(accountId);
      setIsConnected(true);
    } else {
      setAccountId('');
      setIsConnected(false);
    }
  }, [setAccountId, setIsConnected]);

  useEffect(() => {
    // Sync after walletconnect finishes initializing
    refreshEvent.addListener("sync", syncWithWalletConnectContext);

    initializeWalletConnect().then(() => {
      syncWithWalletConnectContext();
    });

    return () => {
      refreshEvent.removeListener("sync", syncWithWalletConnectContext);
    }
  }, [syncWithWalletConnectContext]);
  
  return null;
};
