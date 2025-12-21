import { Lightning } from "@inco/js/lite";
import { handleTypes } from "@inco/js";

let incoConfig = null;

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
export async function decryptValue({ walletClient, handle, chainId }) {
  const inco = await getConfig(chainId);

  // Get attested decrypt for the wallet
  const attestedDecrypt = await inco.attestedDecrypt(walletClient, [handle]);

  console.log("Attested decrypt: ", attestedDecrypt[0].plaintext.value%4n);

  // Return the decrypted value
  return attestedDecrypt[0].plaintext.value;
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
