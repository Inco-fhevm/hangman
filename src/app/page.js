"use client";
import Keyboard from "@/components/keyboard";
import Navbar from "@/components/navbar";
import Stage from "@/components/stages/stage";
import React, { useState, useRef, useEffect } from "react";

const Page = () => {
  const [inputs, setInputs] = useState(Array(7).fill(""));
  const inputRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 7);
  }, []);

  // Handle input change from physical keyboard
  const handleInputChange = (index, value) => {
    if (value.length <= 1) {
      const newInputs = [...inputs];
      newInputs[index] = value;
      setInputs(newInputs);

      // Move to next input if there's a value and not the last input
      if (value && index < 6) {
        setActiveIndex(index + 1);
        inputRefs.current[index + 1].focus();
      }
    }
  };

  // Handle paste functionality
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").toUpperCase();

    if (!pastedText) return;

    const newInputs = [...inputs];

    // Fill in as many characters as we have inputs
    for (let i = 0; i < Math.min(pastedText.length, 7); i++) {
      const targetIndex = activeIndex + i;
      if (targetIndex < 7) {
        newInputs[targetIndex] = pastedText[i];
      }
    }

    setInputs(newInputs);

    // Set focus to the next empty input or the last input
    const nextEmptyIndex = newInputs.findIndex(
      (val, idx) => idx >= activeIndex && !val
    );
    if (nextEmptyIndex !== -1 && nextEmptyIndex < 7) {
      setActiveIndex(nextEmptyIndex);
      inputRefs.current[nextEmptyIndex].focus();
    } else {
      setActiveIndex(Math.min(activeIndex + pastedText.length, 6));
      inputRefs.current[Math.min(activeIndex + pastedText.length, 6)].focus();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e, index) => {
    if (e.key === "ArrowRight" && index < 6) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1].focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      setActiveIndex(index - 1);
      inputRefs.current[index - 1].focus();
    } else if (e.key === "Backspace" && index > 0 && inputs[index] === "") {
      // If current input is empty and backspace is pressed, move to previous input
      setActiveIndex(index - 1);
      inputRefs.current[index - 1].focus();
    }
  };

  // Handle virtual keyboard input
  const handleVirtualKeyPress = (key) => {
    if (activeIndex < 7) {
      const newInputs = [...inputs];
      newInputs[activeIndex] = key;
      setInputs(newInputs);

      // Move to next input if not the last one
      if (activeIndex < 6) {
        setActiveIndex(activeIndex + 1);
        inputRefs.current[activeIndex + 1].focus();
      }
    }
  };

  // Handle input focus
  const handleFocus = (index) => {
    setActiveIndex(index);
  };

  return (
    <div>
      <Navbar />
      <div className="h-[calc(100vh-136px)] flex w-full gap-8 overflow-hidden relative">
        <Stage stage={2} />

        <div className="w-full pr-16 mt-6">
          <div className="flex space-x-4 w-full px-8">
            {[...Array(7)].map((_, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                value={inputs[index]}
                onChange={(e) =>
                  handleInputChange(index, e.target.value.toUpperCase())
                }
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                onFocus={() => handleFocus(index)}
                className={`w-full h-20 text-center border-b-2 ${
                  activeIndex === index ? "border-b-4" : "border-b-2"
                } border-[#3673F5] text-[#3673F5] bg-transparent text-4xl focus:outline-none focus:border-b-4`}
                maxLength={1}
                autoComplete="off"
              />
            ))}
          </div>

          <div className="mt-32">
            <Keyboard onKeyPress={handleVirtualKeyPress} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
