# Escrow + Offchain Payment System (Arbitrum Mainnet) ENvio

This project implements a simple escrow and offchain payment verification system using Solidity smart contracts and EIP-712 signature verification.

## 📜 Overview

The system consists of three main components:

1. **Escrow Contract** — Handles token locking, releasing, and withdrawal logic using USDC.
2. **USDC Token Contract** — The ERC20 stablecoin used for transactions.
3. **Offchain Payment Verifier** — Verifies signed offchain payment claims using ECDSA or EIP-712.

---

## 🔗 Deployed Contracts (Arbitrum One)

| Contract | Description | Address |
|-----------|--------------|----------|
| **Escrow** | Core contract for locking and releasing funds | [`0x6fF44A88Ab945e7742BfE16D54ceda4061462F48`](https://arbiscan.io/address/0x6ff44a88ab945e7742bfe16d54ceda4061462f48#code) |
| **USDC (Arbitrum)** | ERC20 token used for escrow payments | [`0xAf88d065E77C8Cc2239327C5EDb3A432268E5831`](https://arbiscan.io/address/0xaf88d065e77c8cc2239327c5edb3a432268e5831#writeProxyContract) |
| **Offchain Payment Verifier** | Verifies signed offchain payment claims | [`0x5B866B6655234b3B6f9B3bD86F068A99622F5919`](https://arbiscan.io/address/0x5b866b6655234b3b6f9b3bd86f068a99622f5919) |

---

## 🧩 How It Works

### 1. **Escrow**
- Users deposit USDC into the Escrow contract.
- Funds are locked until certain conditions or signatures are verified.
- The receiver (or an authorized address) can withdraw after validation.

### 2. **Offchain Payment Verification**
- A signer (backend) signs structured payment data (e.g., status, amount, UPI ID, etc.).
- The signature is verified on-chain by the verifier contract.
- Prevents replay attacks and ensures payment authenticity.

### 3. **USDC**
- Standard ERC20 stablecoin on Arbitrum.
- Used for value transfer in escrow operations.

---
