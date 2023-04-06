
import { expect } from 'chai';
import { ethers } from "hardhat";
import { BigNumber, FixedNumber } from "@ethersproject/bignumber";
import { base64encode, base64decode } from 'nodejs-base64';
var chaiJsonEqual = require('chai-json-equal');
var chai = require('chai');
chai.use(chaiJsonEqual);

// Start test block
describe('Revealable Contract Debug testing', function () {
  before(async function () {
    // Get the owner and collector address
    this.signers = await ethers.getSigners();
    this.owner = this.signers[0].address;

    this.Revealable_debug = await ethers.getContractFactory('Revealable_debug', {
      signer: this.signers[0]
    });
  });

  beforeEach(async function () {
    // deploy the contract
    this.reveal = await this.Revealable_debug.deploy();
    await this.reveal.deployed();

    // Set the hidden value
    //await this.reveal["setHiddenValues(uint256[],uint256)"]([0x56f2,0x8eaa,0x05f5,0x06a4,0xefeb,0x4568,0xc508,0x9392,0xbd81,0x1cb0]);
    // Get the collector contract for signing transaction with collector key
    //this.collectorContract = this.reveal.connect(this.signers[1]);
  });

  // Test cases

  it('should set the hidden values', async function () {
    const test_case = {
      data: [4062, 55174, 23769, 24456, 46791, 7236, 39972, 51902, 58541, 17820],
      key: '0xcaa6e3191f88601644b74e72893e1b392583b6a04f71511bcc2a8b7280933604',
      iv: '0xe92f5949babb53eb160f01da9321a6e7744a28f4795f38cb5bba1b6b73e1acbe',
      cipherData: [32219, 42371, 11996, 11661, 50370, 28225, 60961, 47291, 38568, 14233],
      decipherMessage: [0x3aed, 0xb961, 0xbe63, 0x6d27, 0xd902, 0x68d7, 0xe259, 0xa365, 0x3403, 0xd296]
    };
    // Set the hidden values
    const valueSize = 2;
    await this.reveal["setHiddenValues(uint256[],uint256)"](test_case.data, valueSize);
    // Get the hidden values
    for (let index = 0; index < test_case.data.length; index++) {
      expect(await this.reveal.getHiddenValue(index, 2)).to.equal(test_case.data[index]);
    }
  });

  it('should emit event when setting the hidden values', async function () {
    const test_case = {
      data: [4062, 55174, 23769, 24456, 46791, 7236, 39972, 51902, 58541, 17820],
      key: '0xcaa6e3191f88601644b74e72893e1b392583b6a04f71511bcc2a8b7280933604',
      iv: '0xe92f5949babb53eb160f01da9321a6e7744a28f4795f38cb5bba1b6b73e1acbe',
    };
    // Set the hidden values
    const valueSize = 2;
    await expect(this.reveal["setHiddenValues(uint256[],uint256)"](test_case.data, valueSize))
      .to.emit(this.reveal, 'HiddenValuesSet').withArgs(this.owner, test_case.data);
  });


  it('should cipher values', async function () {
    const test_case = {
      data: [4062, 55174, 23769, 24456, 46791, 7236, 39972, 51902, 58541, 17820],
      key: '0xcaa6e3191f88601644b74e72893e1b392583b6a04f71511bcc2a8b7280933604',
      iv: '0xe92f5949babb53eb160f01da9321a6e7744a28f4795f38cb5bba1b6b73e1acbe',
    };

    // ciphering data
    console.log("Encoding data: ", test_case.data);
    await this.reveal["setHiddenValues(uint256[],uint256)"](test_case.data, 2);
    console.log("set reveal key");
    await this.reveal.setRevealKey(test_case.key, test_case.iv);
    console.log("ciphering data");
    await this.reveal['reveal()']();
    const cipherData = [];

    //check that values are different
    for (let i = 0; i < test_case.data.length; i++) {
      const hiddenValue = await this.reveal.getHiddenValue(i, 2);
      cipherData[i] = hiddenValue.toNumber();
      expect(hiddenValue).to.not.equal(test_case.data[i], `hiddenValue: ${hiddenValue}, expected: ${test_case.data[i]}`);
      //todo add the expected cipherData
    }
    console.log("cipherData: ", cipherData);
  });

  it('should decipher hidden value if revealed', async function () {
    const test_case = {
      data: [4062, 55174, 23769, 24456, 46791, 7236, 39972, 51902, 58541, 17820],
      key: '0xcaa6e3191f88601644b74e72893e1b392583b6a04f71511bcc2a8b7280933604',
      iv: '0xe92f5949babb53eb160f01da9321a6e7744a28f4795f38cb5bba1b6b73e1acbe',
      cipherData: [32219, 42371, 11996, 11661, 50370, 28225, 60961, 47291, 38568, 14233],
    };
    // ciphering data
    console.log("Encoding data: ", test_case.data);
    await this.reveal["setHiddenValues(uint256[],uint256)"](test_case.data, 2);
    // try to reveal without setting the key
    await expect(this.reveal['reveal()']()).to.be.revertedWith("Revealable: contract not revealable");
    console.log("set reveal key");
    await this.reveal.setRevealKey(test_case.key, test_case.iv);
    console.log("ciphering data");
    await this.reveal['reveal()']();
    const cipherData = [];
    for (let i = 0; i < test_case.data.length; i++) {
      const hiddenValue = await this.reveal.getHiddenValue(i, 2);
      cipherData[i] = hiddenValue.toNumber();
      expect(hiddenValue).to.not.equal(test_case.data[i], `hiddenValue: ${hiddenValue}, expected: ${test_case.data[i]}`);
    }

    // set wrong key
    const wrongKey = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toHexString();
    const wrongIv = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toHexString();
    console.log("wrongKey: ", wrongKey);
    console.log("wrongIv: ", wrongIv);
    // reset keys
    await expect(this.reveal.resetRevealKey(wrongKey, wrongIv)).to.be.revertedWith("Revealable: contract not revealable");
    // try to reveal without resetting the reveal
    await expect(this.reveal['reveal()']()).to.be.revertedWith("Revealable: contract not revealable");

    await this.reveal.resetReveal();
    await expect(this.reveal.setRevealKey(wrongKey, wrongIv)).to.be.revertedWith("Revealable: contract not hidden");
    await this.reveal['reveal()']();
    //check that values are different
    for (let i = 0; i < test_case.data.length; i++) {
      const hiddenValue = await this.reveal.getHiddenValue(i, 2);
      // check that the deciphered value is not the same as the original data with the wrong key
      expect(hiddenValue).to.not.equal(test_case.cipherData[i], `hiddenValue: ${hiddenValue}, expected: ${test_case.cipherData[i]}`);
    }
  });

  it('should cipher and decipher if revealed', async function () {
    const test_case = {
      data: [4062, 55174, 23769, 24456, 46791, 7236, 39972, 51902, 58541, 17820],
      key: '0xcaa6e3191f88601644b74e72893e1b392583b6a04f71511bcc2a8b7280933604',
      iv: '0xe92f5949babb53eb160f01da9321a6e7744a28f4795f38cb5bba1b6b73e1acbe',
      cipherData: [766, 10105, 58665, 13202, 65495, 53002, 10655, 64327, 31668, 28695],
    };

    // ciphering data
    console.log("Encoding data: ", test_case.data);
    await this.reveal["setHiddenValues(uint256[],uint256)"](test_case.data, 2);
    console.log("set reveal key");
    await this.reveal.setRevealKey(test_case.key, test_case.iv);
    console.log("ciphering data");
    await this.reveal['reveal()']();
    
    const hiddenValueBytes = await this.reveal.getHiddenValues();
    console.log(`hiddenValuesBytes:${hiddenValueBytes}`);
    
    //check that values are different
    const cipherData = [];
    for (let i = 0; i < test_case.data.length; i++) {
      const hiddenValue = await this.reveal.getHiddenValue(i, 2);
      cipherData[i] = hiddenValue.toNumber();
      expect(hiddenValue).to.not.equal(test_case.data[i], `hiddenValue: ${hiddenValue}, expected: ${test_case.data[i]}`);
    }

    // deciphering data
    console.log("setting ciphered data: ", test_case.cipherData);
    await this.reveal["setHiddenValues(bytes)"](hiddenValueBytes);
    console.log("set reveal key");
    await this.reveal.setRevealKey(test_case.key, test_case.iv);
    console.log("Revealing data");
    await this.reveal['reveal()']();
    
    // check that values are the same as the original data
    const decipherData = [];
    for (let i = 0; i < test_case.data.length; i++) {
      const hiddenValue = await this.reveal.getHiddenValue(i, 2);
      decipherData[i] = hiddenValue.toNumber();
      expect(hiddenValue).to.equal(test_case.data[i], `hiddenValue: ${hiddenValue}, expected: ${test_case.data[i]}`);
    }

    console.log("cipherData: ", cipherData);
    console.log("decipherData: ", decipherData);
  });



});