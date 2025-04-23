# **Inco CERC20 **

This repository provides a **complete Hardhat setup** for testing **reencryption, decryption, and ciphertext formation** in smart contracts.

## **Setup Instructions**

### **1. Clone the Repository**
```sh
git clone <your-repo-url>
cd into_your_repo
```

### **2. Install Dependencies**
```sh
pnpm install
```

### **3. Configure Environment Variables**  
Create a `.env` file in the root directory and add the following:  

```plaintext
PRIVATE_KEY=""  # Private key funded with native tokens
SEED_PHRASE=""  # Seed phrase for testing with different accounts
BASE_SEPOLIA_RPC_URL=""  # RPC URL supporting eth_getLogs and eth_getFilteredLogs
```

### **4. Compile Smart Contracts**
```sh
pnpm hardhat compile
```

### **5. Run Tests**
```sh
pnpm hardhat test --network baseSepolia
```

## **Features**
- End-to-end testing of encryption, reencryption  and decryption functionalities.
- Hardhat-based test framework.
- Supports reencryption and ciphertext validation.