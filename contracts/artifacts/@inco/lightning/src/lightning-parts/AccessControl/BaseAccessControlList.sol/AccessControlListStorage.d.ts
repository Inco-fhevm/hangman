// This file was autogenerated by hardhat-viem, do not edit it.
// prettier-ignore
// tslint:disable
// eslint-disable

import type { Address } from "viem";
import type { GetContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import "@nomicfoundation/hardhat-viem/types";

export interface AccessControlListStorage$Type {
  "_format": "hh-sol-artifact-1",
  "contractName": "AccessControlListStorage",
  "sourceName": "@inco/lightning/src/lightning-parts/AccessControl/BaseAccessControlList.sol",
  "abi": [],
  "bytecode": "0x6080604052348015600e575f5ffd5b50603e80601a5f395ff3fe60806040525f5ffdfea26469706673582212206acbfe565706d5a89f94cb9d4ed1f8c39d64603ca89fc35e80711a81f7d3f30264736f6c634300081c0033",
  "deployedBytecode": "0x60806040525f5ffdfea26469706673582212206acbfe565706d5a89f94cb9d4ed1f8c39d64603ca89fc35e80711a81f7d3f30264736f6c634300081c0033",
  "linkReferences": {},
  "deployedLinkReferences": {}
}

declare module "@nomicfoundation/hardhat-viem/types" {
  export function deployContract(
    contractName: "AccessControlListStorage",
    constructorArgs?: [],
    config?: DeployContractConfig
  ): Promise<GetContractReturnType<AccessControlListStorage$Type["abi"]>>;
  export function deployContract(
    contractName: "@inco/lightning/src/lightning-parts/AccessControl/BaseAccessControlList.sol:AccessControlListStorage",
    constructorArgs?: [],
    config?: DeployContractConfig
  ): Promise<GetContractReturnType<AccessControlListStorage$Type["abi"]>>;

  export function sendDeploymentTransaction(
    contractName: "AccessControlListStorage",
    constructorArgs?: [],
    config?: SendDeploymentTransactionConfig
  ): Promise<{
    contract: GetContractReturnType<AccessControlListStorage$Type["abi"]>;
    deploymentTransaction: GetTransactionReturnType;
  }>;
  export function sendDeploymentTransaction(
    contractName: "@inco/lightning/src/lightning-parts/AccessControl/BaseAccessControlList.sol:AccessControlListStorage",
    constructorArgs?: [],
    config?: SendDeploymentTransactionConfig
  ): Promise<{
    contract: GetContractReturnType<AccessControlListStorage$Type["abi"]>;
    deploymentTransaction: GetTransactionReturnType;
  }>;

  export function getContractAt(
    contractName: "AccessControlListStorage",
    address: Address,
    config?: GetContractAtConfig
  ): Promise<GetContractReturnType<AccessControlListStorage$Type["abi"]>>;
  export function getContractAt(
    contractName: "@inco/lightning/src/lightning-parts/AccessControl/BaseAccessControlList.sol:AccessControlListStorage",
    address: Address,
    config?: GetContractAtConfig
  ): Promise<GetContractReturnType<AccessControlListStorage$Type["abi"]>>;
}
