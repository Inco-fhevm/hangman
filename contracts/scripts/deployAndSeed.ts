// SPDX-License-Identifier: BSD-3-Clause-Clear
//
// Deploy + seed a HangmanFactory on Base Sepolia using the migrated @inco/lightning-js v1 SDK.
// Run: npx hardhat run scripts/deployAndSeed.ts --network baseSepolia
//
import { wallet, publicClient } from "../utils/wallet";
import { encryptValue, getFee } from "../utils/IncoHelper";
import { Abi, Hex } from "viem";
import factoryJson from "../artifacts/contracts/IncoHangMan.sol/HangmanFactory.json";

const factoryAbi = factoryJson.abi as Abi;

// 4-letter words for the game (must be exactly 4 chars, a-z).
const WORDS = [
  "play", "time", "home", "mind", "work", "jump", "farm", "cake",
  "bake", "fire", "wind", "gold", "road", "love", "rock", "rain",
  "star", "fish", "desk", "news", "team", "care", "peak", "golf",
  "word", "ship", "bank", "dust", "made", "corn", "tail", "zinc",
];

// Pack a 4-char word into a uint256 (little-endian per byte, matches the test helper).
function asFourByteHex(word: string): Hex {
  if (word.length !== 4) throw new Error(`"${word}" must be exactly 4 characters`);
  return ("0x" +
    Buffer.from(word.toLowerCase().split("").reverse().join(""), "ascii").toString("hex")) as Hex;
}

async function main() {
  console.log(`\n🚀 Deploying HangmanFactory on Base Sepolia (chain ${publicClient.chain.id})`);
  console.log(`   Master / deployer: ${wallet.account.address}`);

  // 1) Deploy the factory (master = deployer).
  const deployTx = await wallet.deployContract({
    abi: factoryAbi,
    bytecode: factoryJson.bytecode as Hex,
    args: [wallet.account.address],
  });
  const deployReceipt = await publicClient.waitForTransactionReceipt({ hash: deployTx });
  const factoryAddress = deployReceipt.contractAddress!;
  console.log(`✅ HangmanFactory deployed at: ${factoryAddress}`);

  // 2) Encrypt every word for the factory (v1 SDK: Lightning.baseSepoliaTestnet()).
  console.log(`🔐 Encrypting ${WORDS.length} words...`);
  const wordBytes: Hex[] = await Promise.all(
    WORDS.map(async (word) => {
      const raw = BigInt(asFourByteHex(word));
      return (await encryptValue({
        value: raw,
        address: wallet.account.address,
        contractAddress: factoryAddress,
      })) as Hex;
    })
  );

  // 3) Seed all words in one tx (fee = inco.getFee() * count).
  const fee = await getFee();
  console.log(`💸 Seeding words (fee per word: ${fee}, total: ${fee * BigInt(wordBytes.length)})`);
  const seedTx = await wallet.writeContract({
    address: factoryAddress,
    abi: factoryAbi,
    functionName: "seedWords",
    args: [wordBytes],
    value: fee * BigInt(wordBytes.length),
  });
  await publicClient.waitForTransactionReceipt({ hash: seedTx, confirmations: 2 });

  const total = await publicClient.readContract({
    address: factoryAddress,
    abi: factoryAbi,
    functionName: "getWordsTotal",
  });

  console.log(`\n🎉 Done!`);
  console.log(`   Factory address : ${factoryAddress}`);
  console.log(`   Words seeded    : ${total}`);
  console.log(`   Seed tx         : ${seedTx}`);
  console.log(`\n👉 Set this in the frontend .env:`);
  console.log(`   HANGMAN_FACTORY_CONTRACT_ADDRESS=${factoryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
