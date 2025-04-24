// test/HangmanTests.ts
// SPDX-License-Identifier: BSD-3-Clause-Clear

import { expect } from "chai";
import { namedWallets, wallet, publicClient } from "../utils/wallet";
import { getContract, Abi, Hex, parseAbiItem, getAddress } from "viem";
import factoryJson from "../artifacts/contracts/IncoHangMan.sol/HangmanFactory.json";
import gameJson from "../artifacts/contracts/IncoHangMan.sol/HangmanGame.json";
import { encryptValue, incoLiteConfig, KMS_CONNECT_ENDPOINT_BASE_SEPOLIA, reencryptValue } from "../utils/IncoHelper";
import { HexString } from "@inco/js/dist/binary";

// Cast JSON ABIs to Viem’s Abi
const factoryAbi = factoryJson.abi as Abi;
const gameAbi = gameJson.abi as Abi;
let incoConfig = incoLiteConfig("baseSepolia");

// Helper to turn 4 ASCII chars into a single 4-byte hex literal
function asFourByteHex(word: string): Hex {
  if (word.length !== 4) throw new Error("Must be exactly 4 characters");
  return (`0x${Buffer.from(word, "ascii").toString("hex")}`) as Hex;
}



describe("Hangman Tests for word 'WORD'", function () {
  // bump Mocha’s timeout for all hooks & tests
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

  it("processes letter guesses one by one on 'WORD' and wins the game", async () => {
    // 1) Encrypt & add "WORD"
    const raw = BigInt(asFourByteHex("WORD"));
    const { inputCt } = await encryptValue({
      value: raw,
      address: wallet.account.address,
      config: incoConfig,
      contractAddress: factoryAddress,
    });
    const encryptedWord = inputCt.ciphertext.value;

    const tx1 = await wallet.writeContract({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: "addWord",
      args: [encryptedWord],
    });
    await publicClient.waitForTransactionReceipt({ hash: tx1 });

    // 2) Watch for GameCreated
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
      setTimeout(() => { unwatch(); reject(new Error("GameCreated timeout")); }, 20_000);
    });

    // 3) CreateGame
    const tx2 = await wallet.writeContract({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: "CreateGame",
      args: [wallet.account.address],
    });
    await publicClient.waitForTransactionReceipt({ hash: tx2 });
    gameAddress = await newGame;
    console.log(`✅ Game created at: ${gameAddress}`);

    // 4) Wrong guess "Z"
    await publicClient.waitForTransactionReceipt({
      hash: await wallet.writeContract({
        address: gameAddress,
        abi: gameAbi,
        functionName: "guessLetter",
        args: ["Z"],
      }),
    });

    // ── 4) WRONG guess "Z"
    await publicClient.waitForTransactionReceipt({
      hash: await wallet.writeContract({
        address: gameAddress,
        abi: gameAbi,
        functionName: "guessLetter",
        args: ["Z"],
      }),
    });


    // ── 5) CORRECT guess "W" → reveal slot 0
    await publicClient.waitForTransactionReceipt({
      hash: await wallet.writeContract({
        address: gameAddress,
        abi: gameAbi,
        functionName: "guessLetter",
        args: ["W"],
      }),
    });

    // ── 6) CORRECT guess "O" → reveal slot 1
    await publicClient.waitForTransactionReceipt({
      hash: await wallet.writeContract({
        address: gameAddress,
        abi: gameAbi,
        functionName: "guessLetter",
        args: ["O"],
      }),
    });

    // ── 7) CORRECT guess "R" → reveal slot 2
    await publicClient.waitForTransactionReceipt({
      hash: await wallet.writeContract({
        address: gameAddress,
        abi: gameAbi,
        functionName: "guessLetter",
        args: ["R"],
      }),
    });

    // ── 8) CORRECT guess "D" → reveal slot 3 and win
    await publicClient.waitForTransactionReceipt({
      hash: await wallet.writeContract({
        address: gameAddress,
        abi: gameAbi,
        functionName: "guessLetter",
        args: ["D"],
      }),
    });

    // 1) grab the raw tuple of ciphertext handles
    const rawHandles = await publicClient.readContract({
      address: gameAddress,
      abi: gameAbi,
      functionName: "getCurrentStatus",
    }) as [
        HexString, // flag0
        HexString, // flag1
        HexString, // flag2
        HexString, // flag3
        HexString, // newLives
        HexString  // newHasWon
      ];

    // 2) pull them out
    const [h0, h1, h2, h3, hLives, hWon] = rawHandles;

    console.log("raw handle h0:", h0);
    console.log("raw handle h1:", h1);
    console.log("raw handle h2:", h2);
    console.log("raw handle h3:", h3);
    console.log("raw handle hLives:", hLives);


    // 4) run them all in parallel
    const [flag0, flag1, flag2, flag3, newLives, newHasWon] = await Promise.all([
      decryptHandle(h0),
      decryptHandle(h1),
      decryptHandle(h2),
      decryptHandle(h3),
      decryptHandle(hLives),
      decryptHandle(hWon),
    ]);
    // 5) now assert
    console.log("decrypted flags:", flag0, flag1, flag2, flag3);
    console.log("decrypted lives:", newLives);
    console.log("decrypted hasWon:", newHasWon);
  });
});

// 3) helper to re‐encrypt one handle
async function decryptHandle(handle: HexString,) {
  const result = await reencryptValue({
    chainId: 84532,
    walletClient: wallet,
    handle: handle.toString(),
    kmsConnectEndpoint: KMS_CONNECT_ENDPOINT_BASE_SEPOLIA
  });
  return result.value;
}

