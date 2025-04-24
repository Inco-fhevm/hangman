"use client";
import React from "react";

import Navbar from "@/components/navbar";
import Keyboard from "@/components/keyboard";
import Stage from "@/components/stages/stage";

import { ErrorMessage } from "@/components/game/error-message";
import { StartGameButton } from "@/components/game/start-game-button";
import { WordTiles } from "@/components/game/word-tiles";
import { InputFields } from "@/components/game/input-fields";
import { IncorrectGuessCounter } from "@/components/game/incorrect-guess-counter";
import { useHangmanGame } from "@/hooks/use-hangman";
import { GameOverScreen } from "@/components/game/game-over-screen";

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
    <div className="md:max-w-screen-2xl mx-auto">
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
          } w-full gap-2 md:gap-8 relative`}
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
              <div className="flex flex-col items-center justify-center h-full pb-20 md:pb-40 mt-32 md:mt-0">
                <StartGameButton
                  onStartGame={handleStartGame}
                  isLoading={startGameLoading}
                  error={startGameError}
                />
              </div>
            ) : (
              <div className="mt-32 md:mt-0">
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
