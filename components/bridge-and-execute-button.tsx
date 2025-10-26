"use client";

import {
  BridgeAndExecuteButton,
  TOKEN_METADATA,
} from "@avail-project/nexus-widgets";
import { parseUnits } from "viem";
import {
  SUPPORTED_CHAINS,
  TOKEN_CONTRACT_ADDRESSES,
} from "@avail-project/nexus-widgets";

const CONTRACT_ADDRESS = "0xA413e84B0604e3D7916246406f0aECAC514116E4";
const ARBITRUM_CHAIN_ID = 42161;

const CONTRACT_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "lockTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "beneficiary",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "lockTokensOnBehalf",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_token",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "beneficiary",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "TokensLocked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "TokensWithdrawn",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdrawTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "balances",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface BridgeAndExecuteButtonComponentProps {
  className?: string;
}

export default function BridgeAndExecuteButtonComponent({
  className = "",
}: BridgeAndExecuteButtonComponentProps) {
  const btnClass =
    className ||
    "btn-coffee";

  return (
    <BridgeAndExecuteButton
      contractAddress={CONTRACT_ADDRESS}
      contractAbi={CONTRACT_ABI}
      functionName="lockTokens"
      buildFunctionParams={(token, amount, _chainId, user) => {
        const decimals = TOKEN_METADATA[token].decimals;
        const amountWei = parseUnits(amount, decimals);
        const tokenAddr = TOKEN_CONTRACT_ADDRESSES[token][_chainId];
        return { functionParams: [amountWei] };
      }}
      prefill={{
        toChainId: ARBITRUM_CHAIN_ID,
        token: "USDC",
        amount: "10",
      }}
    >
      {({ onClick, isLoading }) => (
        <button
          onClick={onClick}
          disabled={isLoading}
          className={btnClass}
        >
          {isLoading ? "Processing…" : "Bridge & Stake"}
        </button>
      )}
    </BridgeAndExecuteButton>
  );
}
