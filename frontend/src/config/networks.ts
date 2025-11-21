import { NetworkConfigs } from "./type"

export const networkConfig: NetworkConfigs = {
  testnet: {
    network: "testnet",
    jsonRpcUrl: "https://testnet.hashio.io/api", // check out the readme for alternative RPC Relay urls
    mirrorNodeUrl: "https://testnet.mirrornode.hedera.com",
    backendUrl: "http://localhost:3333",
    chainId: "0x128",
  }
}