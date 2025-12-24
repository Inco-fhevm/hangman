"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { baseSepolia } from "viem/chains";
import { useContracts } from "@/contexts/contract-context";

const queryClient = new QueryClient();

export const RainbowKitWrapper = ({ children }) => {
  const { contracts } = useContracts();

  const config = getDefaultConfig({
    appName: "Hangman Game",
    projectId: contracts?.reownAppId || "rainbow-wallet-app", // fallback
    chains: [baseSepolia],
    ssr: true,
  });

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
