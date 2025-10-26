'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNexus } from '@avail-project/nexus-widgets';

export function WalletBridge() {
  const { connector, isConnected } = useAccount();
  const { setProvider } = useNexus();

  useEffect(() => {
    if (isConnected && connector?.getProvider) {
      connector.getProvider().then((provider) => {
        if (provider && typeof provider === 'object' && 'request' in provider) {
          setProvider(provider as any);
        }
      });
    }
  }, [isConnected, connector, setProvider]);

  return null;
}
