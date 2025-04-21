"use client";
import Keyboard from "@/components/keyboard";
import ConnectWallet from "@/components/logout-screen/connect-wallet";
import HeroImageLogoutScreen from "@/components/logout-screen/hero-image";
import Navbar from "@/components/navbar";
import Stage from "@/components/stages/stage";
import React, { useState } from "react";

const Page = () => {
  const [inputs, setInputs] = useState(Array(7).fill(""));

  const handleInputChange = (index, value) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  return (
    <div>
      <Navbar />
      <div className="h-[calc(100vh-136px)] flex w-full gap-8 overflow-hidden relative">
        <Stage />

        <div className="w-full pr-16 mt-6">
          {/* <div className="w-full h-28 grid place-items-center"> */}
            <div className="flex space-x-4 w-full px-8">
              {[...Array(7)].map((_, index) => (
                <input
                  key={index}
                  type="text"
                  value={inputs[index]}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  className="w-full h-20 text-center border-b-2 border-[#3673F5] bg-transparent text-4xl focus:outline-none focus:border-b-4"
                  maxLength={1}
                />
              ))}
            </div>
          {/* </div> */}

          <div className="mt-32">
            <Keyboard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
