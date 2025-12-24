"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  Lightning,
  generateSecp256k1Keypair,
  getIncoVerifierContract,
} from "@inco/js/lite";
import { handleTypes } from "@inco/js";
import { privateKeyToAccount } from "viem/accounts";

let incoConfig = null;

// Create context for session voucher wrapper
const SessionVoucherContext = createContext();

// Provider component for session voucher management
export function SessionVoucherProvider({ children }) {
  const [sessionVoucherWrapper, setSessionVoucherWrapper] = useState(null);

  // Function to check if we have a valid session
  const hasValidSession = useCallback(() => {
    if (!sessionVoucherWrapper) return false;

    const { voucher, keypair, expiration } = sessionVoucherWrapper;
    return voucher && keypair && expiration > new Date();
  }, [sessionVoucherWrapper]);

  // Function to clear current session
  const clearSession = useCallback(() => {
    setSessionVoucherWrapper(null);
    console.log("Session cleared");
  }, []);

  const value = {
    sessionVoucherWrapper,
    setSessionVoucherWrapper,
    hasValidSession,
    clearSession,
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

// Hook to clear session
export function useClearSession() {
  const { clearSession } = useSessionVoucher();
  return clearSession;
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
    incoConfig = await Lightning.latest(incoEnv, 84532); // Base Sepolia
  } else {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return incoConfig;
}

/**
 * Initialize session voucher for attested decrypt with session key
 */
export function useInitializeSessionVoucher() {
  const { sessionVoucherWrapper, setSessionVoucherWrapper, hasValidSession } =
    useSessionVoucher();

  return useCallback(
    async (walletClient, chainId, publicClient, incoEnv) => {
      // Check if we already have a valid session in memory
      if (hasValidSession()) {
        console.log("Using existing session voucher from memory");
        const { voucher, keypair } = sessionVoucherWrapper;
        return { voucher, keypair };
      }

      console.log("Creating new session voucher");
      const inco = await getConfig(chainId, incoEnv);

      // Generate ephemeral keypair for session
      const ephemeralKeypair = await generateSecp256k1Keypair();
      const privateKey = `0x${ephemeralKeypair.kp.getPrivate("hex")}`;
      console.log("Private key:", privateKey);

      const ephemeralAccount = privateKeyToAccount(privateKey);

      console.log("Ephemeral account:", ephemeralAccount);
      console.log("Ephemeral account address:", ephemeralAccount.address);

      // const executorAddress = inco.executorAddress;
      // console.log("Inco executor address:", executorAddress);

      // const incoVerifier = await Lightning.getIncoVerifierContract(
      //   publicClient,
      //   executorAddress
      // );
      // const incoVerifierAddress = incoVerifier.address;
      const sessionVerifierAddress =
        "0xc34569efc25901bdd6b652164a2c8a7228b23005";
      console.log("Inco verifier address:", sessionVerifierAddress);

      // Create voucher valid for 24 hours
      const expirationDate = new Date(Date.now() + 1000 * 60 * 60 * 24);

      console.log("🔑 Creating session voucher for attested decrypt...");
      console.log("Ephemeral account address:", ephemeralAccount.address);
      console.log("Inco verifier address:", sessionVerifierAddress);

      const sessionVoucher = await inco.grantSessionKeyAllowanceVoucher(
        walletClient,
        ephemeralAccount.address,
        expirationDate,
        sessionVerifierAddress
      );

      console.log("✅ Session voucher created:", sessionVoucher);

      // Store session data in context
      const newSessionWrapper = {
        voucher: sessionVoucher,
        keypair: ephemeralKeypair,
        expiration: expirationDate,
      };
      setSessionVoucherWrapper(newSessionWrapper);

      return { voucher: sessionVoucher, keypair: ephemeralKeypair };
    },
    [sessionVoucherWrapper, setSessionVoucherWrapper, hasValidSession]
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
  const { sessionVoucherWrapper, hasValidSession } = useSessionVoucher();
  const initializeSessionVoucher = useInitializeSessionVoucher();

  return useCallback(
    async ({ walletClient, handle, chainId, publicClient, incoEnv }) => {
      const inco = await getConfig(chainId, incoEnv);

      // Ensure we have a session voucher initialized
      if (!hasValidSession()) {
        await initializeSessionVoucher(walletClient, chainId, publicClient);
      }

      const { voucher, keypair } = sessionVoucherWrapper;

      // Use attested decrypt with voucher
      console.log("Decrypting handle:", handle, "type:", typeof handle);

      console.log("using session voucher: ", voucher);
      const decrypted = await inco.attestedDecryptWithVoucher(
        keypair,
        voucher,
        publicClient,
        [handle]
      );

      // const decrypted = await inco.attestedDecrypt(walletClient, [handle]);

      // Return the decrypted value
      return decrypted[0].plaintext.value;
    },
    [sessionVoucherWrapper, hasValidSession, initializeSessionVoucher]
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
