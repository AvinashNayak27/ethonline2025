// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

struct PaymentData {
    string paymentStatusTitle;
    uint256 paymentTotalAmount;
    string receiverUpiId;
    string upiTransactionId;
}

contract EIP712Verifier {
    using ECDSA for bytes32;

    string public constant NAME = "PaymentVerificationService";
    string public constant VERSION = "1";
    address public immutable AUTHORIZED_SIGNER;
    bytes32 private DOMAIN_SEPARATOR;
    bytes32 private constant PAYMENT_DATA_TYPEHASH =
        keccak256(
            "PaymentData(string paymentStatusTitle,uint256 paymentTotalAmount,string receiverUpiId,string upiTransactionId)"
        );

    constructor(address authorizedSignerAddress) {
        AUTHORIZED_SIGNER = authorizedSignerAddress;
        DOMAIN_SEPARATOR = _buildDomainSeparator();
    }

    function _buildDomainSeparator() internal view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256(
                        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                    ),
                    keccak256(bytes(NAME)),
                    keccak256(bytes(VERSION)),
                    block.chainid,
                    address(this)
                )
            );
    }

    function _hashPaymentData(
        PaymentData memory data
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    PAYMENT_DATA_TYPEHASH,
                    keccak256(bytes(data.paymentStatusTitle)),
                    data.paymentTotalAmount,
                    keccak256(bytes(data.receiverUpiId)),
                    keccak256(bytes(data.upiTransactionId))
                )
            );
    }

    // Helper function to compute EIP-712 digest
    function _hashTypedData(
        bytes32 structHash
    ) internal view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
            );
    }

    function verifyPaymentAndProcess(
        PaymentData memory data,
        bytes memory signature
    ) public view returns (bool) {
        bytes32 digest = _hashTypedData(_hashPaymentData(data));
        address signer = digest.recover(signature);
        if (signer == AUTHORIZED_SIGNER) {
            return true;
        }
        return false;
    }
}
