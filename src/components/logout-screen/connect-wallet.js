"use client";
import Keyboard from "@/components/keyboard";
import HeroImageLogoutScreen from "@/components/logout-screen/hero-image";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useState, useEffect } from "react";

const ConnectWallet = () => {
  const { openConnectModal } = useConnectModal();
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`${
        isMobile ? "flex flex-col h-auto" : "h-[calc(100vh-136px)] flex"
      } w-full gap-2 md:gap-8 overflow-hidden relative`}
    >
      {/* Hero Image Container */}
      <div
        className={`${isMobile ? "w-full flex justify-center" : "h-full"}`}
      >
        <HeroImageLogoutScreen isMobile={isMobile} />
      </div>

      {/* Content Container */}
      <div
        className={`${
          isMobile ? "w-full px-4 py-4" : "w-full pr-4 md:pr-16 pt-12"
        }`}
      >
        {/* Connect Wallet Button */}
        {openConnectModal && (
          <button
            onClick={openConnectModal}
            className="w-full bg-[#3673F5] hover:bg-[#3673F5]/80 h-16 md:h-28 grid place-items-center"
          >
            <span className="text-lg md:text-2xl text-[#020B20]">
              Connect Wallet to Play
            </span>
          </button>
        )}

        {/* Keyboard Section - with proper spacing */}
        <div className="mt-6 md:mt-32">
          <Keyboard onKeyPress={() => {}} />
        </div>

        {/* Add some bottom spacing on mobile */}
        {isMobile && <div className="h-6"></div>}
      </div>
    </div>
  );
};

export default ConnectWallet;
