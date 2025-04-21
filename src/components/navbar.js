'use client";';
import React from "react";
import { useAccount, useDisconnect } from "wagmi";

const Navbar = () => {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  const logout = async () => {
    try {
      disconnect();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="px-16 py-9 flex items-center justify-between">
      <div className="border-2 border-[#3673F5] text-[#3673F5] w-48 h-16 grid place-items-center text-3xl">
        Hangman
      </div>
      {address && (
        <div
          onClick={logout}
          className="border-2 border-[#3673F5] text-[#3673F5] hover:bg-[#3673F5] hover:text-[#020B20] cursor-pointer w-48 h-16 grid place-items-center text-3xl"
        >
          <p>{address.slice(0, 4)}</p>
        </div>
      )}
    </div>
  );
};

export default Navbar;
