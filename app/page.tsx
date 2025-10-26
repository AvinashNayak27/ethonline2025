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
 
  const btn = 'btn-coffee';
 
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl card-coffee p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--coffee-espresso)' }}>Avail Nexus Demo</h1>
          <p className="text-sm" style={{ color: 'var(--coffee-muted)' }}>Coffee-themed light UI</p>
        </div>

        <div className="flex flex-col items-stretch gap-3">
        <ConnectWalletButton className={btn} />
        <InitButton className={btn} onReady={() => setInitialized(true)} />
        <FetchUnifiedBalanceButton className={btn} onResult={(r) => setBalances(r)} />
        <VerifyOffchainPaymentButton className={btn} />
          
          <div className="pt-4 mt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--coffee-espresso)' }}>Nexus Core Implementation</h3>
            <BridgeAndExecuteButtonComponent className={btn} />
          </div>
          
          <DeinitButton className={btn} onDone={() => { setInitialized(false); setBalances(null); }} />

          <div className="grid grid-cols-1 gap-2 text-sm mt-2">
            <div className="rounded-md p-3" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <b>Wallet Status:</b> {isConnected ? 'Connected' : 'Not connected'}
            </div>
            <div className="rounded-md p-3" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <b>Nexus SDK Initialization Status:</b> {initialized ? 'Initialized' : 'Not initialized'}
            </div>
          </div>

          {balances && (
            <pre className="whitespace-pre-wrap mt-3 rounded-md p-3 overflow-x-auto" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>{JSON.stringify(balances, null, 2)}</pre>
          )}
        </div>
      </div>
    </main>
  );
}