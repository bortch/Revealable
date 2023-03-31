// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "hardhat/console.sol";

/**
 * @title Revealable Contract (Debug Version)
 * @author Bortch
 * @custom:url https://github.com/bortch/RevealOnChain
 * @notice Revealable is a contract that can hide and reveal a secret
 * @dev just inherit from this contract to add the reveal feature
 */
contract Revealable_debug {

    enum RevealState {
        Hidden,
        Revealed,
        Revealable
    }

    modifier _ownerOnly() {
        require(msg.sender == _owner);
        _;
    }

    address private _owner;
    RevealState internal _revealState = RevealState.Hidden;
    // Array of value to hide and reveal
    // hardcode or set via call to setHiddenValues()
    bytes internal _hiddenValues; // = [/*hardcode here*/];
    bytes32 internal _revealKey = bytes32(0);
    bytes32 internal _initialVector = bytes32(0);

    event Revealed(
        address indexed revealer,
        bytes32 indexed revealKey,
        bytes32 indexed nonce,
        bytes hiddenValues
    );
    event HiddenValuesSet(address indexed hider, uint256[] hiddenValues);
    event ResetKey(
        address indexed resetter,
        bytes32 indexed revealKey,
        bytes32 indexed nonce
    );
    event ResetRevealable(address indexed resetter);

    // Constructor will be called on contract creation
    constructor() {
        console.log("\n[\nRevealable::constructor called");
        _owner = msg.sender;
        console.log("Revealable::constructor _owner: %s", _owner);
        console.log("Revealable::constructor ends\n]\n");
    }

    function reveal() public _ownerOnly {
        // require RvealState.Revealable
        require(
            _revealState == RevealState.Revealable,
            "Revealable: contract not yet revealable"
        );
        console.log("\n[\nRevealable::reveal called");
        console.log("Revealable::reveal _hiddenValues (before):");
        console.logBytes(_hiddenValues);
        bytes memory hiddenValues = _hiddenValues;
        _hiddenValues = cipherCTR(hiddenValues, _revealKey, _initialVector);
        console.log("Revealable::reveal _hiddenValues (after):");
        console.logBytes(_hiddenValues);
        console.log("Revealable::reveal ends\n]\n");
        _revealState = RevealState.Revealed;
        emit Revealed(msg.sender, _revealKey, _initialVector, _hiddenValues);
    }

    /**
     * @notice Owner can set the hidden values
     * @param values an array of hidden values
     * @param valueSize the size of each hidden value
     */
    function setHiddenValues(
        uint256[] memory values,
        uint valueSize
    ) public _ownerOnly {
        console.log("\n[\nRevealable::setHiddenValues called");
        // create a new array of bytes from the uint256 array
        for (uint256 i = 0; i < values.length; i++) {
            console.log(
                "Revealable::setHiddenValues values[%s]: %s",
                i,
                values[i]
            );
            // for each bytes of the value
            bytes memory valueBytes = new bytes(valueSize);
            for (uint256 j = 0; j < valueSize; j++) {
                //take only the valueSize first bytes lsbs
                bytes1 value = bytes1(uint8(values[i] >> (j * 8)));

                console.log(
                    "Revealable::setHiddenValues value %s/%s:",
                    j,
                    valueSize
                );
                console.logBytes1(value);
                // add the value to the hiddenValue array
                _hiddenValues.push(value);
                valueBytes[valueSize - 1 - j] = value;
            }
            console.log("Revealable::setHiddenValues valueBytes:");
            console.logBytes(valueBytes);
        }
        console.log("Revealable::setHiddenValues _hiddenValues:");
        console.logBytes(_hiddenValues);
        _revealState = RevealState.Hidden;
        emit HiddenValuesSet(msg.sender, values);
    }

    /**
     * @notice returns the nth hidden value as 256 bits
     * @param index the nth hidden value
     * @return uint256 the hidden value as uint256
     */
    function getHiddenValue(
        uint256 index,
        uint256 valueSize
    ) public view returns (uint256) {
        console.log("\n[\nRevealable::getHiddenValue called");
        console.log("Revealable::getHiddenValue index: %s", index);
        // reach the nth hidden value
        uint256 hiddenValueIndex = index * valueSize;
        bytes memory hiddenValue = new bytes(valueSize);
        // get the n bytes of the hidden value
        for (uint256 i = 0; i < valueSize; i++) {
            hiddenValue[valueSize - 1 - i] = _hiddenValues[
                hiddenValueIndex + i
            ];
            console.log("Revealable::getHiddenValue hiddenValue[%s]:", i);
            console.logBytes1(hiddenValue[i]);
        }
        console.log("Revealable::getHiddenValue hiddenValue:");
        console.logBytes(hiddenValue);
        // convert the hidden value to uint of valueSize bytes
        uint256 hiddenValueAsUint256;
        for (uint i = 0; i < valueSize; i++) {
            // shift the value to the left by 8 bits
            hiddenValueAsUint256 = hiddenValueAsUint256 << 8;
            // add the value to the hiddenValueAsUint256
            hiddenValueAsUint256 =
                hiddenValueAsUint256 |
                uint256(uint8(hiddenValue[i]));
        }
        console.log(
            "Revealable::getHiddenValue hiddenValueAsUint256: %s",
            hiddenValueAsUint256
        );
        console.log("Revealable::getHiddenValue ends\n]\n");
        return hiddenValueAsUint256;
    }

    /**
     * @notice Owner can set the key to reveal the hidden values
     * @param revealKey the key to reveal the hidden values
     * @param nonce the nonce to reveal the hidden values
     */
    function setRevealKey(bytes32 revealKey, bytes32 nonce) public _ownerOnly {
        console.log("\n[\nRevealable::setRevealKey called");
        require(
            _revealState == RevealState.Hidden,
            "Revealable: contract not hidden anymore"
        );
        _revealKey = revealKey;
        _initialVector = nonce;
        require(
            _revealKey != bytes32(0) && _initialVector != bytes32(0),
            "Revealable: key and nonce cannot be zero"
        );
        // if key and nonce are set to zero, the contract is not revealed
        console.log("Revealable::setRevealKey _revealKey:");
        console.logBytes32(_revealKey);
        console.log("Revealable::setRevealKey _initialVector:");
        console.logBytes32(_initialVector);
        console.log("Revealable::setRevealKey ends\n]\n");
        _revealState = RevealState.Revealable;
    }

    function resetRevealKey(
        bytes32 revealKey,
        bytes32 nonce
    ) public _ownerOnly {
        require(
            _revealState == RevealState.Revealable,
            "Revealable: contract not revealable"
        );
        console.log("\n[\nRevealable::resetRevealKey called");
        emit ResetKey(msg.sender, _revealKey, _initialVector);
        _revealState = RevealState.Hidden;
        setRevealKey(revealKey, nonce);
        console.log("Revealable::resetRevealKey _revealKey:");
    }

    function resetReveal() public _ownerOnly {
        require(
            _revealState == RevealState.Revealed,
            "Revealable: contract not revealed"
        );
        console.log("\n[\nRevealable::resetReveal called");
        console.log("Revealable::resetReveal _hiddenValues (before):");
        console.logBytes(_hiddenValues);
        // revert the cipher
        bytes memory hiddenValues = _hiddenValues;
        _hiddenValues = cipherCTR(hiddenValues, _revealKey, _initialVector);
        console.log("Revealable::resetReveal _hiddenValues (after):");
        console.logBytes(_hiddenValues);
        _revealState = RevealState.Revealable;
        console.log("Revealable::resetReveal ends\n]\n");
        emit ResetRevealable(msg.sender);
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
            bytes32 keyStream = keccak256(abi.encode(key, iv, i));
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
