import React, { useState } from "react";

const Stage = ({ stage = 1 }) => {
  // Ensure stage is within valid range (1-8)
  const currentStage = Math.min(Math.max(1, stage), 8);

  return (
    <div className="h-full flex items-end justify-start px-16">
      <div className="relative" style={{ width: "581.82px" }}>
        <div className="absolute bottom-0 left-0 w-full z-10 px-10">
          <img
            src={`/stages/${currentStage}.svg`}
            alt={`Stage ${currentStage}`}
            className="max-w-full object-contain"
          />
        </div>

        <div className="w-full z-20 relative">
          <img
            src="/logout-screen/fire.svg"
            alt="Background"
            className="max-w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default Stage;
