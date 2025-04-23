import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount, mnemonicToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import * as dotenv from "dotenv";
import { HexString } from "@inco/js/dist/binary";

dotenv.config();

// Load private key and ensure it has the "0x" prefix
const PRIVATE_KEY = process.env.PRIVATE_KEY?.startsWith("0x")
  ? (process.env.PRIVATE_KEY as HexString)
  : (`0x${process.env.PRIVATE_KEY}` as HexString);

if (!PRIVATE_KEY || PRIVATE_KEY.length !== 66) {
  throw new Error("Invalid or missing PRIVATE_KEY in .env file");
}

// ✅ Create an account from the private key
const account = privateKeyToAccount(PRIVATE_KEY);

// ✅ Create a Viem public client
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"),
});

// ✅ Create a Viem wallet client (single wallet)
export const wallet = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"),
});

console.log(`✅ Wallet created: ${account.address}`);

// ✅ Load Seed Phrase for Multiple Named Wallets
const MNEMONIC = process.env.SEED_PHRASE;
if (!MNEMONIC) {
  throw new Error("Missing SEED_PHRASE in .env file");
}

// Generate multiple named wallets from the mnemonic
export const  namedWallets = {
  alice: createWalletClient({
    account: mnemonicToAccount(MNEMONIC, { path: "m/44'/60'/0'/0/0" }),
    chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"),
  }),
  bob: createWalletClient({
    account: mnemonicToAccount(MNEMONIC, { path: "m/44'/60'/0'/0/1" }),
    chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"),
  }),
  dave: createWalletClient({
    account: mnemonicToAccount(MNEMONIC, { path: "m/44'/60'/0'/0/2" }),
    chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"),
  }),
  carol: createWalletClient({
    account: mnemonicToAccount(MNEMONIC, { path: "m/44'/60'/0'/0/3" }),
    chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"),
  }),
  john: createWalletClient({
    account: mnemonicToAccount(MNEMONIC, { path: "m/44'/60'/0'/0/4" }),
    chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"),
  }),
};

console.log("✅ Named wallets created:");
Object.entries(namedWallets).forEach(([name, client]) => {
  console.log(`   - ${name}: ${(client.account?.address)}`);
});
