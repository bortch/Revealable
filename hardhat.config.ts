import fs from "fs";

import "@nomicfoundation/hardhat-toolbox";
import type { HardhatUserConfig } from "hardhat/config";

import "dotenv/config";

require("./scripts/cipher_data.js");

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
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
        version: "0.8.18",
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
