// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "./CipherLib.sol";

contract Reveal is ERC721, Ownable {
    using Strings for uint256;
    using Counters for Counters.Counter;

    bool private _isRevealed = false;

    Counters.Counter private _counter;
    uint16 private _maxSupply = 5;
    bytes32 private _revealKey = "";
    bytes32 private _nonce = "";

    // array of token ids
    uint16[] private _hiddenIds =  [25293,3784,15829,1612,26299,58420,48545,50278,4370,51563];

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
        // build and return the metadata JSON
        bytes memory revealed = reveal(tokenId);
        uint256 tempBytes32;

        assembly {
            tempBytes32 := mload(add(revealed, 0x20))
        }

        return
            string.concat(
                "data:application/json;base64,",
                Base64.encode(
                    bytes(
                        string.concat(
                            '{"name": "Reveal #',
                            tempBytes32.toString(),
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
        return uint256(_hiddenIds[n]);
    }

    function mint() public {
        // select next token id
        _counter.increment();
        require(_counter.current() <= _maxSupply, "Max supply reached");
        // get the token id
        uint256 tokenKey = _counter.current();
        uint256 tokenId = _hiddenIds[tokenKey];
        _safeMint(msg.sender, tokenId);
    }

    function reveal(uint256 tokenId) public view returns (bytes memory) {
        bytes memory tokenIdBytes = abi.encodePacked(tokenId);

        if (!_isRevealed) {
            return tokenIdBytes;
        }
        return cipher_CTR5(tokenIdBytes, _revealKey, _nonce);
    }

    // function cipher_CTR( bytes memory data, bytes memory key) public pure returns (bytes memory result) {
    //     return CipherLib.cipherCTR(data, key);
    // }

    // function cipher_CTR2( bytes memory data, bytes memory key) public pure returns (bytes memory result) {
    //     return CipherLib.cipherCTR2(data, key);
    // }

    function cipher_CTR5(
        bytes memory data,
        bytes32 key,
        bytes32 iv
    ) public pure returns (bytes memory result) {
        return CipherLib.cipherCTR5(data, key, iv);
    }
}
