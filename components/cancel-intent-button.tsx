"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

const CONTRACT_ADDRESS = "0x886495c7c0502d948ad4cb3764aeae2293664bb8";

const CONTRACT_ABI = [
  {
    inputs: [],
    name: "cancelIntent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

interface CancelIntentButtonProps {
  className?: string;
  onSuccess?: () => void;
  disabled?: boolean;
}

export default function CancelIntentButton({
  className = "btn-outline-coffee",
  onSuccess,
  disabled = false,
}: CancelIntentButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const { writeContract, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirmingTx, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleCancelIntent = async () => {
    try {
      setError(null);
      setIsConfirming(true);
      
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "cancelIntent",
        args: [],
      });
    } catch (err: any) {
      setError(err?.shortMessage || "Failed to cancel intent. Please try again.");
      console.error("Cancel intent error:", err);
    } finally {
      setIsConfirming(false);
    }
  };

  // Show success state
  if (isConfirmed) {
    onSuccess?.();
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M2.25 12a9.75 9.75 0 1 1 19.5 0 9.75 9.75 0 0 1-19.5 0Zm13.36-2.59a.75.75 0 1 0-1.06-1.06L10.5 12.34l-1.53-1.53a.75.75 0 0 0-1.06 1.06l2.06 2.06a.75.75 0 0 0 1.06 0l4.62-4.62Z" clipRule="evenodd" />
        </svg>
        Intent cancelled successfully!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleCancelIntent}
        disabled={isPending || isConfirming || isConfirmingTx || disabled}
        className={`${className} flex items-center gap-2 ${
          isPending || isConfirming || isConfirmingTx ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isPending || isConfirming ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cancelling...
          </>
        ) : isConfirmingTx ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Confirming...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm3 10.5a.75.75 0 0 0-1.5 0v4.5a.75.75 0 0 0 1.5 0v-4.5Zm-7.5 0a.75.75 0 0 0-1.5 0v4.5a.75.75 0 0 0 1.5 0v-4.5Z" clipRule="evenodd" />
            </svg>
            Cancel Intent
          </>
        )}
      </button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}
    </div>
  );
}
