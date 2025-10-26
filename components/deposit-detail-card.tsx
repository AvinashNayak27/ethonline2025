"use client";

import { useState } from "react";
import { formatUSDC, formatINR, formatRelativeTime, getArbiscanTxLink } from "@/lib/graphql";
import WithdrawFundsButton from "./withdraw-funds-button";

interface DepositDetailCardProps {
  deposit: {
    id: string;
    depositId: string;
    seller: string;
    upiId: string;
    remainingFunds: string;
    minimumAmount: string;
    timestamp: string;
    transactionHash: string;
    activeIntent?: {
      id: string;
      depositId: string;
      buyer: string;
      amount: string;
      timestamp: string;
      transactionHash: string;
    } | null;
    claims: Array<{
      id: string;
      buyer: string;
      depositId: string;
      usdcAmount: string;
      upiTransactionId: string;
      timestamp: string;
      transactionHash: string;
      type: 'payment' | 'intent';
    }>;
    hasActiveIntent: boolean;
    totalClaimed: number;
  };
  onClose: () => void;
  onRefresh: () => void;
}

export default function DepositDetailCard({ deposit, onClose, onRefresh }: DepositDetailCardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'claims'>('overview');
  
  const originalAmount = parseFloat(formatUSDC(deposit.remainingFunds)) + deposit.totalClaimed;
  const remainingAmount = parseFloat(formatUSDC(deposit.remainingFunds));
  const claimedAmount = deposit.totalClaimed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 modal-backdrop"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="overflow-hidden rounded-2xl shadow-2xl" style={{ background: '#fff', border: '1px solid var(--color-border)', color: 'var(--coffee-text)' }}>
          {/* Header */}
          <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md" style={{ background: 'var(--color-card)', color: 'var(--coffee-espresso)' }}>
                <span className="font-black">💰</span>
              </span>
              <div>
                <h3 className="text-base font-semibold leading-none" style={{ color: 'var(--coffee-espresso)' }}>
                  Deposit #{deposit.depositId}
                </h3>
                <p className="text-xs" style={{ color: 'var(--coffee-muted)' }}>Deposit Details</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-md p-2 hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="tab-container">
            <button
              onClick={() => setActiveTab('overview')}
              className={`tab-button ${activeTab === 'overview' ? 'active' : 'inactive'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('claims')}
              className={`tab-button ${activeTab === 'claims' ? 'active' : 'inactive'}`}
            >
              Claims ({deposit.claims.length})
            </button>
          </div>

          <div className="px-6 py-5">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Deposit Info */}
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                  <div className="px-4 py-2 text-sm font-medium" style={{ background: 'var(--color-surface)' }}>Deposit Information</div>
                  <div className="p-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--coffee-muted)' }}>UPI ID:</span>
                      <span className="font-medium">{deposit.upiId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--coffee-muted)' }}>Minimum Amount:</span>
                      <span className="font-medium">{formatUSDC(deposit.minimumAmount)} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--coffee-muted)' }}>Created:</span>
                      <span className="font-medium">{formatRelativeTime(deposit.timestamp)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: 'var(--coffee-muted)' }}>Transaction:</span>
                      <a
                        href={getArbiscanTxLink(deposit.transactionHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                      >
                        View on Arbiscan
                      </a>
                    </div>
                  </div>
                </div>

                {/* Funds Status */}
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                  <div className="px-4 py-2 text-sm font-medium" style={{ background: 'var(--color-surface)' }}>Funds Status</div>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--coffee-espresso)' }}>
                          {originalAmount.toFixed(2)}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--coffee-muted)' }}>Original (USDC)</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {claimedAmount.toFixed(2)}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--coffee-muted)' }}>Claimed (USDC)</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {remainingAmount.toFixed(2)}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--coffee-muted)' }}>Remaining (USDC)</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(claimedAmount / originalAmount) * 100}%` }}
                      />
                    </div>
                    <div className="text-center text-sm" style={{ color: 'var(--coffee-muted)' }}>
                      {((claimedAmount / originalAmount) * 100).toFixed(1)}% claimed
                    </div>
                  </div>
                </div>

                {/* Active Intent */}
                {deposit.activeIntent && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                    <div className="px-4 py-2 text-sm font-medium" style={{ background: 'var(--color-surface)' }}>Active Intent</div>
                    <div className="p-4 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--coffee-muted)' }}>Buyer:</span>
                        <span className="font-medium">{deposit.activeIntent.buyer.slice(0, 6)}...{deposit.activeIntent.buyer.slice(-4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--coffee-muted)' }}>Amount:</span>
                        <span className="font-medium">{formatUSDC(deposit.activeIntent.amount)} USDC</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--coffee-muted)' }}>Created:</span>
                        <span className="font-medium">{formatRelativeTime(deposit.activeIntent.timestamp)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span style={{ color: 'var(--coffee-muted)' }}>Transaction:</span>
                        <a
                          href={getArbiscanTxLink(deposit.activeIntent.transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                        >
                          View on Arbiscan
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  {remainingAmount > 0 ? (
                    <WithdrawFundsButton
                      depositId={deposit.depositId}
                      remainingFunds={deposit.remainingFunds}
                      onSuccess={onRefresh}
                      className="w-full"
                    />
                  ) : (
                    <div className="text-center py-4">
                      <span className="status-badge status-completed">
                        Fully Claimed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'claims' && (
              <div className="space-y-4">
                {deposit.claims.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-sm" style={{ color: 'var(--coffee-muted)' }}>
                      No claims yet
                    </div>
                  </div>
                ) : (
                  deposit.claims.map((claim) => (
                    <div
                      key={claim.id}
                      className="p-4 rounded-lg"
                      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              Claimed: {formatUSDC(claim.usdcAmount)} USDC
                            </div>
                            <div className="text-sm" style={{ color: 'var(--coffee-muted)' }}>
                              Buyer: {claim.buyer.slice(0, 6)}...{claim.buyer.slice(-4)}
                            </div>
                            <div className="text-sm" style={{ color: 'var(--coffee-muted)' }}>
                              UPI Txn: {claim.upiTransactionId}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--coffee-muted)' }}>
                              Claimed: {formatRelativeTime(claim.timestamp)}
                            </div>
                          </div>
                          <span className="status-badge status-completed">
                            Completed
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs" style={{ color: 'var(--coffee-muted)' }}>Transaction:</span>
                          <a
                            href={getArbiscanTxLink(claim.transactionHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                          >
                            View on Arbiscan
                          </a>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
