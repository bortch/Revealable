
import { expect } from 'chai';
import { ethers } from "hardhat";
import { BigNumber, FixedNumber } from "@ethersproject/bignumber";
import { base64encode, base64decode } from 'nodejs-base64';
var chaiJsonEqual = require('chai-json-equal');
var chai = require('chai');
chai.use(chaiJsonEqual);

//import dataset json
import _dataSet from './dataSet.json';


const dataSet = _dataSet[0];

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
    this.revealable = await this.Revealable_debug.deploy();
    await this.revealable.deployed();
  });

  // Test cases

  it('should revert if Unset', async function () {
    await expect(this.revealable["getHiddenValue(uint256)"](1)).to.revertedWith("Revealable: contract not set");
  });

  it('should revert if key or iv equal 0', async function () {
    await this.revealable["setHiddenValues(uint256[],uint256)"](dataSet.data, dataSet.valueSize);
    // set the valueSize
    // zero bytes
    const zero = ethers.constants.HashZero;
    await expect(this.revealable.setRevealKey(dataSet.key,zero, dataSet.valueSize)).to.revertedWith('Revealable: key and initialVector cannot be zero');
    await expect(this.revealable.setRevealKey(zero, dataSet.iv, dataSet.valueSize)).to.revertedWith('Revealable: key and initialVector cannot be zero');
    await expect(this.revealable.setRevealKey(dataSet.key, dataSet.iv, 0)).to.revertedWith("valueSize couldn't be zero");
  });

  it('should set the hidden values', async function () {
    // Set the hidden values
    await this.revealable["setHiddenValues(uint256[],uint256)"](dataSet.data, dataSet.valueSize);
    // set the valueSize
    await this.revealable.setRevealKey(dataSet.key, dataSet.iv, dataSet.valueSize)
    // Get the hidden values
    for (let index = 0; index < dataSet.data.length; index++) {
      expect(await this.revealable.getHiddenValue(index)).to.equal(dataSet.data[index]);
    }
  });

  it('should emit event when setting the hidden values', async function () {
    // Set the hidden values
    await expect(this.revealable["setHiddenValues(uint256[],uint256)"](dataSet.data, dataSet.valueSize))
      .to.emit(this.revealable, 'HiddenValuesSet').withArgs(this.owner, dataSet.data);
  });

  it('should cipher values', async function () {
    // ciphering data
    console.log("Encoding data: ", dataSet.data);
    await this.revealable["setHiddenValues(uint256[],uint256)"](dataSet.data, dataSet.valueSize);
    console.log("set reveal key");
    await this.revealable.setRevealKey(dataSet.key, dataSet.iv, dataSet.valueSize);
    console.log("ciphering data");
    await this.revealable['reveal()']();

    //check that values are different
    const cipherData = [];
    for (let i = 0; i < dataSet.data.length; i++) {
      const hiddenValue = await this.revealable["getHiddenValue(uint256)"](i);
      cipherData[i] = hiddenValue.toNumber();
      expect(hiddenValue).to.not.equal(dataSet.data[i], `hiddenValue: ${hiddenValue}, expected: ${dataSet.data[i]}`);
      expect(hiddenValue).to.be.equal(dataSet.cipherData[i], `hiddenValue: ${hiddenValue}, expected: ${dataSet.cipherData[i]}`);
    }
    console.log("cipherData: ", cipherData);
  });

  it('should decipher hidden value if revealed', async function () {
    // ciphering data
    console.log("Encoding data: ", dataSet.data);
    await this.revealable["setHiddenValues(uint256[],uint256)"](dataSet.data, 2);
    // try to reveal without setting the key
    await expect(this.revealable['reveal()']()).to.be.revertedWith("Revealable: contract not revealable");
    console.log("set reveal key");
    await this.revealable.setRevealKey(dataSet.key, dataSet.iv, dataSet.valueSize);
    console.log("ciphering data");
    await this.revealable['reveal()']();
    const cipherData = [];
    for (let i = 0; i < dataSet.data.length; i++) {
      const hiddenValue = await this.revealable["getHiddenValue(uint256)"](i);
      cipherData[i] = hiddenValue.toNumber();
      expect(hiddenValue).to.not.equal(dataSet.data[i], `hiddenValue: ${hiddenValue}, expected: ${dataSet.data[i]}`);
    }

    // set wrong key
    const wrongKey = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toHexString();
    const wrongIv = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toHexString();
    console.log("wrongKey: ", wrongKey);
    console.log("wrongIv: ", wrongIv);
    // reset keys must fail because contract is in RevealState.Revealed
    await expect(this.revealable.resetRevealKey(wrongKey, wrongIv, dataSet.valueSize)).to.be.revertedWith("Revealable: contract not revealable");
    // try to reveal without resetting the reveal must fail
    await expect(this.revealable['reveal()']()).to.be.revertedWith("Revealable: contract not revealable");

    await this.revealable.resetReveal();
    // setting keys must fail as the contract is already in RevealState.revealable
    await expect(this.revealable.setRevealKey(wrongKey, wrongIv, dataSet.valueSize)).to.be.revertedWith("Revealable: contract not hidden");
    // calling reveal return to original values
    await this.revealable['reveal()']();
    //check that values are different
    for (let i = 0; i < dataSet.data.length; i++) {
      const hiddenValue = await this.revealable["getHiddenValue(uint256)"](i);
      // check that the deciphered value is not the same as the original data with the wrong key
      expect(hiddenValue).to.equal(dataSet.cipherData[i], `hiddenValue: ${hiddenValue}, expected: ${dataSet.cipherData[i]}`);
    }
  });

  it('should cipher and decipher if revealed', async function () {

    // ciphering data
    console.log("Encoding data: ", dataSet.data);
    await this.revealable["setHiddenValues(uint256[],uint256)"](dataSet.data, 2);
    console.log("set reveal key");
    await this.revealable.setRevealKey(dataSet.key, dataSet.iv, dataSet.valueSize);
    console.log("ciphering data");
    await this.revealable['reveal()']();

    const hiddenValueBytes = await this.revealable.getHiddenValues();
    console.log(`hiddenValuesBytes:${hiddenValueBytes}`);

    //check that values are different
    const cipherData = [];
    for (let i = 0; i < dataSet.data.length; i++) {
      const hiddenValue = await this.revealable["getHiddenValue(uint256)"](i);
      cipherData[i] = hiddenValue.toNumber();
      expect(hiddenValue).to.not.equal(dataSet.data[i], `hiddenValue: ${hiddenValue}, expected: ${dataSet.data[i]}`);
    }

    // deciphering data
    console.log("setting ciphered data: ", dataSet.cipherData);
    await this.revealable["setHiddenValues(bytes)"](hiddenValueBytes);
    console.log("set reveal key");
    await this.revealable.setRevealKey(dataSet.key, dataSet.iv, dataSet.valueSize);
    console.log("Revealing data");
    await this.revealable['reveal()']();

    // check that values are the same as the original data
    const decipherData = [];
    for (let i = 0; i < dataSet.data.length; i++) {
      const hiddenValue = await this.revealable["getHiddenValue(uint256)"](i);
      decipherData[i] = hiddenValue.toNumber();
      expect(hiddenValue).to.equal(dataSet.data[i], `hiddenValue: ${hiddenValue}, expected: ${dataSet.data[i]}`);
    }

    console.log("cipherData: ", cipherData);
    console.log("decipherData: ", decipherData);
  });

  it('should return cipher values as byte', async function () {
    console.log("Encoding data: ", dataSet.data);
    await this.revealable["setHiddenValues(uint256[],uint256)"](dataSet.data, dataSet.valueSize);
    console.log("set reveal key");
    await this.revealable.setRevealKey(dataSet.key, dataSet.iv, dataSet.valueSize);
    console.log("ciphering data");
    await this.revealable['reveal()']();
    const cipherData = await this.revealable['getHiddenValues()']();
    console.log("cipherData: ", cipherData);
    expect(cipherData).to.be.equals(dataSet.cipherDataAsBytes);
  });

  it('should setHiddenValues with bytes', async function () {
    console.log("Encoding data: ", dataSet.cipherDataAsBytes);
    await this.revealable["setHiddenValues(bytes)"](dataSet.cipherDataAsBytes);
    console.log("set reveal key");
    await this.revealable.setRevealKey(dataSet.key, dataSet.iv, dataSet.valueSize);
    console.log("deciphering data");
    await this.revealable['reveal()']();
    const decipherData = [];
    for (let i = 0; i < dataSet.data.length; i++) {
      const hiddenValue = await this.revealable["getHiddenValue(uint256)"](i);
      decipherData[i] = hiddenValue.toNumber();
      expect(hiddenValue).to.equal(dataSet.data[i], `hiddenValue: ${hiddenValue}, expected: ${dataSet.data[i]}`);
    }
  });


});