"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

const CONTRACT_ADDRESS = "0x886495c7c0502d948ad4cb3764aeae2293664bb8";

const CONTRACT_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "depositId", type: "uint256" }],
    name: "withdrawRemainingFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

interface WithdrawFundsButtonProps {
  depositId: string;
  remainingFunds: string;
  className?: string;
  onSuccess?: () => void;
  disabled?: boolean;
}

export default function WithdrawFundsButton({
  depositId,
  remainingFunds,
  className = "btn-coffee",
  onSuccess,
  disabled = false,
}: WithdrawFundsButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirmingTx, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleWithdraw = async () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "withdrawRemainingFunds",
        args: [BigInt(depositId)],
      });
    } catch (err) {
      console.error("Withdraw funds error:", err);
    }
  };

  const handleCancel = () => {
    setIsConfirming(false);
  };

  if (isConfirmed) {
    onSuccess?.();
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--coffee-espresso)' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M2.25 12a9.75 9.75 0 1 1 19.5 0 9.75 9.75 0 0 1-19.5 0Zm13.36-2.59a.75.75 0 1 0-1.06-1.06L10.5 12.34l-1.53-1.53a.75.75 0 0 0-1.06 1.06l2.06 2.06a.75.75 0 0 0 1.06 0l4.62-4.62Z" clipRule="evenodd" />
        </svg>
        Funds withdrawn successfully!
      </div>
    );
  }

  if (disabled) {
    return (
      <button
        className="w-full px-4 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-500 cursor-not-allowed"
        disabled
      >
        No Funds to Withdraw
      </button>
    );
  }

  if (!isConfirming) {
    return (
      <div className="w-full flex justify-center">
        <button
          onClick={handleWithdraw}
          className={className}
          disabled={isPending || isConfirmingTx}
        >
          Withdraw Funds
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="text-sm font-medium mb-2" style={{ color: 'var(--coffee-espresso)' }}>
          Confirm Withdrawal
        </div>
        <div className="text-sm" style={{ color: 'var(--coffee-muted)' }}>
          Are you sure you want to withdraw {parseFloat(remainingFunds) / 1e6} USDC?
        </div>
      </div>

      {writeError && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
          {writeError.message}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          className="flex-1 btn-outline-coffee"
          disabled={isPending || isConfirmingTx}
        >
          Cancel
        </button>
        <button
          onClick={handleWithdraw}
          className="flex-1 btn-coffee"
          disabled={isPending || isConfirmingTx}
        >
          {isPending ? "Withdrawing..." : isConfirmingTx ? "Confirming..." : "Confirm Withdraw"}
        </button>
      </div>
    </div>
  );
}
