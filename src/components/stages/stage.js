import Image from "next/image";
import React, { useEffect, useState } from "react";

const Stage = ({ stage = 0 }) => {
  // Ensure stage is within valid range (0-8)
  const currentStage = Math.min(Math.max(0, stage), 8);
  const [screenType, setScreenType] = useState("large"); // mobile, macbook, large

  // Check device size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < 768) {
        setScreenType("mobile");
      }
      // MacBook range (roughly 13-16 inch laptop screens)
      else if (width >= 768 && width <= 1600) {
        setScreenType("macbook");
      }
      // Larger displays
      else {
        setScreenType("large");
      }
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = screenType === "mobile";
  const isMacbook = screenType === "macbook";
  const isLarge = screenType === "large";

  // For mobile - take full available width and position at the top
  if (isMobile) {
    return (
      <div className="w-full flex flex-col items-center justify-start h-56 mt-2">
        <div className="relative w-full max-w-xs flex justify-center">
          <div className="relative w-auto" style={{ maxWidth: "70%" }}>
            <Image
              width={160}
              height={200}
              src={`/stages/${currentStage}.svg`}
              alt={`Stage ${currentStage}`}
              className="w-full h-auto"
              priority
            />

            <div className="absolute -bottom-1 left-0 w-full">
              <Image
                width={160}
                height={30}
                src="/logout-screen/fire.svg"
                alt="Fire"
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For desktop views
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="relative" style={{ width: "581.82px" }}>
        <div className="relative flex justify-center">
          <div className="relative flex justify-center">
            <Image
              width={432.76}
              height={672}
              src={`/stages/${currentStage}.svg`}
              alt={`Stage ${currentStage}`}
              className="max-w-full object-contain"
              style={{
                height: "calc(100vh - 180px)",
                maxHeight: "70vh",
                width: "auto",
                objectFit: "contain",
              }}
              priority
            />

            <div className="absolute bottom-0 left-0 w-full">
              <Image
                width={581.82}
                height={140}
                src="/logout-screen/fire.svg"
                alt="Fire"
                className="w-full object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stage;
