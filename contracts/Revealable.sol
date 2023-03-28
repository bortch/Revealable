// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Revealable Contract
 * @author Bortch
 * @notice Reveal is a contract that can hide and reveal a secret
 * @dev just inherit from this contract to add the reveal feature
 * @dev add you hidden values in the _hiddenValue array
 */
contract Revealable is Ownable {
    bool internal _isRevealed = false;
    bytes32 internal _revealKey = "";
    bytes32 internal _nonce = "";

    // Array of value to hide and reveal
    // hardcode or set via call to setHiddenValue()
    uint16[] internal _hiddenValue;// = [/*hardcode here*/];

    // Constructor will be called on contract creation
    constructor() {}

    /**
     * @notice returns the revealed value
     * @param value the value in uint256
     * @return bytes the revealed value as bytes array (containing 32 bytes)
     */
    function reveal(uint256 value) internal view returns (bytes memory) {
        // transform value into equivalent bytes32 then into bytes
        bytes memory valueBytes = abi.encodePacked(bytes32(value));
        // return the revealed value
        return cipherCTR(valueBytes, _revealKey, _nonce);
    }

    /**
     * @notice returns the revealed value at the given index
     * @param index the index of the hidden value to reveal
     * @return uint256 the revealed value as uint256
     */
    function revealIndex(uint256 index) internal view returns (uint256) {
        return literalConvertBytesToUint256(reveal(getHiddenValue(index)));
    }

    /**
     * @notice Owner can set the hidden values
     * @param hiddenValue the hidden values
     * @dev the hidden values are stored as uint16 to save gas
     */
    function setHiddenValue(uint16[] memory hiddenValue) public onlyOwner {
        _hiddenValue = hiddenValue;
    }

    /**
     * @notice Owner can set the key to reveal the hidden values
     * @param revealKey the key to reveal the hidden values
     * @param nonce the nonce to reveal the hidden values
     */
    function setRevealKey(bytes32 revealKey, bytes32 nonce) public onlyOwner {
        _revealKey = revealKey;
        _nonce = nonce;
        _isRevealed = true;
    }

    /**
     * @notice returns the nth hidden value as 256 bits
     * @param index the nth hidden value
     * @return uint256 the hidden value as uint256
     */
    function getHiddenValue(uint256 index) internal view returns (uint256) {
        return literalConvert16to256(_hiddenValue[index]);
    }

         /**
     * @notice The function takes an uint16 value and returns a uint256 value after being packed into bytes to get à right padding
     * @param value: an uint16 value
     * @return uint256: the uint256 value of the uint16 value
     */
    function literalConvert16to256(uint16 value) public pure returns (uint256){
        // uint16 into bytes2
        // bytes2 into bytes32 for implicite right padding
        // bytes32 into equivalent uint256
        return uint256(bytes32(bytes2(value)));
    }

    /**
     * @notice The function receive a bytes array and return a uint256 limited to 16 bits
     * @param data: a bytes array
     * @return uint256: the uint256 value of the first 16 bits of the bytes array
     */
    function literalConvertBytesToUint256(bytes memory data) public pure returns (uint256){
        // bytes into bytes2 and trim the first 2 bytes
        bytes2 tempBytes2;
            assembly {
                tempBytes2 := mload(add(data, 0x20))
            }
        // bytes2 into uint16 then into uint256
        return uint256(uint16(tempBytes2));
    }

     /*
    * @notice: Decrypts data using CTR mode
    * @param data: Data to decrypt
    * @param key: Key to decrypt data with
    * @param iv: Initialization vector
    * @return: Decrypted data
    * @url:https://ethereum.stackexchange.com/questions/69825/decrypt-message-on-chain
    * @dev: inspired by Mikhail Vladimirov notes
    */
    function cipherCTR(
        bytes memory data,
        bytes32 key,
        bytes32 iv
    ) public pure returns (bytes memory result) {
        uint256 length = data.length;
        assembly {
            result := mload(0x40)
            mstore(0x40, add(add(result, length), 32))
            mstore(result, length)
        }

        for (uint256 i = 0; i < length; i += 32) {
            bytes32 dataBlock;
            assembly {
                dataBlock := mload(add(data, add(i, 32)))
            }
           
            bytes32 keyStream = keccak256(abi.encode(key,iv,bytes32(length-i)));
            bytes32 cipherBlock = dataBlock ^ keyStream;
            assembly {
                mstore(add(result, add(i, 32)), cipherBlock)
            }
        }
        return result;
    }
}
