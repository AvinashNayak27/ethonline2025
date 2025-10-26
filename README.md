# P2P USDC Marketplace

A decentralized peer-to-peer marketplace for trading USDC for INR using off-chain payment verification through TEE (Trusted Execution Environment).

## Features

### For Sellers
- **Bridge & Deposit**: Bridge USDC from multiple chains and deposit into escrow
- **Set Terms**: Specify UPI ID, deposit amount, and minimum transaction amount
- **Manage Deposits**: View all your deposits and withdraw remaining funds
- **Real-time Updates**: Live data from the blockchain indexer

### For Buyers
- **Browse Deposits**: View available USDC deposits from other users
- **Signal Intent**: Reserve a deposit by signaling your intent to buy
- **Off-chain Payment**: Pay via Amazon Pay (verified through TEE)
- **Claim Funds**: Submit verified payment proof to claim USDC on-chain

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Blockchain**: Wagmi, Viem
- **Cross-chain**: Avail Nexus SDK
- **Styling**: Tailwind CSS with custom coffee theme
- **Data**: GraphQL queries to blockchain indexer
- **Verification**: TEE-based payment verification

## Architecture

### Smart Contracts
- **Escrow Contract**: Main contract managing deposits, intents, and claims
- **Verifier Contract**: EIP712 signature verification for payment proofs

### Flow
1. **Seller Flow**:
   - Connect wallet and initialize Nexus
   - Bridge USDC from any supported chain
   - Deposit funds with UPI ID and terms
   - Monitor deposits and withdraw remaining funds

2. **Buyer Flow**:
   - Browse available deposits
   - Signal intent for desired deposit
   - Pay via Amazon Pay off-chain
   - Generate TEE proof of payment
   - Claim USDC on-chain with verified proof

### Data Layer
- **GraphQL Indexer**: Real-time blockchain data at `https://indexer.dev.hyperindex.xyz/f78d466/v1/graphql`
- **Events Tracked**:
  - `FundsDeposited`: New seller deposits
  - `BuyerIntent`: Buyer intent signals
  - `PaymentClaimed`: Successful fund claims
  - `FundsWithdrawn`: Seller withdrawals
  - `IntentCancelled`: Intent cancellations

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- MetaMask or compatible wallet

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ethonline2025
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Usage

1. **Connect Wallet**: Click "Connect Wallet" and connect your MetaMask
2. **Initialize Nexus**: Click "Initialize Nexus" to enable cross-chain functionality
3. **Choose Role**:
   - **Buy USDC**: Browse available deposits and signal intent
   - **Sell USDC**: Create deposits and manage your listings

## Components

### Core Components
- `ConnectWalletButton`: Wallet connection with RainbowKit
- `InitButton`: Nexus SDK initialization
- `BridgeAndExecuteButtonComponent`: Cross-chain bridging and deposit creation
- `SignalIntentButton`: Buyer intent signaling
- `VerifyOffchainPaymentButton`: TEE payment verification and claiming
- `WithdrawFundsButton`: Seller fund withdrawal

### UI Components
- `LoadingSkeleton`: Loading states and placeholders
- Custom CSS classes for marketplace styling

## Configuration

### Contract Addresses
- **Escrow Contract**: `0x886495c7c0502d948ad4cb3764aeae2293664bb8`
- **Verifier Contract**: Deployed with TEE signer
- **USDC Contract**: Arbitrum USDC

### Supported Chains
- Arbitrum (main)
- All chains supported by Avail Nexus

## Security Features

- **TEE Verification**: Off-chain payments verified through trusted execution environment
- **EIP712 Signatures**: Cryptographic proof of payment authenticity
- **Escrow Protection**: Funds held in smart contract until payment verification
- **Intent System**: Prevents double-spending and race conditions

## Development

### Project Structure
```
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utilities and configurations
├── _contracts/             # Smart contracts
└── envio_indexer/          # Blockchain indexer
```

### Key Files
- `app/page.tsx`: Main marketplace interface
- `lib/graphql.ts`: GraphQL queries and utilities
- `lib/nexus.ts`: Avail Nexus SDK wrapper
- `components/`: Individual feature components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the repository
- Check the documentation
- Review the smart contract code

---

Built with ❤️ for ETHOnline 2025