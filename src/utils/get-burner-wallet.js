import { createWalletClient, http, keccak256 } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

export function getBurnerWallet(signature) {
  try {
    console.log(
      "Creating burner wallet from signature:",
      signature?.slice(0, 10) + "..."
    );

    // Convert signature to a deterministic 32-byte private key
    const privateKeyHash = keccak256(signature);
    console.log(
      "Generated private key hash:",
      privateKeyHash?.slice(0, 10) + "..."
    );

    const account = privateKeyToAccount(privateKeyHash);
    console.log("Created account:", account.address);

    const wallet = createWalletClient({
      chain: baseSepolia,
      transport: http(),
      account: account,
    });

    console.log("✅ Burner wallet created successfully");
    return wallet;
  } catch (error) {
    console.error("❌ Error in getBurnerWallet:", error);
    throw error;
  }
}
