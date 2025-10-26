"use client";

import { useState } from "react";
import { BridgeButton } from '@avail-project/nexus-widgets';

interface BridgeUSDCButtonProps {
  className?: string;
  onSuccess?: () => void;
}

export default function BridgeUSDCButton({
  className = "btn-coffee",
  onSuccess,
}: BridgeUSDCButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleBridgeSuccess = () => {
    setIsOpen(false);
    onSuccess?.();
  };

  return (
    <BridgeButton>
      {({ onClick, isLoading }) => (
        <button
          onClick={() => {
            onClick();
            setIsOpen(true);
          }}
          disabled={isLoading}
          className={`${className} flex items-center gap-2 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading Bridge...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M15.75 2.25H21a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0V4.81L8.03 17.03a.75.75 0 0 1-1.06-1.06L19.19 3.75H15.75a.75.75 0 0 1 0-1.5Zm-6.75 4.5a3 3 0 0 0-3 3v2.25a3 3 0 0 0 3 3h1.5a.75.75 0 0 1 0 1.5H9a4.5 4.5 0 0 1-4.5-4.5V9.75a4.5 4.5 0 0 1 4.5-4.5h1.5a.75.75 0 0 1 0 1.5H9Z" clipRule="evenodd" />
              </svg>
              Bridge USDC
            </>
          )}
        </button>
      )}
    </BridgeButton>
  );
}
