import React, { useState, useRef, useEffect } from "react";
import { reEncryptValue } from "@/utils/inco-lite";
import {
  HANGMAN_ABI,
  HANGMAN_FACTORY_ABI,
  HANGMAN_FACTORY_CONTRACT_ADDRESS,
} from "@/utils/contracts";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWalletClient,
  useWriteContract,
} from "wagmi";

export const useHangmanGame = () => {
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

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

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

      if (value) {
        const lowercasedValue = value.toLowerCase();
        setGuessLoading(true);
        setGuessError(null);

        try {
          const hash = await writeContractAsync({
            address: hangmanContractAddress,
            abi: HANGMAN_ABI,
            functionName: "guessLetter",
            args: [lowercasedValue],
          });

          const receipt = await publicClient.waitForTransactionReceipt({
            hash,
          });

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
