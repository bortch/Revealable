// // SPDX-License-Identifier: MIT
// pragma solidity 0.8.18;

// import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/utils/Strings.sol";
// import "@openzeppelin/contracts/utils/Counters.sol";
// import "@openzeppelin/contracts/utils/Base64.sol";
// import "./CipherLib.sol";
// //import "./Revealable.sol";
// import "./Revealable_debug.sol";
// import "hardhat/console.sol";

// /**
// * @title Reveal an ERC721-Revealable Contract (Debug Version)
// * @author Bortch
// * @notice Reveal is a contract that can hide and reveal a secret
// */
// contract Reveal_debug is ERC721, Revealable_debug {
//     using Strings for uint256;
//     using Strings for uint16;
//     using Counters for Counters.Counter;

//     Counters.Counter private _counter;
//     uint16 private _maxSupply = 5;

//     // Constructor will be called on contract creation
//     constructor() ERC721("Reveal", "REVEAL") {
//         _counter.reset();
//     }

//     /**
//      * @notice Override the baseURI function to return the on-chain URI
//      */
//     function tokenURI(
//         uint256 tokenId
//     ) public view virtual override returns (string memory) {
//         console.log("\nReveal::tokenURI called");
//         return getMetadata(tokenId);
//     }

//     /**
//      * @notice returns the metadata of the token
//      * @param tokenId the token id
//      */
//     function getMetadata(
//         uint256 tokenId
//     ) public view virtual returns (string memory) {
//         // build and return the metadata JSON
//         console.log("\nReveal::getMetadata called");
//         console.log("Reveal::getMetadata tokenId: %s", tokenId);
//         uint256 displayId = tokenId;

//         if(_isRevealed) {
//             bytes32 _tokenId = literalConvert_16toBytes32(uint16(tokenId));
//             console.log("Reveal::getMetadata _tokenId:");
//             console.logBytes32(_tokenId);
//             bytes memory revealed = reveal(_tokenId);
//             console.log("Reveal::getMetadata revealed:");
//             console.logBytes(revealed);
//             displayId = literalConvert_Bytes_to_Uint16_as_Uint256(revealed);
//             console.log("Reveal::getMetadata displayId: %s", displayId);
//         }       
//         return
//             string.concat(
//                 "data:application/json;base64,",
//                 Base64.encode(
//                     bytes(
//                         string.concat(
//                             '{"name": "Reveal #',
//                             displayId.toString(),
//                             '",',
//                             '"description": "Reveal is a collection of on-chain NFTs"',
//                             // add whatever you want
//                             "}"
//                         )
//                     )
//                 )
//             );
//     }


//     function mint() public {
//         console.log("\nReveal::mint called");
//         // select next token id
//         _counter.increment();
//         require(_counter.current() <= _maxSupply, "Max supply reached");
//         // get the token id
//         uint256 tokenKey = _counter.current();
//         uint256 tokenId = getTokenId(tokenKey);
//         console.log("Reveal::mint tokenId: %s", tokenId);
//         _safeMint(msg.sender, tokenId);
//     }

//     /**
//      * @notice returns the token id of the token at the given index
//      * @param index the index of the token
//      */
//     function getTokenId(uint256 index) public view returns (uint256) {
//         console.log("\nReveal::getTokenId called with index: %s", index);
//         return uint256(getHiddenValue(index));
//     }

//     // public function for testing

//     /**
//      * @notice returns the nth token id
//      * @param n the nth token id
//      */
//     function getTokenId_test(uint256 n) public view returns (uint256) {
//         console.log("\nReveal::getTokenId_test called with n: %s", n);
//         return literalConvert_16to256(getHiddenValue(n));
//     }

//     function reveal_test(uint256 tokenId) public view returns (uint256) {
//         console.log("\nReveal::reveal_test called with tokenId: %s", tokenId);
//         return literalConvert_Bytes_to_Uint16_as_Uint256(reveal(bytes32(tokenId))); }

//     function getHiddenValue_test(uint256 n) public view returns (uint256) {
//         console.log("\nReveal::getHiddenValue_test called with n: %s", n);
//         uint256 tokenId = getHiddenValue(n);
//         console.log("Reveal::getHiddenValue_test tokenId: %s", tokenId);
//         return tokenId;
//     }

//     function revealIndex_test(uint256 tokenId) public view returns (uint256) {
//         console.log("\nReveal::revealIndex_test called with tokenId: %s", tokenId);
//         return revealIndex(tokenId);
//     }
// }
