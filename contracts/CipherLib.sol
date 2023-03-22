// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/*
 * @title: CipherLib
 * @dev: Bortch
 * @notice: CipherLib is a library that contains methods to encrypt and decrypt data
 * @link: https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition/b66dfbe3e84287f6fa61c079007255270cd20c14
 */
library CipherLib {
    /*
     * @notice: Encrypts data using CTR mode
     * @param data: Data to encrypt
     * @param key: Key to encrypt data with
     * @return: Encrypted data
     */
    function cipherCTR(
        bytes memory data,
        bytes memory key
    ) internal pure returns (bytes memory) {
        uint256 length = data.length;
        bytes memory result = new bytes(length);

        for (uint256 i = 0; i < length; i += 32) {
            bytes32 hash = keccak256(abi.encodePacked(key, i));

            bytes32 chunk;
            assembly {
                chunk := mload(add(data, add(0x20, i)))
            }

            bytes32 encryptedChunk;
            assembly {
                encryptedChunk := xor(chunk, hash)
            }

            assembly {
                mstore(add(result, add(0x20, i)), encryptedChunk)
            }
        }

        return result;
    }

    /*
     * @notice: Decrypts data using CTR mode
     * @url:https://ethereum.stackexchange.com/questions/69825/decrypt-message-on-chain
     * @author: Mikhail Vladimirov
     * @param data: Data to decrypt
     * @param key: Key to decrypt data with
     * @return: Decrypted data
     */
    function cipherCTR2(
        bytes memory data,
        bytes memory key
    ) public pure returns (bytes memory result) {
        // Store data length on stack for later use
        uint256 length = data.length;

        assembly {
            // Set result to the address of the available free memory
            result := mload(0x40)
            // Overwrite 0x40 with the new value of 
            // the free memory pointer (increased by an offset of lenght + 32)
            mstore(0x40, add(add(result, length), 32))
            // Set result length
            mstore(result, length)
        }

        // Iterate over the data stepping by 32 bytes
        for (uint i = 0; i < length; i += 32) {
            // Generate hash of the key and offset
            bytes32 hash = keccak256(abi.encodePacked(key, i));

            bytes32 chunk;
            assembly {
                // Read 32-bytes data chunk
                chunk := mload(add(data, add(i, 32)))
            }
            // XOR the chunk with hash
            chunk ^= hash;
            assembly {
                // Write 32-byte encrypted chunk
                mstore(add(result, add(i, 32)), chunk)
            }
        }
    }

    /*
    * @notice: Decrypts data using CTR mode
    * @param data: Data to decrypt
    * @param key: Key to decrypt data with
    * @param iv: Initialization vector
    * @return: Decrypted data
    */
    function cipherCTR5(
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
            bytes32 keyStream = keccak256(abi.encode(key, bytes32((uint256(iv) + i)/32)));
            bytes32 cipherBlock = dataBlock ^ keyStream;
            assembly {
                mstore(add(result, add(i, 32)), cipherBlock)
            }
        }
        return result;
    }

    function cipherBytes32CTR(
        bytes32 data,
        bytes32 key,
        bytes32 iv
    ) public pure returns (bytes32 result) {
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
            bytes32 keyStream = keccak256(abi.encode(key, bytes32((uint256(iv) + i)/32)));
            bytes32 cipherBlock = dataBlock ^ keyStream;
            assembly {
                mstore(add(result, add(i, 32)), cipherBlock)
            }
        }
        return result;
    }
}
