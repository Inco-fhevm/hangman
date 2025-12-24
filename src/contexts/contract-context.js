"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const ContractContext = createContext(null);

export const ContractProvider = ({ children }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const res = await fetch("/api/contracts");
      if (!res.ok) throw new Error("Failed to fetch contract data");
      return res.json();
    },
    enabled: isClient, // Only run query on client side
  });

  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background text-red-500">
        Failed to load contract configuration.
      </div>
    );
  }

  return (
    <ContractContext.Provider value={{ contracts: data, isLoading, isError }}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContracts = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error("useContracts must be used within a ContractProvider");
  }
  return context;
};
