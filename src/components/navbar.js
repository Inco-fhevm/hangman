"use client";

import React, { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";

const Navbar = () => {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const [isHovered, setIsHovered] = useState(false);

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
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`border-2 text-3xl w-48 h-16 grid place-items-center cursor-pointer 
            ${isHovered ? "bg-red-100 text-red-600 border-red-400" : "text-[#3673F5] border-[#3673F5] hover:bg-[#3673F5] hover:text-[#020B20]"}`}
        >
          <p>{isHovered ? "Logout" : address.slice(0, 4)}</p>
        </div>
      )}
    </div>
  );
};

export default Navbar;
