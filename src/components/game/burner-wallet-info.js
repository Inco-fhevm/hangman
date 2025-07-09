"use client";

import { useBurnerWallet } from "@/context/burner-wallet-context";
import { usePublicClient } from "wagmi";
import { useEffect, useState } from "react";
import { formatEther } from "viem";

export function BurnerWalletInfo() {
  const { burnerWallet, hasWallet } = useBurnerWallet();
  const publicClient = usePublicClient();
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    let interval;

    const updateBalance = async () => {
      if (hasWallet && burnerWallet && publicClient) {
        try {
          const balanceWei = await publicClient.getBalance({
            address: burnerWallet.account.address,
          });
          setBalance(formatEther(balanceWei));
        } catch (error) {
          console.error("Failed to fetch burner wallet balance:", error);
        }
      }
    };

    if (hasWallet) {
      updateBalance();
      // Update balance every 10 seconds during game
      interval = setInterval(updateBalance, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hasWallet, burnerWallet, publicClient]);

  if (!hasWallet) return null;

  return (
    <div className="fixed top-20 right-4 bg-gray-900/90 backdrop-blur-sm text-white p-3 rounded-lg border border-gray-700 text-sm">
      <div className="text-green-400 font-medium mb-1">
        🔥 Burner Wallet Active
      </div>
      <div className="text-xs text-gray-300">
        <div className="truncate">
          {burnerWallet?.account?.address?.slice(0, 6)}...
          {burnerWallet?.account?.address?.slice(-4)}
        </div>
        <div className="text-blue-400">
          {parseFloat(balance).toFixed(4)} ETH
        </div>
      </div>
    </div>
  );
}
