
import { expect } from 'chai';
import { ethers } from "hardhat";
import { BigNumber, FixedNumber } from "@ethersproject/bignumber";
import { base64encode, base64decode } from 'nodejs-base64';
var chaiJsonEqual = require('chai-json-equal');
var chai = require('chai');
chai.use(chaiJsonEqual);

// Start test block
describe('Reveal Contract Debug testing', function () {
  before(async function () {
    // Get the owner and collector address
    this.signers = await ethers.getSigners();
    this.owner = this.signers[0].address;
    this.collector = this.signers[1].address;

    this.Reveal = await ethers.getContractFactory('Reveal', {
      signer: this.signers[0]
    });
  });

  beforeEach(async function () {
    // test data
    this.test_case ={
      data: [4062,55174,23769,24456,46791,7236,39972,51902,58541,17820],
      key: '0xcaa6e3191f88601644b74e72893e1b392583b6a04f71511bcc2a8b7280933604',
      iv: '0xe92f5949babb53eb160f01da9321a6e7744a28f4795f38cb5bba1b6b73e1acbe',
      cipherData: [766, 10105, 58665, 13202, 65495, 53002, 10655, 64327, 31668, 28695 ],
      hiddenValueBytesSize: 2
    };
    // deploy the contract
    this.reveal = await this.Reveal.deploy();
    await this.reveal.deployed();
    // Set the hidden value
    await this.reveal.setHiddenValues(this.test_case.cipherData,this.test_case.hiddenValueBytesSize);
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
  await this.reveal.setHiddenValues(this.test_case.cipherData,this.test_case.hiddenValueBytesSize);
  
  //unrevealed
  expect(await this.reveal.getSecretForTokenId(1)).to.equal(ethers.BigNumber.from(this.test_case.cipherData[1]));
  
  //revealed
  await this.reveal.setRevealKey(this.test_case.key, this.test_case.iv);
  await this.reveal.reveal();
  expect(await this.reveal.getSecretForTokenId(1)).to.equal(ethers.BigNumber.from(this.test_case.data[1]));
});



it('Creates a token collection with a name', async function () {
  expect(await this.reveal.name()).to.exist;
  // expect(await this.reveal.name()).to.equal('Reveal');
});

it('Creates a token collection with a symbol', async function () {
  expect(await this.reveal.symbol()).to.exist;
  // expect(await this.reveal.symbol()).to.equal('REVEAL');
});

it('Mints initial set of NFTs from collection to owner', async function () {
  for (let i = 0; i < this.initialMint.length; i++) {
    let tokenId = this.initialMint[i];
    expect(await this.reveal.ownerOf(tokenId)).to.equal(this.owner,`tokenId: ${tokenId}, owner of tokenId: ${await this.reveal.ownerOf(tokenId)}, expected owner: ${this.owner}`);
  }
});

it('Should get decrypted token if revealed', async function () {
  console.log('Should get decrypted token if revealed');
  await this.reveal.setHiddenValues(this.test_case.cipherData,this.test_case.hiddenValueBytesSize);
  await this.reveal.setRevealKey(this.test_case.key, this.test_case.iv);
  await this.reveal.reveal();          

  for (let i = 0; i < this.initialMint.length; i++) {
    const index = this.initialMint[i];
    // reveal the token
    // get the tokenId
    let tokenId = await this.reveal.getSecretForTokenId(index);
    console.log("tokenId: ", tokenId);
    // get the tokenURI
    let tokenURI = await this.reveal.tokenURI(index);
    console.log("tokenURI: ", tokenURI);
    // extract the encrypted token from the tokenURI
    // tokenUri is a base64 encoded string
    let tokenUri_json = JSON.parse(base64decode(tokenURI.split(',')[1]));
    console.log(tokenUri_json);
    let tokenId_received = tokenUri_json.name.split('#')[1];
    expect(tokenId_received).to.equal(ethers.BigNumber.from(this.test_case.data[index]), "tokenId_received: " + tokenId_received + " test_case.data[i]: " + this.test_case.data[index]);
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
    let tokenId = this.initialMint[i];
    await this.collectorContract["safeTransferFrom(address,address,uint256)"](this.owner, this.collector, tokenId);
  }
  expect(await this.reveal.balanceOf(this.collector)).to.equal(this.initialMint.length.toString());
});


});