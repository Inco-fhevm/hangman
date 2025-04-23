// @ts-ignore
import {
  generateSecp256k1Keypair,
  decodeSecp256k1PublicKey,
  getEciesEncryptor,   // @ts-ignore
} from "@inco/js/lite";
import { hexToBytes } from "viem";
import { HexString } from "@inco/js/dist/binary";

// @ts-ignore
import { incoLiteReencryptor } from "@inco/js/lite";
// @ts-ignore
import { getActiveLightningDeployment, IncoLiteDeployment } from "@inco/js/lite";

// Define KMS Endpoints for different networks
export const KMS_CONNECT_ENDPOINT_BASE_SEPOLIA = "https://grpc.base-sepolia.lightning.testnet.inco.org/";
export const KMS_CONNECT_ENDPOINT_MONAD_TESTNET = "grpc.monadtestnet.covalidator.denver.inco.org";

// Helper function to get KMS endpoint based on network
export const getKmsEndpoint = (network: string): string => {
  switch (network.toLowerCase()) {
    case 'basesepolia':
      return KMS_CONNECT_ENDPOINT_BASE_SEPOLIA;
    case 'monadtestnet':
      return KMS_CONNECT_ENDPOINT_MONAD_TESTNET;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
};

// ✅ Define Config Type
interface EncryptConfig {
  chainId: number;
  eciesPublicKey: HexString;
  executorAddress: HexString;
}

// ✅ Define Encrypt Function Input Type
interface EncryptParams {
  value: string | number | bigint;
  address: HexString;
  config: EncryptConfig;
  contractAddress: HexString;
}

// ✅ Define `InputCt` Type
export interface InputCt {
  prehandle: HexString;
  handle: HexString;
  context: {
    hostChainId: bigint;
    aclAddress: HexString;
    userAddress: HexString;
    contractAddress: HexString;
  };
  ciphertext: {
    scheme: number;
    type: number;
    value: HexString;
  };
}

// ✅ Update Encrypt Function to Return `InputCt`
export const encryptValue = async ({
  value,
  address,
  config,
  contractAddress,
}: EncryptParams): Promise<{ inputCt: InputCt }> => {
  const valueBigInt: bigint = BigInt(value); // Convert to BigInt

  const plaintextWithContext = {
    plaintext: {
      scheme: 1, // encryptionSchemes.ecies
      value: valueBigInt,
      type: 8, // handleTypes.uint256
    },
    context: {
      hostChainId: BigInt(config.chainId),
      aclAddress: config.executorAddress,
      userAddress: address,
      contractAddress: contractAddress,
    },
  };

  const ephemeralKeypair = await generateSecp256k1Keypair();
  const eciesPubKey = decodeSecp256k1PublicKey(hexToBytes(config.eciesPublicKey));
  const encryptor = getEciesEncryptor({
    scheme: 1, 
    pubKeyA: eciesPubKey,
    privKeyB: ephemeralKeypair,
  });

  const inputCt: InputCt = await encryptor(plaintextWithContext);

  return { inputCt };
};

// ✅ Define Re-encrypt Function Input Type
interface ReEncryptParams {
  chainId: number;
  walletClient: unknown; 
  handle: string;
  kmsConnectEndpoint: string;
}

// ✅ Define `ReencryptResult` Type
export interface ReencryptResult {
  value: bigint;
}

// ✅ Updated Re-encrypt Function with new API
export const reencryptValue = async ({
  chainId,
  walletClient,
  handle,
  kmsConnectEndpoint,
}: ReEncryptParams): Promise<ReencryptResult> => {
  if(!chainId || !walletClient || !handle || !kmsConnectEndpoint) {
    throw new Error("Missing required parameters");
  }
  try {

    const reencryptor = await incoLiteReencryptor({
      chainId: BigInt(chainId),
      walletClient: walletClient,
      kmsConnectRpcEndpointOrClient: kmsConnectEndpoint,
    });

    const decrypted = await reencryptor({ 
      handle: handle 
    });

    return { value: decrypted.value };
  } catch (error: any) {
    throw new Error(`Failed to re-encrypt value: ${error.message}`);
  }
};

// ✅ Define `incoLiteConfig` Function with Proper Type Return
export const incoLiteConfig = (network_name: string): IncoLiteDeployment => {
  return getActiveLightningDeployment(network_name);
};
