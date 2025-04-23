// import { expect } from "chai";
// import { namedWallets, wallet, publicClient } from "../utils/wallet";
// import {
//     Address,
//     getContract,
//     parseEther,
//     formatEther,
//     getAddress,
//     parseAbiItem,
// } from "viem";
// import contractAbi from "../artifacts/contracts/NativeConfidentialToken.sol/ConfidentialERC20.json";
// import {
//     encryptValue,
//     incoLiteConfig,
//     KMS_CONNECT_ENDPOINT_BASE_SEPOLIA, 
//     reencryptValue,
// } from "../utils/IncoHelper";
// import { HexString } from "@inco/js/dist/binary";

// describe("ConfidentialToken Tests", function () {
//     let confidentialToken: any;
//     let contractAddress: Address;
//     let incoConfig: any;

//     beforeEach(async function () {
//         incoConfig = incoLiteConfig("baseSepolia");

//         const txHash = await wallet.deployContract({
//             abi: contractAbi.abi,
//             bytecode: contractAbi.bytecode as HexString,
//             args: ["Native Confidential Token", "cUSDC", 18, [
//                 namedWallets.alice.account.address,
//                 namedWallets.bob.account.address]],
//         });

//         const receipt = await publicClient.waitForTransactionReceipt({
//             hash: txHash,
//         });
//         contractAddress = receipt.contractAddress as Address;
//         console.log(`✅ Contract deployed at: ${contractAddress}`);

//         confidentialToken = getContract({
//             address: contractAddress as HexString,
//             abi: contractAbi.abi,
//             client: wallet,
//         });

//         for (const [name, userWallet] of Object.entries(namedWallets)) {
//             const balance = await publicClient.getBalance({
//                 address: userWallet.account.address,
//             });
//             const balanceEth = Number(formatEther(balance));

//             if (balanceEth < 0.001) {
//                 const neededEth = 0.001 - balanceEth;
//                 console.log(`💰 Funding ${name} with ${neededEth.toFixed(6)} ETH...`);
//                 const tx = await wallet.sendTransaction({
//                     to: userWallet.account.address,
//                     value: parseEther(neededEth.toFixed(6)),
//                 });

//                 await publicClient.waitForTransactionReceipt({ hash: tx });
//                 console.log(`✅ ${name} funded: ${userWallet.account.address}`);
//             }
//         }
//     });

//     it("Native - It should send 1000 cUSDC from owner to alice", async function () {
//         // Minting 5000 cUSDC
//         console.log("\n------ 💰 Minting 5000 cUSDC for Owner ------");
//         const plainTextAmountToMint = parseEther("5000");

//         const txHashForMint = await wallet.writeContract({
//             address: contractAddress,
//             abi: contractAbi.abi,
//             functionName: "mint",
//             args: [plainTextAmountToMint, wallet.account.address],
//         });
//         await publicClient.waitForTransactionReceipt({ hash: txHashForMint });
//         console.log("✅ Mint successful: 5000 cUSDC added to Owner's balance.");

//         // Fetch Owner's Balance
//         console.log("\n------ 🔍 Fetching Balance Handle for Owner ------");
//         const eBalanceHandleForOwnerAfterMint = (await publicClient.readContract({
//             address: getAddress(contractAddress),
//             abi: contractAbi.abi,
//             functionName: "balanceOf",
//             args: [wallet.account.address],
//         })) as HexString;

//         const decryptedBalanceForOwnerAfterMint = await reencryptValue({
//             chainId: 84532,
//             walletClient: wallet,
//             handle: eBalanceHandleForOwnerAfterMint.toString(),
//             kmsConnectEndpoint: KMS_CONNECT_ENDPOINT_BASE_SEPOLIA,
//         });

//         console.log(
//             `🎯 Decrypted Owner Balance: ${decryptedBalanceForOwnerAfterMint.value} cUSDC`
//         );
//         expect(decryptedBalanceForOwnerAfterMint.value).to.equal(
//             plainTextAmountToMint
//         ); // ✅ Assertion

//         // Encrypt 1000 cUSDC for Transfer
//         const plainTextAmountToBeSent = parseEther("1000");
//         console.log("\n------ 🔄 Encrypting Transfer Amount (1000 cUSDC) ------");
//         const encryptedCipherText = await encryptValue({
//             value: plainTextAmountToBeSent,
//             address: wallet.account.address,
//             config: incoConfig,
//             contractAddress: contractAddress,
//         });
//         console.log("✅ Encryption successful.");

//         // Transfer 1000 cUSDC from Owner to Alice
//         console.log(
//             `\n------ 📤 Transferring 1000 cUSDC from Owner to Alice ------`
//         );
//         const transferFunctionAbi = contractAbi.abi.find(
//             (item) =>
//                 item.name === "transfer" &&
//                 item.inputs.length === 2 &&
//                 item.inputs[1].type === "bytes"
//         );
//         const txHashForTransfer = await wallet.writeContract({
//             address: contractAddress,
//             abi: [transferFunctionAbi],
//             functionName: "transfer",
//             args: [
//                 namedWallets.alice.account.address,
//                 encryptedCipherText.inputCt.ciphertext.value,
//             ],
//         });
//         await publicClient.waitForTransactionReceipt({ hash: txHashForTransfer });
//         console.log("✅ Transfer successful: 1000 cUSDC sent to Alice.");

//         // Fetch Owner's Balance After Transfer
//         console.log("\n------ 🔍 Fetching Updated Balance for Owner ------");
//         const eBalanceHandleForOwnerAfterTransfer =
//             (await publicClient.readContract({
//                 address: getAddress(contractAddress),
//                 abi: contractAbi.abi,
//                 functionName: "balanceOf",
//                 args: [wallet.account.address],
//             })) as HexString;

//         const decryptedBalanceForOwnerAfterTransfer = await reencryptValue({
//             chainId: 84532,
//             walletClient: wallet,
//             handle: eBalanceHandleForOwnerAfterTransfer.toString(),
//             kmsConnectEndpoint: KMS_CONNECT_ENDPOINT_BASE_SEPOLIA,
//         });

//         console.log(
//             `🎯 Decrypted Owner Balance After Transfer: ${decryptedBalanceForOwnerAfterTransfer.value} cUSDC`
//         );
//         expect(decryptedBalanceForOwnerAfterTransfer.value).to.equal(
//             parseEther("4000")
//         ); // ✅ Assertion

//         // Fetch Alice's Balance After Transfer
//         console.log("\n------ 🔍 Fetching Balance Handle for Alice ------");
//         const eBalanceHandleForAliceAfterTransfer =
//             (await publicClient.readContract({
//                 address: getAddress(contractAddress),
//                 abi: contractAbi.abi,
//                 functionName: "balanceOf",
//                 args: [namedWallets.alice.account.address],
//             })) as HexString;

//         const decryptedBalanceForAliceAfterTransfer = await reencryptValue({
//             chainId: 84532,
//             walletClient: namedWallets.alice,
//             handle: eBalanceHandleForAliceAfterTransfer.toString(),
//             kmsConnectEndpoint: KMS_CONNECT_ENDPOINT_BASE_SEPOLIA,
//         });

//         console.log(
//             `🎯 Decrypted Alice Balance: ${decryptedBalanceForAliceAfterTransfer.value} cUSDC`
//         );
//         expect(decryptedBalanceForAliceAfterTransfer.value).to.equal(
//             parseEther("1000")
//         ); // ✅ Assertion
//     });


//     it("Native - It should mint 5000 cUSDC to owner", async function () {
//         const plainTextAmount = parseEther("5000");
//         console.log("Owner Minting 5000 cUSDC");
//         const txHash = await wallet.writeContract({
//             address: contractAddress,
//             abi: contractAbi.abi,
//             functionName: "mint",
//             args: [plainTextAmount, wallet.account.address],
//         });

//         await publicClient.waitForTransactionReceipt({ hash: txHash });
//         console.log(`✅ Owner wallet minted 5000 cUSDC.`);

//         console.log("🔍 Fetching `balance` handle from the contract...");
//         const eBalanceHandle = (await publicClient.readContract({
//             address: getAddress(contractAddress),
//             abi: contractAbi.abi,
//             functionName: "balanceOf",
//             args: [wallet.account.address],
//         })) as HexString;

//         const decryptedBalance = await reencryptValue({
//             chainId: 84532,
//             walletClient: wallet,
//             handle: eBalanceHandle.toString(),
//             kmsConnectEndpoint: KMS_CONNECT_ENDPOINT_BASE_SEPOLIA,
//         });

//         console.log("🎯 Decrypted Balance of Onwer:", decryptedBalance.value);
//         expect(decryptedBalance.value).to.equal(plainTextAmount);
//     });



//     it("Native - It should send 1000 cUSDC from owner to alice and then decrypt Alice's balance", async function () {
//         // Minting 5000 cUSDC
//         console.log("\n------ 💰 Minting 5000 cUSDC for Owner ------");
//         const plainTextAmountToMint = parseEther("5000");

//         const txHashForMint = await wallet.writeContract({
//             address: contractAddress,
//             abi: contractAbi.abi,
//             functionName: "mint",
//             args: [plainTextAmountToMint, wallet.account.address],
//         });
//         await publicClient.waitForTransactionReceipt({ hash: txHashForMint });
//         console.log("✅ Mint successful: 5000 cUSDC added to Owner's balance.");

//         // Fetch Owner's Balance
//         console.log("\n------ 🔍 Fetching Balance Handle for Owner ------");
//         const eBalanceHandleForOwnerAfterMint = (await publicClient.readContract({
//             address: getAddress(contractAddress),
//             abi: contractAbi.abi,
//             functionName: "balanceOf",
//             args: [wallet.account.address],
//         })) as HexString;

//         const decryptedBalanceForOwnerAfterMint = await reencryptValue({
//             chainId: 84532,
//             walletClient: wallet,
//             handle: eBalanceHandleForOwnerAfterMint.toString(),
//             kmsConnectEndpoint: KMS_CONNECT_ENDPOINT_BASE_SEPOLIA,
//         });

//         console.log(
//             `🎯 Decrypted Owner Balance: ${decryptedBalanceForOwnerAfterMint.value} cUSDC`
//         );
//         expect(decryptedBalanceForOwnerAfterMint.value).to.equal(
//             plainTextAmountToMint
//         ); // ✅ Assertion

//         // Encrypt 1000 cUSDC for Transfer
//         const plainTextAmountToBeSent = parseEther("1000");
//         console.log("\n------ 🔄 Encrypting Transfer Amount (1000 cUSDC) ------");
//         const encryptedCipherText = await encryptValue({
//             value: plainTextAmountToBeSent,
//             address: wallet.account.address,
//             config: incoConfig,
//             contractAddress: contractAddress,
//         });
//         console.log("✅ Encryption successful.");

//         // Transfer 1000 cUSDC from Owner to Alice
//         console.log(
//             `\n------ 📤 Transferring 1000 cUSDC from Owner to Alice ------`
//         );
//         const transferFunctionAbi = contractAbi.abi.find(
//             (item) =>
//                 item.name === "transfer" &&
//                 item.inputs.length === 2 &&
//                 item.inputs[1].type === "bytes"
//         );
//         const txHashForTransfer = await wallet.writeContract({
//             address: contractAddress,
//             abi: [transferFunctionAbi],
//             functionName: "transfer",
//             args: [
//                 namedWallets.alice.account.address,
//                 encryptedCipherText.inputCt.ciphertext.value,
//             ],
//         });
//         await publicClient.waitForTransactionReceipt({ hash: txHashForTransfer });
//         console.log("✅ Transfer successful: 1000 cUSDC sent to Alice.");

//         // Fetch Owner's Balance After Transfer
//         console.log("\n------ 🔍 Fetching Updated Balance for Owner ------");
//         const eBalanceHandleForOwnerAfterTransfer =
//             (await publicClient.readContract({
//                 address: getAddress(contractAddress),
//                 abi: contractAbi.abi,
//                 functionName: "balanceOf",
//                 args: [wallet.account.address],
//             })) as HexString;

//         const decryptedBalanceForOwnerAfterTransfer = await reencryptValue({
//             chainId: 84532,
//             walletClient: wallet,
//             handle: eBalanceHandleForOwnerAfterTransfer.toString(),
//             kmsConnectEndpoint: KMS_CONNECT_ENDPOINT_BASE_SEPOLIA,
//         });

//         console.log(
//             `🎯 Decrypted Owner Balance After Transfer: ${decryptedBalanceForOwnerAfterTransfer.value} cUSDC`
//         );
//         expect(decryptedBalanceForOwnerAfterTransfer.value).to.equal(
//             parseEther("4000")
//         ); // ✅ Assertion

//         // Fetch Alice's Balance After Transfer
//         console.log("\n------ 🔍 Fetching Balance Handle for Alice ------");
//         const eBalanceHandleForAliceAfterTransfer =
//             (await publicClient.readContract({
//                 address: getAddress(contractAddress),
//                 abi: contractAbi.abi,
//                 functionName: "balanceOf",
//                 args: [namedWallets.alice.account.address],
//             })) as HexString;

//         const decryptedBalanceForAliceAfterTransfer = await reencryptValue({
//             chainId: 84532,
//             walletClient: namedWallets.alice,
//             handle: eBalanceHandleForAliceAfterTransfer.toString(),
//             kmsConnectEndpoint: KMS_CONNECT_ENDPOINT_BASE_SEPOLIA,
//         });

//         console.log(
//             `🎯 Decrypted Alice Balance: ${decryptedBalanceForAliceAfterTransfer.value} cUSDC`
//         );
//         expect(decryptedBalanceForAliceAfterTransfer.value).to.equal(
//             parseEther("1000")
//         ); // ✅ Assertion

//         console.log(
//             "\n------ 🔑 Requesting Decryption of Alice's Balance ------"
//         );

//         const txHashForDecryption = await wallet.writeContract({
//             address: contractAddress,
//             abi: contractAbi.abi,
//             functionName: "requestUserBalanceDecryption",
//             args: [namedWallets.alice.account.address], // Passing Alice's address for decryption
//         });

//         await publicClient.waitForTransactionReceipt({
//             hash: txHashForDecryption,
//         });
//         console.log(`✅ Decryption request sent for Alice's balance.`);

//         // 🛑 **Wait for `UserBalanceDecrypted` Event**
//         console.log(
//             "\n------ 🛑 Waiting for `UserBalanceDecrypted` Event ------"
//         );

//         const eventPromise = new Promise((resolve, reject) => {
//             const unwatch = publicClient.watchEvent({
//                 address: getAddress(contractAddress),
//                 event: parseAbiItem(
//                     "event UserBalanceDecrypted(address user, uint256 decryptedAmount)"
//                 ),
//                 onLogs: (logs) => {
//                     console.log("📢 Event detected:", logs);

//                     if (logs.length > 0) {
//                         // Extract decrypted balance from `logs[0].data`
//                         const decryptedBalanceHex = logs[0].data;
//                         const decryptedBalance = BigInt(decryptedBalanceHex); // Convert to BigInt
//                         resolve(decryptedBalance);
//                     }
//                 },
//                 onError: (error) => {
//                     console.error("❌ Error watching event:", error.message);
//                     reject(error);
//                 },
//             });

//             setTimeout(() => {
//                 unwatch();
//                 reject(new Error("⏳ Event not detected within timeout"));
//             }, 20000); // Timeout after 20 seconds
//         });

//         // Await the event and assert the balance
//         const decryptedBalanceForAlice = await eventPromise;
//         console.log(
//             `🎯 Decrypted Alice Balance: ${decryptedBalanceForAlice} cUSDC`
//         );

//         expect(decryptedBalanceForAlice).to.equal(parseEther("1000")); // ✅ Assertion
//     });



//     it("Native - It should be able to burn and reduce the supply", async function () {
//         // Minting 5000 cUSDC
//         console.log("\n------ 💰 Minting 5000 cUSDC for Owner ------");
//         const plainTextAmountToMint = parseEther("5000");

//         const txHashForMint = await wallet.writeContract({
//             address: contractAddress,
//             abi: contractAbi.abi,
//             functionName: "mint",
//             args: [plainTextAmountToMint, wallet.account.address],
//         });
//         await publicClient.waitForTransactionReceipt({ hash: txHashForMint });
//         console.log("✅ Mint successful: 5000 cUSDC added to Owner's balance.");

//         const plainTextAmountToBurn = parseEther("1000");

//         const encryptedCipherTextForApprove = await encryptValue({
//             value: plainTextAmountToMint,
//             address: wallet.account.address,
//             config: incoConfig,
//             contractAddress: contractAddress,
//         });

//         const approveFunctionAbi = contractAbi.abi.find(
//             (item) =>
//                 item.name === "approve" &&
//                 item.inputs.length === 2 &&
//                 item.inputs[1].type === "bytes"
//         );

//         console.log(
//             `\n------ 📤 Approving 1000 cUSDC for Burn ------`
//         );
//         const approveTxHash = await wallet.writeContract({
//             address: contractAddress,
//             abi: [approveFunctionAbi],
//             functionName: "approve",
//             args: [
//                 contractAddress,
//                 encryptedCipherTextForApprove.inputCt.ciphertext.value, // Approve 1000 cUSDC for Alice
//             ],
//         });
//         await publicClient.waitForTransactionReceipt({ hash: approveTxHash });

//         console.log("✅ Approve successful: 1000 cUSDC approved for burn.");

//         console.log('Burning 1000 cUSDC for Main wallet');

//         const txHashForDecryption = await wallet.writeContract({
//             address: contractAddress,
//             abi: contractAbi.abi,
//             functionName: "requestBurnFor",
//             args: [wallet.account.address, plainTextAmountToBurn], // Passing Alice's address for decryption
//         });

//         await publicClient.waitForTransactionReceipt({
//             hash: txHashForDecryption,
//         });

//         const totalSupplyForNative = await publicClient.readContract({
//             address: getAddress(contractAddress),
//             abi: contractAbi.abi,
//             functionName: "totalSupply",
//             args: [],
//         });
//         console.log(
//             `🎯 Total Supply Before Burn: ${totalSupplyForNative} cUSDC`
//         );
//         console.log(`✅ Burn request sent for Alice's balance.`);

//         // 🛑 **Wait for `UserBalanceDecrypted` Event**
//         console.log(
//             "\n------ 🛑 Waiting for `Burn` Event ------"
//         );

//         const eventPromise = new Promise((resolve, reject) => {
//             const unwatch = publicClient.watchEvent({
//                 address: getAddress(contractAddress),
//                 event: parseAbiItem(
//                     "event Burn(address indexed from, address indexed to, uint256 amount)"
//                 ),
//                 onLogs: (logs) => {
//                     console.log("📢 Event detected:", logs);

//                     if (logs.length > 0) {
//                         resolve(0);
//                     }
//                 },
//                 onError: (error) => {
//                     console.error("❌ Error watching event:", error.message);
//                     reject(error);
//                 },
//             });

//             setTimeout(() => {
//                 unwatch();
//                 reject(new Error("⏳ Event not detected within timeout"));
//             }, 20000); // Timeout after 20 seconds
//         });

//         // Await the event and assert the balance
//         const decryptedBalanceForAlice = await eventPromise;

//         const totalSupply = await publicClient.readContract({
//             address: getAddress(contractAddress),
//             abi: contractAbi.abi,
//             functionName: "totalSupply",
//             args: [],
//         });
//         console.log(
//             `🎯 Total Supply After Burn: ${totalSupply} cUSDC`
//         );

//     });

//     it("Native - Auditor Bob Should be able to read Alice balance", async function () {
//         // Minting 5000 cUSDC
//         console.log("\n------ 💰 Minting 5000 cUSDC for Owner ------");
//         const plainTextAmountToMint = parseEther("5000");

//         const txHashForMint = await wallet.writeContract({
//             address: contractAddress,
//             abi: contractAbi.abi,
//             functionName: "mint",
//             args: [plainTextAmountToMint, wallet.account.address],
//         });
//         await publicClient.waitForTransactionReceipt({ hash: txHashForMint });
//         console.log("✅ Mint successful: 5000 cUSDC added to Owner's balance.");

//         // Fetch Owner's Balance
//         console.log("\n------ 🔍 Fetching Balance Handle for Owner ------");
//         const eBalanceHandleForOwnerAfterMint = (await publicClient.readContract({
//             address: getAddress(contractAddress),
//             abi: contractAbi.abi,
//             functionName: "balanceOf",
//             args: [wallet.account.address],
//         })) as HexString;

//         const decryptedBalanceForOwnerAfterMint = await reencryptValue({
//             chainId: 84532,
//             walletClient: wallet,
//             handle: eBalanceHandleForOwnerAfterMint.toString(),
//             kmsConnectEndpoint: KMS_CONNECT_ENDPOINT_BASE_SEPOLIA,
//         });

//         console.log(
//             `🎯 Decrypted Owner Balance: ${decryptedBalanceForOwnerAfterMint.value} cUSDC`
//         );
//         expect(decryptedBalanceForOwnerAfterMint.value).to.equal(
//             plainTextAmountToMint
//         ); // ✅ Assertion

//         // Encrypt 1000 cUSDC for Transfer
//         const plainTextAmountToBeSent = parseEther("1000");
//         console.log("\n------ 🔄 Encrypting Transfer Amount (1000 cUSDC) ------");
//         const encryptedCipherText = await encryptValue({
//             value: plainTextAmountToBeSent,
//             address: wallet.account.address,
//             config: incoConfig,
//             contractAddress: contractAddress,
//         });
//         console.log("✅ Encryption successful.");

//         // Transfer 1000 cUSDC from Owner to Alice
//         console.log(
//             `\n------ 📤 Transferring 1000 cUSDC from Owner to Alice ------`
//         );
//         const transferFunctionAbi = contractAbi.abi.find(
//             (item) =>
//                 item.name === "transfer" &&
//                 item.inputs.length === 2 &&
//                 item.inputs[1].type === "bytes"
//         );
//         const txHashForTransfer = await wallet.writeContract({
//             address: contractAddress,
//             abi: [transferFunctionAbi],
//             functionName: "transfer",
//             args: [
//                 namedWallets.alice.account.address,
//                 encryptedCipherText.inputCt.ciphertext.value,
//             ],
//         });
//         await publicClient.waitForTransactionReceipt({ hash: txHashForTransfer });
//         console.log("✅ Transfer successful: 1000 cUSDC sent to Alice.");

//         // Fetch Owner's Balance After Transfer
//         console.log("\n------ 🔍 Fetching Updated Balance for Owner from auditor account ------");
//         const eBalanceHandleForOwnerAfterTransfer =
//             (await publicClient.readContract({
//                 address: getAddress(contractAddress),
//                 abi: contractAbi.abi,
//                 functionName: "balanceOf",
//                 args: [wallet.account.address],
//             })) as HexString;

//         const decryptedBalanceForOwnerAfterTransfer = await reencryptValue({
//             chainId: 84532,
//             walletClient: namedWallets.alice,
//             handle: eBalanceHandleForOwnerAfterTransfer.toString(),
//             kmsConnectEndpoint: KMS_CONNECT_ENDPOINT_BASE_SEPOLIA,
//         });

//         console.log(
//             `🎯 Decrypted Owner Balance After Transfer : ${decryptedBalanceForOwnerAfterTransfer.value} cUSDC`
//         );
//         expect(decryptedBalanceForOwnerAfterTransfer.value).to.equal(
//             parseEther("4000")
//         ); // ✅ Assertion

//         // Fetch Alice's Balance After Transfer
//         console.log("\n------ 🔍 Fetching Balance Handle for Alice ------");
//         const eBalanceHandleForAliceAfterTransfer =
//             (await publicClient.readContract({
//                 address: getAddress(contractAddress),
//                 abi: contractAbi.abi,
//                 functionName: "balanceOf",
//                 args: [namedWallets.alice.account.address],
//             })) as HexString;

//         const decryptedBalanceForAliceAfterTransfer = await reencryptValue({
//             chainId: 84532,
//             walletClient: namedWallets.bob,
//             handle: eBalanceHandleForAliceAfterTransfer.toString(),
//             kmsConnectEndpoint: KMS_CONNECT_ENDPOINT_BASE_SEPOLIA,
//         });

//         console.log(
//             `🎯 Decrypted Alice Balance: ${decryptedBalanceForAliceAfterTransfer.value} cUSDC fetched from Auditor BOB`
//         );
//         expect(decryptedBalanceForAliceAfterTransfer.value).to.equal(
//             parseEther("1000")
//         ); // ✅ Assertion
//     });
// });