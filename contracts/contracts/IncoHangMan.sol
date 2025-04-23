// SPDX-License-Identifier: BSD-3-Clause-Clear
// License identifier specifying a clear BSD 3-Clause license without additional terms
pragma solidity ^0.8.24; // Solidity compiler version 0.8.24 or later, enabling built-in overflow checks

import "@inco/lightning/src/Lib.sol"; // Import Inco Lite library for encrypted operations
import "@inco/lightning/src/IncoLightning.sol"; // Import Inco Lite library for encryption
// Factory contract to create individual HangmanGame instances
contract HangmanFactory {
    // Event emitted when a new game is created, logging the player and game contract address
    event GameCreated(address indexed player, address gameContract);

    address public master;      // Address authorized to add new words
    euint256[] private fourBytes; // Array of encrypted 4-letter words
    uint256 public currentWord; // Index of the next word to use for a new game

    constructor(address _master) {
        master = _master;       // Initialize the master address
        currentWord = 0;        // Start with the first word in the list
    }

    // Returns the total number of words stored
    function getWordsTotal() public view returns (uint256) {
        return fourBytes.length; // Length of the encrypted words array
    }

    // Master can add a new 4-letter word (in bytes) to the list, encrypted on-chain
    function addWord(bytes memory inSecret) public onlyMaster {
        // Encrypt `inSecret` using Encryption at insertion time
        euint256 encryptedWord = e.newEuint256(inSecret, msg.sender);
        e.allow(encryptedWord, address(this)); // Allow this contract to access the encrypted word
        fourBytes.push(encryptedWord);
    }

    // Creates a new HangmanGame for `player`, using the next word in the list
    function CreateGame(address player) public returns (address) {
        // Deploy a fresh HangmanGame, passing the player and the current word index
        HangmanGame game = new HangmanGame(player, currentWord);
        // If the index is within range, use the corresponding encrypted word; else wrap to zero
        if (currentWord < fourBytes.length) {
            e.allow(fourBytes[currentWord], address(game)); // Allow game to access the word
            game.setWord(fourBytes[currentWord]);
        } else {
            e.allow(fourBytes[0], address(game)); // Wrap to the first word
            game.setWord(fourBytes[0]);
        }
        currentWord++; // Increment index for the next game
        emit GameCreated(player, address(game)); // Notify listeners
        return address(game); // Return the new game’s address
    }

    // Modifier to restrict functions to the master only
    modifier onlyMaster() {
        require(msg.sender == master, "Not master"); // Revert if caller is not master
        _;
    }
}

// Hangman letter-by-letter game using Inco Lite asynchronous decryption
contract HangmanGame {
    euint256[4] private encryptedCharsInv; // Array of encrypted ASCII codes for each letter
    bytes private decryptedWord;            // Decrypted display of the word (underscores & revealed letters)

    bool private playerWon;    // True when all letters are revealed
    bool private gameOver;     // True when lives reach zero
    uint8 private lives;       // Remaining incorrect guesses allowed
    uint8 private nOfCellsRevealed; // Count of letters successfully revealed

    uint8 private constant MAX_LETTERS = 4;   // Word length constant
    uint8 private constant UNDERSCORE = 95;   // ASCII code for underscore (_)

    bytes private wrongGuesses;  // Concatenated wrong letters as bytes
    mapping(uint8 => bool) private guessedLetters; // Tracks which letters have been guessed

    address private factory;    // Address of the factory that created this game
    address public player;      // Address of the player allowed to guess
    uint256 public gameID;      // Index of the word used for this game

    // Stages of asynchronous decryption: OR check, per-slot flag, and actual char
    enum DecryptPurpose { DECRYPT_OR, DECRYPT_FLAG, DECRYPT_CHAR }
    struct CallbackContext {
        string guessInput;       // Original letter guessed, as string
        uint8 letterIndex;       // Index of the slot (0–3) for flag/char stages
        DecryptPurpose purpose;  // Which stage of decryption this callback is for
    }
    mapping(uint256 => CallbackContext) private pendingDecryptions; // Map requestId→context

    // Game lifecycle events
    event GuessedCorrectly(string indexed letter);
    event GuessedIncorrectly(string indexed letter);
    event LetterRevealed(uint8 index, uint8 letter);
    event GameWon();
    event GameOver();

    // Constructor stores factory, player, and gameID, then initializes state
    constructor(address _player, uint256 _gameID) {
        factory = msg.sender;           // The factory contract is the deployer
        player = _player;               // Store the authorized player
        gameID = _gameID;               // Which word index is used
        decryptedWord = new bytes(MAX_LETTERS); // Allocate display buffer
        resetState();                   // Initialize lives, underscores, etc.
    }

    // Internal helper to reset game state (underscores, lives, flags)
    function resetState() internal {
        for (uint8 i = 0; i < MAX_LETTERS; i++) {
            decryptedWord[i] = bytes1(UNDERSCORE); // Set each position to '_'
        }
        lives = 8;               // Start with 11 incorrect guesses allowed
        nOfCellsRevealed = 0;     // No letters revealed initially
        playerWon = false;        // Not won yet
        gameOver = false;         // Not over yet
        delete wrongGuesses;      // Clear wrong guesses
        for (uint8 c = 65; c <= 90; c++) {
            guessedLetters[c] = false; // Mark no letters as guessed
        }
    }

    // Only factory should call setWord; omitted modifier for clarity
    function setWord(euint256 packedWord) public {
        // Extract each ASCII byte from the packed euint256 and store encrypted
        euint256 mask = e.asEuint256(0xff);
        for (uint8 i = 0; i < MAX_LETTERS; i++) {
            euint256 shifted   = e.shr(packedWord, e.asEuint256(i * 8)); // Shift down by i*8 bits
            euint256 letterEnc = e.and(shifted, mask);                   // Mask low 8 bits
            // Normalize lowercase ASCII to uppercase
            ebool isLower      = e.ge(letterEnc, e.asEuint256(97));      // 'a' = 97
            euint256 diff      = e.sub(letterEnc, e.asEuint256(32));      // 'A' = 'a'-32
            encryptedCharsInv[i] = e.select(isLower, diff, letterEnc);   // Conditional select
            e.allow(encryptedCharsInv[i] , address(this)); // Allow this contract to access the word
        }
        resetState(); // Reset lives & display for the new word
    }

    // Only the designated player should call; omitted modifier for brevity
    function guessLetter(string memory letter) public {
        require(!playerWon && !gameOver, "Game over"); // Block guesses after end
        bytes memory b = bytes(letter);
        require(b.length == 1, "Enter one character");  // Only single letters

        uint8 charCode = uint8(b[0]);
        // Validate ASCII range A–Z or a–z
        require(
            (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122),
            "Invalid character"
        );
        if (charCode >= 97) charCode -= 32; // Convert lowercase to uppercase
        require(!guessedLetters[charCode], "Letter already guessed"); // No repeats
        guessedLetters[charCode] = true; // Mark as guessed

        // Stage 1: Build encrypted OR of comparisons across all 4 slots
        ebool anyMatch;
        for (uint8 i = 0; i < MAX_LETTERS; i++) {
            ebool eqRes = e.eq(encryptedCharsInv[i], e.asEuint256(charCode));
            anyMatch = i == 0 ? eqRes : e.or(anyMatch, eqRes);
        }
        e.allow(anyMatch, address(this)); // Grant this contract access to decrypt the OR

        // Request asynchronous decryption of the OR result
        uint256 reqId = e.requestDecryption(
            anyMatch,
            this.handleCallback.selector,
            "" // No additional data
        );
        // Store context so callback knows it’s the OR stage
        pendingDecryptions[reqId] = CallbackContext(letter, 0, DecryptPurpose.DECRYPT_OR);
    }

    // Callback invoked by Inco runtime to deliver decrypted results
    // Should be restricted (onlyGateway) in production
    function handleCallback(
        uint256 requestId,
        bytes32 decrypted,
        bytes memory
    ) public returns (bool) {
        CallbackContext memory ctx = pendingDecryptions[requestId]; // Load context
        delete pendingDecryptions[requestId];                     // Free storage

        // Stage 1: OR result (did the letter appear anywhere?)
        if (ctx.purpose == DecryptPurpose.DECRYPT_OR) {
            bool any = uint256(decrypted) > 0; // True if at least one match
            if (any) {
                emit GuessedCorrectly(ctx.guessInput); // Notify a correct guess
                uint8 charCode = uint8(bytes(ctx.guessInput)[0]);
                if (charCode >= 97) charCode -= 32;  // To uppercase
                // Stage 2: decrypt a boolean flag per slot to locate matches
                for (uint8 i = 0; i < MAX_LETTERS; i++) {
                    ebool eqRes = e.eq(encryptedCharsInv[i], e.asEuint256(charCode));
                    e.allow(eqRes, address(this));
                    uint256 flagReq = e.requestDecryption(
                        eqRes,
                        this.handleCallback.selector,
                        ""
                    );
                    // Context: next decryptFlag for slot i
                    pendingDecryptions[flagReq] = CallbackContext(ctx.guessInput, i, DecryptPurpose.DECRYPT_FLAG);
                }
            } else {
                // Wrong guess: lose one life
                lives--;
                wrongGuesses = bytes.concat(wrongGuesses, bytes1(uint8(bytes(ctx.guessInput)[0])));
                emit GuessedIncorrectly(ctx.guessInput);
                if (lives == 0) {
                    gameOver = true; // Mark game lost
                    emit GameOver();
                }
            }

        // Stage 2: flag per slot (is this specific position a match?)
        } else if (ctx.purpose == DecryptPurpose.DECRYPT_FLAG) {
            bool matchSlot = uint256(decrypted) > 0;
            if (matchSlot) {
                uint8 idx = ctx.letterIndex;
                // Stage 3: decrypt the actual character at this slot
                e.allow(encryptedCharsInv[idx], address(this));
                uint256 charReq = e.requestDecryption(
                    encryptedCharsInv[idx],
                    this.handleCallback.selector,
                    ""
                );
                // Context: next decryptChar for slot idx
                pendingDecryptions[charReq] = CallbackContext("", idx, DecryptPurpose.DECRYPT_CHAR);
            }

        // Stage 3: actual character decrypt returns ASCII code to reveal
        } else if (ctx.purpose == DecryptPurpose.DECRYPT_CHAR) {
            uint8 letter = uint8(uint256(decrypted));          // Extract ASCII code
            decryptedWord[ctx.letterIndex] = bytes1(letter);   // Reveal in display
            nOfCellsRevealed++;
            emit LetterRevealed(ctx.letterIndex, letter);     // Notify slot reveal
            if (nOfCellsRevealed == MAX_LETTERS) {
                playerWon = true;                              // All letters found
                emit GameWon();                                 // Notify win
            }
        }
        return true; // Callback must return true to signal completion
    }

    // Public view: get the current display (underscores + revealed letters)
    function showWord() public view returns (string memory) {
        return string(decryptedWord);
    }

    // Public view: list of letters guessed incorrectly so far
    function showMisses() public view returns (string memory) {
        return string(wrongGuesses);
    }

    // Public view: has the player won?
    function hasWon() public view returns (bool) {
        return playerWon;
    }

    // Public view: how many lives remain?
    function remainingLives() public view returns (uint8) {
        return lives;
    }
}

