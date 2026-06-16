"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Lightning } from "@inco/lightning-js/lite";
import { handleTypes } from "@inco/lightning-js";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

let incoConfig = null;

// Create context for session voucher wrapper
const SessionVoucherContext = createContext();

// Provider component for session voucher management
export function SessionVoucherProvider({ children }) {
  // Store vouchers by wallet address: Map<address, {voucher, keypair, expiration}>
  const [sessionVouchersByAddress, setSessionVouchersByAddress] = useState(new Map());

  // Clear all sessions on page refresh/reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // This will clear sessions when page is refreshed
      setSessionVouchersByAddress(new Map());
    };

    // Clear on page load (not reload, but good practice)
    setSessionVouchersByAddress(new Map());

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Function to check if we have a valid session for current address
  const hasValidSession = useCallback((address) => {
    if (!address || !sessionVouchersByAddress.has(address)) return false;

    const { voucher, ephemeralAccount, expiration } = sessionVouchersByAddress.get(address);
    return voucher && ephemeralAccount && expiration > new Date();
  }, [sessionVouchersByAddress]);

  // Function to get session for specific address
  const getSessionForAddress = useCallback((address) => {
    if (!address || !sessionVouchersByAddress.has(address)) return null;
    return sessionVouchersByAddress.get(address);
  }, [sessionVouchersByAddress]);

  // Function to set session for specific address
  const setSessionForAddress = useCallback((address, sessionData) => {
    setSessionVouchersByAddress(prev => {
      const newMap = new Map(prev);
      newMap.set(address, sessionData);
      return newMap;
    });
  }, []);

  // Function to clear all sessions (only on refresh/page reload)
  const clearAllSessions = useCallback(() => {
    setSessionVouchersByAddress(new Map());
    console.log("All sessions cleared");
  }, []);

  // Function to clear session for specific address
  const clearSessionForAddress = useCallback((address) => {
    setSessionVouchersByAddress(prev => {
      const newMap = new Map(prev);
      newMap.delete(address);
      return newMap;
    });
    console.log(`Session cleared for address: ${address}`);
  }, []);

  const value = {
    sessionVouchersByAddress,
    hasValidSession,
    getSessionForAddress,
    setSessionForAddress,
    clearAllSessions,
    clearSessionForAddress,
  };

  return (
    <SessionVoucherContext.Provider value={value}>
      {children}
    </SessionVoucherContext.Provider>
  );
}

// Hook to use session voucher context
export function useSessionVoucher() {
  const context = useContext(SessionVoucherContext);
  if (!context) {
    throw new Error(
      "useSessionVoucher must be used within a SessionVoucherProvider"
    );
  }
  return context;
}

// Hook to clear all sessions (for page refresh)
export function useClearAllSessions() {
  const { clearAllSessions } = useSessionVoucher();
  return clearAllSessions;
}

/**
 * Get or initialize the Inco configuration based on the current chain and environment
 */
export async function getConfig(chainId, incoEnv) {
  if (incoConfig) return incoConfig;

  console.log(
    `🔧 Initializing Inco config for chain: ${chainId}, env: ${incoEnv}`
  );

  if (chainId === 84532) {
    // v1: explicit Base Sepolia factory (replaces Lightning.latest(env, 84532)).
    // Pass reliable host-chain RPCs so the SDK's executor/verifier reads avoid
    // the heavily rate-limited public default endpoint.
    incoConfig = await Lightning.baseSepoliaTestnet({
      hostChainRpcUrls: [
        "https://base-sepolia-rpc.publicnode.com",
        "https://base-sepolia.drpc.org",
        "https://sepolia.base.org",
      ],
    });
  } else {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return incoConfig;
}

/**
 * Initialize session voucher for attested decrypt with session key
 */
export function useInitializeSessionVoucher() {
  const {
    hasValidSession,
    getSessionForAddress,
    setSessionForAddress
  } = useSessionVoucher();

  return useCallback(
    async (walletClient, chainId, publicClient, incoEnv, userAddress) => {
      // Check if we already have a valid session for this address
      if (hasValidSession(userAddress)) {
        console.log(`Using existing session voucher for address: ${userAddress}`);
        const sessionData = getSessionForAddress(userAddress);
        const { voucher, keypair } = sessionData;
        return { voucher, keypair };
      }

      console.log(`Creating new session voucher for address: ${userAddress}`);
      const inco = await getConfig(chainId, incoEnv);

      // v1: the session key is a throwaway viem signing account. The voucher
      // authorizes it to decrypt the user's handles until expiry — no wallet
      // popup per read. (Replaces the secp256k1 keypair flow.)
      const ephemeralAccount = privateKeyToAccount(generatePrivateKey());
      console.log("Ephemeral session account address:", ephemeralAccount.address);

      const sessionVerifierAddress =
        "0xc34569efc25901bdd6b652164a2c8a7228b23005";

      // Create voucher valid for 24 hours
      const expirationDate = new Date(Date.now() + 1000 * 60 * 60 * 24);

      console.log("🔑 Creating session voucher for attested decrypt...");

      const sessionVoucher = await inco.grantSessionKeyAllowanceVoucher(
        walletClient,
        ephemeralAccount.address,
        expirationDate,
        sessionVerifierAddress
      );

      console.log("✅ Session voucher created");

      // Store session data for this specific address
      const newSessionData = {
        voucher: sessionVoucher,
        ephemeralAccount,
        expiration: expirationDate,
      };
      setSessionForAddress(userAddress, newSessionData);

      return { voucher: sessionVoucher, ephemeralAccount };
    },
    [hasValidSession, getSessionForAddress, setSessionForAddress]
  );
}

/**
 * Encrypt a value for a specific contract and account
 */
export async function encryptValue({
  value,
  address,
  contractAddress,
  chainId,
  incoEnv,
}) {
  const inco = await getConfig(chainId, incoEnv);

  const encryptedData = await inco.encrypt(BigInt(value), {
    accountAddress: address,
    dappAddress: contractAddress,
    handleType: handleTypes.euint256,
  });

  console.log("Encrypted data: ", encryptedData);

  return encryptedData;
}

/**
 * Hook to decrypt a value using session voucher
 */
export function useDecryptValue() {
  const { hasValidSession, getSessionForAddress } = useSessionVoucher();
  const initializeSessionVoucher = useInitializeSessionVoucher();

  return useCallback(
    async ({ walletClient, handle, chainId, publicClient, incoEnv, userAddress }) => {
      const inco = await getConfig(chainId, incoEnv);

      // Ensure we have a session voucher initialized for this address
      if (!hasValidSession(userAddress)) {
        await initializeSessionVoucher(walletClient, chainId, publicClient, incoEnv, userAddress);
      }

      const sessionData = getSessionForAddress(userAddress);
      const { voucher, ephemeralAccount } = sessionData;

      // Use attested decrypt with voucher.
      // v1 signature: (account, voucher, handles, options?) — no publicClient arg;
      // the session key (ephemeralAccount) signs in place of the wallet.
      console.log("Decrypting handle:", handle, "type:", typeof handle);
      console.log("Using session voucher for address:", userAddress);

      const decrypted = await inco.attestedDecryptWithVoucher(
        ephemeralAccount,
        voucher,
        [handle]
      );

      // Return the decrypted value
      return decrypted[0].plaintext.value;
    },
    [hasValidSession, getSessionForAddress, initializeSessionVoucher]
  );
}

/**
 * Get the fee required for Inco operations
 */
export async function getFee(chainId, incoEnv) {
  const inco = await getConfig(chainId, incoEnv);

  // Read the fee from the Lightning contract
  const fee = await inco.publicClient.readContract({
    address: inco.executorAddress,
    abi: [
      {
        type: "function",
        inputs: [],
        name: "getFee",
        outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
        stateMutability: "pure",
      },
    ],
    functionName: "getFee",
  });

  console.log("Fee: ", fee);
  return fee;
}
