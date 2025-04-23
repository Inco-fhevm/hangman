// test/HangmanTests.ts
// SPDX-License-Identifier: BSD-3-Clause-Clear

import { expect } from "chai";
import { namedWallets, wallet, publicClient } from "../utils/wallet";
import { getContract, Abi, Hex, parseAbiItem, getAddress } from "viem";
import factoryJson from "../artifacts/contracts/IncoHangMan.sol/HangmanFactory.json";
import gameJson    from "../artifacts/contracts/IncoHangMan.sol/HangmanGame.json";
import { encryptValue, incoLiteConfig } from "../utils/IncoHelper";

// Cast JSON ABIs to Viem’s Abi
const factoryAbi = factoryJson.abi as Abi;
const gameAbi    = gameJson.abi    as Abi;

// Helper to turn 4 ASCII chars into a single 4-byte hex literal
function asFourByteHex(word: string): Hex {
  if (word.length !== 4) throw new Error("Must be exactly 4 characters");
  return (`0x${Buffer.from(word, "ascii").toString("hex")}`) as Hex;
}

// Polling helper for showWord
async function waitForShowWord(
  gameAddress: Hex,
  expected: string,
  timeoutMs = 120_000,
  intervalMs = 1_000
) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const current = await publicClient.readContract({
      address:      gameAddress,
      abi:          gameAbi,
      functionName: "showWord",
    });
    if (current === expected) return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Timed out waiting for showWord === "${expected}"`);
}

// Polling helper for showMisses
async function waitForShowMisses(
  gameAddress: Hex,
  expected: string,
  timeoutMs = 120_000,
  intervalMs = 1_000
) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const current = await publicClient.readContract({
      address:      gameAddress,
      abi:          gameAbi,
      functionName: "showMisses",
    });
    if (current === expected) return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Timed out waiting for showMisses === "${expected}"`);
}

describe("Hangman Tests", function () {
  // bump Mocha’s timeout for all hooks & tests
  this.timeout(300_000);

  let factoryAddress: Hex;
  let gameAddress:    Hex;
  let incoConfig:     ReturnType<typeof incoLiteConfig>;

  beforeEach(async () => {
    incoConfig = incoLiteConfig("baseSepolia");

    const tx0 = await wallet.deployContract({
      abi:      factoryAbi,
      bytecode: factoryJson.bytecode as Hex,
      args:     [wallet.account.address],
    });
    const r0 = await publicClient.waitForTransactionReceipt({ hash: tx0 });
    factoryAddress = r0.contractAddress!;
    console.log(`✅ Factory deployed at: ${factoryAddress}`);
  });

  it("processes letter guesses one by one and wins the game", async () => {
    // ── 1) Encrypt & add "TEST" ────────────────────────────────────────
    const raw = BigInt(asFourByteHex("TEST"));
    const { inputCt } = await encryptValue({
      value:           raw,
      address:         wallet.account.address,
      config:          incoConfig,
      contractAddress: factoryAddress,
    });
    const encryptedWord = inputCt.ciphertext.value;

    const tx1 = await wallet.writeContract({
      address:      factoryAddress,
      abi:          factoryAbi,
      functionName: "addWord",
      args:         [encryptedWord],
    });
    await publicClient.waitForTransactionReceipt({ hash: tx1 });

    // ── 2) Watch for GameCreated ───────────────────────────────────────
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

    // ── 3) CreateGame ──────────────────────────────────────────────────
    const tx2 = await wallet.writeContract({
      address:      factoryAddress,
      abi:          factoryAbi,
      functionName: "CreateGame",
      args:         [namedWallets.alice.account.address],
    });
    await publicClient.waitForTransactionReceipt({ hash: tx2 });

    gameAddress = await newGame;
    console.log(`✅ Game created at: ${gameAddress}`);

    // ── 4) WRONG guess "Z" ───────────────────────────────────────────────
    await publicClient.waitForTransactionReceipt({
      hash: await wallet.writeContract({
        address:      gameAddress,
        abi:          gameAbi,
        functionName: "guessLetter",
        args:         ["Z"],
      }),
    });

    // Wait for both the word _and_ the misses to update:
    await waitForShowWord   (gameAddress, "____", 60_000);
    await waitForShowMisses (gameAddress, "Z",    60_000);

    const lives1 = await publicClient.readContract({
      address:      gameAddress,
      abi:          gameAbi,
      functionName: "remainingLives",
    });
    expect(lives1).to.equal(7);

    // ── 5) CORRECT guess "T" (positions 0 & 3) ───────────────────────────
    await publicClient.waitForTransactionReceipt({
      hash: await wallet.writeContract({
        address:      gameAddress,
        abi:          gameAbi,
        functionName: "guessLetter",
        args:         ["T"],
      }),
    });

    // **give this one plenty of time**
    await waitForShowWord   (gameAddress, "T__T", 120_000);
    await waitForShowMisses (gameAddress, "Z",    30_000);

    const lives2 = await publicClient.readContract({
      address:      gameAddress,
      abi:          gameAbi,
      functionName: "remainingLives",
    });
    expect(lives2).to.equal(7);

    // ── 6) CORRECT guess "E" ───────────────────────────────────────────────
    await publicClient.waitForTransactionReceipt({
      hash: await wallet.writeContract({
        address:      gameAddress,
        abi:          gameAbi,
        functionName: "guessLetter",
        args:         ["E"],
      }),
    });
    await waitForShowWord(gameAddress, "TE_T", 60_000);

    // ── 7) FINAL guess "S" → WIN ────────────────────────────────────────────
    await publicClient.waitForTransactionReceipt({
      hash: await wallet.writeContract({
        address:      gameAddress,
        abi:          gameAbi,
        functionName: "guessLetter",
        args:         ["S"],
      }),
    });
    await waitForShowWord(gameAddress, "TEST", 60_000);

    const won = await publicClient.readContract({
      address:      gameAddress,
      abi:          gameAbi,
      functionName: "hasWon",
    });
    expect(won).to.be.true;
  });
});
