// app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
// import { RainbowKitWrapper } from '../components/RainbowKitWrapper';
import { parseAbiItem, getAddress, Hex } from 'viem';
import { usePublicClient } from 'wagmi';

// ABIs for the contracts - you'll need to replace these with your actual ABIs
const factoryAbi = [
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "encryptedWord",
        "type": "bytes"
      }
    ],
    "name": "addWord",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "CreateGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "gameContract",
        "type": "address"
      }
    ],
    "name": "GameCreated",
    "type": "event"
  }
];

const gameAbi = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "letter",
        "type": "string"
      }
    ],
    "name": "guessLetter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "showWord",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "showMisses",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "remainingLives",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "hasWon",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Normally you'd import this from a configuration file
const FACTORY_ADDRESS = "0x..."; // Replace with your deployed factory address

export default function Home() {
  return (
    // <RainbowKitWrapper>
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center py-8 px-4">
        <h1 className="text-4xl font-bold mb-8">IncoHangman</h1>
        <ConnectButton />
        <div className="mt-8 w-full max-w-2xl">
          <HangmanGame />
        </div>
      </div>
    // </RainbowKitWrapper>
  );
}

function HangmanGame() {
  const { address, isConnected } = useAccount();
  const [gameAddress, setGameAddress] = useState(null);
  const [newWord, setNewWord] = useState("");
  const [letter, setLetter] = useState("");
  const [loadingStatus, setLoadingStatus] = useState("");
  const [encryptedWord, setEncryptedWord] = useState(null);
  
  const publicClient = usePublicClient();
  
  // Contract write operations
  const { writeContract: writeFactory, data: factoryTxHash } = useWriteContract();
  const { writeContract: writeGame, data: gameTxHash } = useWriteContract();
  
  // Track transaction status
  const { isLoading: isFactoryTxLoading, isSuccess: isFactoryTxSuccess } = 
    useWaitForTransactionReceipt({ hash: factoryTxHash });
  const { isLoading: isGameTxLoading, isSuccess: isGameTxSuccess } = 
    useWaitForTransactionReceipt({ hash: gameTxHash });

  // Read game state
  const { data: currentWord } = useReadContract({
    address: gameAddress,
    abi: gameAbi,
    functionName: 'showWord',
    watch: true,
    enabled: !!gameAddress,
  });

  const { data: missedLetters } = useReadContract({
    address: gameAddress,
    abi: gameAbi,
    functionName: 'showMisses',
    watch: true,
    enabled: !!gameAddress,
  });

  const { data: lives } = useReadContract({
    address: gameAddress,
    abi: gameAbi,
    functionName: 'remainingLives',
    watch: true,
    enabled: !!gameAddress,
  });

  const { data: hasWon } = useReadContract({
    address: gameAddress,
    abi: gameAbi,
    functionName: 'hasWon',
    watch: true,
    enabled: !!gameAddress,
  });

  // Function to handle word submission
  // Note: In a real app, you'd need to implement the encryption part as shown in the test
  const handleAddWord = async (e) => {
    e.preventDefault();
    
    if (!newWord || newWord.length !== 4) {
      alert("Please enter a 4-letter word");
      return;
    }
    
    // This is a placeholder. In a real app, you'd use the encryptValue function
    setLoadingStatus("Encrypting word...");
    
    // Mock encryption (you would replace this with actual encryption)
    const mockEncryptedWord = `0x${Buffer.from(newWord.toUpperCase(), "utf-8").toString("hex")}`;
    setEncryptedWord(mockEncryptedWord);
    
    // Add word to factory
    try {
      setLoadingStatus("Adding word to factory...");
      writeFactory({
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: 'addWord',
        args: [mockEncryptedWord],
      });
    } catch (error) {
      console.error('Error adding word:', error);
      setLoadingStatus("");
    }
  };

  // Function to create a new game
  const createGame = async () => {
    if (!address) return;
    
    try {
      setLoadingStatus("Creating new game...");
      
      // Setup event listening for GameCreated
      setupGameCreatedListener();
      
      // Call the CreateGame function
      writeFactory({
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: 'CreateGame',
        args: [address],
      });
    } catch (error) {
      console.error('Error creating game:', error);
      setLoadingStatus("");
    }
  };

  // Setup listener for GameCreated event
  const setupGameCreatedListener = () => {
    const unwatch = publicClient.watchEvent({
      address: FACTORY_ADDRESS,
      event: parseAbiItem("event GameCreated(address indexed player, address gameContract)"),
      onLogs(logs) {
        if (logs.length && logs[0].args.player === address) {
          const newGameAddress = logs[0].args.gameContract;
          setGameAddress(newGameAddress);
          setLoadingStatus("");
          unwatch();
        }
      },
    });
  };

  // Function to guess a letter
  const handleGuessLetter = (e) => {
    e.preventDefault();
    
    if (!gameAddress || !letter || letter.length !== 1) {
      alert("Please enter a single letter");
      return;
    }
    
    const upperLetter = letter.toUpperCase();
    setLoadingStatus(`Guessing letter ${upperLetter}...`);
    
    writeGame({
      address: gameAddress,
      abi: gameAbi,
      functionName: 'guessLetter',
      args: [upperLetter],
    });
    
    setLetter("");
  };

  // Update loading status based on transaction state
  useEffect(() => {
    if (isFactoryTxSuccess || isGameTxSuccess) {
      setLoadingStatus("");
    }
  }, [isFactoryTxSuccess, isGameTxSuccess]);

  if (!isConnected) {
    return (
      <div className="text-center py-10">
        <p className="text-xl mb-4">Connect your wallet to play Hangman!</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
      {loadingStatus && (
        <div className="bg-blue-900 text-white p-4 rounded mb-6">
          <p>{loadingStatus}</p>
        </div>
      )}
      
      {!gameAddress ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">Setup Game</h2>
          
          <div className="mb-6">
            <h3 className="text-xl mb-2">1. Add a Secret Word</h3>
            <form onSubmit={handleAddWord} className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-slate-700 text-white px-3 py-2 rounded"
                placeholder="Enter a 4-letter word"
                maxLength={4}
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
              />
              <button 
                type="submit"
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium"
                disabled={isFactoryTxLoading}
              >
                Add Word
              </button>
            </form>
          </div>
          
          <div>
            <h3 className="text-xl mb-2">2. Create Game</h3>
            <button
              onClick={createGame}
              className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded font-medium text-lg"
              disabled={!encryptedWord || isFactoryTxLoading}
            >
              Create New Game
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-2">Hangman Game</h2>
          <p className="text-gray-400 mb-6 text-sm">Game Address: {gameAddress}</p>
          
          <div className="mb-8 text-center">
            <div className="text-5xl font-mono tracking-widest mb-4 h-16">
              {currentWord || '____'}
            </div>
            
            <div className="mb-2">
              <span className="font-bold">Lives:</span> {lives !== undefined ? lives.toString() : '8'}/8
            </div>
            
            {missedLetters && (
              <div>
                <span className="font-bold">Missed:</span> {missedLetters}
              </div>
            )}
          </div>
          
          {hasWon ? (
            <div className="text-center bg-green-800 p-6 rounded-lg mb-6">
              <h3 className="text-2xl font-bold mb-2">You Won! 🎉</h3>
              <p>Congratulations! You've guessed the word correctly.</p>
            </div>
          ) : (
            lives && lives > 0 ? (
              <form onSubmit={handleGuessLetter} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-slate-700 text-white px-3 py-2 rounded"
                  placeholder="Guess a letter"
                  maxLength={1}
                  value={letter}
                  onChange={(e) => setLetter(e.target.value)}
                />
                <button 
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-medium"
                  disabled={isGameTxLoading}
                >
                  Guess
                </button>
              </form>
            ) : (
              <div className="text-center bg-red-800 p-6 rounded-lg mb-6">
                <h3 className="text-2xl font-bold mb-2">Game Over</h3>
                <p>You've run out of lives. Better luck next time!</p>
              </div>
            )
          )}
          
          {/* Simple hangman visual */}
          <div className="mt-8 flex justify-center">
            <HangmanDrawing lives={lives || 8} />
          </div>
        </div>
      )}
    </div>
  );
}

function HangmanDrawing({ lives }) {
  // Simple ASCII-style hangman (8 lives total)
  const hangmanStages = [
    `
  +---+
  |   |
  O   |
 /|\\  |
 / \\  |
      |
=========
    `,
    `
  +---+
  |   |
  O   |
 /|\\  |
 /    |
      |
=========
    `,
    `
  +---+
  |   |
  O   |
 /|\\  |
      |
      |
=========
    `,
    `
  +---+
  |   |
  O   |
 /|   |
      |
      |
=========
    `,
    `
  +---+
  |   |
  O   |
  |   |
      |
      |
=========
    `,
    `
  +---+
  |   |
  O   |
      |
      |
      |
=========
    `,
    `
  +---+
  |   |
      |
      |
      |
      |
=========
    `,
    `
  +---+
      |
      |
      |
      |
      |
=========
    `,
  ];

  // Determine which stage to show based on remaining lives
  const stageIndex = 8 - lives;
  const stage = hangmanStages[stageIndex >= 0 && stageIndex < 8 ? stageIndex : 0];

  return (
    <pre className="text-xs text-gray-400 font-mono">
      {stage}
    </pre>
  );
}