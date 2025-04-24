"use client";
import React, { useState, useRef, useEffect } from "react";
import { createPublicClient, http, parseAbiItem } from "viem";
import { baseSepolia } from "viem/chains";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import Image from "next/image";
import {
  HANGMAN_ABI,
  HANGMAN_FACTORY_ABI,
  HANGMAN_FACTORY_CONTRACT_ADDRESS,
} from "@/utils/contracts";
import { reEncryptValue } from "@/utils/inco-lite";
import Navbar from "@/components/navbar";
import Keyboard from "@/components/keyboard";
import Stage from "@/components/stages/stage";

// Components
const LoadingIndicator = ({ message }) => (
  <div className="flex flex-col items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3673F5]"></div>
    <p className="mt-4 text-[#3673F5] font-semibold">{message}</p>
  </div>
);

const ErrorMessage = ({ message, onRetry }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
    <strong className="font-bold">Error:</strong>
    <span className="block sm:inline"> Something went wrong!</span>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
      >
        Retry
      </button>
    )}
  </div>
);

const StartGameButton = ({ onStartGame, isLoading, error }) => (
  <div className="flex flex-col items-center justify-center">
    {error && <ErrorMessage message={error} onRetry={onStartGame} />}
    <h2 className="text-2xl md:text-5xl font-bold text-[#3673F5] mb-6">
      Ready to Play?
    </h2>
    <button
      onClick={onStartGame}
      disabled={isLoading}
      className={`bg-[#3673F5] text-white px-6 md:px-8 py-3 md:py-4 text-lg md:text-xl font-semibold transition-colors md:mt-6 ${
        isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
      }`}
    >
      {isLoading ? "Starting..." : "Start Game"}
    </button>
  </div>
);

const WordTiles = ({ tiles, correctTiles }) => (
  <div className="mb-8">
    <h3 className="text-xl text-center font-semibold text-[#3673F5] mb-6">
      Word to Guess:
    </h3>
    <div className="flex space-x-4 w-full px-2 md:px-8 justify-center">
      {[...Array(4)].map((_, index) => (
        <div
          key={`tile-${index}`}
          className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center 
                   text-3xl md:text-4xl font-bold border-b-2 
                   ${
                     correctTiles[index]
                       ? "border-green-500 text-green-700 bg-green-100"
                       : "border-[#3673F5] text-[#3673F5] bg-white/10"
                   }`}
        >
          {tiles[index] || "_"}
        </div>
      ))}
    </div>
  </div>
);

const InputFields = ({
  inputs,
  wrongInputs,
  activeIndex,
  inputRefs,
  handleInputChange,
  handleKeyDown,
  handlePaste,
  handleFocus,
}) => (
  <div className="flex space-x-2 md:space-x-4 w-full px-2 md:px-8">
    {[...Array(8)].map((_, index) => (
      <input
        key={index}
        ref={(el) => (inputRefs.current[index] = el)}
        type="text"
        value={inputs[index]}
        onChange={(e) => handleInputChange(index, e.target.value.toUpperCase())}
        onKeyDown={(e) => handleKeyDown(e, index)}
        onPaste={handlePaste}
        onFocus={() => handleFocus(index)}
        className={`w-full h-12 md:h-16 text-center border-b-2 
                  ${
                    wrongInputs[index]
                      ? "border-b-4 border-red-500 text-red-500 bg-red-50"
                      : `${activeIndex === index ? "border-b-4" : "border-b-2"} 
                       border-[#3673F5] text-[#3673F5] bg-transparent`
                  } 
                  text-2xl md:text-3xl focus:outline-none ${
                    !wrongInputs[index] && "focus:border-b-4"
                  }`}
        maxLength={1}
        autoComplete="off"
        readOnly={wrongInputs[index]}
      />
    ))}
  </div>
);

const IncorrectGuessCounter = ({ incorrectCount }) => (
  <div className="mt-6 text-center">
    <p className="text-lg text-gray-700">
      Incorrect Guesses:{" "}
      <span
        className={`font-bold ${incorrectCount > 5 ? "text-red-500" : "text-[#3673F5]"}`}
      >
        {incorrectCount}
      </span>
      /8
    </p>
  </div>
);

const GameOverScreen = ({ hasWon, resetGame, isMobile }) => (
  <div
    className={`grid place-items-center pb-24 ${
      isMobile ? "" : "h-[calc(100vh-136px)]"
    } w-full`}
  >
    {hasWon ? (
      <div className="">
        <div className="h-full flex items-end px-4">
          <div
            className="relative"
            style={{ width: isMobile ? "auto" : "581.82px" }}
          >
            <div className="relative">
              <div
                className={`
             ${isMobile ? "flex justify-center" : "relative z-10"}
           `}
              >
                <Image
                  width={isMobile ? 200 : 260}
                  height={isMobile ? 310 : 406}
                  src={`/game-over/win.svg`}
                  alt={`Game Over`}
                  className={`
               ${isMobile ? "h-48 w-auto" : "max-w-full"} 
               object-contain
             `}
                />

                <div className="absolute top-0 left-80 text-[#3673F5] flex flex-col items-start z-30">
                  <div className="text-4xl mb-4 pixel-font max-w-[21rem]">
                    Thank you for saving my life!
                  </div>
                  <button
                    className="border-2 mt-8 text-2xl border-[#3673F5] text-[#3673F5] hover:bg-[#3673F5] hover:text-white px-8 py-4 pixel-font"
                    onClick={resetGame}
                  >
                    Play Again
                  </button>
                </div>
              </div>

              {!isMobile && (
                <div className="absolute left-0 w-full z-20">
                  <Image
                    width={581.82}
                    height={140}
                    src="/game-over/line.svg"
                    alt="Background"
                    className="max-w-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="">
        <div className="h-full flex items-end px-4">
          <div
            className="relative"
            style={{ width: isMobile ? "auto" : "581.82px" }}
          >
            <div className="relative">
              <div
                className={`
              ${isMobile ? "flex justify-center" : "relative z-10"}
            `}
              >
                <Image
                  width={isMobile ? 200 : 260}
                  height={isMobile ? 310 : 406}
                  src={`/game-over/lose.svg`}
                  alt={`Game Over`}
                  className={`
                ${isMobile ? "h-48 w-auto" : "max-w-full"} 
                object-contain
              `}
                />

                <div className="absolute top-0 right-16 text-[#3673F5] flex flex-col items-end z-30">
                  <div className="text-4xl mb-4 pixel-font">You suck.</div>
                  <button
                    className="border-2 mt-8 text-2xl border-[#3673F5] text-[#3673F5] hover:bg-[#3673F5] hover:text-white px-8 py-4 pixel-font"
                    onClick={resetGame}
                  >
                    Try Again
                  </button>
                </div>
              </div>

              {!isMobile && (
                <div className="absolute bottom-0 left-0 w-full z-20">
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
        </div>
      </div>
    )}
  </div>
);

// Game Logic hook
const useHangmanGame = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [tiles, setTiles] = useState(Array(4).fill(""));
  const [correctTiles, setCorrectTiles] = useState(Array(4).fill(false));
  const [inputs, setInputs] = useState(Array(8).fill(""));
  const [wrongInputs, setWrongInputs] = useState(Array(8).fill(false));
  const [hangmanContractAddress, setHangmanContractAddress] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [startGameLoading, setStartGameLoading] = useState(false);
  const [startGameError, setStartGameError] = useState(null);
  const [guessLoading, setGuessLoading] = useState(false);
  const [guessError, setGuessError] = useState(null);

  const inputRefs = useRef([]);
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const walletClient = useWalletClient();
  const chainId = useChainId();
  const { address } = useAccount();

  // Initialize refs array and check device size
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 8);

    // Add window resize listener to detect mobile
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

  // Check for win or lose condition
  useEffect(() => {
    // Check for win condition - all tiles filled (4 correct letters)
    const correctGuessCount = correctTiles.filter(Boolean).length;
    if (correctGuessCount === 4) {
      setGameOver(true);
      setHasWon(true);
    }

    // Check for lose condition - 8 incorrect guesses
    if (incorrectCount >= 8) {
      setGameOver(true);
      setHasWon(false);
    }
  }, [correctTiles, incorrectCount]);

  const handleStartGame = async () => {
    setStartGameLoading(true);
    setStartGameError(null);

    try {
      const hash = await writeContractAsync({
        address: HANGMAN_FACTORY_CONTRACT_ADDRESS,
        abi: HANGMAN_FACTORY_ABI,
        functionName: "CreateGame",
        args: [address],
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });

      if (receipt.status === "reverted") {
        throw new Error("Transaction reverted. Game creation failed.");
      }

      const gameContractAddress = await publicClient.readContract({
        address: HANGMAN_FACTORY_CONTRACT_ADDRESS,
        abi: HANGMAN_FACTORY_ABI,
        functionName: "getGameAddressByPlayer",
        args: [address],
      });

      setHangmanContractAddress(gameContractAddress);
      setGameStarted(true);
      setGameOver(false);
      setHasWon(false);
      setIncorrectCount(0);
      setTiles(Array(4).fill(""));
      setCorrectTiles(Array(4).fill(false));
      setInputs(Array(8).fill(""));
      setWrongInputs(Array(8).fill(false));

      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 0);
    } catch (error) {
      console.error("Failed to start game:", error);
      setStartGameError(
        error.message || "Failed to start game. Please try again."
      );
    } finally {
      setStartGameLoading(false);
    }
  };

  const handleInputChange = async (index, value) => {
    if (gameOver || guessLoading) return; // Prevent input if game is over or loading

    if (value.length <= 1) {
      // Create a copy of inputs to modify
      const newInputs = [...inputs];

      // Store the value in the current input field temporarily
      newInputs[index] = value;
      setInputs(newInputs);

      // Only proceed with API calls if there's a value
      if (value) {
        const lowercasedValue = value.toLowerCase();
        setGuessLoading(true);
        setGuessError(null);

        try {
          // Call guessLetter function
          const hash = await writeContractAsync({
            address: hangmanContractAddress,
            abi: HANGMAN_ABI,
            functionName: "guessLetter",
            args: [lowercasedValue],
          });

          const receipt = await publicClient.waitForTransactionReceipt({
            hash,
          });

          // Get tile position from contract
          const tile = await publicClient.readContract({
            address: hangmanContractAddress,
            abi: HANGMAN_ABI,
            functionName: "getTile",
            args: [],
          });

          const decryptedTile = await reEncryptValue({
            chainId,
            walletClient,
            handle: tile,
          });

          // Convert BigInt to Number safely
          const tilePosition = parseInt(decryptedTile.toString());

          // Check if decrypted tile is a valid position (1-4)
          if (tilePosition >= 1 && tilePosition <= 4) {
            // This means the guessed letter is correct and should be placed at position tilePosition
            // Clear the input field where user typed
            newInputs[index] = "";

            // Get array index (0-based) from tile position (1-based)
            const tileIndex = tilePosition - 1;

            // Update the tile with the correct letter
            const newTiles = [...tiles];
            newTiles[tileIndex] = value.toUpperCase();
            setTiles(newTiles);

            // Mark this tile as correct
            const newCorrectTiles = [...correctTiles];
            newCorrectTiles[tileIndex] = true;
            setCorrectTiles(newCorrectTiles);

            // Clear the current input and update inputs state
            setInputs(newInputs);

            // Focus on the next empty input
            const nextEmptyIndex = newInputs.findIndex((val) => !val);
            if (nextEmptyIndex !== -1) {
              setActiveIndex(nextEmptyIndex);
              inputRefs.current[nextEmptyIndex].focus();
            }
          } else if (tilePosition === 100) {
            // Wrong input
            // Increment incorrect count
            setIncorrectCount((prevCount) => prevCount + 1);

            // Keep the wrong input in the field and mark it as wrong
            const newWrongInputs = [...wrongInputs];
            newWrongInputs[index] = true;
            setWrongInputs(newWrongInputs);

            // Focus on the next input field
            if (index < 7) {
              setActiveIndex(index + 1);
              inputRefs.current[index + 1].focus();
            }
          } else {
            console.log("Unexpected tile value:", tilePosition);
            setGuessError("Unexpected response from game. Please try again.");
          }
        } catch (error) {
          console.error("Error in handleInputChange:", error);
          setGuessError(
            error.message || "Error processing your guess. Please try again."
          );
          // Reset input on error
          newInputs[index] = "";
          setInputs(newInputs);
        } finally {
          setGuessLoading(false);
        }
      }
    }
  };

  // Handle paste functionality
  const handlePaste = (e) => {
    if (gameOver || guessLoading) return; // Prevent paste if game is over or loading

    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").toUpperCase();

    if (!pastedText) return;

    const newInputs = [...inputs];

    // Fill in as many characters as we have inputs
    for (let i = 0; i < Math.min(pastedText.length, 8); i++) {
      const targetIndex = activeIndex + i;
      if (targetIndex < 8) {
        newInputs[targetIndex] = pastedText[i];
      }
    }

    setInputs(newInputs);

    // Set focus to the next empty input or the last input
    const nextEmptyIndex = newInputs.findIndex(
      (val, idx) => idx >= activeIndex && !val
    );
    if (nextEmptyIndex !== -1 && nextEmptyIndex < 8) {
      setActiveIndex(nextEmptyIndex);
      inputRefs.current[nextEmptyIndex].focus();
    } else {
      setActiveIndex(Math.min(activeIndex + pastedText.length, 7));
      inputRefs.current[Math.min(activeIndex + pastedText.length, 7)].focus();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e, index) => {
    if (gameOver || guessLoading) return; // Prevent keyboard navigation if game is over or loading

    if (e.key === "ArrowRight" && index < 7) {
      // Find the next non-wrong input to focus on
      let nextIndex = index + 1;
      while (nextIndex < 8 && wrongInputs[nextIndex]) {
        nextIndex++;
      }
      if (nextIndex < 8) {
        setActiveIndex(nextIndex);
        inputRefs.current[nextIndex].focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      // Find the previous non-wrong input to focus on
      let prevIndex = index - 1;
      while (prevIndex >= 0 && wrongInputs[prevIndex]) {
        prevIndex--;
      }
      if (prevIndex >= 0) {
        setActiveIndex(prevIndex);
        inputRefs.current[prevIndex].focus();
      }
    } else if (e.key === "Backspace" && index > 0 && inputs[index] === "") {
      // If current input is empty and backspace is pressed, move to previous non-wrong input
      let prevIndex = index - 1;
      while (prevIndex >= 0 && wrongInputs[prevIndex]) {
        prevIndex--;
      }
      if (prevIndex >= 0) {
        setActiveIndex(prevIndex);
        inputRefs.current[prevIndex].focus();
      }
    }
  };

  // Handle virtual keyboard input
  const handleVirtualKeyPress = (key) => {
    if (gameOver || guessLoading) return; // Prevent virtual keyboard input if game is over or loading

    if (activeIndex < 8 && !wrongInputs[activeIndex]) {
      handleInputChange(activeIndex, key);
    } else {
      // Find the next available input that isn't marked as wrong
      const nextAvailableIndex = inputs.findIndex(
        (val, idx) => !val && !wrongInputs[idx]
      );
      if (nextAvailableIndex !== -1) {
        setActiveIndex(nextAvailableIndex);
        inputRefs.current[nextAvailableIndex].focus();
        handleInputChange(nextAvailableIndex, key);
      }
    }
  };

  // Handle input focus
  const handleFocus = (index) => {
    if (gameOver || guessLoading) return; // Prevent focus if game is over or loading

    // Don't allow focusing on wrong inputs
    if (!wrongInputs[index]) {
      setActiveIndex(index);
    } else {
      // If trying to focus on a wrong input, find the next available empty input
      const nextEmptyIndex = inputs.findIndex(
        (val, idx) => !val && !wrongInputs[idx]
      );
      if (nextEmptyIndex !== -1) {
        setActiveIndex(nextEmptyIndex);
        inputRefs.current[nextEmptyIndex].focus();
      }
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setHasWon(false);
    setIncorrectCount(0);
    setTiles(Array(4).fill(""));
    setCorrectTiles(Array(4).fill(false));
    setInputs(Array(8).fill(""));
    setWrongInputs(Array(8).fill(false));
    setStartGameError(null);
    setGuessError(null);
  };

  return {
    gameStarted,
    gameOver,
    hasWon,
    incorrectCount,
    tiles,
    correctTiles,
    inputs,
    wrongInputs,
    activeIndex,
    isMobile,
    inputRefs,
    startGameLoading,
    startGameError,
    guessLoading,
    guessError,
    handleStartGame,
    handleInputChange,
    handlePaste,
    handleKeyDown,
    handleVirtualKeyPress,
    handleFocus,
    resetGame,
  };
};

// Main Page Component
const Page = () => {
  const {
    gameStarted,
    gameOver,
    hasWon,
    incorrectCount,
    tiles,
    correctTiles,
    inputs,
    wrongInputs,
    activeIndex,
    isMobile,
    inputRefs,
    startGameLoading,
    startGameError,
    guessLoading,
    guessError,
    handleStartGame,
    handleInputChange,
    handlePaste,
    handleKeyDown,
    handleVirtualKeyPress,
    handleFocus,
    resetGame,
  } = useHangmanGame();

  return (
    <div>
      <Navbar />
      {gameOver ? (
        <GameOverScreen
          hasWon={hasWon}
          resetGame={resetGame}
          isMobile={isMobile}
        />
      ) : (
        <div
          className={`${
            isMobile ? "flex flex-col h-auto" : "h-[calc(100vh-136px)] flex"
          } w-full gap-2 md:gap-8 overflow-hidden relative`}
        >
          <div
            className={`${
              isMobile ? "w-full h-64 flex justify-center" : "h-full"
            }`}
          >
            <Stage stage={incorrectCount} />
          </div>

          <div
            className={`${
              isMobile ? "w-full px-4 py-4" : "w-full pr-4 md:pr-16 mt-6"
            }`}
          >
            {!gameStarted ? (
              <div className="flex flex-col items-center justify-center h-full pb-20 md:pb-40">
                <StartGameButton
                  onStartGame={handleStartGame}
                  isLoading={startGameLoading}
                  error={startGameError}
                />
              </div>
            ) : (
              <>
                {guessError && <ErrorMessage message={guessError} />}
                {/* {guessLoading && (
                  <LoadingIndicator message="Processing your guess..." />
                )} */}

                <WordTiles tiles={tiles} correctTiles={correctTiles} />

                <InputFields
                  inputs={inputs}
                  wrongInputs={wrongInputs}
                  activeIndex={activeIndex}
                  inputRefs={inputRefs}
                  handleInputChange={handleInputChange}
                  handleKeyDown={handleKeyDown}
                  handlePaste={handlePaste}
                  handleFocus={handleFocus}
                />

                <IncorrectGuessCounter incorrectCount={incorrectCount} />

                <div className="mt-6 md:mt-8">
                  <Keyboard onKeyPress={handleVirtualKeyPress} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
