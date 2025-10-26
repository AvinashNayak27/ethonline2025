'use client';
 
import { useState } from 'react';
import { useAccount } from 'wagmi';
import ConnectWalletButton from '@/components/connect-button';
import InitButton from '@/components/init-button';
import FetchUnifiedBalanceButton from '@/components/fetch-unified-balance-button';
import DeinitButton from '@/components/de-init-button';
import BridgeAndExecuteButtonComponent from '@/components/bridge-and-execute-button';
import { isInitialized } from '@/lib/nexus';
import VerifyOffchainPaymentButton from '@/components/verify-offchain-payment-button';
 
export default function Page() {
  const { isConnected } = useAccount();
  const [initialized, setInitialized] = useState(isInitialized());
  const [balances, setBalances] = useState<any>(null);
 
  const btn =
    'px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';
 
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <ConnectWalletButton className={btn} />
        <InitButton className={btn} onReady={() => setInitialized(true)} />
        <FetchUnifiedBalanceButton className={btn} onResult={(r) => setBalances(r)} />
        <VerifyOffchainPaymentButton className={btn} />
        
        <div className="border-t pt-4 mt-4 w-full">
          <h3 className="text-lg font-semibold mb-2 text-center">Nexus Core Implementation</h3>
          <BridgeAndExecuteButtonComponent className={btn} />
        </div>
        
        <DeinitButton className={btn} onDone={() => { setInitialized(false); setBalances(null); }} />
 
        <div className="mt-2">
          <b>Wallet Status:</b> {isConnected ? 'Connected' : 'Not connected'}
        </div>
        <div className="mt-2">
          <b>Nexus SDK Initialization Status:</b> {initialized ? 'Initialized' : 'Not initialized'}
        </div>
 
        {balances && (
          <pre className="whitespace-pre-wrap">{JSON.stringify(balances, null, 2)}</pre>
        )}
      </div>
    </main>
  );
}