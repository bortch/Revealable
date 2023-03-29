// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "./CipherLib.sol";
import "./Revealable.sol";
//import "hardhat/console.sol";

/**
* @title Reveal a Revealable Contract
* @author Bortch
* @notice Reveal is a contract that can hide and reveal a secret
*/
contract Reveal is ERC721, Revealable {
    using Strings for uint256;
    using Strings for uint16;
    using Counters for Counters.Counter;

    Counters.Counter private _counter;
    uint16 private _maxSupply = 5;

    // Constructor will be called on contract creation
    constructor() ERC721("Reveal", "REVEAL") {
        _counter.reset();
    }

    /**
     * @notice Override the baseURI function to return the on-chain URI
     */
    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        return getMetadata(tokenId);
    }

    /**
     * @notice returns the metadata of the token
     * @param tokenId the token id
     */
    function getMetadata(
        uint256 tokenId
    ) public view virtual returns (string memory) {
        // build and return the metadata JSON
        uint256 displayId = tokenId;

        if(_isRevealed) {
            bytes32 _tokenId = literalConvert_16toBytes32(uint16(tokenId));
            bytes memory revealed = reveal(_tokenId);
            displayId = literalConvert_Bytes_to_Uint16_as_Uint256(revealed);
        }       
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


    function mint() public {
        // select next token id
        _counter.increment();
        require(_counter.current() <= _maxSupply, "Max supply reached");
        // get the token id
        uint256 tokenKey = _counter.current();
        uint256 tokenId = getTokenId(tokenKey);
        _safeMint(msg.sender, tokenId);
    }

    /**
     * @notice returns the token id of the token at the given index
     * @param index the index of the token
     */
    function getTokenId(uint256 index) public view returns (uint256) {
        return uint256(getHiddenValue(index));
    }
    
}
