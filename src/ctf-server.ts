import path from "path";
import WebSocket from "ws";
import {
    EthereumProvider,
    JsonRpcRequest,
    JsonRpcServer as IJsonRpcServer,
    NetworkConfig,
} from "hardhat/types";
import { glob } from "hardhat/internal/util/glob";
import { createProvider } from "hardhat/internal/core/providers/construction";
import { InternalError, InvalidJsonInputError, InvalidRequestError, ProviderError } from "hardhat/internal/core/providers/errors";
import { FailedJsonRpcResponse, isValidJsonRequest, isValidJsonResponse, JsonRpcResponse, SuccessfulJsonRpcResponse } from "hardhat/internal/util/jsonrpc";
import { MochaOptions } from "mocha";


export interface CTFWebsocketServerConfig {
    hostname: string;
    port: number;
    networkConfig: NetworkConfig;
    initializationHook?: (provider: EthereumProvider) => Promise<void>;
    responseHook?: (provider: EthereumProvider, rpcReq: JsonRpcRequest, rpcResp: JsonRpcResponse) => Promise<JsonRpcResponse>;
}

export class CTFWebsocketServer implements IJsonRpcServer {
    private _config: CTFWebsocketServerConfig;
    private _wsServer: WebSocket.Server;

    constructor(_config: CTFWebsocketServerConfig) {
        this._config = _config;

        this._wsServer = new WebSocket.Server({ port: this._config.port });

        this._wsServer.on("connection", this.handleWs);
    }

    public handleWs = async (ws: WebSocket) => {
        console.log('Connection opened')
        let isServerReady = false;
        const provider = createProvider(
            "hardhat",
            this._config.networkConfig
        );

        ws.on("message", async (msg) => {
            if (!isServerReady) {
                await until(() => isServerReady == true);
            }

            let rpcReq: JsonRpcRequest | undefined;
            let rpcResp: JsonRpcResponse | undefined;

            try {
                rpcReq = _readWsRequest(msg.toString());

                if (!isValidJsonRequest(rpcReq)) {
                    throw new InvalidRequestError("Invalid request");
                }

                rpcResp = await _handleRequest(rpcReq, provider);

                if (this._config.responseHook) {
                    rpcResp = await this._config.responseHook(provider, rpcReq, rpcResp);
                }
            } catch (error) {
                rpcResp = _handleError(error);
            }

            // Validate the RPC response.
            if (!isValidJsonResponse(rpcResp)) {
                // Malformed response coming from the provider, report to user as an internal error.
                rpcResp = _handleError(new InternalError("Internal error"));
            }

            if (rpcReq !== undefined) {
                rpcResp.id = rpcReq.id;
            }

            ws.send(JSON.stringify(rpcResp));
        });


        await setupChallege(provider);

        isServerReady = true;
    };

    public listen = async (): Promise<{ address: string; port: number }> => {
        return { address: this._config.hostname, port: this._config.port };
    };

    public waitUntilClosed = async () => {
        const wsServerClosed = new Promise((resolve) => {
            this._wsServer.once("close", resolve);
        });

        await wsServerClosed;
    };

    public close = async () => {
        await new Promise<void>((resolve, reject) => {
            this._wsServer.close((err) => {
                if (err !== null && err !== undefined) {
                    reject(err);
                    return;
                }

                resolve();
            });
        })
    };
}

const _handleError = (error: any): JsonRpcResponse => {
    // extract the relevant fields from the error before wrapping it
    let txHash: string | undefined;
    let returnData: string | undefined;

    if (error.transactionHash !== undefined) {
        txHash = error.transactionHash;
    }
    if (error.data !== undefined) {
        returnData = error.data;
    }

    // In case of non-hardhat error, treat it as internal and associate the appropriate error code.
    if (!ProviderError.isProviderError(error)) {
        error = new InternalError(error);
    }

    const response: FailedJsonRpcResponse = {
        jsonrpc: "2.0",
        id: null,
        error: {
            code: error.code,
            message: error.message,
        },
    };

    response.error.data = {
        message: error.message,
    };

    if (txHash !== undefined) {
        response.error.data.txHash = txHash;
    }

    if (returnData !== undefined) {
        response.error.data.data = returnData;
    }

    return response;
};

const _readWsRequest = (msg: string): JsonRpcRequest => {
    let json: any;
    try {
        json = JSON.parse(msg);
    } catch (error) {
        if (error instanceof Error) {
            throw new InvalidJsonInputError(`Parse error: ${error.message}`);
        }

        // eslint-disable-next-line @nomiclabs/hardhat-internal-rules/only-hardhat-error
        throw error;
    }

    return json;
};

const _handleRequest = async (
    req: JsonRpcRequest, provider: EthereumProvider
): Promise<JsonRpcResponse> => {
    const result = await provider.request({
        method: req.method,
        params: req.params,
    });

    return {
        jsonrpc: "2.0",
        id: req.id,
        result,
    };
};

const isSuccessfulJsonResponse = (
    payload: JsonRpcResponse
) => {
    return "result" in payload;
}
const until = (conditionFunction: () => Boolean) => {
    const poll: (resolve: (value?: unknown) => void) => void = resolve => {
        if (conditionFunction()) resolve();
        else setTimeout(_ => poll(resolve), 400);
    }

    return new Promise(poll);
}
const setupChallege = async (provider: EthereumProvider) => {
    const { config, ethers } = await import("hardhat");
    const { default: Mocha } = await import("mocha");

    const mochaConfig: MochaOptions = {
        ...config.mocha,
    };

    mochaConfig.grep = "Challenge Setup";
    ethers.provider = new ethers.providers.Web3Provider(provider.send);

    const mocha = new Mocha(mochaConfig);

    const files = await glob(path.join(config.paths.root, "challenge/**/*.ts"));
    files.forEach((file: string) => mocha.addFile(file));

    await new Promise<number>((resolve) => {
        mocha.run(resolve);
    });

    mocha.dispose();
}