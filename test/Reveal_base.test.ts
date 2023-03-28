
import { expect } from 'chai';
import { ethers } from "hardhat";
import { BigNumber, FixedNumber } from "@ethersproject/bignumber";
import { base64encode, base64decode } from 'nodejs-base64';
var chaiJsonEqual = require('chai-json-equal');
var chai = require('chai');
chai.use(chaiJsonEqual);

// Start test block
describe('Reveal', function () {
  before(async function () {
    // Get the owner and collector address
    this.signers = await ethers.getSigners();
    this.owner = this.signers[0].address;
    this.collector = this.signers[1].address;

    // // Get the CipherLib contract
    // this.CipherLib = await ethers.getContractFactory('CipherLib');
    // this.cipherLib = await this.CipherLib.deploy();
    // await this.cipherLib.deployed();

    this.Reveal = await ethers.getContractFactory('Reveal', {
      // libraries: {
      //   CipherLib: this.cipherLib.address
      // },
      signer: this.signers[0]
    });
  });

  beforeEach(async function () {
    // deploy the contract
    this.reveal = await this.Reveal.deploy();
    await this.reveal.deployed();
    // Set the hidden value
    await this.reveal.setHiddenValue([0x56f2,0x8eaa,0x05f5,0x06a4,0xefeb,0x4568,0xc508,0x9392,0xbd81,0x1cb0]);
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

  it('should cipher and decipher data', async function () {
    const data = ethers.utils.formatBytes32String("Hello World");
    const key = ethers.utils.formatBytes32String("mysecretkey");
    const iv = ethers.utils.formatBytes32String("mysecretiv");
    const cipherMessage = await this.reveal.cipherCTR(data, key, iv);
    const decipherMessage = await this.reveal.cipherCTR(cipherMessage, key, iv);
    //console.log(data, key, cipherMessage, decipherMessage);
    expect(decipherMessage).to.equal(data,`data: ${data}\nkey: ${key}\ncipherMessage: ${cipherMessage}\ndecipherMessage: ${decipherMessage}`);
  });

  it('should cipher and decipher an uint256 with CTR', async function () {
    const data = ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 32);
    const key = ethers.utils.formatBytes32String("mysecretkey");
    const iv = ethers.utils.formatBytes32String("mysecretiv");
    const cipherMessage = await this.reveal.cipherCTR(data, key, iv);
    const decipherMessage = await this.reveal.cipherCTR(cipherMessage, key, iv);
    //console.log(data, key, cipherMessage, decipherMessage);
    expect(decipherMessage).to.equal(data, `data: ${data}\nkey: ${key}\ncipherMessage: ${cipherMessage}\ndecipherMessage: ${decipherMessage}`);
  });

  it('should cipher and decipher data 2', async function () {
    const data = ethers.utils.formatBytes32String("Hello World");
    const key = ethers.utils.formatBytes32String("mysecretkey");
    const iv = ethers.utils.formatBytes32String("mysecretiv");
    const cipherMessage = await this.reveal.cipherCTR(data, key, iv);
    const decipherMessage = await this.reveal.cipherCTR(cipherMessage, key, iv);
    //console.log(data, key, cipherMessage, decipherMessage);
    expect(decipherMessage).to.equal(data, `data: ${data}\nkey: ${key}\ncipherMessage: ${cipherMessage}\ndecipherMessage: ${decipherMessage}`);
  });

  it('should cipher and decipher 32 bytes data with CTR5', async function () {
    const data = ethers.utils.formatBytes32String("Hello World");
    const key = ethers.utils.formatBytes32String("mysecretkey");
    const iv = ethers.utils.formatBytes32String("mysecretiv");
    const cipherMessage = await this.reveal.cipherCTR(data, key, iv);
    const decipherMessage = await this.reveal.cipherCTR(cipherMessage, key, iv);
    //console.log(`data: ${data}\nkey: ${key}\niv: ${iv}\ncipherMessage: ${cipherMessage}\ndecipherMessage: ${decipherMessage}`);
    expect(decipherMessage).to.equal(data, `data: ${data}\nkey: ${key}\niv: ${iv}\ncipherMessage: ${cipherMessage}\ndecipherMessage: ${decipherMessage}`);
  });

  it('should cipher and decipher an array of 250 random 8 bits data with CTR5', async function () {
    // create array of random byte data
    const data: Uint8Array = ethers.utils.randomBytes(250);
    const key = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toHexString();
    const iv = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toHexString();
    // cipherData is an array of bytes
    const cipherData: Uint8Array = new Uint8Array(250);
    const decipherData: Uint8Array = new Uint8Array(250);
    for (let index = 0; index < data.length; index++) {
      cipherData[index] = await this.reveal.cipherCTR(data[index], key, iv);
    }
    for (let index = 0; index < data.length; index++) {
      decipherData[index] = await this.reveal.cipherCTR(cipherData[index], key, iv)
    }
    // console.log(`data: ${data}\nkey: ${key}\niv: ${iv}\ncipherData: ${cipherData}\ndecipherMessage: ${decipherData}`);
    for (let index = 0; index < data.length; index++) {
      expect(decipherData[index]).to.equal(data[index]), `data: ${data[index]}\ncipherData: ${cipherData[index]}\ndecipherMessage: ${decipherData[index]}`;
    }
  });

  it('should cipher and decipher a uint16 in Hex format with CTR5', async function () {
    const data = ethers.BigNumber.from(28266).toHexString();
    const key = "0xc5d5c2a9e010e331c5a3c56ae0a9e5b6b9eeb00f12508e620c2c12f719919637";
    const iv = "0xabc42b060643064ff293bb9f18174ef81b235f6e3814d2d23372c079f2f4bfee";
    const cipherMessage = await this.reveal.cipherCTR(data, key, iv);
    const decipherMessage = await this.reveal.cipherCTR(cipherMessage, key, iv);
    // console.log(`data: ${data}\nkey: ${key}\niv: ${iv}\ncipherMessage: ${cipherMessage}\ndecipherMessage: ${decipherMessage}`);
    expect(decipherMessage).to.equal(data, `data: ${data}\nkey: ${key}\niv: ${iv}\ncipherMessage: ${cipherMessage}\ndecipherMessage: ${decipherMessage}`);
  });


  it('should cipher and decipher a uint16 with CTR5', async function () {
    const test_case = [{ data: 6444, 
      key: '0x4ef0c55641d169693b44cbcf08409822c1fcda6c0728fa9667475a5a831e30ea', 
      iv: '0x6a824663226a432a4c2c485600d14f9e688c78ce10997d11ae6e03b0a4b3505a', 
      cipherData: 74, 
      decipherData: 83 },
      {data: 63654,	key: '0x332baf02df3104cdc74fc9771764c9d5ce1ee1f5e96be096924210caa00d04f9',	iv: '0xf95aa2b781742ef85ab9b62e273929cbb2e783adf48e91a0900d02f186c922a7',	cipherData: 117,	decipherData: 141},
      {data: 43089,	key: '0xc4944ac9ed5bbbebc7bc53c7a4da3ba2dff1be15525c7c768d063c4937d5992f',	iv: '0x7717098a8f34433678944feb25992180cadfce01db37f160de7d2d35399edcfd',	cipherData: 212,	decipherData: 124}];
    for (let index = 0; index < test_case.length; index++) {
      const data = test_case[index].data;
      const key = test_case[index].key;
      const iv = test_case[index].iv;
      const cipherMessage = await this.reveal.cipherCTR(data, key, iv);
      const decipherMessage = await this.reveal.cipherCTR(cipherMessage, key, iv);
      //console.log(`data: ${data}\nkey: ${key}\niv: ${iv}\ncipherMessage: ${cipherMessage}\ndecipherMessage: ${decipherMessage}`);
    expect(decipherMessage).to.equal(ethers.BigNumber.from(data).toHexString(),`data: ${data}\tkey: ${key}\tiv: ${iv}
    \nfailing Ciphered:${test_case[index].cipherData}\tdeciphered:${test_case[index].decipherData} 
    \ncipherMessage: ${cipherMessage}\tdecipherMessage: ${decipherMessage}`);
    }
  });

  it('should cipher and decipher an array of n random uint16 with CTR5', async function () {
    const _size = 10;
    let data: Uint16Array = new Uint16Array(_size);
    // fill array with random number limited to 16 bit uint
    for (let index = 0; index < _size; index++) {
      // create random number of 16 bits and add it to the array
      //Math.floor(Math.random() * 65536);
      data[index] = ethers.BigNumber.from(ethers.utils.randomBytes(2)).toNumber();
    }
    const key = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toHexString();
    const iv = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toHexString();
    // cipherData is an array of 32bytes big numbers
    const cipherDataString: string[]=[];
    const cipherData: BigNumber[] = new Array(_size);
    const decipherData: BigNumber[] = new Array(_size);
    for (let index = 0; index < data.length; index++) {
      const cd:BigNumber = await this.reveal.cipherCTR(data[index], key, iv);
      //console.log("ciphered as string",cd.toString());
      cipherData[index] = cd;
      cipherDataString[index]=ethers.utils.formatBytes32String(cd.toString())
      // convert to hex string
      decipherData[index] = await this.reveal.cipherCTR(cipherData[index], key, iv);
      //console.log(`{data: ${data[index]},\tkey: '${key}',\tiv: '${iv}',\tcipherData: ${cipherData[index]},\tdecipherData: ${decipherData[index]}}`);
      expect(decipherData[index]).to.equal(ethers.BigNumber.from(data[index]).toHexString(),`{data: ${data[index]},\tkey: '${key}',\tiv: '${iv}',\tcipherData: ${cipherData[index]},\tdecipherData: ${decipherData[index]}}`);
    }
    //console.log(`{\ndata: [${data}],\nkey: '${key}',\niv: '${iv}',\ncipherData: [${cipherData}],\ndecipherMessage: [${decipherData}]}`);
    //console.log(cipherDataString);
  });

  it('should cipher and decipher an array of 250 random 16 bits in Hex string with CTR', async function () {
    let data: string[] = [];
    // fill array with random number limited to 16 bit uint
    for (let index = 0; index < 250; index++) {
      data[index] = ethers.BigNumber.from(ethers.utils.randomBytes(2)).toHexString() //ethers.utils.hexZeroPad(ethers.BigNumber.from(ethers.utils.randomBytes(2)).toHexString(), 32);
    }
    const key = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toHexString();
    const iv = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toHexString();
    // cipherData is an array of bytes
    const cipherData: string[] = [];
    const decipherData: string[] = [];
    for (let index = 0; index < data.length; index++) {
      cipherData[index] = await this.reveal.cipherCTR(data[index], key, iv);
      decipherData[index] = await this.reveal.cipherCTR(cipherData[index], key, iv);
      expect(decipherData[index]).to.equal(data[index]);
    }
    // console.log(`data: ${data}\nkey: ${key}\niv: ${iv}\ncipherData: ${cipherData}\ndecipherMessage: ${decipherData}`);
  });

  it('should cipher and decipher an uint256 with CTR', async function () {
    const data = ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 32);
    const key = ethers.utils.formatBytes32String("mysecretkey");
    const iv = ethers.utils.hexZeroPad(ethers.utils.hexlify(42), 32);
    const cipherMessage = await this.reveal.cipherCTR(data, key, iv);
    const decipherMessage = await this.reveal.cipherCTR(cipherMessage, key, iv);
    //console.log(`data: ${data}\nkey: ${key}\niv: ${iv}\ncipherMessage: ${cipherMessage}\ndecipherMessage: ${decipherMessage}`);
    expect(decipherMessage).to.equal(data,`data: ${data}\tkey: ${key}\tiv: ${iv}\tcipherMessage: ${cipherMessage}\tdecipherMessage: ${decipherMessage}`);
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
      let tokenId = await this.reveal.getTokenId_test(this.initialMint[i]);
      expect(await this.reveal.ownerOf(tokenId)).to.equal(this.owner,`tokenId: ${tokenId}, owner of tokenId: ${await this.reveal.ownerOf(tokenId)}, expected owner: ${this.owner}`);
    }
  });

  it('Should get encrypted token if not yet revealed', async function () {
    for (let i = 0; i < this.initialMint.length; i++) {
      let tokenId = await this.reveal.getTokenId_test(this.initialMint[i]);
      let tokenURI = await this.reveal.tokenURI(tokenId);
      // extract the encrypted token from the tokenURI
      // tokenUri is a base64 encoded string
      let tokenUri_json = JSON.parse(base64decode(tokenURI.split(',')[1]));
      //console.log(tokenUri_json);
      let tokenId_received = ethers.BigNumber.from(tokenUri_json.name.split('#')[1]);
      expect(tokenId_received).to.equal(tokenId,`tokenId received: ${tokenId_received}, tokenId expected: ${tokenId}`);
    }
  });

  it('Should get decrypted token if revealed', async function () {
    const test_case ={
      data: [15085,47457,48739,27943,55554,26839,57945,41829,13315,53910],
      key: '0x2f4ace5537c7668edf3f6712a4f8bb86d86d2a93e6c47f7031e5bb23e2a04e3b',
      iv: '0xb0a91108bcedf334c7c7a9eeebee973a6272eda3286317b93ad4d9fc194caeaf',
      cipherData: [0x4a2f,0xc9a3,0xcea1,0x1de5,0xa9c0,0x1815,0x929b,0xd3a7,0x44c1,0xa254],
      decipherMessage: [0x3aed,0xb961,0xbe63,0x6d27,0xd902,0x68d7,0xe259,0xa365,0x3403,0xd296]}
      ;
      // console.log("test_case\n", test_case);
    await this.reveal.setHiddenValue(test_case.cipherData);

    for (let i = 0; i < this.initialMint.length; i++) {
      const index = this.initialMint[i];
      console.log("\nthis.initialMint[i] ", index);

      let tokenId = await this.reveal.getTokenId_test(index);
      console.log("tokenId: ", tokenId, " hex: ", ethers.BigNumber.from(tokenId).toHexString());

      // reveal the token
      await this.reveal.setRevealKey(test_case.key, test_case.iv);
      let revealed_tokenId = await this.reveal.reveal_test(tokenId);
      console.log("revealed TokenId: ", revealed_tokenId);
      
      let tokenURI = await this.reveal.tokenURI(tokenId);
      // extract the encrypted token from the tokenURI
      // tokenUri is a base64 encoded string
      let tokenUri_json = JSON.parse(base64decode(tokenURI.split(',')[1]));
      console.log(tokenUri_json);
      let tokenId_received = ethers.BigNumber.from(tokenUri_json.name.split('#')[1]);
      expect(tokenId_received).to.equal(ethers.BigNumber.from(test_case.decipherMessage[index]), "tokenId_received: " + tokenId_received + " test_case.decipherMessage[i]: " + test_case.decipherMessage[index]);
    }
  });

  it('Is able to query the NFT balances of an address', async function () {
    expect(await this.reveal.balanceOf(this.owner)).to.equal(this.initialMint.length);
  });

  it('Is able to mint new NFTs to the collection to collector', async function () {
    let nextCounter = ethers.BigNumber.from(this.initialMint.length + 1);
    let tokenId = await this.reveal.getTokenId_test(nextCounter);
    await this.collectorContract.mint();
    expect(await this.reveal.ownerOf(tokenId)).to.equal(this.collector);
  });

  it('Emits a transfer event for newly minted NFTs', async function () {
    let nextCounter = ethers.BigNumber.from(this.initialMint.length + 1);
    let tokenId = await this.reveal.getTokenId_test(nextCounter);
    await expect(this.reveal.mint()).to.emit(this.reveal, "Transfer")
      .withArgs("0x0000000000000000000000000000000000000000", this.owner, tokenId);
    //NFTs are minted from zero address
  });


  it('Is able to transfer NFTs to another wallet when called by owner', async function () {
    let tokenId = await this.reveal.getTokenId_test(this.initialMint[0]);
    await this.reveal["safeTransferFrom(address,address,uint256)"](this.owner, this.collector, tokenId);
    expect(await this.reveal.ownerOf(tokenId)).to.equal(this.collector);
  });

  it('Emits a Transfer event when transferring a NFT', async function () {
    let tokenId = await this.reveal.getTokenId_test(this.initialMint[0]);
    await expect(this.reveal["safeTransferFrom(address,address,uint256)"](this.owner, this.collector, tokenId))
      .to.emit(this.reveal, "Transfer")
      .withArgs(this.owner, this.collector, tokenId);
  });

  it('Approves an operator wallet to spend owner NFT', async function () {
    let tokenId = await this.reveal.getTokenId_test(this.initialMint[0]);
    await this.reveal.approve(this.collector, tokenId);
    expect(await this.reveal.getApproved(tokenId)).to.equal(this.collector);
  });

  it('Emits an Approval event when an operator is approved to spend a NFT', async function () {
    let tokenId = await this.reveal.getTokenId_test(this.initialMint[0]);
    await expect(this.reveal.approve(this.collector, tokenId))
      .to.emit(this.reveal, "Approval")
      .withArgs(this.owner, this.collector, tokenId);
  });

  it('Allows operator to transfer NFT on behalf of owner', async function () {
    let tokenId = await this.reveal.getTokenId_test(this.initialMint[0]);
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
      let tokenId = await this.reveal.getTokenId_test(this.initialMint[i]);
      await this.collectorContract["safeTransferFrom(address,address,uint256)"](this.owner, this.collector, tokenId);
    }
    expect(await this.reveal.balanceOf(this.collector)).to.equal(this.initialMint.length.toString());
  });


});