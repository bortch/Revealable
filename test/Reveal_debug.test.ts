
import { expect } from 'chai';
import { ethers } from "hardhat";
import { BigNumber, FixedNumber } from "@ethersproject/bignumber";
import { base64encode, base64decode } from 'nodejs-base64';
var chaiJsonEqual = require('chai-json-equal');
var chai = require('chai');
chai.use(chaiJsonEqual);

//import dataset json
import dataSet from './dataSet.json';

// Start test block
describe('Reveal Contract Debug testing', function () {
  before(async function () {
    // Get the owner and collector address
    this.signers = await ethers.getSigners();
    this.owner = this.signers[0].address;
    this.collector = this.signers[1].address;

    this.Reveal_debug = await ethers.getContractFactory('Reveal_debug', {
      signer: this.signers[0]
    });
  });

  beforeEach(async function () {
    // test data
    // deploy the contract
    this.reveal = await this.Reveal_debug.deploy();
    await this.reveal.deployed();
    // Set the hidden value
    await this.reveal["setHiddenValues(bytes)"](dataSet[0].cipherDataAsBytes);
    // Get the collector contract for signing transaction with collector key
    this.collectorContract = this.reveal.connect(this.signers[1]);

    // Mint an initial set of NFTs from this collection
    this.initialMintCount = 2;
    this.initialMint = [];
    for (let i = 1; i <= this.initialMintCount; i++) { // tokenId to start at 1
      await this.reveal.mint();
      this.initialMint.push(i);
    }
  });

  // Test cases

  it('should return the correct secret for tokenId', async function () {
    await this.reveal["setHiddenValues(uint256[],uint256)"](dataSet[0].cipherData, dataSet[0].valueSize);

    //unrevealed must fail as the key and iv are not set
    expect(await this.reveal.getSecretForTokenId(1)).to.be.not.equal(ethers.BigNumber.from(dataSet[0].cipherData[1]));
    expect(await this.reveal.getSecretForTokenId(1)).to.be.not.equal(ethers.BigNumber.from(dataSet[0].data[1]));
    //revealed must return the correct secret
    await this.reveal["reveal(bytes32,bytes32,uint256)"](dataSet[0].key, dataSet[0].iv, dataSet[0].valueSize);
    expect(await this.reveal.getSecretForTokenId(1)).to.equal(ethers.BigNumber.from(dataSet[0].data[1]));
  });



  it('Creates a token collection with a name', async function () {
    expect(await this.reveal.name()).to.exist;
    //expect(await this.reveal.name()).to.equal('Reveal');
  });

  it('Creates a token collection with a symbol', async function () {
    expect(await this.reveal.symbol()).to.exist;
    //expect(await this.reveal.symbol()).to.equal('REVEAL');
  });

  it('Mints initial set of NFTs from collection to owner', async function () {
    for (let i = 0; i < this.initialMint.length; i++) {
      let tokenId = this.initialMint[i]
      expect(await this.reveal.ownerOf(tokenId)).to.equal(this.owner, `tokenId: ${tokenId}, owner of tokenId: ${await this.reveal.ownerOf(tokenId)}, expected owner: ${this.owner}`);
    }
  });

  it('Should get decrypted token if revealed', async function () {
    console.log('Should get decrypted token if revealed');
    await this.reveal["setHiddenValues(uint256[],uint256)"](dataSet[0].cipherData, dataSet[0].valueSize);
    await this.reveal.setRevealKey(dataSet[0].key, dataSet[0].iv, dataSet[0].valueSize);
    await this.reveal["reveal()"]();

    for (let i = 0; i < this.initialMint.length; i++) {
      const index = this.initialMint[i];
      // reveal the token
      // get the tokenId
      let tokenId = await this.reveal.getSecretForTokenId(index);
      console.log("tokenId:", tokenId);
      // get the tokenURI
      let tokenURI = await this.reveal.tokenURI(index);
      console.log("tokenURI as base64:", tokenURI);
      // extract the encrypted token from the tokenURI
      // tokenUri is a base64 encoded string
      let tokenUri_json = JSON.parse(base64decode(tokenURI.split(',')[1]));
      console.log("tokenURI decoded:", tokenUri_json);
      let tokenId_received = tokenUri_json.name.split('#')[1];
      expect(tokenId_received).to.equal(ethers.BigNumber.from(dataSet[0].data[index]), "tokenId_received: " + tokenId_received + " test_case.data[i]: " + dataSet[0].data[index]);
    }
  });

  it('Is able to query the NFT balances of an address', async function () {
    expect(await this.reveal.balanceOf(this.owner)).to.equal(this.initialMint.length);
  });

  it('Is able to mint new NFTs to the collection to collector', async function () {
    let nextCounter = ethers.BigNumber.from(this.initialMint.length + 1);
    let tokenId = nextCounter;
    await this.collectorContract.mint();
    expect(await this.reveal.ownerOf(tokenId)).to.equal(this.collector);
  });

  it('Emits a transfer event for newly minted NFTs', async function () {
    let nextCounter = ethers.BigNumber.from(this.initialMint.length + 1);
    let tokenId = nextCounter;
    await expect(this.reveal.mint()).to.emit(this.reveal, "Transfer")
      .withArgs("0x0000000000000000000000000000000000000000", this.owner, tokenId);
    //NFTs are minted from zero address
  });


  it('Is able to transfer NFTs to another wallet when called by owner', async function () {
    let tokenId = this.initialMint[0];
    await this.reveal["safeTransferFrom(address,address,uint256)"](this.owner, this.collector, tokenId);
    expect(await this.reveal.ownerOf(tokenId)).to.equal(this.collector);
  });

  it('Emits a Transfer event when transferring a NFT', async function () {
    let tokenId = this.initialMint[0];
    await expect(this.reveal["safeTransferFrom(address,address,uint256)"](this.owner, this.collector, tokenId))
      .to.emit(this.reveal, "Transfer")
      .withArgs(this.owner, this.collector, tokenId);
  });

  it('Approves an operator wallet to spend owner NFT', async function () {
    let tokenId = this.initialMint[0];
    await this.reveal.approve(this.collector, tokenId);
    expect(await this.reveal.getApproved(tokenId)).to.equal(this.collector);
  });

  it('Emits an Approval event when an operator is approved to spend a NFT', async function () {
    let tokenId = this.initialMint[0];
    await expect(this.reveal.approve(this.collector, tokenId))
      .to.emit(this.reveal, "Approval")
      .withArgs(this.owner, this.collector, tokenId);
  });

  it('Allows operator to transfer NFT on behalf of owner', async function () {
    let tokenId = this.initialMint[0];
    await this.reveal.approve(this.collector, tokenId);
    // Using the collector contract which has the collector's key
    await this.collectorContract["safeTransferFrom(address,address,uint256)"](this.owner, this.collector, tokenId);
    expect(await this.reveal.ownerOf(tokenId)).to.equal(this.collector);
  });

  it('Approves an operator to spend all of an owner\'s NFTs', async function () {
    await this.reveal.setApprovalForAll(this.collector, true);
    expect(await this.reveal.isApprovedForAll(this.owner, this.collector)).to.equal(true);
  });

  it('Emits an ApprovalForAll event when an operator is approved to spend all NFTs', async function () {
    let isApproved = true
    await expect(this.reveal.setApprovalForAll(this.collector, isApproved))
      .to.emit(this.reveal, "ApprovalForAll")
      .withArgs(this.owner, this.collector, isApproved);
  });

  it('Removes an operator from spending all of owner\'s NFTs', async function () {
    // Approve all NFTs first
    await this.reveal.setApprovalForAll(this.collector, true);
    // Remove approval privileges
    await this.reveal.setApprovalForAll(this.collector, false);
    expect(await this.reveal.isApprovedForAll(this.owner, this.collector)).to.equal(false);
  });

  it('Allows operator to transfer all NFTs on behalf of owner', async function () {
    await this.reveal.setApprovalForAll(this.collector, true);
    for (let i = 0; i < this.initialMint.length; i++) {
      let tokenId = this.initialMint[i]
      await this.collectorContract["safeTransferFrom(address,address,uint256)"](this.owner, this.collector, tokenId);
    }
    expect(await this.reveal.balanceOf(this.collector)).to.equal(this.initialMint.length.toString());
  });

});