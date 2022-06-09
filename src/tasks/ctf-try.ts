import type { MochaOptions } from "mocha";

import chalk from "chalk";
import path from "path";

import { HARDHAT_NETWORK_NAME } from "hardhat/internal/constants";
import { subtask, task } from "hardhat/internal/core/config/config-env";
import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { glob } from "hardhat/internal/util/glob";
import { pluralize } from "hardhat/internal/util/strings";
import "@nomiclabs/hardhat-ethers";

import {
  TASK_CTF_TRY,
  TASK_CTF_TRY_RUN_MOCHA_TESTS,
} from "./task-names";
import { HardhatPluginError } from "hardhat/plugins";

subtask(TASK_CTF_TRY_RUN_MOCHA_TESTS)
  .addOptionalVariadicPositionalParam(
    "testFiles",
    "An optional list of files to test",
    []
  )
  .addFlag(
    "submit",
    "Submit the solution against the remote CTF node to get the actual flag",
  )
  .addOptionalParam(
    "grep",
    "Only run tests matching the given string or regexp"
  )
  .setAction(
    async (
      taskArgs: {
        submit: boolean;
        testFiles: string[];
      },
      { config, ethers }
    ) => {
      const { default: Mocha } = await import("mocha");

      const mochaConfig: MochaOptions = {
        ...config.mocha,
      };

      if (taskArgs.submit) {
        mochaConfig.grep = "Challenge Setup";
        mochaConfig.invert = true;

        if (config.ctfRemoteNode) {
          ethers.provider = new ethers.providers.WebSocketProvider(
            config.ctfRemoteNode
          );
        } else {
          throw new HardhatPluginError("hardhat-ctf", "Missing property in Hardhat config: ctfRemoteNode (e.g. ws://ctf.example.com:8545)");
        }
      }

      const mocha = new Mocha(mochaConfig);

      taskArgs.testFiles.forEach((file) => mocha.addFile(file));

      const testFailures = await new Promise<number>((resolve) => {
        mocha.run(resolve);
      });

      mocha.dispose();

      return testFailures;
    }
  );

task(TASK_CTF_TRY, "Try to solve the challenge")
  .addFlag(
    "submit",
    "Submit the solution against the remote CTF node to get the actual flag"
  )
  .addFlag("noCompile", "Don't compile before running this task")
  .setAction(
    async (
      {
        noCompile,
        submit,
      }: {
        noCompile: boolean;
        submit: boolean,
      },
      { run, network, config }
    ) => {
      if (!noCompile) {
        await run(TASK_COMPILE, { quiet: true });
      }

      const files = await glob(path.join(config.paths.root, "challenge/**/*.ts"));

      const testFailures = await run(TASK_CTF_TRY_RUN_MOCHA_TESTS, {
        testFiles: files,
        submit
      });

      if (network.name === HARDHAT_NETWORK_NAME) {
        const stackTracesFailures = await network.provider.send(
          "hardhat_getStackTraceFailuresCount"
        );

        if (stackTracesFailures !== 0) {
          console.warn(
            chalk.yellow(
              `Failed to generate ${stackTracesFailures} ${pluralize(
                stackTracesFailures,
                "stack trace"
              )}. Run Hardhat with --verbose to learn more.`
            )
          );
        }
      }

      process.exitCode = testFailures;
      return testFailures;
    }
  );