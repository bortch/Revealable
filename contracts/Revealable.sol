// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

/**
 * @title Revealable Contract (Debug Version)
 * @author Bortch
 * @custom:url https://github.com/bortch/RevealOnChain
 * @notice Revealable is a contract that can hide and reveal a secret
 * @dev just inherit from this contract to add the Revealable feature
 */
contract Revealable {
    enum RevealState {
        Unset,
        Hidden,
        Revealed,
        Revealable
    }

    modifier _ownerOnly() {
        require(msg.sender == _owner);
        _;
    }

    modifier hasState(RevealState state) {
        // revert message by state
        string memory message = "in a valid state";
        if (state == RevealState.Hidden) {
            message = "hidden";
        } else if (state == RevealState.Revealed) {
            message = "revealed";
        } else if (state == RevealState.Revealable) {
            message = "revealable";
        }
        require(
            _revealState == state,
            string.concat("Revealable: contract not ", message)
        );
        _;
    }

    modifier hasBeenSet() {
        require(
            _revealState != RevealState.Unset,
            "Revealable: contract not set"
        );
        _;
    }

    address private _owner;
    RevealState internal _revealState = RevealState.Unset;
    bytes internal _hiddenValues;
    bytes32 internal _key = bytes32(0);
    bytes32 internal _initialVector = bytes32(0);
    uint256 internal _valueSize = 1;

    event Revealed(
        address indexed revealer,
        bytes32 indexed key,
        bytes32 indexed initialVector,
        bytes hiddenValues
    );
    event HiddenValuesSet(address indexed hider, uint256[] hiddenValues);
    event HiddenValuesSetAsBytes(address indexed hider, bytes hiddenValues);
    event ResetKey(
        address indexed resetter,
        bytes32 indexed key,
        bytes32 indexed initialVector
    );
    event ResetRevealable(address indexed resetter);

    constructor() {
        _owner = msg.sender;
    }

    /**
     * @notice Owner can reveal the hidden values
     */
    function reveal() public _ownerOnly hasState(RevealState.Revealable) {
        bytes memory hiddenValues = _hiddenValues;
        _hiddenValues = cipherCTR(hiddenValues, _key, _initialVector);
        _revealState = RevealState.Revealed;
        emit Revealed(msg.sender, _key, _initialVector, _hiddenValues);
    }

    /**
     * @notice Owner can reveal the hidden values
     * @param key key used to reveal the hidden values
     * @param initialVector initial vector used to reveal the hidden values
     * @param valueSize the size of each value in byte
     */
    function reveal(
        bytes32 key,
        bytes32 initialVector,
        uint256 valueSize
    ) public _ownerOnly {
        setRevealKey(key, initialVector, valueSize);
        reveal();
    }

    /**
     * @notice Owner can set the hidden values
     * @param values an array of hidden values
     * @param valueSize the size of each hidden value in byte
     * @dev this function costs more gas than setHiddenValues(bytes)
     * @dev use this function when the hidden values are not ciphered in bytes or if you've an array of uint256
     * @dev using that function when the contract is publicly deployed will show the size of each hidden value
     * @dev it could be a security issue if the hidden values are very sensitive
     */
    function setHiddenValues(
        uint256[] memory values,
        uint valueSize
    ) public _ownerOnly {
        // if _hiddenValues is not empty
        if (_hiddenValues.length > 0) {
            delete _hiddenValues;
        }
        // for each bytes of the value
        for (uint256 i = 0; i < values.length; i++) {
            for (uint256 j = 0; j < valueSize; j++) {
                //take only the valueSize first bytes lsbs
                bytes1 value = bytes1(uint8(values[i] >> (j * 8)));
                _hiddenValues.push(value);
            }
        }
        _revealState = RevealState.Hidden;
        emit HiddenValuesSet(msg.sender, values);
    }

    /**
     * @notice Owner can set the hidden values as bytes
     * @param values a bytes array of hidden values
     * @dev that function costs less gas than setHiddenValues(uint256[], uint256)
     * @dev use this function with hidden values already ciphered in bytes
     */
    function setHiddenValues(bytes memory values) public _ownerOnly {
        _hiddenValues = values;
        _revealState = RevealState.Hidden;
        emit HiddenValuesSetAsBytes(msg.sender, values);
    }

    /**
     * @notice get the hidden values as bytes
     * @return bytes the hidden values
     */
    function getHiddenValues() public view hasBeenSet returns (bytes memory) {
        return _hiddenValues;
    }

    /**
     * @notice returns the nth hidden value as 256 bits
     * @param index the nth hidden value
     * @return uint256 the hidden value as uint256
     */
    function getHiddenValue(
        uint256 index
    ) public view hasBeenSet returns (uint256) {
        // index must be less than the number of hidden values
        uint256 numHiddenValues = _hiddenValues.length / _valueSize;
        require(index < numHiddenValues, "Revealable: index out of range");
        // reach the nth hidden value
        uint256 hiddenValueIndex = index * _valueSize;
        bytes memory hiddenValue = new bytes(_valueSize);
        // get the n bytes of the hidden value
        for (uint256 i = 0; i < _valueSize; i++) {
            hiddenValue[_valueSize - 1 - i] = _hiddenValues[
                hiddenValueIndex + i
            ];
        }
        // convert the hidden value to uint of valueSize bytes
        uint256 hiddenValueAsUint256;
        for (uint i = 0; i < _valueSize; i++) {
            // shift the value to the left by 8 bits
            hiddenValueAsUint256 = hiddenValueAsUint256 << 8;
            // add the value to the hiddenValueAsUint256
            hiddenValueAsUint256 =
                hiddenValueAsUint256 |
                uint256(uint8(hiddenValue[i]));
        }
        return hiddenValueAsUint256;
    }

    /**
     * @notice Owner can set the key to reveal the hidden values
     * @param key the key to reveal the hidden values
     * @param initialVector the initialVector to reveal the hidden values
     */
    function setRevealKey(
        bytes32 key,
        bytes32 initialVector,
        uint256 valueSize
    ) public _ownerOnly hasState(RevealState.Hidden) {
        _key = key;
        _initialVector = initialVector;
        require(valueSize > 0, "valueSize couldn't be zero");
        _valueSize = valueSize;
        require(
            _key != bytes32(0) && _initialVector != bytes32(0),
            "Revealable: key and initialVector cannot be zero"
        );
        // if key and initialVector are set to zero, the contract is not revealed
        _revealState = RevealState.Revealable;
    }

    function resetRevealKey(
        bytes32 key,
        bytes32 initialVector,
        uint256 valueSize
    ) public _ownerOnly hasState(RevealState.Revealable) {
        emit ResetKey(msg.sender, _key, _initialVector);
        _revealState = RevealState.Hidden;
        setRevealKey(key, initialVector, valueSize);
    }

    /**
     * @notice Owner can reset the revealation of the hidden values
     * @dev the hidden values are deciphered using the key and the initialVector
     * @dev the hidden values are not safe anymore as it is written in the blockchain
     */
    function resetReveal() public _ownerOnly hasState(RevealState.Revealed) {
        // revert the cipher
        bytes memory hiddenValues = _hiddenValues;
        _hiddenValues = cipherCTR(hiddenValues, _key, _initialVector);
        _revealState = RevealState.Revealable;
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
            bytes32 keyStream = keccak256(abi.encode(key, iv, i));
            bytes32 cipherBlock = dataBlock ^ keyStream;
            assembly {
                mstore(add(result, add(i, 32)), cipherBlock)
            }
        }
        return result;
    }
}
