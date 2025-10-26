"use client";

import { useState } from "react";
import BridgeUSDCButton from "./bridge-usdc-button";

interface BridgePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBridge: () => void;
  onSkip: () => void;
  claimedAmount: string;
}

export default function BridgePromptModal({
  isOpen,
  onClose,
  onBridge,
  onSkip,
  claimedAmount,
}: BridgePromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 modal-backdrop"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md">
        <div className="overflow-hidden rounded-2xl shadow-2xl" style={{ background: '#fff', border: '1px solid var(--color-border)', color: 'var(--coffee-text)' }}>
          {/* Header */}
          <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md" style={{ background: 'var(--color-card)', color: 'var(--coffee-espresso)' }}>
                <span className="font-black">🌉</span>
              </span>
              <div>
                <h3 className="text-base font-semibold leading-none" style={{ color: 'var(--coffee-espresso)' }}>
                  Bridge USDC?
                </h3>
                <p className="text-xs" style={{ color: 'var(--coffee-muted)' }}>Cross-chain transfer</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-md p-2 hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold mb-2" style={{ color: 'var(--coffee-espresso)' }}>
                </div>
                <p className="text-sm" style={{ color: 'var(--coffee-muted)' }}>
                  Would you like to bridge your USDC to another chain?
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-blue-600 mt-0.5">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Bridge Benefits</h4>
                    <ul className="text-xs text-blue-700 mt-1 space-y-1">
                      <li>• Transfer USDC to other chains</li>
                      <li>• Access different DeFi protocols</li>
                      <li>• Lower gas fees on other networks</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onSkip}
                  className="flex-1 btn-outline-coffee"
                >
                  Skip for Now
                </button>
                <BridgeUSDCButton
                  className="flex-1 btn-coffee"
                  onSuccess={() => {
                    onBridge();
                    onClose();
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
