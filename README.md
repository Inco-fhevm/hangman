# Hangman

A classic Hangman word game built on [Inco](https://www.inco.org/) - a privacy-focused blockchain with Fully Homomorphic Encryption (FHE) and on-chain randomness. 

Play the traditional word-guessing game where you try to guess a hidden word one letter at a time before running out of attempts. All game logic runs on-chain with encrypted state thanks to FHE technology.

## Features

- **On-chain gameplay** with FHE-encrypted game state
- **Wallet integration** via RainbowKit
- **Privacy-preserving** word selection and validation
- **Modern UI** built with Next.js, React, and Tailwind CSS
- **Smart contracts** for game logic with confidential computing

## Tech Stack

This project is built with:

- **Frontend**: [Next.js 14](https://nextjs.org/), React, Tailwind CSS
- **Blockchain**: [Inco Network](https://www.inco.org/) with FHE
- **Web3**: [Wagmi](https://wagmi.sh/), [Viem](https://viem.sh/), [RainbowKit](https://www.rainbowkit.com/)
- **Smart Contracts**: Solidity with [Hardhat](https://hardhat.org/)
- **Inco SDK**: [@inco/js](https://www.npmjs.com/package/@inco/js)

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Web3 wallet (MetaMask, Rainbow, etc.)
- Some test tokens on Inco testnet

### Installation

1. Clone the repository:

\`\`\`bash
git clone https://github.com/Inco-fhevm/hangman.git
cd hangman
\`\`\`

2. Install dependencies:

\`\`\`bash
npm install
# or
bun install
\`\`\`

3. Set up environment variables:

Copy \`.env.sample\` to \`.env\` and configure:

\`\`\`bash
cp .env.sample .env
\`\`\`

4. Start the development server:

\`\`\`bash
npm run dev
# or
bun dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Smart Contracts

The smart contracts for the game are located in the \`/contracts\` directory. 

### Compile Contracts

\`\`\`bash
cd contracts
bun hardhat compile
\`\`\`

### Run Tests

\`\`\`bash
cd contracts
bun hardhat test --network baseSepolia
\`\`\`

For more details, see the [contracts README](./contracts/README.md).

## How It Works

The Hangman game leverages Inco's FHE technology to keep the word selection and game state encrypted on-chain. This ensures:

1. **Fair gameplay**: The word is encrypted until revealed, preventing cheating
2. **Privacy**: Player guesses and game state remain confidential
3. **Verifiability**: All game logic is transparently executed on-chain
4. **Randomness**: Word selection uses on-chain verifiable randomness

## Project Structure

\`\`\`
hangman/
├── src/              # Next.js app source
├── contracts/        # Solidity smart contracts
├── public/           # Static assets
├── components.json   # UI component configuration
└── README.md         # This file
\`\`\`

## Deployment

### Deploy Frontend

The easiest way to deploy the Next.js frontend is using [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Inco-fhevm/hangman)

### Deploy Contracts

See the [contracts README](./contracts/README.md) for deployment instructions.

## Learn More

- [Inco Network Documentation](https://docs.inco.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [FHE Explained](https://www.zama.ai/post/what-is-fully-homomorphic-encryption-fhe)
- [RainbowKit Docs](https://www.rainbowkit.com/docs/introduction)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
