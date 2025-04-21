import React from "react";

const HeroImageLogoutScreen = () => {
  return (
    <div className="h-full flex items-end justify-start px-16">
      <div className="relative" style={{ width: "581.82px" }}>
        <div className="absolute bottom-0 left-0 w-full z-10 px-10">
          <img
            src="/logout-screen/hangman.svg"
            alt="Hangman"
            className="max-w-full object-contain"
          />
        </div>

        <div className="w-full z-20 relative">
          <img
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
