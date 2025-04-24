"use client";
import React from "react";

import Image from "next/image";
import Navbar from "@/components/navbar";
import Keyboard from "@/components/keyboard";
import Stage from "@/components/stages/stage";

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
