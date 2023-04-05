require("@nomicfoundation/hardhat-toolbox");
const assert = require("assert");
const fs = require('fs');
const path = require('path');
const figlet = require('figlet');
const chalk = require('chalk');

//convert input if hex or string
function convertStringToBytes(input) {
    if (hre.ethers.utils.isHexString(input)) {
        //assert(input.length <= 64, chalk.red(`hex ${input} is too long, it must be 32 bytes or shorter`));
        return input;
    } else {
        assert(input.length <= 31, chalk.red(`string ${input} is too long, it must be 31 bytes or shorter`));
        const bytes = ethers.utils.formatBytes32String(input);
        return bytes;
    }
}

task("cipher", "Prepare a secret for reveal")
    .addParam("source", "The source of the secret")
    .addOptionalParam("valuesize", "The size of each value to be revealed", 2, types.int)
    .addOptionalParam('key', 'The key to cipher the secret')
    .addOptionalParam('iv', 'The iv to cipher the secret')
    .setAction(async (taskArgs, hre) => {
        console.log(chalk.red(figlet.textSync("Revealable", {
            font: "Poison", horizontalLayout: 'full',
            verticalLayout: 'full'
        })));

        // get file with path relative to the command line
        // and merge the path with the source's path
        const currentPath = process.cwd();
        const filePath = path.join(currentPath, taskArgs.source);
        assert(fs.existsSync(filePath), chalk.red(`File ${filePath} does not exist, verify the path`));
        // Get the secret from the JSON file
        const file = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        // generate key and iv
        let key;
        let iv;
        if (taskArgs.key && taskArgs.iv) {
            // check if key and iv not too long
            key = convertStringToBytes(taskArgs.key);
            iv = convertStringToBytes(taskArgs.iv);
        } else {
            // if file contains key and iv, use them
            if (file.key && file.iv) {
                // check if key and iv are not too long
                key = convertStringToBytes(file.key);
                iv = convertStringToBytes(file.iv);
            } else {
                console.log(chalk.yellow("No key and iv provided, generating random ones"));
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
        // set the data to be ciphered
        await instance.setHiddenValues(secret, taskArgs.valuesize);
        // prepare the secret
        await instance["reveal(bytes32,bytes32)"](key, iv);
        const cipherData = [];
        for (let i = 0; i < secret.length; i++) {
            const cipher = await instance.getHiddenValue(i, taskArgs.valuesize);
            // big number to number
            cipherData.push(cipher.toNumber());
            //cipherData.push(cipher.toHexString());
        }
        
        // set the data to be deciphered
        const decipherData = [];
        await instance.setHiddenValues(cipherData, taskArgs.valuesize);
        // reveal the secret
        await instance["reveal(bytes32,bytes32)"](key, iv);
        // decipher the data to check if it matches the original data
        for (let i = 0; i < cipherData.length; i++) {
            decipherData.push(await instance.getHiddenValue(i, taskArgs.valuesize));
            assert(decipherData[i] == secret[i], `Deciphered data ${decipherData[i]} does not match the original data ${secret[i]}`);
        }
        console.log(`${chalk.yellow("Ciphered secret:")}\n${cipherData}`);
        // create filename based on original filename
        
        let filenameSrc = filePath.split(".")[0];
        console.log(filenameSrc);
        // sanitize filename
        // remove absolute path
        filenameSrc = filenameSrc.replace(/^.*[\\\/]/, '');
        console.log(filenameSrc);
        // replace all non-alphanumeric characters with underscore
        filenameSrc = filenameSrc.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        console.log(filenameSrc);
        // Output response in an "output" directory
        // create output directory if it does not exist
        const outputDir = path.join(currentPath, `cipher_output_${filenameSrc}`);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }
        // create a file text for ciphered data
        fs.writeFileSync(path.join(outputDir, `${filenameSrc}_ciphered.txt`), JSON.stringify(cipherData));
        // create a file .key for key
        fs.writeFileSync(path.join(outputDir, `${filenameSrc}.key`), key);
        // create a file .iv for iv
        fs.writeFileSync(path.join(outputDir, `${filenameSrc}.iv`), iv);
        
        // write the data to a file
        const filenameReport = `${filenameSrc}_report.json`;
        fs.writeFileSync(path.join(outputDir, filenameReport), JSON.stringify({
            original_key: file.key,
            original_Iv: file.iv,
            key_to_use: key,
            iv_to_use: iv,
            ciphered_secret_to_use: cipherData,
            secret_to_cipher: file.secret,
            hidden_value_bytes_size: taskArgs.valuesize,
        }));
        // display the file path 
        console.log(`\n${chalk.yellow('The secret data has been written into')} ${path.join(__dirname, "output:")}\n
        ${filenameSrc}_ciphered.txt will contains your ciphered data
        ${filenameSrc}.key will contains the key to use to reveal the ciphered data
        ${filenameSrc}.iv will contains the initial vector to use to reveal the ciphered data
        ${filenameSrc}_report.json will contains all the previous data\n
        ${chalk.blue('keep them safe!\n')}`);
    });
