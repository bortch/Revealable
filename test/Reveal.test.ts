
import { expect } from 'chai';
import { ethers } from "hardhat";
import {base64encode, base64decode} from 'nodejs-base64';
var chaiJsonEqual = require('chai-json-equal');
var chai    = require('chai');
chai.use(chaiJsonEqual);
//import { encryptData,decryptData,getKey, getIV } from './encrypt';

// Start test block
describe('Reveal', function () {
  before(async function () {
    // Get the owner and collector address
    this.signers = await ethers.getSigners();
    this.owner = this.signers[0].address;
    this.collector = this.signers[1].address;

    // Get the CipherLib contract
    this.CipherLib = await ethers.getContractFactory('CipherLib');
    this.cipherLib = await this.CipherLib.deploy();
    await this.cipherLib.deployed();

    this.Reveal = await ethers.getContractFactory('Reveal', {
      libraries: {
        CipherLib: this.cipherLib.address},
        //signer: this.owner,
        });
  });

  beforeEach(async function () {
    // deploy the contract
    this.reveal = await this.Reveal.deploy();
    await this.reveal.deployed();


    // Get the collector contract for signing transaction with collector key
    this.collectorContract = this.reveal.connect(this.signers[1]);

    // Mint an initial set of NFTs from this collection
    this.initialMintCount = 2;
    this.initialMint = [];
    for (let i = 1; i <= this.initialMintCount; i++) { // tokenId to start at 1
      await this.reveal.mint();
      this.initialMint.push(ethers.BigNumber.from(i));
    }
  });

  // Test cases


  it('should cipher and decipher data', async function () {
    const data = ethers.utils.formatBytes32String("Hello World");
    const key = ethers.utils.formatBytes32String("mysecretkey");
    const cipherMessage = await this.reveal.cipher_CTR(data, key);
    const decipherMessage = await this.reveal.cipher_CTR(cipherMessage, key);
    //console.log(data, key, cipherMessage, decipherMessage);
    expect(decipherMessage).to.equal(data);
  });
  
    it('should cipher and decipher an uint256 with CTR', async function () {
      const data = ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 32);
      const key = ethers.utils.formatBytes32String("mysecretkey");
      const cipherMessage = await this.reveal.cipher_CTR(data, key);
      const decipherMessage = await this.reveal.cipher_CTR(cipherMessage, key);
      //console.log(data, key, cipherMessage, decipherMessage);
      expect(decipherMessage).to.equal(data);
    });

  it('should cipher and decipher data 2', async function () {
    const data = ethers.utils.formatBytes32String("Hello World");
    const key = ethers.utils.formatBytes32String("mysecretkey");
    const cipherMessage = await this.reveal.cipher_CTR2(data, key);
    const decipherMessage = await this.reveal.cipher_CTR2(cipherMessage, key);
    //console.log(data, key, cipherMessage, decipherMessage);
    expect(decipherMessage).to.equal(data);
  });

  it('should cipher and decipher 32 bytes data with CTR5', async function () {
    const data = ethers.utils.formatBytes32String("Hello World");
    const key = ethers.utils.formatBytes32String("mysecretkey");
    const iv = ethers.utils.formatBytes32String("mysecretiv");
    const cipherMessage = await this.reveal.cipher_CTR5(data, key, iv);
    const decipherMessage = await this.reveal.cipher_CTR5(cipherMessage, key, iv);
    //console.log(`data: ${data}\nkey: ${key}\niv: ${iv}\ncipherMessage: ${cipherMessage}\ndecipherMessage: ${decipherMessage}`);
    expect(decipherMessage).to.equal(data);
  });


  it('should cipher and decipher an uint256 with CTR5', async function () {
    const data = ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 32);
    const key = ethers.utils.formatBytes32String("mysecretkey");
    const iv = ethers.utils.hexZeroPad(ethers.utils.hexlify(42), 32);
    const cipherMessage = await this.reveal.cipher_CTR5(data, key, iv);
    const decipherMessage = await this.reveal.cipher_CTR5(cipherMessage, key, iv);
    //console.log(`data: ${data}\nkey: ${key}\niv: ${iv}\ncipherMessage: ${cipherMessage}\ndecipherMessage: ${decipherMessage}`);
    expect(decipherMessage).to.equal(data);
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
      let tokenId = await this.reveal.getTokenId(this.initialMint[i]);
      expect(await this.reveal.ownerOf(tokenId)).to.equal(this.owner);
    }
  });

  it('Should get encrypted token if not yet revealed', async function () {
    for (let i = 0; i < this.initialMint.length; i++) {
      let tokenId = await this.reveal.getTokenId(this.initialMint[i]);
      let tokenURI = await this.reveal.tokenURI(tokenId);
      // extract the encrypted token from the tokenURI
      // tokenUri is a base64 encoded string
      let tokenUri_json = JSON.parse(base64decode(tokenURI.split(',')[1]));
      //console.log(tokenUri_json);
      let tokenId_received = ethers.BigNumber.from(tokenUri_json.name.split('#')[1]);
      expect(tokenId_received).to.equal(tokenId);
    }
  });

  it('Is able to query the NFT balances of an address', async function () {
    expect(await this.reveal.balanceOf(this.owner)).to.equal(this.initialMint.length);
  });

  it('Is able to mint new NFTs to the collection to collector', async function () {
    let nextCounter = ethers.BigNumber.from(this.initialMint.length + 1);
    let tokenId = await this.reveal.getTokenId(nextCounter);
    await this.collectorContract.mint();
    expect(await this.reveal.ownerOf(tokenId)).to.equal(this.collector);
  });

  it('Emits a transfer event for newly minted NFTs', async function () {
    let nextCounter = ethers.BigNumber.from(this.initialMint.length + 1);
    let tokenId = await this.reveal.getTokenId(nextCounter);
    await expect(this.reveal.mint()).to.emit(this.reveal, "Transfer")
      .withArgs("0x0000000000000000000000000000000000000000", this.owner, tokenId); 
      //NFTs are minted from zero address
  });
  

  it('Is able to transfer NFTs to another wallet when called by owner', async function () {
    let tokenId = await this.reveal.getTokenId(this.initialMint[0]);
    await this.reveal["safeTransferFrom(address,address,uint256)"](this.owner, this.collector, tokenId);
    expect(await this.reveal.ownerOf(tokenId)).to.equal(this.collector);
  });

  it('Emits a Transfer event when transferring a NFT', async function () {
    let tokenId = await this.reveal.getTokenId(this.initialMint[0]);
    await expect(this.reveal["safeTransferFrom(address,address,uint256)"](this.owner, this.collector, tokenId))
      .to.emit(this.reveal, "Transfer")
      .withArgs(this.owner, this.collector, tokenId);
  });

  it('Approves an operator wallet to spend owner NFT', async function () {
    let tokenId = await this.reveal.getTokenId(this.initialMint[0]);
    await this.reveal.approve(this.collector, tokenId);
    expect(await this.reveal.getApproved(tokenId)).to.equal(this.collector);
  });

  it('Emits an Approval event when an operator is approved to spend a NFT', async function () {
    let tokenId = await this.reveal.getTokenId(this.initialMint[0]);
    await expect(this.reveal.approve(this.collector, tokenId))
      .to.emit(this.reveal, "Approval")
      .withArgs(this.owner, this.collector, tokenId);
  });

  it('Allows operator to transfer NFT on behalf of owner', async function () {
    let tokenId = await this.reveal.getTokenId(this.initialMint[0]);
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
      let tokenId = await this.reveal.getTokenId(this.initialMint[i]);
      await this.collectorContract["safeTransferFrom(address,address,uint256)"](this.owner, this.collector, tokenId);
    }
    expect(await this.reveal.balanceOf(this.collector)).to.equal(this.initialMint.length.toString());
  });


});