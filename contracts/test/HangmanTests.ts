// SPDX-License-Identifier: BSD-3-Clause-Clear

import { expect } from "chai";
import { namedWallets, wallet, publicClient } from "../utils/wallet";
import { Abi, Hex, parseAbiItem } from "viem";
import factoryJson from "../artifacts/contracts/IncoHangMan.sol/HangmanFactory.json";
import gameJson from "../artifacts/contracts/IncoHangMan.sol/HangmanGame.json";
import {
  decryptValue,
  encryptValue,
  getConfig,
  getFee,
} from "../utils/IncoHelper";
import { HexString } from "@inco/js";

const factoryAbi = factoryJson.abi as Abi;
const gameAbi = gameJson.abi as Abi;

function asFourByteHex(word: string): Hex {
  if (word.length !== 4) throw new Error("Must be exactly 4 characters");
  return ("0x" +
    Buffer.from(
      word.toLowerCase().split("").reverse().join(""),
      "ascii"
    ).toString("hex")) as Hex;
}

describe("Hangman Tests for word 'word'", function () {
  this.timeout(300_000);

  let factoryAddress: Hex;
  let gameAddress: Hex;
  let incoConfig: ReturnType<typeof getConfig>;

  beforeEach(async () => {
    incoConfig = await getConfig();

    const tx0 = await wallet.deployContract({
      abi: factoryAbi,
      bytecode: factoryJson.bytecode as Hex,
      args: [wallet.account.address],
    });
    const r0 = await publicClient.waitForTransactionReceipt({ hash: tx0 });
    factoryAddress = r0.contractAddress!;
    console.log(`✅ Factory deployed at: ${factoryAddress}`);
  });

  it.only("Seed Word", async () => {
    // 1) Prepare your list of 4-letter words
    const words = [
      "play",
      "time",
      "home",
      "mind",
      "work",
      "jump",
      "farm",
      "cake",
      "bake",
      "fire",
      "wind",
      "gold",
      "road",
      "love",
      "rock",
      "rain",
      "star",
      "fish",
      "desk",
      "news",
      "team",
      "care",
      "peak",
      "golf",
      "mesh",
      "ping",
      "dock",
      "lamb",
      "comb",
      "stem",
      "grow",
      "clan",
      "hint",
      "glad",
      "vile",
      "zone",
      "test",
      "teal",
      "pony",
      "germ",
      "bank",
      "ship",
      "bark",
      "dust",
      "made",
      "sake",
      "corn",
      "pail",
      "tuck",
      "boil",
      "ramp",
      "vase",
      "blow",
      "chat",
      "drum",
      "flop",
      "grim",
      "hazy",
      "jolt",
      "beak",
      "lurk",
      "moat",
      "numb",
      "oath",
      "pace",
      "quit",
      "rude",
      "dope",
      "tail",
      "urge",
      "veto",
      "yarn",
      "zinc",
    ];

    // 2) Encrypt each word in parallel, then await them all
    const wordBytes: Hex[] = await Promise.all(
      words.map(async (word) => {
        const raw = BigInt(asFourByteHex(word));
        const inputCt: `0x${string}` = await encryptValue({
          value: raw,
          address: wallet.account.address,
          contractAddress: factoryAddress,
        });
        return inputCt as Hex;
      })
    );
    // console.log("wordBytes:", wordBytes);

    // 3) Call seedWords once, passing the entire array
    const txSeed = await wallet.writeContract({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: "seedWords",
      args: [wordBytes], // bytes[] memory
      value: (await getFee()) * BigInt(wordBytes.length),
    });
    await publicClient.waitForTransactionReceipt({ hash: txSeed });
  });

  it("processes letter guesses one by one on 'word' and wins the game", async () => {
    // Add first word "word"
    const raw1 = BigInt(asFourByteHex("word"));
    const inputCt1: `0x${string}` = await encryptValue({
      value: raw1,
      address: wallet.account.address,
      contractAddress: factoryAddress,
    });

    const tx1 = await wallet.writeContract({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: "addWord",
      args: [inputCt1],
      value: await getFee(),
    });
    console.log("tx1:", tx1);
    await publicClient.waitForTransactionReceipt({
      hash: tx1,
      confirmations: 5,
    });

    // Add second word "play"
    const raw2 = BigInt(asFourByteHex("play"));
    const inputCt2: `0x${string}` = await encryptValue({
      value: raw2,
      address: wallet.account.address,
      contractAddress: factoryAddress,
    });

    const tx1b = await wallet.writeContract({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: "addWord",
      args: [inputCt2],
      value: await getFee(),
    });
    console.log("tx1b:", tx1b);
    await publicClient.waitForTransactionReceipt({
      hash: tx1b,
      confirmations: 5,
    });

    const newGame = new Promise<Hex>((resolve, reject) => {
      const unwatch = publicClient.watchEvent({
        address: factoryAddress,
        event: parseAbiItem(
          "event GameCreated(address indexed player, address gameContract)"
        ),
        onLogs(logs) {
          if (logs.length) {
            resolve(logs[0].args.gameContract as Hex);
            unwatch();
          }
        },
        onError: reject,
      });
      setTimeout(() => {
        unwatch();
        reject(new Error("GameCreated timeout"));
      }, 20_000);
    });

    const simulate = await publicClient.simulateContract({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: "CreateGame",
      args: [wallet.account.address],
    });
    const tx2 = await wallet.writeContract({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: "CreateGame",
      args: [wallet.account.address],
    });

    console.log("simulate:", simulate.result);
    await publicClient.waitForTransactionReceipt({ hash: tx2 });
    gameAddress = simulate.result;
    console.log(`✅ Game created at: ${gameAddress}`);

    // Determine which word was selected by trying a unique letter
    // 'r' is in "word" but not in "play"
    await publicClient.waitForTransactionReceipt({
      hash: await wallet.writeContract({
        address: gameAddress,
        abi: gameAbi,
        functionName: "guessLetter",
        args: ["r"],
      }),
      confirmations: 5,
    });

    const tileAfterR = (await publicClient.readContract({
      address: gameAddress,
      abi: gameAbi,
      functionName: "getTile",
      args: [],
    })) as HexString;

    const decryptedTileAfterR = await decryptHandle(tileAfterR);
    const isWord = decryptedTileAfterR.toString() !== "100"; // If 'r' was found, it's "word"

    console.log(`Selected word appears to be: ${isWord ? "word" : "play"}`);

    const guesses = isWord
      ? ["z", "z", "w", "o", "d"] // for "word": z,z,w,o,d (r already guessed)
      : ["z", "z", "p", "l", "a", "y"]; // for "play": z,z,p,l,a,y

    const expectedTiles = isWord
      ? ["100", "100", "1", "2", "4"] // for "word": positions of w,o,d (after r was already guessed)
      : ["100", "100", "1", "2", "3", "4"]; // for "play": positions of p,l,a,y

    for (let i = 0; i < guesses.length; i++) {
      const guess = guesses[i];
      const expected = expectedTiles[i];

      await publicClient.waitForTransactionReceipt({
        hash: await wallet.writeContract({
          address: gameAddress,
          abi: gameAbi,
          functionName: "guessLetter",
          args: [guess],
        }),
        confirmations: 5,
      });

      const tile = (await publicClient.readContract({
        address: gameAddress,
        abi: gameAbi,
        functionName: "getTile",
        args: [],
      })) as HexString;
      console.log("tile:", tile);
      const decryptedTile = await decryptHandle(tile);
      console.log(`decrypted tile after guess '${guess}':`, decryptedTile);
      expect(decryptedTile.toString()).to.equal(expected);
    }

    const rawHandles = (await publicClient.readContract({
      address: gameAddress,
      abi: gameAbi,
      functionName: "getCurrentStatus",
    })) as [
      HexString,
      HexString,
      HexString,
      HexString,
      HexString,
      HexString,
      HexString
    ];

    const [h0, h1, h2, h3, tile, hLives, hWon] = rawHandles;
    const [flag0, flag1, flag2, flag3, tileStatus, newLives, newHasWon] =
      await Promise.all([
        decryptHandle(h0),
        decryptHandle(h1),
        decryptHandle(h2),
        decryptHandle(h3),
        decryptHandle(tile),
        decryptHandle(hLives),
        decryptHandle(hWon),
      ]);

    console.log("decrypted flags:", flag0, flag1, flag2, flag3);
    console.log("decrypted lives:", newLives);
    console.log("decrypted hasWon:", newHasWon);
    console.log("decrypted tile:", tileStatus);
  });
});

async function decryptHandle(handle: HexString) {
  const result = await decryptValue({
    walletClient: wallet,
    handle: handle as `0x${string}`,
  });
  return result;
}
