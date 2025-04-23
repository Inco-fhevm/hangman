import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ConfidentialityTokenModule = buildModule("ConfidentialERC20Wrapper", (m) => {
  // Deploy the USDC contract
  const usdc = m.contract("USDC");

  // Pass the deployed USDC contract as an argument (no need for .address)
  const cUSDC = m.contract("ConfidentialERC20Wrapper", [usdc]); 

  return { usdc, cUSDC };
});

export default ConfidentialityTokenModule;
