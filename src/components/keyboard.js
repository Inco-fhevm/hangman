import React, { useEffect, useState } from "react";

const Keyboard = ({ onKeyPress }) => {
  // Define the keyboard layout rows
  const rows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ];

  const [isMobile, setIsMobile] = useState(false);

  // Check device size
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
    <div className="flex flex-col items-center justify-center w-full">
      <div className="border-2 border-[#143E94] p-2 md:p-6 w-full">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`flex justify-center ${rowIndex !== 2 ? "mb-2 md:mb-4" : ""}`}
          >
            {row.map((key) => (
              <div
                key={key}
                onClick={() => onKeyPress(key)}
                className={`
                  border-2 border-[#143E94] text-[#3673F5] 
                  ${isMobile ? "w-8 h-8 m-0.5 text-sm" : "w-12 h-12 m-1 text-xl"}
                  flex items-center justify-center 
                  hover:bg-[#3673F5] hover:text-[#020B20] 
                  transition duration-200 ease-in-out cursor-pointer
                `}
              >
                {key}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Keyboard;
