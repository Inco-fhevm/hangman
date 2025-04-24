import Image from "next/image";
import React from "react";

const HeroImageLogoutScreen = ({ isMobile }) => {
  // Define different dimensions based on device type
  const hangmanDimensions = isMobile
    ? { width: 220, height: 350 }
    : { width: 432.76, height: 672 };

  const fireDimensions = isMobile
    ? { width: 300, height: 70 }
    : { width: 581.82, height: 140 };

  const containerStyle = isMobile
    ? { width: "300px", maxWidth: "100%" }
    : { width: "581.82px", maxWidth: "100%" };

  const hangmanStyle = isMobile
    ? {
        height: "calc(100vh - 280px)",
        maxHeight: "45vh",
        width: "auto",
        objectFit: "contain",
      }
    : {
        height: "calc(100vh - 180px)",
        maxHeight: "70vh",
        width: "auto",
        objectFit: "contain",
      };

  return (
    <div
      className={`${isMobile ? "" : ""} flex items-center justify-center w-full h-full`}
    >
      <div className={`relative `}style={containerStyle}>
        <div className="relative flex justify-center">
          <div className="relative flex justify-center">
            <Image
              width={hangmanDimensions.width}
              height={hangmanDimensions.height}
              src="/logout-screen/hangman.svg"
              alt={"Hangman"}
              className="max-w-full object-contain"
              style={hangmanStyle}
              priority
            />

            <div className="absolute bottom-0 left-0 w-full">
              <Image
                width={fireDimensions.width}
                height={fireDimensions.height}
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

export default HeroImageLogoutScreen;
