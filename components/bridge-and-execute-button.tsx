"use client";

import { useState, useEffect } from "react";
import {
  BridgeAndExecuteButton,
  TOKEN_METADATA,
} from "@avail-project/nexus-widgets";
import { parseUnits } from "viem";
import {
  SUPPORTED_CHAINS,
  TOKEN_CONTRACT_ADDRESSES,
} from "@avail-project/nexus-widgets";

const CONTRACT_ADDRESS = "0x886495c7c0502d948ad4cb3764aeae2293664bb8";
const ARBITRUM_CHAIN_ID = 42161;

const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "verifierAddress", type: "address" },
      { internalType: "address", name: "usdcAddress", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "depositId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "buyer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "BuyerIntent",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "depositId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "seller",
        type: "address",
      },
      { indexed: false, internalType: "string", name: "upiId", type: "string" },
      {
        indexed: false,
        internalType: "uint256",
        name: "remainingFunds",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "minimumAmount",
        type: "uint256",
      },
    ],
    name: "FundsDeposited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "seller",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "depositId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "FundsWithdrawn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "buyer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "depositId",
        type: "uint256",
      },
    ],
    name: "IntentCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "buyer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "usdcAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "upiTransactionId",
        type: "string",
      },
    ],
    name: "PaymentClaimed",
    type: "event",
  },
  {
    inputs: [],
    name: "INR_PER_USDC",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "USDC_DECIMALS",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "buyerIntents",
    outputs: [
      { internalType: "address", name: "buyer", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "bool", name: "claimed", type: "bool" },
      { internalType: "uint256", name: "depositId", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "cancelIntent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "string",
            name: "paymentStatusTitle",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "paymentTotalAmount",
            type: "uint256",
          },
          { internalType: "string", name: "receiverUpiId", type: "string" },
          { internalType: "string", name: "upiTransactionId", type: "string" },
        ],
        internalType: "struct IEIP712Verifier.PaymentData",
        name: "data",
        type: "tuple",
      },
      { internalType: "bytes", name: "signature", type: "bytes" },
    ],
    name: "claimFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "", type: "string" }],
    name: "claimedTransactions",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "depositCounter",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "upiId", type: "string" },
      { internalType: "uint256", name: "depositAmount", type: "uint256" },
      { internalType: "uint256", name: "minimumAmount", type: "uint256" },
    ],
    name: "depositFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "deposits",
    outputs: [
      { internalType: "address", name: "seller", type: "address" },
      { internalType: "string", name: "upiId", type: "string" },
      { internalType: "uint256", name: "remainingFunds", type: "uint256" },
      { internalType: "uint256", name: "minimumAmount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "buyer", type: "address" }],
    name: "hasActiveIntent",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
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
    name: "usdc",
    outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "verifier",
    outputs: [
      { internalType: "contract IEIP712Verifier", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "depositId", type: "uint256" }],
    name: "withdrawRemainingFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

interface BridgeAndExecuteButtonComponentProps {
  className?: string;
}

export default function BridgeAndExecuteButtonComponent({
  className = "",
}: BridgeAndExecuteButtonComponentProps) {
  const btnClass = className || "btn-coffee";
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [isEditingUpiId, setIsEditingUpiId] = useState(false);
  const [formData, setFormData] = useState({
    upiID: "",
    minimumAmount: "",
    depositAmount: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load UPI ID from localStorage on component mount
  useEffect(() => {
    const savedUpiId = localStorage.getItem('bridgeUpiId');
    if (savedUpiId) {
      setFormData(prev => ({ ...prev, upiID: savedUpiId }));
    }
  }, []);

  // Save UPI ID to localStorage when it changes
  const handleUpiIdChange = (value: string) => {
    setFormData(prev => ({ ...prev, upiID: value }));
    if (value.trim()) {
      localStorage.setItem('bridgeUpiId', value.trim());
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.upiID.trim()) {
      newErrors.upiID = "UPI ID is required";
    } else if (!formData.upiID.includes("@")) {
      newErrors.upiID = "Please enter a valid UPI ID (e.g., user@paytm)";
    }
    
    if (!formData.minimumAmount.trim()) {
      newErrors.minimumAmount = "Minimum amount is required";
    } else if (isNaN(Number(formData.minimumAmount)) || Number(formData.minimumAmount) <= 0) {
      newErrors.minimumAmount = "Please enter a valid minimum amount";
    }
    
    if (!formData.depositAmount.trim()) {
      newErrors.depositAmount = "Deposit amount is required";
    } else if (isNaN(Number(formData.depositAmount)) || Number(formData.depositAmount) <= 0) {
      newErrors.depositAmount = "Please enter a valid deposit amount";
    } else if (Number(formData.depositAmount) < Number(formData.minimumAmount)) {
      newErrors.depositAmount = "Deposit amount must be greater than or equal to minimum amount";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowWidget(true);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'upiID') {
      handleUpiIdChange(value);
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setShowWidget(false);
    setIsEditingUpiId(false);
    // Preserve UPI ID from localStorage
    const savedUpiId = localStorage.getItem('bridgeUpiId') || "";
    setFormData({ upiID: savedUpiId, minimumAmount: "", depositAmount: "" });
    setErrors({});
  };

  // Show form first
  if (!showForm && !showWidget) {
    return (
      <button onClick={() => setShowForm(true)} className={btnClass}>
        + New Deposit
      </button>
    );
  }

  // Show form
  if (showForm && !showWidget) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 modal-backdrop"
          onClick={resetForm}
        />
        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="overflow-hidden rounded-2xl shadow-2xl" style={{ background: '#fff', border: '1px solid var(--color-border)', color: 'var(--coffee-text)' }}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md" style={{ background: 'var(--color-card)', color: 'var(--coffee-espresso)' }}>
                  <span className="font-black">💰</span>
                </span>
                <div>
                  <h3 className="text-base font-semibold leading-none" style={{ color: 'var(--coffee-espresso)' }}>New Deposit</h3>
                  <p className="text-xs" style={{ color: 'var(--coffee-muted)' }}>Enter your deposit details</p>
                </div>
              </div>
              <button onClick={resetForm} className="rounded-md p-2 hover:bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="px-6 py-5 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">UPI ID</label>
                {formData.upiID && !isEditingUpiId ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg px-3 py-2" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                      <span className="text-sm font-medium">{formData.upiID}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingUpiId(true)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                      title="Edit UPI ID"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" style={{ color: 'var(--coffee-muted)' }}>
                        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.upiID}
                    onChange={(e) => handleInputChange("upiID", e.target.value)}
                    onBlur={() => {
                      if (formData.upiID.trim()) {
                        setIsEditingUpiId(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && formData.upiID.trim()) {
                        setIsEditingUpiId(false);
                      }
                    }}
                    placeholder="e.g., user@paytm, user@phonepe"
                    className="w-full rounded-lg px-3 py-2 outline-none"
                    style={{ border: '1px solid var(--color-border)', background: '#fff' }}
                    autoFocus={isEditingUpiId}
                  />
                )}
                {errors.upiID && (
                  <p className="text-xs text-red-600">{errors.upiID}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Minimum Amount (USDC)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minimumAmount}
                  onChange={(e) => handleInputChange("minimumAmount", e.target.value)}
                  placeholder="e.g., 1.0"
                  className="w-full rounded-lg px-3 py-2 outline-none"
                  style={{ border: '1px solid var(--color-border)', background: '#fff' }}
                />
                {errors.minimumAmount && (
                  <p className="text-xs text-red-600">{errors.minimumAmount}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Deposit Amount (USDC)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.depositAmount}
                  onChange={(e) => handleInputChange("depositAmount", e.target.value)}
                  placeholder="e.g., 3.0"
                  className="w-full rounded-lg px-3 py-2 outline-none"
                  style={{ border: '1px solid var(--color-border)', background: '#fff' }}
                />
                {errors.depositAmount && (
                  <p className="text-xs text-red-600">{errors.depositAmount}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={resetForm} className="flex-1 btn-outline-coffee">
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-coffee">
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Show widget with form data
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 modal-backdrop"
        onClick={resetForm}
      />
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="overflow-hidden rounded-2xl shadow-2xl" style={{ background: '#fff', border: '1px solid var(--color-border)', color: 'var(--coffee-text)' }}>
          <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md" style={{ background: 'var(--color-card)', color: 'var(--coffee-espresso)' }}>
                <span className="font-black">🌉</span>
              </span>
              <div>
                <h3 className="text-base font-semibold leading-none" style={{ color: 'var(--coffee-espresso)' }}>Bridge & Execute</h3>
                <p className="text-xs" style={{ color: 'var(--coffee-muted)' }}>Complete your transaction</p>
              </div>
            </div>
            <button onClick={resetForm} className="rounded-md p-2 hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5">
            <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid var(--color-border)' }}>
              <div className="px-4 py-2 text-sm font-medium" style={{ background: 'var(--color-surface)' }}>Transaction Details</div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--coffee-muted)' }}>UPI ID</span>
                  <span className="font-medium">{formData.upiID}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--coffee-muted)' }}>Deposit Amount</span>
                  <span className="font-medium">{formData.depositAmount} USDC</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--coffee-muted)' }}>Minimum Amount</span>
                  <span className="font-medium">{formData.minimumAmount} USDC</span>
                </div>
              </div>
            </div>

            <BridgeAndExecuteButton
              contractAddress={CONTRACT_ADDRESS}
              contractAbi={CONTRACT_ABI}
              functionName="depositFunds"
              buildFunctionParams={(token, amount, _chainId, user) => {
                const decimals = TOKEN_METADATA[token].decimals;
                const amountWei = parseUnits(amount, decimals);
                const minimumAmountWei = parseUnits(formData.minimumAmount, decimals);

                return { functionParams: [formData.upiID, amountWei, minimumAmountWei] };
              }}
              prefill={{
                toChainId: ARBITRUM_CHAIN_ID,
                token: "USDC",
                amount: formData.depositAmount,
              }}
            >
              {({ onClick, isLoading }) => (
                <div className="space-y-3">
                  <button onClick={onClick} disabled={isLoading} className="w-full btn-coffee">
                    {isLoading ? "Processing…" : "Create Deposit via Nexus"}
                  </button>
                  <button onClick={() => setShowWidget(false)} className="w-full btn-outline-coffee">
                    Back to Edit
                  </button>
                </div>
              )}
            </BridgeAndExecuteButton>
          </div>
        </div>
      </div>
    </div>
  );
}
