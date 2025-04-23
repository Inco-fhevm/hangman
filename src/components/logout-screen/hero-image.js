import Image from "next/image";
import React from "react";

const HeroImageLogoutScreen = () => {
  return (
    <div className="h-full flex items-end justify-start px-16">
      <div className="relative" style={{ width: "581.82px" }}>
        <div className="absolute bottom-0 left-0 w-full z-10 px-10">
          <Image
            width={432.76}
            height={672}
            src="/logout-screen/hangman.svg"
            alt="Hangman"
            className="max-w-full object-contain"
          />
        </div>

        <div className="w-full z-20 relative">
          <Image
            width={581.82}
            height={140}
            src="/logout-screen/fire.svg"
            alt="Fire"
            className="max-w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default HeroImageLogoutScreen;
