import {
  Lightning,
  generateSecp256k1Keypair,
  getIncoVerifierContract,
} from "@inco/js/lite";
import { handleTypes } from "@inco/js";
import { privateKeyToAccount } from "viem/accounts";

let incoConfig = null;
let sessionVoucher = null;
let ephemeralKeypair = null;

// localStorage keys
const SESSION_VOUCHER_KEY = "hangman-session-voucher";
const SESSION_EXPIRATION_KEY = "hangman-session-expiration";

// Function to store session data in localStorage
function storeSessionData(voucher, keypair, expiration) {
  try {
    const data = {
      voucher,
      keypair: {
        publicKey: keypair.kp.getPublic("hex"),
        privateKey: keypair.kp.getPrivate("hex"),
      },
      expiration: expiration.toISOString(),
    };
    localStorage.setItem(SESSION_VOUCHER_KEY, JSON.stringify(data));
    console.log(
      "Session data stored in localStorage (WARNING: contains private key for demo purposes)"
    );
  } catch (error) {
    console.error("Error storing session data:", error);
  }
}

// Function to get session data from localStorage
function getStoredSessionData() {
  try {
    const dataString = localStorage.getItem(SESSION_VOUCHER_KEY);

    if (dataString) {
      const data = JSON.parse(dataString);
      const expiration = new Date(data.expiration);

      if (expiration > new Date()) {
        return {
          voucher: data.voucher,
          keypair: data.keypair,
          expiration,
        };
      } else {
        // Expired, clean up
        clearStoredSessionData();
      }
    }
  } catch (error) {
    console.error("Error reading session data:", error);
  }
  return null;
}

// Function to clear stored session data
function clearStoredSessionData() {
  localStorage.removeItem(SESSION_VOUCHER_KEY);
}

// Function to clear current session (both memory and localStorage)
export function clearSession() {
  sessionVoucher = null;
  ephemeralKeypair = null;
  clearStoredSessionData();
  // Also clear any old format data
  localStorage.removeItem(SESSION_EXPIRATION_KEY);
  console.log("Session cleared");
}

// Function to check if we have a valid session
function hasValidSession() {
  return sessionVoucher && ephemeralKeypair;
}

/**
 * Get or initialize the Inco configuration based on the current chain
 */
export async function getConfig(chainId) {
  if (incoConfig) return incoConfig;

  console.log(`🔧 Initializing Inco config for chain: ${chainId}`);

  if (chainId === 84532) {
    incoConfig = await Lightning.latest("devnet", 84532); // Base Sepolia
  } else {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return incoConfig;
}

/**
 * Initialize session voucher for attested decrypt with session key
 */
export async function initializeSessionVoucher(
  walletClient,
  chainId,
  publicClient
) {
  // Check if we already have a valid session in memory
  if (hasValidSession()) {
    console.log("Using existing session voucher from memory");
    return { voucher: sessionVoucher, keypair: ephemeralKeypair };
  }

  // Check if we have valid session data in localStorage
  const storedData = getStoredSessionData();
  if (storedData) {
    console.log("Found valid session data in localStorage");
    // Reconstruct the keypair from stored private key
    ephemeralKeypair = {
      kp: {
        getPublic: (encoding) =>
          Buffer.from(storedData.keypair.publicKey, "hex"),
        getPrivate: (encoding) =>
          Buffer.from(storedData.keypair.privateKey, "hex"),
      },
      encodePublicKey: () => storedData.keypair.publicKey,
    };
    sessionVoucher = storedData.voucher;
    return { voucher: sessionVoucher, keypair: ephemeralKeypair };
  }

  console.log("Creating new session voucher");
  const inco = await getConfig(chainId);

  // Generate ephemeral keypair for session
  ephemeralKeypair = await generateSecp256k1Keypair();
  const privateKey = `0x${ephemeralKeypair.kp.getPrivate("hex")}`;
  console.log("Private key:", privateKey);

  const ephemeralAccount = privateKeyToAccount(privateKey);

  console.log("Ephemeral account:", ephemeralAccount);
  console.log("Ephemeral account address:", ephemeralAccount.address);

  // const executorAddress = inco.executorAddress;
  // console.log("Inco executor address:", executorAddress);

  // const incoVerifier = await Lightning.getIncoVerifierContract(
  //   publicClient,
  //   executorAddress
  // );
  // const incoVerifierAddress = incoVerifier.address;
  const sessionVerifierAddress = '0xc34569efc25901bdd6b652164a2c8a7228b23005';
  console.log("Inco verifier address:", sessionVerifierAddress);

  // Create voucher valid for 24 hours
  const expirationDate = new Date(Date.now() + 1000 * 60 * 60 * 24);

  console.log("🔑 Creating session voucher for attested decrypt...");
  console.log("Ephemeral account address:", ephemeralAccount.address);
  console.log("Inco verifier address:", sessionVerifierAddress);

  sessionVoucher = await inco.grantSessionKeyAllowanceVoucher(
    walletClient,
    ephemeralAccount.address,
    expirationDate,
    sessionVerifierAddress
  );

  console.log("✅ Session voucher created:", sessionVoucher);

  // Store session data in localStorage for persistence
  storeSessionData(sessionVoucher, ephemeralKeypair, expirationDate);

  return { voucher: sessionVoucher, keypair: ephemeralKeypair };
}

/**
 * Encrypt a value for a specific contract and account
 */
export async function encryptValue({
  value,
  address,
  contractAddress,
  chainId,
}) {
  const inco = await getConfig(chainId);

  const encryptedData = await inco.encrypt(BigInt(value), {
    accountAddress: address,
    dappAddress: contractAddress,
    handleType: handleTypes.euint256,
  });

  console.log("Encrypted data: ", encryptedData);

  return encryptedData;
}

/**
 * Re-encrypt and decrypt a handle for a specific wallet
 */
export async function decryptValue({
  walletClient,
  handle,
  chainId,
  publicClient,
}) {
  const inco = await getConfig(chainId);

  // Ensure we have a session voucher initialized
  if (!sessionVoucher || !ephemeralKeypair) {
    await initializeSessionVoucher(walletClient, chainId, publicClient);
  }

  // Use attested decrypt with voucher
  console.log("Decrypting handle:", handle, "type:", typeof handle);

  console.log("using session voucher: ", sessionVoucher);
  const decrypted = await inco.attestedDecryptWithVoucher(
    ephemeralKeypair,
    sessionVoucher,
    publicClient,
    [handle]
  );

  // const decrypted = await inco.attestedDecrypt(walletClient, [handle]);

  // Return the decrypted value
  return decrypted[0].plaintext.value;
}

/**
 * Get the fee required for Inco operations
 */
export async function getFee(chainId) {
  const inco = await getConfig(chainId);

  // Read the fee from the Lightning contract
  const fee = await inco.publicClient.readContract({
    address: inco.executorAddress,
    abi: [
      {
        type: "function",
        inputs: [],
        name: "getFee",
        outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
        stateMutability: "pure",
      },
    ],
    functionName: "getFee",
  });

  console.log("Fee: ", fee);
  return fee;
}
