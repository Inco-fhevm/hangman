import Image from "next/image";
import React, { useEffect, useState } from "react";

const Stage = ({ stage = 0 }) => {
  // Ensure stage is within valid range (1-8)
  const currentStage = Math.min(Math.max(0, stage), 8);
  const [isMobile, setIsMobile] = useState(false);

  // Check device size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`
      ${isMobile ? 'flex items-center justify-center w-full' : 'h-full flex items-end justify-start px-4 md:px-16'}
    `}>
      <div className={`relative ${isMobile ? 'w-64 md:w-80' : ''}`} style={{ width: isMobile ? 'auto' : "581.82px" }}>
        <div className={`
          ${isMobile ? 'static flex justify-center' : 'absolute bottom-0 left-0 w-full z-10 px-10'}
        `}>
          <Image
            width={isMobile ? 200 : 432.76}
            height={isMobile ? 310 : 672}
            src={`/stages/${currentStage}.svg`}
            alt={`Stage ${currentStage}`}
            className={`
              ${isMobile ? 'h-48 w-auto' : 'max-w-full'} 
              object-contain
            `}
          />
        </div>

        {!isMobile && (
          <div className="w-full z-20 relative">
            <Image
              width={581.82}
              height={140}
              src="/logout-screen/fire.svg"
              alt="Background"
              className="max-w-full object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Stage;