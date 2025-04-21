"use client";
import Keyboard from "@/components/keyboard";
import HeroImageLogoutScreen from "@/components/logout-screen/hero-image";
import { useConnectModal } from "@rainbow-me/rainbowkit";

const ConnectWallet = () => {
  const { openConnectModal } = useConnectModal();

  return (
    <div className="h-[calc(100vh-136px)] flex w-full gap-8 overflow-hidden relative ">
      <HeroImageLogoutScreen />

      <div className="w-full pr-16">
        {openConnectModal && (
          <button
            onClick={openConnectModal}
            className="w-full bg-[#3673F5] hover:bg-[#3673F5]/80 h-28 grid place-items-center"
          >
            <span className="text-2xl text-[#020B20]">
              Connect Wallet to Play
            </span>
          </button>
        )}

        <div className="mt-32">
          <Keyboard />
        </div>
      </div>
    </div>
  );
};

export default ConnectWallet;
