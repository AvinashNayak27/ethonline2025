"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";

const CONTRACT_ADDRESS = "0x886495c7c0502d948ad4cb3764aeae2293664bb8";

const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "depositId", type: "uint256" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "signalIntent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "cancelIntent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

interface SignalIntentButtonProps {
  depositId: string;
  minimumAmount: string;
  remainingFunds: string;
  className?: string;
  onSuccess?: () => void;
  disabled?: boolean;
}

export default function SignalIntentButton({
  depositId,
  minimumAmount,
  remainingFunds,
  className = "btn-coffee",
  onSuccess,
  disabled = false,
}: SignalIntentButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const minAmount = parseFloat(minimumAmount) / 1e6;
  const maxAmount = parseFloat(remainingFunds) / 1e6;

  const validateAmount = (value: string) => {
    const numAmount = parseFloat(value);
    if (isNaN(numAmount) || numAmount <= 0) {
      return "Please enter a valid amount";
    }
    if (numAmount < minAmount) {
      return `Amount must be at least ${minAmount} USDC`;
    }
    if (numAmount > maxAmount) {
      return `Amount cannot exceed ${maxAmount} USDC`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateAmount(amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError(null);
      const amountWei = parseUnits(amount, 6); // USDC has 6 decimals
      
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "signalIntent",
        args: [BigInt(depositId), amountWei],
      });
    } catch (err) {
      setError("Failed to signal intent. Please try again.");
      console.error("Signal intent error:", err);
    }
  };

  const handleCancelIntent = async () => {
    try {
      setError(null);
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "cancelIntent",
        args: [],
      });
    } catch (err) {
      setError("Failed to cancel intent. Please try again.");
      console.error("Cancel intent error:", err);
    }
  };

  if (isConfirmed) {
    onSuccess?.();
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--coffee-espresso)' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M2.25 12a9.75 9.75 0 1 1 19.5 0 9.75 9.75 0 0 1-19.5 0Zm13.36-2.59a.75.75 0 1 0-1.06-1.06L10.5 12.34l-1.53-1.53a.75.75 0 0 0-1.06 1.06l2.06 2.06a.75.75 0 0 0 1.06 0l4.62-4.62Z" clipRule="evenodd" />
        </svg>
        Intent signaled successfully!
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className={className}
        disabled={isPending || isConfirming || disabled}
      >
        {disabled ? "Intent Active" : "Signal Intent"}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            Amount (USDC)
          </label>
          <input
            type="number"
            step="0.01"
            min={minAmount}
            max={maxAmount}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
            placeholder={`${minAmount} - ${maxAmount} USDC`}
            className="w-full rounded-lg px-3 py-2 outline-none"
            style={{ border: '1px solid var(--color-border)', background: '#fff' }}
            required
          />
          <div className="text-xs mt-1" style={{ color: 'var(--coffee-muted)' }}>
            Min: {minAmount} USDC | Max: {maxAmount} USDC
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
            {error}
          </div>
        )}

        {writeError && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
            {writeError.message}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="flex-1 btn-outline-coffee"
            disabled={isPending || isConfirming}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 btn-coffee"
            disabled={isPending || isConfirming}
          >
            {isPending ? "Signaling..." : isConfirming ? "Confirming..." : "Signal Intent"}
          </button>
        </div>
      </form>

      <button
        onClick={handleCancelIntent}
        className="w-full btn-outline-coffee text-sm"
        disabled={isPending || isConfirming}
      >
        Cancel Intent
      </button>
    </div>
  );
}
