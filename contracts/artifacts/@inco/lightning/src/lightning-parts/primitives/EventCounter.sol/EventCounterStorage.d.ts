// This file was autogenerated by hardhat-viem, do not edit it.
// prettier-ignore
// tslint:disable
// eslint-disable

import type { Address } from "viem";
import type { GetContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import "@nomicfoundation/hardhat-viem/types";

export interface EventCounterStorage$Type {
  "_format": "hh-sol-artifact-1",
  "contractName": "EventCounterStorage",
  "sourceName": "@inco/lightning/src/lightning-parts/primitives/EventCounter.sol",
  "abi": [],
  "bytecode": "0x6080604052348015600e575f5ffd5b50603e80601a5f395ff3fe60806040525f5ffdfea2646970667358221220acb2809d12eb7b9e776617d916d2d8005b13656e7d5ad1d01d6480a753676a8764736f6c634300081c0033",
  "deployedBytecode": "0x60806040525f5ffdfea2646970667358221220acb2809d12eb7b9e776617d916d2d8005b13656e7d5ad1d01d6480a753676a8764736f6c634300081c0033",
  "linkReferences": {},
  "deployedLinkReferences": {}
}

declare module "@nomicfoundation/hardhat-viem/types" {
  export function deployContract(
    contractName: "EventCounterStorage",
    constructorArgs?: [],
    config?: DeployContractConfig
  ): Promise<GetContractReturnType<EventCounterStorage$Type["abi"]>>;
  export function deployContract(
    contractName: "@inco/lightning/src/lightning-parts/primitives/EventCounter.sol:EventCounterStorage",
    constructorArgs?: [],
    config?: DeployContractConfig
  ): Promise<GetContractReturnType<EventCounterStorage$Type["abi"]>>;

  export function sendDeploymentTransaction(
    contractName: "EventCounterStorage",
    constructorArgs?: [],
    config?: SendDeploymentTransactionConfig
  ): Promise<{
    contract: GetContractReturnType<EventCounterStorage$Type["abi"]>;
    deploymentTransaction: GetTransactionReturnType;
  }>;
  export function sendDeploymentTransaction(
    contractName: "@inco/lightning/src/lightning-parts/primitives/EventCounter.sol:EventCounterStorage",
    constructorArgs?: [],
    config?: SendDeploymentTransactionConfig
  ): Promise<{
    contract: GetContractReturnType<EventCounterStorage$Type["abi"]>;
    deploymentTransaction: GetTransactionReturnType;
  }>;

  export function getContractAt(
    contractName: "EventCounterStorage",
    address: Address,
    config?: GetContractAtConfig
  ): Promise<GetContractReturnType<EventCounterStorage$Type["abi"]>>;
  export function getContractAt(
    contractName: "@inco/lightning/src/lightning-parts/primitives/EventCounter.sol:EventCounterStorage",
    address: Address,
    config?: GetContractAtConfig
  ): Promise<GetContractReturnType<EventCounterStorage$Type["abi"]>>;
}
