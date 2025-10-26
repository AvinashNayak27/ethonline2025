"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { NexusProvider } from "@avail-project/nexus-widgets";
import { config } from "@/lib/wagmi";
import { WalletBridge } from "./wallet-bridge";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NexusProvider
      config={{
        debug: false,
        network: "mainnet",
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <WalletBridge />
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </NexusProvider>
  );
}
