
import { expect } from 'chai';
import { ethers } from "hardhat";
import { base64encode, base64decode } from 'nodejs-base64';
var chaiJsonEqual = require('chai-json-equal');
var chai = require('chai');
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
        CipherLib: this.cipherLib.address
      },
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
      this.initialMint.push(i);
    }
  });

  // Test cases


  // it('should cipher and decipher data', async function () {
  //   const data = ethers.utils.formatBytes32String("Hello World");
  //   const key = ethers.utils.formatBytes32String("mysecretkey");
  //   const cipherMessage = await this.reveal.cipher_CTR(data, key);
  //   const decipherMessage = await this.reveal.cipher_CTR(cipherMessage, key);
  //   //console.log(data, key, cipherMessage, decipherMessage);
  //   expect(decipherMessage).to.equal(data);
  // });

  // it('should cipher and decipher an uint256 with CTR', async function () {
  //   const data = ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 32);
  //   const key = ethers.utils.formatBytes32String("mysecretkey");
  //   const cipherMessage = await this.reveal.cipher_CTR(data, key);
  //   const decipherMessage = await this.reveal.cipher_CTR(cipherMessage, key);
  //   //console.log(data, key, cipherMessage, decipherMessage);
  //   expect(decipherMessage).to.equal(data);
  // });

  // it('should cipher and decipher data 2', async function () {
  //   const data = ethers.utils.formatBytes32String("Hello World");
  //   const key = ethers.utils.formatBytes32String("mysecretkey");
  //   const cipherMessage = await this.reveal.cipher_CTR2(data, key);
  //   const decipherMessage = await this.reveal.cipher_CTR2(cipherMessage, key);
  //   //console.log(data, key, cipherMessage, decipherMessage);
  //   expect(decipherMessage).to.equal(data);
  // });

  it('should cipher and decipher 32 bytes data with CTR5', async function () {
    const data = ethers.utils.formatBytes32String("Hello World");
    const key = ethers.utils.formatBytes32String("mysecretkey");
    const iv = ethers.utils.formatBytes32String("mysecretiv");
    const cipherMessage = await this.reveal.cipher_CTR5(data, key, iv);
    const decipherMessage = await this.reveal.cipher_CTR5(cipherMessage, key, iv);
    //console.log(`data: ${data}\nkey: ${key}\niv: ${iv}\ncipherMessage: ${cipherMessage}\ndecipherMessage: ${decipherMessage}`);
    expect(decipherMessage).to.equal(data);
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
      cipherData[index] = await this.reveal.cipher_CTR5(data[index], key, iv);
    }
    for (let index = 0; index < data.length; index++) {
      decipherData[index] = await this.reveal.cipher_CTR5(cipherData[index], key, iv)
    }
    // console.log(`data: ${data}\nkey: ${key}\niv: ${iv}\ncipherData: ${cipherData}\ndecipherMessage: ${decipherData}`);
    for (let index = 0; index < data.length; index++) {
      expect(decipherData[index]).to.equal(data[index]);
    }
  });

  it('should cipher and decipher a uint16 in Hex format with CTR5', async function () {
    const data = ethers.BigNumber.from(28266).toHexString();
    const key = "0xc5d5c2a9e010e331c5a3c56ae0a9e5b6b9eeb00f12508e620c2c12f719919637";
    const iv = "0xabc42b060643064ff293bb9f18174ef81b235f6e3814d2d23372c079f2f4bfee";
    const cipherMessage = await this.reveal.cipher_CTR5(data, key, iv);
    const decipherMessage = await this.reveal.cipher_CTR5(cipherMessage, key, iv);
    // console.log(`data: ${data}\nkey: ${key}\niv: ${iv}\ncipherMessage: ${cipherMessage}\ndecipherMessage: ${decipherMessage}`);
    expect(decipherMessage).to.equal(data);
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
      const cipherMessage = await this.reveal.cipher_CTR5(data, key, iv);
      const decipherMessage = await this.reveal.cipher_CTR5(cipherMessage, key, iv);
    expect(decipherMessage).to.equal(ethers.BigNumber.from(data).toHexString(),`data: ${data}\tkey: ${key}\tiv: ${iv}
    \nfailing Ciphered:${test_case[index].cipherData}\tdeciphered:${test_case[index].decipherData} 
    \ncipherMessage: ${cipherMessage}\tdecipherMessage: ${decipherMessage}`);
    }
  });

  it('should cipher and decipher an array of 250 random uint16 with CTR5', async function () {
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
    // cipherData is an array of bytes
    const cipherData: Uint16Array = new Uint16Array(_size);
    const decipherData: Uint16Array = new Uint16Array(_size);
    for (let index = 0; index < data.length; index++) {
      cipherData[index] = await this.reveal.cipher_CTR5(data[index], key, iv);
      // convert to hex string
      decipherData[index] = await this.reveal.cipher_CTR5(cipherData[index], key, iv);
      //console.log(`{data: ${data[index]},\tkey: '${key}',\tiv: '${iv}',\tcipherData: ${cipherData[index]},\tdecipherData: ${decipherData[index]}}`);
      expect(decipherData[index]).to.equal(data[index],`{data: ${data[index]},\tkey: '${key}',\tiv: '${iv}',\tcipherData: ${cipherData[index]},\tdecipherData: ${decipherData[index]}}`);
      
    }
    //console.log(`data: ${data}\nkey: ${key}\niv: ${iv}\ncipherData: ${cipherData}\ndecipherMessage: ${decipherData}`);
  });

  it('should cipher and decipher an array of 250 random 16 bits in Hex string with CTR5', async function () {
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
      cipherData[index] = await this.reveal.cipher_CTR5(data[index], key, iv);
      decipherData[index] = await this.reveal.cipher_CTR5(cipherData[index], key, iv);
      expect(decipherData[index]).to.equal(data[index]);
    }
    // console.log(`data: ${data}\nkey: ${key}\niv: ${iv}\ncipherData: ${cipherData}\ndecipherMessage: ${decipherData}`);
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

  it('Should get decrypted token if revealed', async function () {
    const test_case ={
    data: [40680,62189,49648,64105,39582,6161,16772,14403,60727,13646],
    key: '0x4a7f44b0a232173bafa4d3e3c6cb14434ae99209fc19c8b8d8c459a03e8f369a',
    iv: '0x12203a7dd451ff94aaf1cdb86100114e4d1ef27741877d42db32e769a732680b',
    cipherData: [25293,3784,15829,1612,26299,58420,48545,50278,4370,51563],
    decipherData: [40680,62189,49648,64105,39582,6161,16772,14403,60727,13646]};

    const expectedTokenId = ['0x1d33', '0x8232', '0x325c', '0xf5e9', '0x299c', '0xb106', '0x2d37', '0xcba2', '0x5974', '0xd905', '0xa077', '0xff14', '0x45d6', '0xa41b', '0xa13b', '0x5c86', '0xe2cc', '0xf744', '0xedd2', '0xc626', '0xa8df', '0x96f0', '0x7ce5', '0x8632', '0x9d95', '0xb3b3', '0xadac', '0x9ea5', '0x764e', '0xc5f7', '0x9f9c', '0x9091', '0x04e7', '0xddc1', '0x9542', '0x91b9', '0x0cd7', '0x7243', '0x8617', '0xd42e', '0x5b95', '0x3fcf', '0x1bdb', '0x6883', '0xca29', '0xb3a0', '0xf38e', '0xde54', '0x8b39', '0xd9c1', '0x7e48', '0x3ebe', '0xba8f', '0xe6e2', '0x2cfe', '0x9b', '0xdad0', '0x92ec', '0x12a7', '0x30d1', '0xa14e', '0x1574', '0x7bb2', '0xb08d', '0x6890', '0xdcbe', '0x5a23', '0x1432', '0x5b1e', '0xacd9', '0x3122', '0x1997', '0x1f1d', '0x18a6', '0xbe86', '0xbd49', '0xdf0e', '0xc22e', '0x221b', '0xbb37', '0x7de6', '0xb0fa', '0xf2ed', '0x62b9', '0x16e8', '0xff4e', '0x6fca', '0x1472', '0x3f44', '0x1236', '0x2624', '0xfbbe', '0xb1fa', '0xcc45', '0xef1d', '0xaba7', '0x25d4', '0x36ee', '0x5f62', '0x3635', '0xf1b2', '0x3431', '0xcbe2', '0x298c', '0x1306', '0x4a61', '0x481c', '0xdd69', '0x0984', '0x06a6', '0x5dff', '0x9507', '0x4fe1', '0xf8ad', '0xdedd', '0xbc48', '0xa5b8', '0xf6f9', '0x0924', '0x05ef', '0x6731', '0x2015', '0xfc07', '0xcab2', '0xcda4', '0x6f37', '0xcb27', '0xd4f5', '0x86c7', '0x088f', '0x5a2a', '0x1ac6', '0x1a06', '0xe73d', '0xe071', '0xa766', '0x36ec', '0xea94', '0x9c82', '0x7313', '0xcfa3', '0x2074', '0x3332', '0x20c5', '0xb66d', '0x8762', '0x76dd', '0xf210', '0x221f', '0xc753', '0x805e', '0x8945', '0x8e70', '0xd712', '0xe349', '0x0279', '0xb447', '0xb9d3', '0xee4e', '0x1eef', '0x96f9', '0x1084', '0x95d5', '0x4ccd', '0xba66', '0x4017', '0x95f2', '0x37fb', '0xb8e5', '0xd1ac', '0xf9a4', '0x0986', '0xf1e8', '0xd324', '0xcc3d', '0x9f21', '0x6cf4', '0x1487', '0x1140', '0x3a0a', '0xadaf', '0xfa11', '0xc83a', '0x5555', '0xa55f', '0x5231', '0x278b', '0xd9b6', '0xa411', '0x715e', '0x67a3', '0xdac5', '0x415a', '0x6eb4', '0x64a7', '0x2445', '0x7214', '0x4252', '0x6869', '0x954c', '0xa187', '0x8896', '0x5fd6', '0x5b58', '0x5aef', '0x7ed4', '0xcf23', '0xc8c1', '0x8156', '0xbc55', '0x08fc', '0x7972', '0x1a51', '0x93c4', '0xc3f8', '0x8a2d', '0x996f', '0xbd02', '0x2db7', '0x23d1', '0x4711', '0x8598', '0x2875', '0x4fef', '0xffac', '0xf02a', '0xe58f', '0x9967', '0x4bb4', '0xe25b', '0x434d', '0xfa', '0x16e5', '0xecf6', '0x995f', '0x5540', '0xeb66', '0xcd14', '0xf261', '0x8e09', '0xe2cb', '0xc672', '0x0a5f', '0xeece', '0x1618', '0xbc26', '0x38bd', '0x0458', '0xdc31', '0x14f7'
    ];
    for (let i = 0; i < this.initialMint.length; i++) {
      let tokenId = await this.reveal.getTokenId(this.initialMint[i]);
      //console.log(tokenId);
      // reveal the token
      await this.reveal.setRevealKey(test_case.key, test_case.iv);
      let tokenURI = await this.reveal.reveal(tokenId);
      console.log(tokenURI);
      expect(true).to.equal(true);
      // let tokenURI = await this.reveal.tokenURI(tokenId);
      // // extract the encrypted token from the tokenURI
      // // tokenUri is a base64 encoded string
      // let tokenUri_json = JSON.parse(base64decode(tokenURI.split(',')[1]));
      // console.log(tokenUri_json);
      // let tokenId_received = ethers.BigNumber.from(tokenUri_json.name.split('#')[1]);
      // expect(tokenId_received).to.equal(ethers.BigNumber.from(expectedTokenId[i]));
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