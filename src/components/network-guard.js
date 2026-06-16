"use client";

import { useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { useChainModal } from "@rainbow-me/rainbowkit";
import { baseSepolia } from "viem/chains";
import Navbar from "@/components/navbar";

const TARGET_CHAIN = baseSepolia; // Base Sepolia (84532) — the only chain this game runs on

/**
 * @dev Blocks the app whenever a connected wallet is on the wrong chain and
 * prompts the user to switch to Base Sepolia. The RainbowKit chain modal is
 * opened automatically when a wrong network is detected; a direct
 * "Switch to Base Sepolia" button is provided as a fallback if the modal is
 * dismissed. Renders its children unchanged once the wallet is on Base Sepolia
 * (or when no wallet is connected).
 */
export default function NetworkGuard({ children }) {
  const { isConnected, chainId } = useAccount();
  const { openChainModal } = useChainModal();
  const { switchChain, isPending } = useSwitchChain();

  const wrongNetwork =
    isConnected && chainId !== undefined && chainId !== TARGET_CHAIN.id;

  // Auto-open the RainbowKit chain modal as soon as a wrong network is detected.
  useEffect(() => {
    if (wrongNetwork && openChainModal) {
      openChainModal();
    }
  }, [wrongNetwork, openChainModal]);

  if (!wrongNetwork) return children;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="h-[calc(100vh-136px)] flex items-center justify-center px-4">
        <div className="border-2 border-[#3673F5] bg-[#020B20]/80 max-w-xl w-full p-8 md:p-12 text-center">
          <h1 className="text-2xl md:text-4xl text-[#3673F5] mb-4">
            Wrong Network
          </h1>
          <p className="text-base md:text-xl text-white/80 mb-8">
            This game runs on{" "}
            <span className="text-[#3673F5]">Base Sepolia</span>. Switch your
            wallet&apos;s network to continue.
          </p>
          <button
            onClick={() => switchChain({ chainId: TARGET_CHAIN.id })}
            disabled={isPending}
            className="w-full bg-[#3673F5] hover:bg-[#3673F5]/80 disabled:opacity-60 h-14 md:h-16 grid place-items-center mb-4"
          >
            <span className="text-lg md:text-2xl text-[#020B20]">
              {isPending ? "Switching..." : "Switch to Base Sepolia"}
            </span>
          </button>
          {openChainModal && (
            <button
              onClick={openChainModal}
              className="w-full border-2 border-[#3673F5] text-[#3673F5] hover:bg-[#3673F5] hover:text-[#020B20] h-12 md:h-14 grid place-items-center"
            >
              <span className="text-base md:text-xl">Open network modal</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
