import React, { useEffect, useState } from "react";

const Keyboard = ({ onKeyPress }) => {
  // Define the keyboard layout rows
  const rows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ];

  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Check device size
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determine size classes based on screen width
  const getKeySize = () => {
    if (screenSize.width < 375) {
      return "w-6 h-6 m-0.5 text-xs"; // Extra small screens
    } else if (screenSize.width < 480) {
      return "w-7 h-7 m-0.5 text-xs"; // Small mobile screens
    } else if (screenSize.width < 640) {
      return "w-8 h-8 m-1 text-sm"; // Mobile screens
    } else if (screenSize.width < 768) {
      return "w-10 h-10 m-1 text-md"; // Tablet screens
    } else {
      return "w-12 h-12 m-1.5 text-xl"; // Desktop screens
    }
  };

  // Get the padding size based on screen width
  const getPadding = () => {
    if (screenSize.width < 640) {
      return "p-1";
    } else if (screenSize.width < 768) {
      return "p-2";
    } else {
      return "p-4";
    }
  };

  // Get the margin between rows
  const getRowMargin = () => {
    if (screenSize.width < 640) {
      return "mb-1";
    } else {
      return "mb-2";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-full">
      <div className={`border-2 border-[#143E94] ${getPadding()} w-full flex flex-col items-center`}>
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`flex justify-center flex-wrap ${rowIndex !== 2 ? getRowMargin() : ""}`}
          >
            {row.map((key) => (
              <div
                key={key}
                onClick={() => onKeyPress(key)}
                className={`
                  border-2 border-[#143E94] text-[#3673F5] 
                  ${getKeySize()}
                  flex items-center justify-center 
                  hover:bg-[#3673F5] hover:text-[#020B20] 
                  transition duration-200 ease-in-out cursor-pointer
                  rounded-sm
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