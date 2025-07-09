"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useSignMessage } from "wagmi";
import { getBurnerWallet } from "@/utils/get-burner-wallet";

const BurnerWalletContext = createContext(undefined);

export function BurnerWalletProvider({ children }) {
  const { signMessage, data: signature, isPending, error } = useSignMessage();
  const [burnerWallet, setBurnerWallet] = useState(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const promiseRef = useRef(null);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const storedSignature = localStorage.getItem("burner-wallet-signature");
      if (storedSignature) {
        const wallet = getBurnerWallet(storedSignature);
        setBurnerWallet(wallet);
      }
    } catch (err) {
      console.error("Failed to restore burner wallet:", err);
      localStorage.removeItem("burner-wallet-signature");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create wallet when signature is available
  useEffect(() => {
    if (signature && isCreatingWallet) {
      try {
        const wallet = getBurnerWallet(signature);
        setBurnerWallet(wallet);
        localStorage.setItem("burner-wallet-signature", signature);

        console.log(
          "✅ Burner wallet created and stored:",
          wallet.account.address
        );

        // Resolve the promise if it exists
        if (promiseRef.current?.resolve) {
          promiseRef.current.resolve(wallet);
          promiseRef.current = null;
        }
      } catch (err) {
        console.error("Failed to create burner wallet:", err);

        // Reject the promise if it exists
        if (promiseRef.current?.reject) {
          promiseRef.current.reject(err);
          promiseRef.current = null;
        }
      } finally {
        setIsCreatingWallet(false);
      }
    }
  }, [signature, isCreatingWallet]);

  // Handle signing errors
  useEffect(() => {
    if (error && isCreatingWallet) {
      console.error("Signing error:", error);
      if (promiseRef.current?.reject) {
        promiseRef.current.reject(error);
        promiseRef.current = null;
      }
      setIsCreatingWallet(false);
    }
  }, [error, isCreatingWallet]);

  const createBurnerWallet = () => {
    if (!signMessage || isPending)
      return Promise.reject(new Error("Cannot create wallet right now"));

    setIsCreatingWallet(true);

    return new Promise((resolve, reject) => {
      // Store resolve/reject for when signature is ready
      promiseRef.current = { resolve, reject };

      signMessage(
        { message: "Burner wallet" },
        {
          onSuccess: () => {
            // The signature will be handled in the useEffect
          },
          onError: (error) => {
            setIsCreatingWallet(false);
            if (promiseRef.current) {
              promiseRef.current.reject(error);
              promiseRef.current = null;
            }
          },
        }
      );
    });
  };

  const clearBurnerWallet = () => {
    setBurnerWallet(null);
    localStorage.removeItem("burner-wallet-signature");
  };

  const value = {
    burnerWallet,
    createBurnerWallet,
    clearBurnerWallet,
    isCreating: isPending || isCreatingWallet,
    isLoading,
    error,
    hasWallet: !!burnerWallet,
  };

  return (
    <BurnerWalletContext.Provider value={value}>
      {children}
    </BurnerWalletContext.Provider>
  );
}

export function useBurnerWallet() {
  const context = useContext(BurnerWalletContext);
  if (context === undefined) {
    throw new Error(
      "useBurnerWallet must be used within a BurnerWalletProvider"
    );
  }
  return context;
}
