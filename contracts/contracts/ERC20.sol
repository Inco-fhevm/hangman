// SPDX-License-Identifier: BSD-3-Clause-Clear
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract USDC is ERC20, Ownable {
    constructor() ERC20("USDC", "USDC") Ownable(msg.sender) {
        _mint(msg.sender, 1000);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function mint(address userAddress, uint256 amount) public {
        _mint(userAddress, amount);
    }
}
