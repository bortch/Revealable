// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "./CipherLib.sol";
//import "hardhat/// console.sol";

/**
* @title Reveal a Revealable Contract
* @author Bortch
* @notice Reveal is a contract that can hide and reveal a secret
*/
contract Reveal is ERC721, Ownable {
    using Strings for uint256;
    using Strings for uint16;
    using Counters for Counters.Counter;

    bool private _isRevealed = false;

    Counters.Counter private _counter;
    uint16 private _maxSupply = 5;
    bytes32 private _revealKey = "";
    bytes32 private _nonce = "";

    // array of token ids
    uint16[] private _hiddenIds = [0x56f2,0x8eaa,0x05f5,0x06a4,0xefeb,0x4568,0xc508,0x9392,0xbd81,0x1cb0];

    // Constructor will be called on contract creation
    constructor() ERC721("Reveal", "REVEAL") {
        _counter.reset();
    }

    /**
     * @notice Owner can set the key to reveal the token ids
     */
    function setRevealKey(bytes32 revealKey, bytes32 nonce) public onlyOwner {
        _revealKey = revealKey;
        _nonce = nonce;
        _isRevealed = true;
    }

    /**
     * @notice Override the baseURI function to return the on-chain URI
     */
    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        _requireMinted(tokenId);
        // if the token is not revealed,
        // it still returns the metadata
        // but the tokenId is crypted
        return getMetadata(tokenId);
    }

    /**
     * @notice returns the metadata of the token
     * @param tokenId the token id
     */
    function getMetadata(
        uint256 tokenId
    ) public view virtual returns (string memory) {
        _requireMinted(tokenId);
        // console.log("getMetadata\ttokenId", tokenId);
        // build and return the metadata JSON
        uint256 displayId = tokenId;

        if(_isRevealed) {
            bytes memory revealed = reveal(tokenId);
            // console.log("getMetadata\trevealed");
            // console.logBytes(revealed);
            // crop to bytes2
            bytes2 tempBytes2;
            assembly {
                tempBytes2 := mload(add(revealed, 0x20))
            }
            // console.log("getMetadata\ttempBytes2");
            // console.logBytes2(tempBytes2);
            // convert bytes2 to string
            uint16 tempBytes16 = uint16(tempBytes2);
            displayId = uint256(tempBytes16);
            // console.log("getMetadata\ttempBytes16", tempBytes16);
        }
        // console.log("getMetadata\tdisplayId:",displayId);
        
        return
            string.concat(
                "data:application/json;base64,",
                Base64.encode(
                    bytes(
                        string.concat(
                            '{"name": "Reveal #',
                            displayId.toString(),
                            '",',
                            '"description": "Reveal is a collection of on-chain NFTs"',
                            // add whatever you want
                            "}"
                        )
                    )
                )
            );
    }

    /**
     * @notice returns the nth token id
     * @param n the nth token id
     */
    function getTokenId(uint256 n) public view returns (uint256) {
        // string to int
        // console.log("getTokenId\tn", n);
        // console.log("getTokenId\thiddenIds:");
        // console.log(_hiddenIds[n]);
        return packTokenId(_hiddenIds[n]);
    }

    /**
     * @notice returns a uint256 tokenId after being packed into bytes
     */
    function packTokenId(uint16 tokenId) public view returns (uint256 packed){
        // uint16 into bytes2
        bytes2 _tokenId = bytes2(tokenId);
        // console.log("packTokenId\t_tokenId in bytes2");
        // console.logBytes2(_tokenId);
        // bytes2 into bytes32 for padding
        bytes32 _packed = bytes32(_tokenId);
        // console.log("packTokenId\t_packed in bytes32");
        // console.logBytes32(_packed);
        // bytes32 into equivalent uint256
        packed = uint256(_packed);
        // console.log("packTokenId\t_packed in uint256");
        // console.log(packed);
        return packed;
    }

    function mint() public {
        // select next token id
        _counter.increment();
        require(_counter.current() <= _maxSupply, "Max supply reached");
        // get the token id
        uint256 tokenKey = _counter.current();
        uint256 tokenId = packTokenId(_hiddenIds[tokenKey]);
        _safeMint(msg.sender, tokenId);
    }

    /**
     * @notice returns the revealed token id
     * @param tokenId the token id
     * @return bytes the revealed token id as bytes array (containing 32 bytes)
     */
    function reveal(uint256 tokenId) public view returns (bytes memory) {
        bytes32 _tokenId = bytes32(tokenId);
        // console.log("reveal\t_tokenId in bytes32");
        // console.logBytes32(_tokenId);

        // transform tokenId into equivalent bytes32 then into bytes
        bytes memory tokenIdBytes = abi.encodePacked(bytes32(tokenId));
        // console.log("reveal\ttokenId in Bytes");
        // console.logBytes(tokenIdBytes);
        if (!_isRevealed) {
            return tokenIdBytes;
        }
        return cipher(tokenIdBytes, _revealKey, _nonce);
    }

    // set to pure
    function cipher(
        bytes memory data,
        bytes32 key,
        bytes32 iv
    ) public view returns (bytes memory result) {
        return CipherLib.cipherCTR5(data, key, iv);
    }
}
