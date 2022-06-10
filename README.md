# hardhat-ctf

[Hardhat](https://hardhat.org) plugin for building solidity capture the flag (CTF) challenges.

## What

This is a framework to implement a solidity CTF challenge.

Check the [example](/example) folder for a sample challenge built using this plugin.

This plugin can be helpful when you:
1. Don't want the flag to be available in the contract source code / bytecode.
2. Want people to solve it in a competitive CTF environment where they get points for flags.
3. Don't want people to be able to cheat by querying the RPC node for other people's transactions.
4. Want to deploy the RPC server in a scalable stateless way in order to mitigate porential DDOS attacks.
5. Want to provide a clean execution environment each time trying to solve the challenge (can be important when dealing with nonces or deploying contracts to specific addresses).

It achieves it by creating a temporary Hardhat Network for each websocket connection, initializing the challenge contracts, and allows the challenge author to hook into the RPC responses in order to inject the flag without it being on-chain.

## Installation


```bash
npm install hardhat-ctf
```

Import the plugin in your `hardhat.config.js`:

```js
require("hardhat-ctf");
```

Or if you are using TypeScript, in your `hardhat.config.ts`:

```ts
import "hardhat-ctf";
```

## Tasks

This plugin provides the `ctf-node` task, which allows you run a websocket hardhat network that creates a temporary hardhat network for each websocket connection, and can hook into the RPC responses to inject the flag.

This plugin provides the `ctf-try` task, which allows you to try and solve the challenge.
Once you solved it locally, you can run the `ctf-try` task with the `--submit` flag to send the solution to the remote CTF node in order to obtain the real flag.

## Configuration

This plugin extends the `HardhatUserConfig` object with
`ctfResponseHook` and `ctfRemoteNode` fields.

This is an example of how to set it:

```ts
import { ethers } from "ethers";
import { EthereumProvider, JsonRpcRequest } from "hardhat/types";
import { JsonRpcResponse, SuccessfulJsonRpcResponse } from "hardhat/internal/util/jsonrpc";

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  ctfRemoteNode: "ws://ctf.example.com:8545",
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
```

## Usage

Check out the [example](/example) folder for an example project using this plugin to create a CTF challenge.

On the server running the CTF node which validates solutions and gives the flag to succesful contestants, run:
```
npx hardhat ctf-node
```

Then, edit the `hardhat.config.ts` file to point the config's `ctfRemoteNode` field to your server running `ctf-node`, and give the folder to anyone who wants to try solving the challenge.