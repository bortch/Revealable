import fs from "fs";

import "@nomicfoundation/hardhat-toolbox";

import type { HardhatUserConfig } from "hardhat/config";

import "dotenv/config";

// Configure remappings.
// https://book.getfoundry.sh/config/hardhat
// Re-run `forge remappings > remappings.txt`
// every time you modify libraries in Foundry.
function getRemappings() {
  return fs
    .readFileSync("remappings.txt", "utf8")
    .split("\n")
    .filter(Boolean) // remove empty lines
    .map((line: string) => line.trim().split("="));
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          viaIR: false,
          optimizer: {
            enabled: true,
            // runs: 1_000_000,
            runs: 200,
          },
        },
      },
    ],
  },
  defaultNetwork: process.env.DEFAULT_NETWORK,
  networks: {
    hardhat: {
      blockGasLimit: 30_000_000,
      throwOnCallFailures: false,
    },
    verificationNetwork: {
      url: process.env.NETWORK_RPC ?? "",
    }
  }
};


export default {
  config,
  // preprocess: {
  //   eachLine: (hre) => ({
  //     transform: (line: string) => {
  //       if (line.match(/ from "/i)) {
  //         getRemappings().forEach(([find, replace]: string[]) => {
  //           if (line.match(find)) {
  //             line = line.replace(find, replace);
  //           }
  //         });
  //       }
  //       return line;
  //     },
  //   }),
  // },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    token: 'ETH',
    gasPriceApi: process.env.ETHERSCAN_API_KEY,
    //noColors: true,
    //outputFile: 'gas-report.txt',
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          viaIR: false,
          optimizer: {
            enabled: true,
            // runs: 1_000_000,
            runs: 200,
          },
        },
      },
    ],
  },
  paths: { 
    sources: "./contracts", 
    cache: "./hh-cache",
   artifacts:"./artifacts" },
};
