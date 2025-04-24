export const HANGMAN_CONTRACT_ADDRESS = "";
export const HANGMAN_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_player",
        type: "address",
      },
      {
        internalType: "address",
        name: "_factory",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "ebool",
        name: "flag0",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "ebool",
        name: "flag1",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "ebool",
        name: "flag2",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "ebool",
        name: "flag3",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "euint256",
        name: "tile",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "euint256",
        name: "newLives",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "ebool",
        name: "newHasWon",
        type: "bytes32",
      },
    ],
    name: "GuessResult",
    type: "event",
  },
  {
    inputs: [],
    name: "getCurrentStatus",
    outputs: [
      {
        internalType: "ebool",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "ebool",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "ebool",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "ebool",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "euint256",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "euint256",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "ebool",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTile",
    outputs: [
      {
        internalType: "euint256",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "letter",
        type: "string",
      },
    ],
    name: "guessLetter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "player",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "euint256",
        name: "packedWord",
        type: "bytes32",
      },
    ],
    name: "setWord",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "tile",
    outputs: [
      {
        internalType: "euint256",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const HANGMAN_FACTORY_CONTRACT_ADDRESS =
  "0x9d0c9cde372c3b50e953e6dd620b503f2bddc6a2";
export const HANGMAN_FACTORY_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_master",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "gameContract",
        type: "address",
      },
    ],
    name: "GameCreated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "player",
        type: "address",
      },
    ],
    name: "CreateGame",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "inSecret",
        type: "bytes",
      },
    ],
    name: "addWord",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "currentWord",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "getGameAddressByPlayer",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getWordsTotal",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "master",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes[]",
        name: "inSecret",
        type: "bytes[]",
      },
    ],
    name: "seedWords",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
