require("@nomicfoundation/hardhat-toolbox");
const assert = require("assert");
const fs = require('fs');
const path = require('path');
const figlet = require('figlet');
const chalk = require('chalk');


task("prepare-secret", "Prepare a secret for reveal")
    .addParam("source", "The source of the secret")
    .addOptionalParam('key', 'The key to cipher the secret')
    .addOptionalParam('iv', 'The iv to cipher the secret')
    .setAction(async (taskArgs, hre) => {
        console.log(chalk.red(figlet.textSync("Revealable", {
            font: "Poison", horizontalLayout: 'full',
            verticalLayout: 'full'
        })));
        // Get the secret from the JSON file
        const file = JSON.parse(fs.readFileSync(path.join(__dirname, taskArgs.source)));
        // generate key and iv
        let key;
        let iv;
        if (taskArgs.key && taskArgs.iv) {
            // check if key and iv are string
            if(typeof taskArgs.key != "string" || typeof taskArgs.iv != "string"){
                key = ethers.utils.formatBytes32String(taskArgs.key);
                iv = ethers.utils.formatBytes32String(taskArgs.iv);
            }else{
                key = taskArgs.key;
                iv = taskArgs.iv;
            }
        } else {
            // if file contains key and iv, use them
            if (file.key && file.iv) {
                if(typeof file.key != "string" || typeof file.iv != "string"){
                    key = ethers.utils.formatBytes32String(file.key);
                    iv = ethers.utils.formatBytes32String(file.iv);
                }else{
                    key = file.key;
                    iv = file.iv;
                }
            } else {
                key = hre.ethers.BigNumber.from(hre.ethers.utils.randomBytes(32)).toHexString();
                iv = hre.ethers.BigNumber.from(hre.ethers.utils.randomBytes(32)).toHexString();
            }
        }
        console.log(`${chalk.yellow("Key:")} ${key}\n${chalk.yellow("IV:")} ${iv}`);
        const secret = file.secret;
        console.log(`${chalk.yellow("Secret to cipher:")}\n${secret}`);
        // create owner 
        const owner = await hre.ethers.getSigner(0);
        // get the contract
        const contract = await hre.ethers.getContractFactory("Revealable", owner);
        // deploy the contract
        const instance = await contract.deploy();

        // prepare the secret
        const cipherData = [];
        const decipherData = [];
        for (let i = 0; i < secret.length; i++) {
            const cipher = await instance.cipherCTR(secret[i], key, iv);
            cipherData.push(cipher);
            decipherData.push(await instance.cipherCTR(cipher, key, iv));
            assert(decipherData[i] == secret[i], `Deciphered data ${decipherData[i]} does not match the original data ${secret[i]}`);
        }
        console.log(`${chalk.yellow("Ciphered data:")}\n${cipherData}`);
        // create filename based on original filename
        const filename = `secret_${taskArgs.source.split(".")[0]}.json`;
        // write the data to a file
        fs.writeFileSync(path.join(__dirname, filename), JSON.stringify({
            key: key,
            iv: iv,
            cipherData: cipherData
        }));
        // display the file path 
        console.log(`\n${chalk.green('The secret data has been written to')} ${path.join(__dirname, filename)}`);
    });