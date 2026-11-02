# Inco Hangman

A four-letter Hangman game whose secret words stay encrypted on-chain. It is built on [Inco Lightning](https://docs.inco.org) and runs on **Base Sepolia** (chain ID 84532).

The word is never stored or compared in plaintext. Each guess is checked against the encrypted letters inside the contract. Only the player can decrypt the result of their own game.

## How it works

The contracts live in [`contracts/contracts/IncoHangMan.sol`](contracts/contracts/IncoHangMan.sol).

- **`HangmanFactory`** holds a list of encrypted words (`euint256`, four ASCII bytes packed per word). Only the `master` address set at deployment can add words, with `addWord` or `seedWords`. Each encrypted input pays the Inco fee (`inco.getFee()`).
- **`CreateGame(player)`** picks a word using a pseudo-random index derived from `block.timestamp`, `block.prevrandao` and the caller. It then deploys a new `HangmanGame` for that player and grants the game access to the encrypted word.
- **`HangmanGame`** unpacks the word into four encrypted characters and starts the player with 8 encrypted lives. `guessLetter(letter)` compares the letter with every position using encrypted equality. It updates the encrypted `revealed` flags, `tile` (the first matching position, 1–4, or 100 for no match), `lives` and `hasWon`, and emits them in `GuessResult`.
- Access to these handles is granted only to the game contract and the player (`e.allow`). The frontend decrypts them using an Inco **session key voucher**: one wallet signature authorizes a throwaway key to decrypt for 24 hours, so there is no wallet prompt on every read. See [`src/utils/inco-lite.js`](src/utils/inco-lite.js).

> Word selection uses on-chain pseudo-randomness, which is fine for a demo but not unpredictable to a block producer.

## Tech stack

- Next.js 16, React 19, Tailwind CSS
- wagmi, viem and RainbowKit (WalletConnect / Reown) for wallets
- [`@inco/lightning-js`](https://www.npmjs.com/package/@inco/lightning-js) v1 for encryption and attested decryption
- Hardhat with `@inco/lightning` for the Solidity contracts

## Project structure

```
src/
  app/                 Next.js app router (page, layout, /api/contracts)
  app/api/contracts/   Serves contract address + config from env vars to the client
  hooks/use-hangman.js Game flow: create game, guess, decrypt results
  utils/inco-lite.js   Inco Lightning config, session vouchers, encrypt/decrypt
  components/          UI, including network-guard.js (forces Base Sepolia)
contracts/
  contracts/IncoHangMan.sol   HangmanFactory + HangmanGame
  scripts/deployAndSeed.ts    Deploys a factory and seeds encrypted words
  test/HangmanTests.ts        End-to-end test on Base Sepolia
```

## Running the frontend

Requirements: Node.js 20+ and a wallet with Base Sepolia ETH.

```bash
npm install
cp .env.sample .env
```

Fill in `.env`:

| Variable | Description |
| --- | --- |
| `HANGMAN_FACTORY_CONTRACT_ADDRESS` | Deployed `HangmanFactory`. `.env.sample` contains a working testnet factory. |
| `INCO_ENV` | Inco environment, `testnet`. |
| `REOWN_APP_ID` | WalletConnect / Reown project ID from [cloud.reown.com](https://cloud.reown.com). |

All three are read at runtime by `/api/contracts`. The app shows a configuration error if any of them is missing.

```bash
npm run dev
```

Open http://localhost:3000, connect a wallet on Base Sepolia, start a game and guess letters.

### Docker

```bash
docker compose up --build
```

`docker-compose.yml` passes the same three variables from your shell environment.

## Contracts

```bash
cd contracts
npm install            # bun install also works
cp .env.example .env   # set PRIVATE_KEY, SEED_PHRASE, BASE_SEPOLIA_RPC_URL
npx hardhat compile
```

Use a throwaway testnet key funded with Base Sepolia ETH. Never commit `.env`.

**Deploy and seed your own factory:**

```bash
npx hardhat run scripts/deployAndSeed.ts --network baseSepolia
```

The script deploys `HangmanFactory` with the deployer as `master`, encrypts and seeds 32 words, and prints the address to put in the frontend `HANGMAN_FACTORY_CONTRACT_ADDRESS`.

**Run the tests** (they send real transactions on Base Sepolia):

```bash
npx hardhat test --network baseSepolia
```

## Learn more

- [Inco documentation](https://docs.inco.org)
- [Inco Lightning JS SDK](https://www.npmjs.com/package/@inco/lightning-js)
- [Base documentation](https://docs.base.org) (lists Base Sepolia faucets)
