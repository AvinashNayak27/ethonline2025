/**
 *Submitted for verification at Arbiscan.io on 2025-10-26
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}

/// @notice Interface for the external EIP712 verifier
interface IEIP712Verifier {
    struct PaymentData {
        string paymentStatusTitle;
        uint256 paymentTotalAmount;
        string receiverUpiId;
        string upiTransactionId;
    }

    function verifyPaymentAndProcess(
        PaymentData memory data,
        bytes memory signature
    ) external view returns (bool);
}

contract Escrow {
    struct Deposit {
        address seller;
        string upiId;
        uint256 remainingFunds;
        uint256 minimumAmount;
    }

    struct Intent {
        address buyer;
        uint256 amount;
        uint256 timestamp;
        bool claimed;
        uint256 depositId;
    }

    IERC20 public usdc;
    IEIP712Verifier public verifier;

    uint256 public depositCounter;
    mapping(uint256 => Deposit) public deposits; // depositId => Deposit
    mapping(address => Intent) public buyerIntents; // buyer => intent
    mapping(string => bool) public claimedTransactions; // upiTxId => claimed

    /// @notice Conversion rate: 1 USDC = 80 INR → 1 INR = 1/80 USDC
    uint256 public constant INR_PER_USDC = 80;
    uint256 public constant USDC_DECIMALS = 1e6; // 6 decimals

    event FundsDeposited(
        uint256 depositId,
        address seller,
        string upiId,
        uint256 remainingFunds,
        uint256 minimumAmount
    );
    event BuyerIntent(uint256 depositId, address buyer, uint256 amount);
    event IntentCancelled(address buyer, uint256 depositId);
    event PaymentClaimed(
        address buyer,
        uint256 usdcAmount,
        string upiTransactionId
    );
    event FundsWithdrawn(address seller, uint256 depositId, uint256 amount);

    constructor(address verifierAddress, address usdcAddress) {
        require(verifierAddress != address(0), "Invalid verifier address");
        require(usdcAddress != address(0), "Invalid USDC address");

        verifier = IEIP712Verifier(verifierAddress);
        usdc = IERC20(usdcAddress);
    }

    /// @notice Seller deposits USDC tokens into escrow
    function depositFunds(
        string memory upiId,
        uint256 depositAmount,
        uint256 minimumAmount
    ) external {
        require(depositAmount > 0, "Deposit some funds");
        require(
            minimumAmount > 0 && minimumAmount <= depositAmount,
            "Invalid minimum amount"
        );

        require(
            usdc.transferFrom(msg.sender, address(this), depositAmount),
            "USDC transfer failed"
        );

        depositCounter++;
        deposits[depositCounter] = Deposit({
            seller: msg.sender,
            upiId: upiId,
            remainingFunds: depositAmount,
            minimumAmount: minimumAmount
        });

        emit FundsDeposited(
            depositCounter,
            msg.sender,
            upiId,
            depositAmount,
            minimumAmount
        );
    }

    /// @notice Buyer signals intent to buy USDC from a seller deposit
    function signalIntent(uint256 depositId, uint256 amount) external {
        Deposit storage d = deposits[depositId];
        require(d.seller != address(0), "Deposit not found");
        require(
            amount >= d.minimumAmount && amount <= d.remainingFunds,
            "Amount out of range"
        );
        require(!hasActiveIntent(msg.sender), "Already has an active intent");

        buyerIntents[msg.sender] = Intent({
            buyer: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            claimed: false,
            depositId: depositId
        });

        emit BuyerIntent(depositId, msg.sender, amount);
    }

    /// @notice Buyer cancels their active intent
    function cancelIntent() external {
        Intent storage intent = buyerIntents[msg.sender];
        require(!intent.claimed, "Already claimed");
        require(intent.amount > 0, "No active intent");

        emit IntentCancelled(msg.sender, intent.depositId);

        delete buyerIntents[msg.sender];
    }

    /// @notice Seller withdraws remaining funds
    function withdrawRemainingFunds(uint256 depositId) external {
        Deposit storage deposit = deposits[depositId];
        require(deposit.seller == msg.sender, "Not the seller");
        require(deposit.remainingFunds > 0, "No funds to withdraw");

        uint256 amount = deposit.remainingFunds;
        deposit.remainingFunds = 0;

        require(usdc.transfer(msg.sender, amount), "USDC transfer failed");

        emit FundsWithdrawn(msg.sender, depositId, amount);
    }

    /// @notice Claim USDC tokens after submitting verified EIP712 payment data
    function claimFunds(
        IEIP712Verifier.PaymentData memory data,
        bytes memory signature
    ) external {
        bool verified = verifier.verifyPaymentAndProcess(data, signature);
        require(verified, "Payment verification failed");

        require(
            compareStrings(data.paymentStatusTitle, "SUCCESS"),
            "Payment not successful"
        );
        require(!claimedTransactions[data.upiTransactionId], "Already claimed");

        uint256 paymentAmountInr = data.paymentTotalAmount;
        uint256 paymentAmountUsdc = (paymentAmountInr * USDC_DECIMALS) /
            INR_PER_USDC;

        // Verify buyer intent
        Intent storage intent = buyerIntents[msg.sender];
        require(!intent.claimed, "Already claimed");
        require(
            block.timestamp <= intent.timestamp + 24 hours,
            "Intent expired"
        );
        require(intent.amount <= paymentAmountUsdc, "Payment amount mismatch");

        // Verify deposit
        Deposit storage deposit = deposits[intent.depositId];
        require(deposit.seller != address(0), "Seller deposit not found");
        require(
            compareStrings(deposit.upiId, data.receiverUpiId),
            "UPI mismatch"
        );
        require(
            deposit.remainingFunds >= paymentAmountUsdc,
            "Insufficient deposit"
        );

        // Update states
        intent.claimed = true;
        deposit.remainingFunds -= paymentAmountUsdc;
        claimedTransactions[data.upiTransactionId] = true;

        // Transfer USDC to buyer
        require(
            usdc.transfer(msg.sender, paymentAmountUsdc),
            "USDC transfer failed"
        );

        emit PaymentClaimed(
            msg.sender,
            paymentAmountUsdc,
            data.upiTransactionId
        );
    }

    // ----------------- Helpers -----------------
    function hasActiveIntent(address buyer) public view returns (bool) {
        Intent storage intent = buyerIntents[buyer];
        return
            !intent.claimed &&
            intent.amount > 0 &&
            block.timestamp <= intent.timestamp + 24 hours;
    }

    function compareStrings(
        string memory a,
        string memory b
    ) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}