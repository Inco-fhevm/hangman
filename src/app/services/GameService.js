import {
  HANGMAN_ABI,
  HANGMAN_FACTORY_ABI,
  HANGMAN_FACTORY_CONTRACT_ADDRESS,
} from "@/utils/contracts";
import { reEncryptValue } from "@/utils/inco-lite";

class GameService {
  constructor(
    publicClient,
    walletClient,
    chainId,
    address,
    hangmanContractAddress = null
  ) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;
    this.chainId = chainId;
    this.address = address;
    this.hangmanContractAddress = hangmanContractAddress;
  }

  async createGame() {
    try {
      // Create a new game through the factory contract
      const writeContract = await this.walletClient?.data?.writeContract({
        address: HANGMAN_FACTORY_CONTRACT_ADDRESS,
        abi: HANGMAN_FACTORY_ABI,
        functionName: "CreateGame",
        args: [this.address],
      });

      if (!writeContract) {
        throw new Error("Failed to write contract");
      }

      // Wait for the transaction to be mined
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: writeContract,
      });

      if (receipt.status === "reverted") {
        throw new Error("Transaction reverted");
      }

      // Get the game contract address
      const gameContractAddress = await this.publicClient.readContract({
        address: HANGMAN_FACTORY_CONTRACT_ADDRESS,
        abi: HANGMAN_FACTORY_ABI,
        functionName: "getGameAddressByPlayer",
        args: [this.address],
      });

      this.hangmanContractAddress = gameContractAddress;
      return gameContractAddress;
    } catch (error) {
      console.error("Error creating game:", error);
      throw new Error(
        `Failed to create game: ${error.message || "Unknown error"}`
      );
    }
  }

  async guessLetter(letter) {
    if (!this.hangmanContractAddress) {
      throw new Error("No game contract address available");
    }

    try {
      // Call guessLetter function
      const writeContract = await this.walletClient?.data?.writeContract({
        address: this.hangmanContractAddress,
        abi: HANGMAN_ABI,
        functionName: "guessLetter",
        args: [letter],
      });

      if (!writeContract) {
        throw new Error("Failed to write contract");
      }

      // Wait for transaction receipt
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: writeContract,
      });

      console.log("Transaction receipt:", receipt);

      if (receipt.status === "reverted") {
        throw new Error("Transaction reverted");
      }

      // Get tile position from contract
      const tile = await this.publicClient.readContract({
        address: this.hangmanContractAddress,
        abi: HANGMAN_ABI,
        functionName: "getTile",
        args: [],
      });

      console.log("Tile:", tile);

      // Decrypt the tile value
      const decryptedTile = await reEncryptValue({
        chainId: this.chainId,
        walletClient: this.walletClient,
        handle: tile,
      });

      console.log("Decrypted tile:", decryptedTile);

      // Convert BigInt to Number safely
      const tilePosition = parseInt(decryptedTile.toString());
      console.log("Tile position (number):", tilePosition);

      return tilePosition;
    } catch (error) {
      console.error("Error guessing letter:", error);
      throw new Error(
        `Failed to guess letter: ${error.message || "Unknown error"}`
      );
    }
  }
}

export default GameService;
