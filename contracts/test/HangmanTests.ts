// SPDX-License-Identifier: BSD-3-Clause-Clear

import { expect } from "chai";
import { namedWallets, wallet, publicClient } from "../utils/wallet";
import { Abi, Hex, parseAbiItem } from "viem";
import factoryJson from "../artifacts/contracts/IncoHangMan.sol/HangmanFactory.json";
import gameJson from "../artifacts/contracts/IncoHangMan.sol/HangmanGame.json";
import { encryptValue, incoLiteConfig, KMS_CONNECT_ENDPOINT_BASE_SEPOLIA, reencryptValue } from "../utils/IncoHelper";
import { HexString } from "@inco/js/dist/binary";

const factoryAbi = factoryJson.abi as Abi;
const gameAbi = gameJson.abi as Abi;
let incoConfig = incoLiteConfig("baseSepolia");

function asFourByteHex(word: string): Hex {
  if (word.length !== 4) throw new Error("Must be exactly 4 characters");
  return ("0x" + Buffer.from(word.toLowerCase().split("").reverse().join(""), "ascii").toString("hex")) as Hex;
}

describe("Hangman Tests for word 'word'", function () {
  this.timeout(300_000);

  let factoryAddress: Hex;
  let gameAddress: Hex;
  let incoConfig: ReturnType<typeof incoLiteConfig>;

  beforeEach(async () => {
    incoConfig = incoLiteConfig("baseSepolia");

    const tx0 = await wallet.deployContract({
      abi: factoryAbi,
      bytecode: factoryJson.bytecode as Hex,
      args: [wallet.account.address],
    });
    const r0 = await publicClient.waitForTransactionReceipt({ hash: tx0 });
    factoryAddress = r0.contractAddress!;
    console.log(`✅ Factory deployed at: ${factoryAddress}`);
  });

  it("processes letter guesses one by one on 'word' and wins the game", async () => {
    const raw = BigInt(asFourByteHex("word"));
    const { inputCt } = await encryptValue({
      value: raw,
      address: wallet.account.address,
      config: incoConfig,
      contractAddress: factoryAddress,
    });

    const tx1 = await wallet.writeContract({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: "addWord",
      args: [inputCt.ciphertext.value],
    });
    await publicClient.waitForTransactionReceipt({ hash: tx1 });

    const newGame = new Promise<Hex>((resolve, reject) => {
      const unwatch = publicClient.watchEvent({
        address: factoryAddress,
        event: parseAbiItem("event GameCreated(address indexed player, address gameContract)"),
        onLogs(logs) {
          if (logs.length) {
            resolve(logs[0].args.gameContract as Hex);
            unwatch();
          }
        },
        onError: reject,
      });
      setTimeout(() => { unwatch(); reject(new Error("GameCreated timeout")); }, 20_000);
    });

    const tx2 = await wallet.writeContract({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: "CreateGame",
      args: [wallet.account.address],
    });
    await publicClient.waitForTransactionReceipt({ hash: tx2 });
    gameAddress = await newGame;
    console.log(`✅ Game created at: ${gameAddress}`);

    const guesses = ["z", "z", "w", "o", "r", "d"];
    const expectedTiles = ["100", "100", "1", "2", "3", "4"];

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
      });

      const tile = await publicClient.readContract({
        address: gameAddress,
        abi: gameAbi,
        functionName: "getTile",
        args: [],
      }) as HexString;

      const decryptedTile = await decryptHandle(tile);
      console.log(`decrypted tile after guess '${guess}':`, decryptedTile);
      expect(decryptedTile.toString()).to.equal(expected);
    }

    const rawHandles = await publicClient.readContract({
      address: gameAddress,
      abi: gameAbi,
      functionName: "getCurrentStatus",
    }) as [HexString, HexString, HexString, HexString, HexString, HexString, HexString];

    const [h0, h1, h2, h3, tile, hLives, hWon] = rawHandles;
    const [flag0, flag1, flag2, flag3, tileStatus, newLives, newHasWon] = await Promise.all([
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

  it("Seed Word", async () => {
    const raw = BigInt(asFourByteHex("word"));
    const { inputCt } = await encryptValue({
      value: raw,
      address: wallet.account.address,
      config: incoConfig,
      contractAddress: factoryAddress,
    });

    // 1) Prepare your list of 4-letter words
    const words = [
      "play", "time", "home", "mind", "work", "jump", "farm", "cake",
      "bake", "fire", "wind", "gold", "road", "love", "rock", "rain",
      "star", "fish", "desk", "news", "team", "care", "peak", "golf",
      "mesh", "ping", "dock", "lamb", "comb", "stem", "grow", "clan",
      "hint", "glad", "vile", "zone", "xray", "kids", "pony", "germ",
      "bank", "ship", "bark", "dust", "made", "sake", "corn", "pail",
      "tuck", "boil", "ramp", "vase", "blow", "chat", "drum", "flop",
      "grim", "hazy", "jolt", "keen", "lurk", "moat", "numb", "oath",
      "pace", "quit", "rude", "scoop", "tail", "urge", "veto", "yarn",
      "zinc"
    ];

    // 2) Convert each to a 4-byte hex literal
    const wordBytes: Hex[] = words.map(w => {
      if (w.length !== 4) throw new Error("All words must be exactly 4 letters");
      return (
        "0x" +
        Buffer.from(w, "ascii")
          .toString("hex")
      ) as Hex;
    });

    // 3) Call seedWords once, passing the entire array
    const txSeed = await wallet.writeContract({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: "seedWords",
      args: [wordBytes],   // note: seedWords(bytes[] memory)
    });
    await publicClient.waitForTransactionReceipt({ hash: txSeed });

  });
});

async function decryptHandle(handle: HexString) {
  const result = await reencryptValue({
    chainId: 84532,
    walletClient: wallet,
    handle: handle.toString(),
    kmsConnectEndpoint: KMS_CONNECT_ENDPOINT_BASE_SEPOLIA,
  });
  return result.value;
}

