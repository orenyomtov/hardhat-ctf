import { task, types } from "hardhat/config";
import { HARDHAT_NETWORK_NAME } from "hardhat/plugins";
import fsExtra from "fs-extra";

import { CTFWebsocketServer, CTFWebsocketServerConfig } from "../ctf-server";
import { TASK_CTF_NODE } from "./task-names";
import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";

task(TASK_CTF_NODE, "Starts CTF websocket server")
  .addOptionalParam(
    "hostname",
    "The host to which to bind to for new connections (Defaults to 127.0.0.1 running locally, and 0.0.0.0 in Docker)",
    undefined,
    types.string
  )
  .addOptionalParam(
    "port",
    "The port on which to listen for new connections",
    8545,
    types.int
  )
  .setAction(
    async (
      {
        hostname: hostnameParam,
        port,
      }: {
        hostname?: string;
        port: number;
      },
      { hardhatArguments, network, config, run }
    ) => {
      await run(TASK_COMPILE, { quiet: true });
      // we throw if the user specified a network argument and it's not hardhat
      if (
        network.name !== HARDHAT_NETWORK_NAME &&
        hardhatArguments.network !== undefined
      ) {
        throw new Error("Unsupported network for CTF server. To start CTF server, retry the command without the --network parameter.",
        );
      }

      // the default hostname is "127.0.0.1" unless we are inside a docker
      // container, in that case we use "0.0.0.0"
      let hostname: string;
      if (hostnameParam !== undefined) {
        hostname = hostnameParam;
      } else {
        const insideDocker = fsExtra.existsSync("/.dockerenv");
        if (insideDocker) {
          hostname = "0.0.0.0";
        } else {
          hostname = "127.0.0.1";
        }
      }
      
      const serverConfig: CTFWebsocketServerConfig = {
        hostname,
        port,
        networkConfig: network.config,
        responseHook: config.ctfResponseHook,
      };

      const server: CTFWebsocketServer = new CTFWebsocketServer(serverConfig);

      console.log(`CTF websocket server started listening on ${hostname}:${port}`);

      await server.waitUntilClosed();
    }
  );