"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { baseSepolia } from "viem/chains";
import { useContracts } from "@/contexts/contract-context";

export const RainbowKitWrapper = ({ children }) => {
  const { contracts } = useContracts();

  // Wait for contracts to be loaded before creating config
  if (!contracts) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-10 h-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const config = getDefaultConfig({
    appName: "Hangman Game",
    projectId: contracts.reownAppId || "rainbow-wallet-app", // fallback
    chains: [baseSepolia],
    ssr: true,
  });

  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider>{children}</RainbowKitProvider>
    </WagmiProvider>
  );
};
