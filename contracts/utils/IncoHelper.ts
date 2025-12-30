import { AttestedComputeSupportedOps, Lightning } from '@inco/js/lite';
import { handleTypes } from '@inco/js';
import { publicClient } from './wallet';
import type { WalletClient } from 'viem';
import { bytesToHex, pad, toHex } from 'viem';

let incoConfig: any = null;

/**
 * Get or initialize the Inco configuration based on the current chain
 */
export async function getConfig() {
  if (incoConfig) return incoConfig;

  const chainId = publicClient.chain.id;
  console.log(`🔧 Initializing Inco config for chain: ${chainId}`);

  if (chainId === 84532) {
    incoConfig = await Lightning.latest('testnet', 84532); // Base Sepolia
  } 
  else {
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
}: {
  value: bigint;
  address: `0x${string}`;
  contractAddress: `0x${string}`;
}): Promise<`0x${string}`> {
  const inco = await getConfig();

  const encryptedData = await inco.encrypt(value, {
    accountAddress: address,
    dappAddress: contractAddress,
    handleType: handleTypes.euint256,
  });

  // console.log("Encrypted data: ", encryptedData);

  return encryptedData as `0x${string}`;
}

/**
 * Re-encrypt and decrypt a handle for a specific wallet
 */
export async function decryptValue({
  walletClient,
  handle,
}: {
  walletClient: WalletClient;
  handle: string;
}): Promise<bigint> {
  const inco = await getConfig();

  // Get attested decrypt for the wallet
  const attestedDecrypt = await inco.attestedDecrypt(
    walletClient,
    [handle],
  );

  // Return the decrypted value
  return attestedDecrypt[0].plaintext.value;
}

export const attestedCompute = async ({
  walletClient,
  lhsHandle,
  op,
  rhsPlaintext,
}: {
  walletClient: WalletClient;
  lhsHandle: `0x${string}`;
  op: (typeof AttestedComputeSupportedOps)[keyof typeof AttestedComputeSupportedOps];
  rhsPlaintext: any;
}) => {
  const incoConfig = await getConfig();

  const result = await incoConfig.attestedCompute(
    walletClient as WalletClient,
    lhsHandle as `0x${string}`,
    op,
    rhsPlaintext
  );

  // Convert Uint8Array signatures to hex strings
  const signatures = result.covalidatorSignatures.map((sig: Uint8Array) => bytesToHex(sig));

  // Encode the plaintext value as bytes32
  // For boolean: true = 1, false = 0, padded to 32 bytes
  const encodedValue = pad(toHex(result.plaintext.value ? 1 : 0), { size: 32 });

  // Return in format expected by contract:
  // - plaintext: the actual decrypted value  
  // - attestation: { handle, value } for the DecryptionAttestation struct
  // - signature array for verification
  return {
    plaintext: result.plaintext.value,
    attestation: {
      handle: result.handle,
      value: encodedValue,
    },
    signature: signatures,
  };
};

/**
 * Get the fee required for Inco operations
 */
export async function getFee(): Promise<bigint> {
  const inco = await getConfig();
  
  // Read the fee from the Lightning contract
  const fee = await publicClient.readContract({
    address: inco.executorAddress,
    abi: [
      {
        type: 'function',
        inputs: [],
        name: 'getFee',
        outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
        stateMutability: 'pure',
      },
    ],
    functionName: 'getFee',
  });

  console.log("Fee: ", fee);
  return fee;
}