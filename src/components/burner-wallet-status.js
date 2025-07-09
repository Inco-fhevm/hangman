"use client";

import { useBurnerWallet } from "@/context/burner-wallet-context";

export default function BurnerWalletStatus() {
  const {
    burnerWallet,
    createBurnerWallet,
    clearBurnerWallet,
    isCreating,
    isLoading,
    error,
    hasWallet,
  } = useBurnerWallet();

  if (isLoading) {
    return <div className="text-white">Loading burner wallet...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="p-4 border border-gray-600 rounded-lg bg-gray-800 text-white">
      <h3 className="text-lg font-semibold mb-2">Burner Wallet Status</h3>

      {hasWallet ? (
        <div className="space-y-2">
          <p className="text-green-400">✓ Burner wallet available</p>
          <p className="text-sm text-gray-300">
            Address: {burnerWallet?.account?.address || "N/A"}
          </p>
          <button
            onClick={clearBurnerWallet}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            Clear Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-yellow-400">No burner wallet available</p>
          <button
            onClick={createBurnerWallet}
            disabled={isCreating}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
          >
            {isCreating ? "Creating..." : "Create Burner Wallet"}
          </button>
        </div>
      )}
    </div>
  );
}
