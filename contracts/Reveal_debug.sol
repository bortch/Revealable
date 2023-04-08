// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "./Revealable_debug.sol";
import "hardhat/console.sol";

/**
* @title Reveal an ERC721-Revealable Contract (Debug Version)
* @author Bortch
* @notice Reveal is a contract that can hide and reveal a secret
*/
contract Reveal_debug is ERC721, Revealable_debug {
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
        console.log("\nReveal::tokenURI called");
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
        console.log("\nReveal::getMetadata called");
        console.log("Reveal::getMetadata tokenId: %s", tokenId);
        uint256 displayId = tokenId;
        // print state
        console.log("Reveal::getMetadata _revealState: %s", uint256(_revealState));

        if(_revealState == RevealState.Revealed) {
            // require to be minted
            require(_exists(tokenId), "Reveal: token not minted");
            console.log("Reveal::getMetadata _tokenId:");
            displayId = getHiddenValue(tokenId);
            console.log("Reveal::getMetadata displayId: %s", displayId);
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
        console.log("\nReveal::mint called");
        // select next token id
        _counter.increment();
        uint256 tokenId = _counter.current();
        require(tokenId <= _maxSupply, "Max supply reached");
        // require tokenId don't already exist
        require(!_exists(tokenId), "Reveal: tokenId already minted");
        // mint
        _safeMint(msg.sender, tokenId);
        // get the token id
        // and save index to tokenId mapping
        // require to be minted
        require(_exists(tokenId), "Reveal: token not minted");
        console.log("Reveal::mint tokenId: %s", tokenId);
    }

    /**
     * @notice returns the token id of the token at the given index
     * @param tokenId the index of the token
     */
    function getSecretForTokenId(uint256 tokenId) public view returns (uint256) {
        console.log("\nReveal::getSecretForTokenId called with index: %s", tokenId);
        return getHiddenValue(tokenId);
    }

}
