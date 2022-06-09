import { EthereumProvider, JsonRpcRequest } from "hardhat/types";
import { JsonRpcResponse } from "hardhat/internal/util/jsonrpc";
import "hardhat/types/config";
import "hardhat/types/runtime";

declare module "hardhat/types/config" {
  export interface HardhatConfig {
    ctfResponseHook?: (provider: EthereumProvider, rpcReq: JsonRpcRequest, rpcResp: JsonRpcResponse) => Promise<JsonRpcResponse>;
    ctfRemoteNode?: string;
  }

  export interface HardhatUserConfig {
    ctfResponseHook?: (provider: EthereumProvider, rpcReq: JsonRpcRequest, rpcResp: JsonRpcResponse) => Promise<JsonRpcResponse>;
    ctfRemoteNode?: string;
  }
}