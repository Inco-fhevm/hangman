// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@inco/lightning/src/Lib.sol";
import "@inco/lightning/src/IncoLightning.sol";

/// @notice Factory to add encrypted 4-byte words and spin up HangmanGame instances
contract HangmanFactory {
    // Event emitted when a new game is created, logging the player and game contract address
    event GameCreated(address indexed player, address gameContract);

    address public master; // Address authorized to add new words
    euint256[] private fourBytes; // Array of encrypted 4-letter words
    uint256 public currentWord; // Index of the next word to use for a new game

    constructor(address _master) {
        master = _master; // Initialize the master address
        currentWord = 0; // Start with the first word in the list
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
        HangmanGame game = new HangmanGame(player, address(this));
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

/// @notice On-chain “re-encryption” hangman: no raw decryption callbacks
contract HangmanGame {
    euint256[4] private encryptedChars; // the 4 letters
    ebool[4] private revealed; // per-slot “revealed” flags
    euint256 private lives; // remaining lives
    ebool private hasWon; // all slots revealed?

    address public player;
    address private factory;

    // last guess result event

    event GuessResult(
        ebool flag0,
        ebool flag1,
        ebool flag2,
        ebool flag3,
        euint256 newLives,
        ebool newHasWon
    );

    modifier onlyFactory() {
        require(msg.sender == factory, "Not factory");
        _;
    }
    modifier onlyPlayer() {
        require(msg.sender == player, "Not player");
        _;
    }

    /// @param _player   who may guess
    /// @param _factory  who may call setWord(...)
    constructor(address _player, address _factory) {
        player = _player;
        factory = _factory;

        // initialize “revealed” bits to false, allow re-encrypt to player + self
        for (uint8 i = 0; i < 4; i++) {
            revealed[i] = e.asEbool(false);
            e.allow(revealed[i], address(this));
            e.allow(revealed[i], player);
        }

        // start with 8 lives
        lives = e.asEuint256(8);
        e.allow(lives, address(this));
        e.allow(lives, player);

        // game not won
        hasWon = e.asEbool(false);
        e.allow(hasWon, address(this));
        e.allow(hasWon, player);
    }

    /// @notice Called by factory immediately after deploy
    function setWord(euint256 packedWord) external onlyFactory {
        euint256 mask = e.asEuint256(0xff);

        // unpack 4 bytes, normalize lowercase→uppercase, store & allow
        for (uint8 i = 0; i < 4; i++) {
            euint256 slot = e.and(e.shr(packedWord, e.asEuint256(i * 8)), mask);
            ebool isLower = e.ge(slot, e.asEuint256(97));
            e.allow(isLower, address(this));

            euint256 maybeUpper = e.sub(slot, e.asEuint256(32));
            encryptedChars[i] = e.select(isLower, maybeUpper, slot);
            e.allow(encryptedChars[i], address(this));
            e.allow(encryptedChars[i], player);

            // reset “revealed” to false
            revealed[i] = e.asEbool(false);
            e.allow(revealed[i], player);
            e.allow(revealed[i], address(this));
        }

        // reset lives & hasWon
        lives = e.asEuint256(8);
        hasWon = e.asEbool(false);

        e.allow(lives, address(this));
        e.allow(lives, player);
        e.allow(hasWon, address(this));
        e.allow(hasWon, player);
    }

    /// @notice Player submits a single-char guess; emits encrypted flags + updated state
    function guessLetter(string memory letter) public {
        bytes memory b = bytes(letter);
        require(b.length == 1, "one-char only");
        uint8 charCode = uint8(b[0]);
        if (charCode >= 97) charCode -= 32; // a–z → A–Z

        // 1) encrypted‐equals for each slot
        ebool[4] memory flags;
        for (uint8 i = 0; i < 4; i++) {
            e.allow(encryptedChars[i], address(this));
            ebool f = e.eq(encryptedChars[i], e.asEuint256(charCode));
            e.allow(f, address(this));
            e.allow(f, player);
            flags[i] = f;
        }

        // 2) revealed[i] = revealed[i] OR flags[i]
        for (uint8 i = 0; i < 4; i++) {
            ebool upd = e.or(revealed[i], flags[i]);
            revealed[i] = upd;
            e.allow(upd, address(this));
            e.allow(upd, player);
        }

        // 3) hasWon = AND over all revealed[]
        ebool newWon = revealed[0];
        for (uint8 i = 1; i < 4; i++) {
            newWon = e.and(newWon, revealed[i]);
        }
        hasWon = newWon;
        e.allow(newWon, address(this));
        e.allow(newWon, player);

        // 4) choose newLives = hasWon ? lives : lives - 1
        euint256 dec = e.sub(lives, e.asEuint256(1));
        e.allow(dec, player);
        e.allow(lives, player);

        euint256 newLives = e.select(newWon, lives, dec);
        lives = newLives;
        e.allow(newLives, address(this));
        e.allow(newLives, player);

        // 5) emit one event
        emit GuessResult(
            flags[0],
            flags[1],
            flags[2],
            flags[3],
            newLives,
            newWon
        );
    }

    /// @notice Raw ciphertext getters for the client to re-encrypt/decrypt
    function getRevealed() public view returns (ebool[4] memory) {
        return revealed;
    }

    function getLives() public view returns (euint256) {
        return lives;
    }

    function getHasWon() public view returns (ebool) {
        return hasWon;
    }

    function getCurrentStatus()
        public
        view
        returns (ebool, ebool, ebool, ebool, euint256, ebool)
    {
        return (
            revealed[0],
            revealed[1],
            revealed[2],
            revealed[3],
            lives,
            hasWon
        );
    }
}
