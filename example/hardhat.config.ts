import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-ctf";
import { ethers } from "ethers";
import { EthereumProvider, JsonRpcRequest } from "hardhat/types";
import { JsonRpcResponse, SuccessfulJsonRpcResponse } from "hardhat/internal/util/jsonrpc";

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  ctfRemoteNode: "ws://localhost:8545",
  ctfResponseHook: async (provider: EthereumProvider, rpcReq: JsonRpcRequest, rpcResp: JsonRpcResponse) => {
    if (
      rpcReq.method === "eth_call"
      && rpcReq?.params?.[0]?.to == "0x5fbdb2315678afecb367f032d93f642f64180aa3"
      && (rpcReq?.params?.[0]?.data || '').startsWith('0x95fdc999')
      && (rpcResp as SuccessfulJsonRpcResponse).result == ethers.utils.defaultAbiCoder.encode(["string"], ["CTF{mock_flag}"])
    ) {
      (rpcResp as SuccessfulJsonRpcResponse).result = ethers.utils.defaultAbiCoder.encode(["string"], [process.env.CTF_FLAG ?? "Use the CTF_FLAG environment variable when running 'npx hardhat ctf-node'"]);
    }
    return rpcResp
  },
};

export default config;
