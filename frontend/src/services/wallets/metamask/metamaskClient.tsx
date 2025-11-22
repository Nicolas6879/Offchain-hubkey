import { ContractId, AccountId, TokenId } from "@hashgraph/sdk";
import { Contract } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { Web3Provider } from "@ethersproject/providers";
import { useContext, useEffect } from "react";
import { appConfig } from "../../../config";
import { MetamaskContext } from "../../../contexts/MetamaskContext";
import { ContractFunctionParameterBuilder } from "../contractFunctionParameterBuilder";
import { WalletInterface } from "../walletInterface";

// Add window interface declaration for ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}

const currentNetworkConfig = appConfig.networks.testnet;

export const switchToHederaNetwork = async (ethereum: any) => {
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: currentNetworkConfig.chainId }]
    });
  } catch (error: any) {
    if (error.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainName: `Hedera (${currentNetworkConfig.network})`,
              chainId: currentNetworkConfig.chainId,
              nativeCurrency: {
                name: 'HBAR',
                symbol: 'HBAR',
                decimals: 18
              },
              rpcUrls: [currentNetworkConfig.jsonRpcUrl]
            },
          ],
        });
      } catch (addError) {
        console.error(addError);
      }
    }
    console.error(error);
  }
}

const getProvider = () => {
  if (!window.ethereum) {
    throw new Error("Metamask is not installed! Go install the extension!");
  }
  return new Web3Provider(window.ethereum);
}

export const connectToMetamask = async () => {
  const provider = getProvider();
  let accounts: string[] = []

  try {
    await switchToHederaNetwork(window.ethereum);
    accounts = await provider.send("eth_requestAccounts", []);
  } catch (error: any) {
    if (error.code === 4001) {
      console.warn("Please connect to Metamask.");
    } else {
      console.error(error);
    }
  }

  return accounts;
}

class MetaMaskWallet implements WalletInterface {
  private convertAccountIdToSolidityAddress(accountId: AccountId): string {
    const accountIdString = accountId.evmAddress !== null
      ? accountId.evmAddress.toString()
      : accountId.toSolidityAddress();

    return `0x${accountIdString}`;
  }

  async transferHBAR(toAddress: AccountId, amount: number) {
    const provider = getProvider();
    const signer = await provider.getSigner();

    const tx = await signer.populateTransaction({
      to: this.convertAccountIdToSolidityAddress(toAddress),
      value: parseUnits(amount.toString(), 18),
    });

    try {
      const { hash } = await signer.sendTransaction(tx);
      await provider.waitForTransaction(hash);
      return hash;
    } catch (error: any) {
      console.warn(error.message ? error.message : error);
      return null;
    }
  }

  async transferFungibleToken(toAddress: AccountId, tokenId: TokenId, amount: number) {
    const hash = await this.executeContractFunction(
      ContractId.fromString(tokenId.toString()),
      'transfer',
      new ContractFunctionParameterBuilder()
        .addParam({
          type: "address",
          name: "recipient",
          value: this.convertAccountIdToSolidityAddress(toAddress)
        })
        .addParam({
          type: "uint256",
          name: "amount",
          value: amount
        }),
      appConfig.constants.METAMASK_GAS_LIMIT_TRANSFER_FT
    );

    return hash;
  }

  async transferNonFungibleToken(toAddress: AccountId, tokenId: TokenId, serialNumber: number) {
    const provider = getProvider();
    const addresses = await provider.listAccounts();
    const hash = await this.executeContractFunction(
      ContractId.fromString(tokenId.toString()),
      'transferFrom',
      new ContractFunctionParameterBuilder()
        .addParam({ type: "address", name: "from", value: addresses[0] })
        .addParam({ type: "address", name: "to", value: this.convertAccountIdToSolidityAddress(toAddress) })
        .addParam({ type: "uint256", name: "nftId", value: serialNumber }),
      appConfig.constants.METAMASK_GAS_LIMIT_TRANSFER_NFT
    );

    return hash;
  }

  async associateToken(tokenId: TokenId) {
    return await this.executeContractFunction(
      ContractId.fromString(tokenId.toString()),
      'associate',
      new ContractFunctionParameterBuilder(),
      appConfig.constants.METAMASK_GAS_LIMIT_ASSOCIATE
    );
  }

  async signMessage(message: string): Promise<string | null> {
    try {
      if (!window.ethereum) throw new Error('MetaMask não está instalado ou não está disponível');
      const provider = getProvider();
      const signer = await provider.getSigner();
      const accounts = await provider.listAccounts();
      if (accounts.length === 0) throw new Error('Nenhuma conta conectada no MetaMask');

      const signature = await signer.signMessage(message);
      if (!signature) throw new Error('Assinatura retornada é vazia');
      return signature;
    } catch (error: any) {
      if (error.code === 4001) throw new Error('Assinatura rejeitada pelo usuário');
      else if (error.code === -32002) throw new Error('Solicitação pendente no MetaMask. Verifique sua carteira.');
      else if (error.code === -32603) throw new Error('Erro interno do MetaMask');
      else throw new Error(error.message || 'Erro desconhecido ao assinar mensagem');
    }
  }

  async executeContractFunction(contractId: ContractId, functionName: string, functionParameters: ContractFunctionParameterBuilder, gasLimit: number) {
    const provider = getProvider();
    const signer = await provider.getSigner();
    const abi = [`function ${functionName}(${functionParameters.buildAbiFunctionParams()})`];

    const contract = new Contract(`0x${contractId.toSolidityAddress()}`, abi, signer);
    try {
      const txResult = await contract[functionName](
        ...functionParameters.buildEthersParams(),
        { gasLimit: gasLimit === -1 ? undefined : gasLimit }
      );
      return txResult.hash;
    } catch (error: any) {
      console.warn(error.message ? error.message : error);
      return null;
    }
  }

  disconnect() {
    alert("Please disconnect using the Metamask extension.");
  }
}

export const metamaskWallet = new MetaMaskWallet();

export const MetaMaskClient = () => {
  const { setMetamaskAccountAddress, setWalletInterface } = useContext(MetamaskContext);

  useEffect(() => {
    try {
      const provider = getProvider();
      provider.listAccounts().then((signers: string[]) => {
        const address = signers[0] || "";
        setMetamaskAccountAddress(address);
        setWalletInterface(address ? metamaskWallet : null);
      });

      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        const address = accounts[0] || "";
        setMetamaskAccountAddress(address);
        setWalletInterface(address ? metamaskWallet : null);
      });

      return () => window.ethereum.removeAllListeners("accountsChanged");
    } catch (error: any) {
      console.error(error.message || error);
    }
  }, [setMetamaskAccountAddress, setWalletInterface]);

  return null;
}