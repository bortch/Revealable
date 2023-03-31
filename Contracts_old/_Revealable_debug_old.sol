// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

/**
 * @title Revealable Contract (Debug Version)
 * @author Bortch
 * @notice Reveal is a contract that can hide and reveal a secret
 * @dev just inherit from this contract to add the reveal feature
 * @dev add you hidden values in the _hiddenValue array
 */
contract Revealable_debug {
    address private _owner;
    bool internal _isRevealed = false;
    bytes32 internal _revealKey = "";
    bytes32 internal _nonce = "";

    // Array of value to hide and reveal
    // hardcode or set via call to setHiddenValues()
    uint16[] internal _hiddenValue;// = [/*hardcode here*/];

    modifier _ownerOnly() {
        require(msg.sender == _owner);
        _;
    }

    // Constructor will be called on contract creation
    constructor() {
        console.log("\n[\nRevealable::constructor called");
         _owner = msg.sender;
        console.log("Revealable::constructor _owner: %s", _owner);
        console.log("Revealable::constructor ends\n]\n");
    }

    /**
     * @notice returns the revealed value
     * @param value the value in uint256
     * @return bytes the revealed value as bytes array (containing 32 bytes)
     */
    function reveal(bytes32 value) internal view returns (bytes memory) {
        console.log("\n[\nRevealable::reveal called");
        console.log("Revealable::reveal value:");
        console.logBytes32(value);
        // transform value into equivalent bytes
        bytes memory valueBytes = abi.encodePacked(value);
        console.log("Revealable::reveal valueBytes:");
        console.logBytes(valueBytes);
        // return the revealed value
        console.log("Revealable::reveal ends\n]\n");
        return cipherCTR(valueBytes, _revealKey, _nonce);
    }

    /**
     * @notice returns the revealed value at the given index
     * @param index the index of the hidden value to reveal
     * @return uint256 the revealed value as uint256
     */
    function revealIndex(uint256 index) public view returns (uint256) {
        require(_isRevealed, "Revealable: contract not revealed");
        console.log("\n[\nRevealable::revealIndex called");
        uint16 hiddenValue = getHiddenValue(index);
        console.log("Revealable::revealIndex hiddenValue: %s", hiddenValue);
        bytes memory revealedValue = reveal(literalConvert_16toBytes32(hiddenValue));
        console.log("Revealable::revealIndex revealedValue:");
        console.logBytes(revealedValue);
        uint256 revealedValueAsUint256 = literalConvert_Bytes_to_Uint16_as_Uint256(revealedValue);
        console.log("Revealable::revealIndex revealedValueAsUint256: %s", revealedValueAsUint256);
        console.log("Revealable::revealIndex ends\n]\n");
        return revealedValueAsUint256;
    }

    /**
     * @notice Owner can set the hidden values
     * @param hiddenValue the hidden values
     * @dev the hidden values are stored as uint16 to save gas
     */
    function setHiddenValues(uint16[] memory hiddenValue) public _ownerOnly {
        //log each hidden value
        console.log("\n[\nRevealable::setHiddenValues called");
        console.log("Revealable::setHiddenValues hiddenValue.length: %s", hiddenValue.length);
        for (uint256 i = 0; i < hiddenValue.length; i++) {
            console.log("\thiddenValue[%s]: %s", i, hiddenValue[i]);
        }
        _hiddenValue = hiddenValue;
        console.log("Revealable::setHiddenValues ends\n]\n");
    }

    /**
     * @notice Owner can set the key to reveal the hidden values
     * @param revealKey the key to reveal the hidden values
     * @param nonce the nonce to reveal the hidden values
     */
    function setRevealKey(bytes32 revealKey, bytes32 nonce) public _ownerOnly {
        console.log("\n[\nRevealable::setRevealKey called");
        _revealKey = revealKey;
        _nonce = nonce;
        _isRevealed = true;
        console.log("Revealable::setRevealKey _revealKey:");
        console.logBytes32(_revealKey);
        console.log("Revealable::setRevealKey _nonce:");
        console.logBytes32(_nonce);
        console.log("Revealable::setRevealKey ends\n]\n");
    }

    /**
     * @notice returns the nth hidden value as 256 bits
     * @param index the nth hidden value
     * @return uint256 the hidden value as uint256
     */
    function getHiddenValue(uint256 index) internal view returns (uint16) {
        console.log("\n[\nRevealable::getHiddenValue called");
        console.log("Revealable::getHiddenValue index: %s", index);
        console.log("Revealable::getHiddenValue _hiddenValue[index]: %s", _hiddenValue[index]);
        console.log("Revealable::getHiddenValue ends\n]\n");
        return  _hiddenValue[index];
    }

         /**
     * @notice The function takes an uint16 value and returns a uint256 value after being packed into bytes to get à right padding
     * @param value: an uint16 value
     * @return uint256: the uint256 value of the uint16 value
     */
    function literalConvert_16to256(uint16 value) public view returns (uint256){
        console.log("\n[\nRevealable::literalConvert_16to256 called");
        // uint16 into bytes2
        bytes2 tempBytes2 = bytes2(value);
        console.log("Revealable::literalConvert_16to256 tempBytes2:");
        console.logBytes2(bytes2(tempBytes2));
        // bytes2 into bytes32 for implicite right padding
        bytes32 tempBytes32 = bytes32(tempBytes2);
        console.log("Revealable::literalConvert_16to256 tempBytes32:");
        console.logBytes32(bytes32(tempBytes32));
        // bytes32 into equivalent uint256
        uint256 tempUint256 = uint256(tempBytes32);
        console.log("Revealable::literalConvert_16to256 tempUint256: %s", tempUint256);
        console.log("Revealable::literalConvert_16to256 ends\n]\n");
        return uint256(bytes32(bytes2(value)));
    }

    /**
     * @notice the function explicitely convert an uint16 into bytes32
     * @param value: an uint16 value
     * @return bytes32: the bytes32 value of the uint16 value
     */ 
    function literalConvert_16toBytes32(uint16 value) public view returns (bytes32) {
        console.log("\n[\nRevealable::literalConvert_16toBytes32 called");
        console.log("Revealable::literalConvert_16toBytes32 value: %s", value);
        bytes2 tempBytes2 = bytes2(value);
        console.log("Revealable::literalConvert_16toBytes32 tempBytes2:");
        console.logBytes2(bytes2(tempBytes2));
        bytes32 tempBytes32 = bytes32(tempBytes2);
        console.log("Revealable::literalConvert_16toBytes32 tempBytes32:");
        console.logBytes32(bytes32(tempBytes32));
        console.log("Revealable::literalConvert_16toBytes32 ends\n]\n");
        return bytes32(bytes2(value));
    }

    /**
     * @notice The function receive a bytes array and return a uint256 limited to 16 bits
     * @param data: a bytes array
     * @return uint256: the uint256 value of the first 16 bits of the bytes array
     */
    function literalConvert_Bytes_to_Uint16_as_Uint256(bytes memory data) public view returns (uint256){
        console.log("\n[\nRevealable::literalConvert_Bytes_to_Uint16_as_Uint256 called");
        // bytes into bytes2 and trim the first 2 bytes
        console.log("Revealable::literalConvert_Bytes_to_Uint16_as_Uint256 data:");
        console.logBytes(data);
        bytes2 tempBytes2;
            assembly {
                tempBytes2 := mload(add(data, 0x20))
            }
        console.log("Revealable::literalConvert_Bytes_to_Uint16_as_Uint256 tempBytes2:");
        console.logBytes2(bytes2(tempBytes2));
        // bytes2 into uint16 then into uint256
        uint16 tempUint16 = uint16(tempBytes2);
        console.log("Revealable::literalConvert_Bytes_to_Uint16_as_Uint256 tempUint16: %s", tempUint16);
        uint256 tempUint256 = uint256(tempUint16);
        console.log("Revealable::literalConvert_Bytes_to_Uint16_as_Uint256 tempUint256: %s", tempUint256);
        console.log("Revealable::literalConvert_Bytes_to_Uint16_as_Uint256 ends\n]\n");
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
    ) public view returns (bytes memory result) {
        console.log("\n[\nRevealable::cipherCTR called");
        console.log("Revealable::cipherCTR data:");
        console.logBytes(data);
        uint256 length = data.length;
        console.log("Revealable::cipherCTR length: %s", length);
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
            console.log("Revealable::cipherCTR dataBlock:");
            console.logBytes32(dataBlock);
            console.log("Revealable::cipherCTR key:");
            console.logBytes32(key);
            console.log("Revealable::cipherCTR iv:");
            console.logBytes32(iv);
            bytes32 keyStream = keccak256(abi.encode(key,iv,bytes32(length-i)));
            console.log("Revealable::cipherCTR keyStream:");
            console.logBytes32(keyStream);
            bytes32 cipherBlock = dataBlock ^ keyStream;
            console.log("Revealable::cipherCTR cipherBlock:");
            console.logBytes32(cipherBlock);
            assembly {
                mstore(add(result, add(i, 32)), cipherBlock)
            }
        }
        console.log("Revealable::cipherCTR result:");
        console.logBytes(result);
        console.log("Revealable::cipherCTR ends\n]\n");
        return result;
    }
}
