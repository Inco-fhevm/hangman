// import { expect } from "chai";
// import { namedWallets, wallet, publicClient } from "../utils/wallet";
// import {
//   Address,
//   getContract,
//   parseEther,
//   formatEther,
//   getAddress,
//   parseAbiItem,
// } from "viem";
// import cUSDC_ABI from "../artifacts/contracts/ConfidentialERC20Wrapper.sol/ConfidentialERC20Wrapper.json";
// import USDC_ABI from "../artifacts/contracts/ERC20.sol/USDC.json";
// import {
//   encryptValue,
//   incoLiteConfig,
//   KMS_CONNECT_ENDPOINT_BASE_SEPOLIA,
//   reencryptValue,
// } from "../utils/IncoHelper";
// import { HexString } from "@inco/js/dist/binary";
// import { parse } from "path";

// describe("ConfidentialToken Tests", function () {
//   let USDC: any;
//   let cUSDC: any;
//   let contractAddressForUSDC: Address;
//   let contractAddressForCUSDC: Address;
//   let incoConfig: any;

//   beforeEach(async function () {
//     incoConfig = incoLiteConfig("baseSepolia");
//     // console.log("🔍 Fetching `incoLiteConfig` incoLiteAddress ..." , incoConfig);
//     const txHashForUSDC = await wallet.deployContract({
//       abi: USDC_ABI.abi,
//       bytecode: USDC_ABI.bytecode as HexString,
//       args: [],
//     });

//     const receiptForUSDC = await publicClient.waitForTransactionReceipt({
//       hash: txHashForUSDC,
//     });
//     contractAddressForUSDC = receiptForUSDC.contractAddress as Address;
//     console.log(`✅ USDC Contract deployed at: ${contractAddressForUSDC}`);


//     USDC = getContract({
//       address: contractAddressForUSDC as HexString,
//       abi: USDC_ABI.abi,
//       client: wallet,
//     });

//     // write deployment of cUSDC contract
//     const txHashForCUSDC = await wallet.deployContract({
//       abi: cUSDC_ABI.abi,
//       bytecode: cUSDC_ABI.bytecode as HexString,
//       args: [contractAddressForUSDC, [namedWallets.alice.account.address,namedWallets.bob.account.address],"Confidential USDC", "cUSDC"],
//     });

//     const receiptForCUSDC = await publicClient.waitForTransactionReceipt({
//       hash: txHashForCUSDC,
//     });
//     contractAddressForCUSDC = receiptForCUSDC.contractAddress as Address;
//     console.log(`✅ cUSDC Contract deployed at: ${contractAddressForCUSDC}`);

//     cUSDC = getContract({
//       address: contractAddressForCUSDC as HexString,
//       abi: cUSDC_ABI.abi,
//       client: wallet,
//     });

//     // for (const [name, userWallet] of Object.entries(namedWallets)) {
//     //   const balance = await publicClient.getBalance({
//     //     address: userWallet.account.address,
//     //   });
//     //   const balanceEth = Number(formatEther(balance));

//     //   if (balanceEth < 0.001) {
//     //     const neededEth = 0.001 - balanceEth;
//     //     console.log(`💰 Funding ${name} with ${neededEth.toFixed(6)} ETH...`);
//     //     const tx = await wallet.sendTransaction({
//     //       to: userWallet.account.address,
//     //       value: parseEther(neededEth.toFixed(6)),
//     //     });

//     //     await publicClient.waitForTransactionReceipt({ hash: tx });
//     //     console.log(`✅ ${name} funded: ${userWallet.account.address}`);
//     //   }
//     // }
//   });

//   it("Owner should be able to mint the USDC and wrap it into cUSDC", async function () {
//     const value = parseEther("1000");
//     const txHashForMintingUSDC = await wallet.writeContract({
//       abi: USDC_ABI.abi,
//       address: contractAddressForUSDC,
//       functionName: "mint",
//       args: [wallet.account.address, value],
//     });

//     await publicClient.waitForTransactionReceipt({ hash: txHashForMintingUSDC });
//     console.log(`✅ USDC minted: ${formatEther(value)} USDC`);

//     const txHashForApprovingUSDC = await wallet.writeContract({
//       abi: USDC_ABI.abi,
//       address: contractAddressForUSDC,
//       functionName: "approve",
//       args: [contractAddressForCUSDC, value],
//     });

//     await publicClient.waitForTransactionReceipt({ hash: txHashForApprovingUSDC });

//     const txHashForWrapUSDC = await wallet.writeContract({
//       abi: cUSDC_ABI.abi,
//       address: contractAddressForCUSDC,
//       functionName: "wrap",
//       args: [value],
//     });

//     await publicClient.waitForTransactionReceipt({ hash: txHashForWrapUSDC });
//     console.log(`✅ USDC wrapped: ${formatEther(value)} cUSDC`);


//     console.log("🔍 Fetching `balance` handle from the contract...");
//     const balanceHandleForOwnerAfterWrapping = (await publicClient.readContract({
//       address: getAddress(contractAddressForCUSDC),
//       abi: cUSDC_ABI.abi,
//       functionName: "balanceOf",
//       args: [wallet.account.address],
//     })) as HexString;

//     const ownerBalanceAfterWrapping = await reencryptValue({
//       chainId: 84532,
//       walletClient: wallet,
//       handle: balanceHandleForOwnerAfterWrapping.toString(),
//       kmsConnectEndpoint: KMS_CONNECT_ENDPOINT_BASE_SEPOLIA
//     });

//     console.log("🎯 Decrypted Balance:", ownerBalanceAfterWrapping.value);
//     expect(ownerBalanceAfterWrapping.value).to.equal(value);
//   });

//   it("Owner should be able to mint the USDC and wrap it into cUSDC and then send it to alice", async function () {
//     const value = parseEther("1000");
//     const txHashForMintingUSDC = await wallet.writeContract({
//       abi: USDC_ABI.abi,
//       address: contractAddressForUSDC,
//       functionName: "mint",
//       args: [wallet.account.address, value],
//     });

//     await publicClient.waitForTransactionReceipt({ hash: txHashForMintingUSDC });
//     console.log(`✅ USDC minted: ${formatEther(value)} USDC`);

//     const txHashForApprovingUSDC = await wallet.writeContract({
//       abi: USDC_ABI.abi,
//       address: contractAddressForUSDC,
//       functionName: "approve",
//       args: [contractAddressForCUSDC, value],
//     });

//     await publicClient.waitForTransactionReceipt({ hash: txHashForApprovingUSDC });

//     const txHashForWrapUSDC = await wallet.writeContract({
//       abi: cUSDC_ABI.abi,
//       address: contractAddressForCUSDC,
//       functionName: "wrap",
//       args: [value],
//     });

//     await publicClient.waitForTransactionReceipt({ hash: txHashForWrapUSDC });
//     console.log(`✅ USDC wrapped: ${formatEther(value)} cUSDC`);


//     console.log("🔍 Fetching `balance` handle from the contract...");
//     const balanceHandleForOwnerAfterWrapping = (await publicClient.readContract({
//       address: getAddress(contractAddressForCUSDC),
//       abi: cUSDC_ABI.abi,
//       functionName: "balanceOf",
//       args: [wallet.account.address],
//     })) as HexString;

//     const ownerBalanceAfterWrapping = await reencryptValue({
//       chainId: 84532,
//       walletClient: wallet,
//       handle: balanceHandleForOwnerAfterWrapping.toString(),
//       kmsConnectEndpoint: KMS_CONNECT_ENDPOINT_BASE_SEPOLIA,
//     });

//     console.log("🎯 Decrypted Balance:", ownerBalanceAfterWrapping.value);
//     expect(ownerBalanceAfterWrapping.value).to.equal(value);

//     const plainTextAmountForUSDC = parseEther("500");

//     const cipherTextForTransferCUSDC = await encryptValue({
//       value: plainTextAmountForUSDC,
//       address: wallet.account.address,
//       config: incoConfig,
//       contractAddress: getAddress(contractAddressForCUSDC)
//     });

//     const transferFunctionAbi = cUSDC_ABI.abi.find(
//       (item) =>
//         item.name === "transfer" &&
//         item.inputs.length === 2 &&
//         item.inputs[1].type === "bytes"
//     );

//     const txHashForTransferCUSDC = await wallet.writeContract({
//       abi: [transferFunctionAbi],
//       address: contractAddressForCUSDC,
//       functionName: "transfer",
//       args: [namedWallets.alice.account.address, cipherTextForTransferCUSDC.inputCt.ciphertext.value],
//     });

//     await publicClient.waitForTransactionReceipt({ hash: txHashForTransferCUSDC });
//     console.log(`✅ cUSDC transferred: ${formatEther(plainTextAmountForUSDC)} cUSDC to alice`);

//     // Check the balance of alice
//     console.log("🔍 Fetching `balance` handle from the contract...");
//     const balanceHandleForAliceAfterTransfer = (await publicClient.readContract({
//       address: getAddress(contractAddressForCUSDC),
//       abi: cUSDC_ABI.abi,
//       functionName: "balanceOf",
//       args: [namedWallets.alice.account.address],
//     })) as HexString;

//     const aliceBalanceAfterTransfer = await reencryptValue({
//       chainId: 84532,
//       walletClient: namedWallets.alice,
//       handle: balanceHandleForAliceAfterTransfer.toString(),
//       kmsConnectEndpoint: KMS_CONNECT_ENDPOINT_BASE_SEPOLIA,
//     });

//     console.log("🎯 Decrypted Balance:", aliceBalanceAfterTransfer.value)
//     expect(aliceBalanceAfterTransfer.value).to.equal(plainTextAmountForUSDC);
    
//   });
// });
