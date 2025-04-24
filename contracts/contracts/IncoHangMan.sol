// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@inco/lightning/src/Lib.sol";
import "@inco/lightning/src/IncoLightning.sol";

contract HangmanFactory {
    event GameCreated(address indexed player, address gameContract);

    address public master;
    euint256[] private fourBytes;
    uint256 public currentWord;

    constructor(address _master) {
        master = _master;
        currentWord = 0;
    }

    function getWordsTotal() public view returns (uint256) {
        return fourBytes.length;
    }

    function addWord(bytes memory inSecret) public onlyMaster {
        euint256 encryptedWord = e.newEuint256(inSecret, msg.sender);
        e.allow(encryptedWord, address(this));
        fourBytes.push(encryptedWord);
    }

    function seedWords(bytes[] memory inSecret) public onlyMaster {
        for (uint256 i = 0; i < inSecret.length; i++) {
            euint256 encryptedWord = e.newEuint256(inSecret[i], msg.sender);
            e.allow(encryptedWord, address(this));
            fourBytes.push(encryptedWord);
        }
    }

    function CreateGame(address player) public returns (address) {
        require(fourBytes.length > 0, "No words added");

        // pseudo‐random index: hash(timestamp, prevrandao, caller)
        uint256 rand = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao, // in Cancún+PoS
                    msg.sender
                )
            )
        );
        uint256 idx = rand % fourBytes.length;

        // deploy & initialize the game
        HangmanGame game = new HangmanGame(player, address(this));
        euint256 word = fourBytes[idx];
        e.allow(word, address(game));
        game.setWord(word);

        emit GameCreated(player, address(game));
        return address(game);
    }

    modifier onlyMaster() {
        require(msg.sender == master, "Not master");
        _;
    }
}

contract HangmanGame {
    euint256[4] private encryptedChars;
    ebool[4] private revealed;
    euint256 private lives;
    ebool private hasWon;
    euint256 public tile;
    address public player;
    address private factory;

    event GuessResult(
        ebool flag0,
        ebool flag1,
        ebool flag2,
        ebool flag3,
        euint256 tile,
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

    constructor(address _player, address _factory) {
        player = _player;
        factory = _factory;
        for (uint8 i = 0; i < 4; i++) {
            revealed[i] = e.asEbool(false);
            e.allow(revealed[i], address(this));
            e.allow(revealed[i], player);
        }
        lives = e.asEuint256(8);
        hasWon = e.asEbool(false);
        e.allow(lives, address(this));
        e.allow(lives, player);
        e.allow(hasWon, address(this));
        e.allow(hasWon, player);
    }

    function setWord(euint256 packedWord) external onlyFactory {
        euint256 mask = e.asEuint256(0xff);
        for (uint8 i = 0; i < 4; i++) {
            euint256 slot = e.and(e.shr(packedWord, e.asEuint256(i * 8)), mask);
            ebool isUpper = e.le(slot, e.asEuint256(90));
            euint256 maybeLower = e.add(slot, e.asEuint256(32));
            encryptedChars[i] = e.select(isUpper, maybeLower, slot);
            e.allow(encryptedChars[i], address(this));
            e.allow(encryptedChars[i], player);
            revealed[i] = e.asEbool(false);
            e.allow(revealed[i], player);
            e.allow(revealed[i], address(this));
        }
        lives = e.asEuint256(8);
        hasWon = e.asEbool(false);
        e.allow(lives, address(this));
        e.allow(lives, player);
        e.allow(hasWon, address(this));
        e.allow(hasWon, player);
    }

    function guessLetter(string memory letter) public {
        bytes memory b = bytes(letter);
        require(b.length == 1, "one-char only");
        uint8 charCode = uint8(b[0]);
        if (charCode <= 90) charCode += 32; // normalize A–Z to a–z

        euint256 _tile = e.asEuint256(100);
        ebool[4] memory flags;
        for (uint8 i = 0; i < 4; i++) {
            ebool f = e.eq(encryptedChars[i], e.asEuint256(charCode));
            flags[i] = f;
            _tile = e.select(
                e.and(f, e.eq(_tile, e.asEuint256(100))),
                e.asEuint256(i + 1),
                _tile
            );
        }
        tile = _tile;
        e.allow(tile, address(this));
        e.allow(tile, player);

        for (uint8 i = 0; i < 4; i++) {
            revealed[i] = e.or(revealed[i], flags[i]);
            e.allow(revealed[i], address(this));
            e.allow(revealed[i], player);
        }

        ebool newWon = revealed[0];
        for (uint8 i = 1; i < 4; i++) {
            newWon = e.and(newWon, revealed[i]);
        }
        hasWon = newWon;
        e.allow(hasWon, address(this));
        e.allow(hasWon, player);

        euint256 dec = e.sub(lives, e.asEuint256(1));
        euint256 newLives = e.select(newWon, lives, dec);
        lives = newLives;
        e.allow(newLives, address(this));
        e.allow(newLives, player);

        emit GuessResult(
            flags[0],
            flags[1],
            flags[2],
            flags[3],
            tile,
            newLives,
            newWon
        );
    }

    function getCurrentStatus()
        public
        view
        returns (ebool, ebool, ebool, ebool, euint256, euint256, ebool)
    {
        return (
            revealed[0],
            revealed[1],
            revealed[2],
            revealed[3],
            tile,
            lives,
            hasWon
        );
    }

    function getTile() public view returns (euint256) {
        return tile;
    }
}
