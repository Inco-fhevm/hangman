// SPDX-License-Identifier: BSD-3-Clause-Clear

import { expect } from "chai";
import { namedWallets, wallet, publicClient } from "../utils/wallet";
import { Abi, Hex, parseAbiItem, decodeEventLog } from "viem";
import factoryJson from "../artifacts/contracts/IncoHangMan.sol/HangmanFactory.json";
import gameJson from "../artifacts/contracts/IncoHangMan.sol/HangmanGame.json";
import { decryptValue, getConfig, getFee } from "../utils/IncoHelper";
import { handleTypes } from "@inco/js";

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
  let incoConfig: any;

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

  it("Seed Word", async () => {
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
      "xray",
      "kids",
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
      "keen",
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
        const encryptedData = await incoConfig.encrypt(raw, {
          accountAddress: wallet.account.address,
          dappAddress: factoryAddress,
          handleType: handleTypes.euint256,
        });
        return encryptedData as Hex;
      })
    );
    // console.log("wordBytes:", wordBytes);

    // 3) Get fee for seedWords (fee * number of words)
    const fee = await getFee();
    const totalFee = fee * BigInt(words.length);

    // 4) Call seedWords once, passing the entire array
    const txSeed = await wallet.writeContract({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: "seedWords",
      args: [wordBytes], // bytes[] memory
      value: totalFee,
    });
    await publicClient.waitForTransactionReceipt({ hash: txSeed });

    // Wait for covalidator to process encrypted operations
    console.log("Waiting for covalidator to process encrypted operations...");
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  it("processes letter guesses one by one on 'word' and wins the game", async () => {
    const raw = BigInt(asFourByteHex("word"));
    const encryptedData = await incoConfig.encrypt(raw, {
      accountAddress: wallet.account.address,
      dappAddress: factoryAddress,
      handleType: handleTypes.euint256,
    });

    // Get fee for addWord
    const fee = await getFee();

    const tx1 = await wallet.writeContract({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: "addWord",
      args: [encryptedData],
      value: fee,
    });
    await publicClient.waitForTransactionReceipt({ hash: tx1 });

    // Wait for covalidator to process encrypted operations
    console.log("Waiting for covalidator to process encrypted operations...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const tx2 = await wallet.writeContract({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: "CreateGame",
      args: [wallet.account.address],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx2 });

    // Parse the GameCreated event from the receipt logs
    const gameCreatedEvent = parseAbiItem(
      "event GameCreated(address indexed player, address gameContract)"
    );

    let foundGameAddress: Hex | undefined;
    for (const log of receipt.logs) {
      // Only check logs from the factory address
      if (log.address.toLowerCase() !== factoryAddress.toLowerCase()) {
        continue;
      }
      try {
        const decoded = decodeEventLog({
          abi: [gameCreatedEvent],
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "GameCreated") {
          foundGameAddress = decoded.args.gameContract as Hex;
          break;
        }
      } catch (e) {
        // Not the event we're looking for, continue
        continue;
      }
    }

    // If not found in receipt, try querying logs from a wider block range
    if (!foundGameAddress) {
      const logs = await publicClient.getLogs({
        address: factoryAddress,
        event: gameCreatedEvent,
        fromBlock: receipt.blockNumber - 1n,
        toBlock: receipt.blockNumber + 1n,
      });

      if (logs.length) {
        foundGameAddress = logs[0].args.gameContract as Hex;
      }
    }

    // If still not found, read from the factory's mapping
    if (!foundGameAddress) {
      foundGameAddress = (await publicClient.readContract({
        address: factoryAddress,
        abi: factoryAbi,
        functionName: "getGameAddressByPlayer",
        args: [wallet.account.address],
      })) as Hex;
    }

    if (
      !foundGameAddress ||
      foundGameAddress === "0x0000000000000000000000000000000000000000"
    ) {
      throw new Error(
        "GameCreated event not found and game address not found in factory mapping"
      );
    }

    gameAddress = foundGameAddress;

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

      // Wait for covalidator to process encrypted operations BEFORE reading the tile
      console.log("Waiting for covalidator to process encrypted operations...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const tile = (await publicClient.readContract({
        address: gameAddress,
        abi: gameAbi,
        functionName: "getTile",
        args: [],
      })) as Hex;

      const decryptedTile = await decryptHandle(tile);
      console.log(`decrypted tile after guess '${guess}':`, decryptedTile);
      expect(decryptedTile.toString()).to.equal(expected);
    }

    const rawHandles = (await publicClient.readContract({
      address: gameAddress,
      abi: gameAbi,
      functionName: "getCurrentStatus",
    })) as [Hex, Hex, Hex, Hex, Hex, Hex, Hex];

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

async function decryptHandle(handle: Hex) {
  // Use decryptValue for player-specific values (game state is allowed to the player)
  const decryptedValue = await decryptValue({
    walletClient: wallet,
    handle: handle.toString(),
  });
  return decryptedValue;
}
