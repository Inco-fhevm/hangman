// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@inco/lightning/src/Lib.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

contract ConfidentialERC20 is Ownable2Step {

    // Events for Transfer, Approval, Mint, and Decryption
    event Transfer(address indexed from, address indexed to);
    event Approval(address indexed owner, address indexed spender);
    event Mint(address indexed to, uint256 amount);
    event UserBalanceDecrypted(address indexed user, uint256 decryptedAmount);
    event Burn(address indexed from, address indexed to, uint256 amount);

    uint256 public totalSupply;
    string public name;
    string public symbol;
    uint8 public decimals;

    // Mappings for balances and allowances
    mapping(address => euint256) internal balances;
    mapping(address => mapping(address => euint256)) internal allowances;
    mapping(uint256 => address) internal requestIdToUserAddress;
    mapping(uint256 requestId => uint256 amountToBurn) internal burnRqs;

    // Auditor Addresses 
    address[] public auditorAddresses;

    // Constructor to set the token name, symbol, and owner
    constructor(string memory _name, string memory _symbol, uint8 _decimals, address[] memory _auditorAddresses) Ownable(msg.sender) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        auditorAddresses = _auditorAddresses;
    }

    // Mint function to create tokens and add to the owner's balance
    function mint(uint256 mintedAmount, address _userAddress) public virtual onlyOwner {
        balances[owner()] = e.add(
            balances[_userAddress],
            e.asEuint256(mintedAmount)
        );
        e.allow(balances[_userAddress], address(this));
        e.allow(balances[_userAddress], owner());
        _allowAuditorsToReadBalance(balances[_userAddress]);
        totalSupply += mintedAmount;
        emit Mint(_userAddress, mintedAmount);
    }

    // Transfer function for EOAs using encrypted inputs
    function transfer(
        address to,
        bytes calldata encryptedAmount
    ) public virtual returns (bool) {
        transfer(to, e.newEuint256(encryptedAmount, msg.sender));
        return true;
    }

    // Transfer function for contracts
    function transfer(
        address to,
        euint256 amount
    ) public virtual returns (bool) {
        ebool canTransfer = e.ge(balances[msg.sender], amount);
        _transfer(msg.sender, to, amount, canTransfer);
        return true;
    }

    // Retrieves the balance handle of a specified wallet
    function balanceOf(address wallet) public view virtual returns (euint256) {
        return balances[wallet];
    }

    // Approve function for EOAs with encrypted inputs
    function approve(
        address spender,
        bytes calldata encryptedAmount
    ) public virtual returns (bool) {
        approve(spender, e.newEuint256(encryptedAmount, msg.sender));
        return true;
    }

    // Approve function for contracts
    function approve(
        address spender,
        euint256 amount
    ) public virtual returns (bool) {
        _approve(msg.sender, spender, amount);
        emit Approval(msg.sender, spender);
        return true;
    }

    // Internal function to handle allowance approvals
    function _approve(
        address owner,
        address spender,
        euint256 amount
    ) internal virtual {
        allowances[owner][spender] = amount;
        e.allow(amount, address(this));
        e.allow(amount, owner);
        e.allow(amount, spender);
    }

    // Retrieves the allowance handle for a spender
    function allowance(
        address owner,
        address spender
    ) public view virtual returns (euint256) {
        return _allowance(owner, spender);
    }
    
    // Internal function to retrieve an allowance handle
    function _allowance(
        address owner,
        address spender
    ) internal view virtual returns (euint256) {
        return allowances[owner][spender];
    }

    // TransferFrom function for EOAs with encrypted inputs
    function transferFrom(
        address from,
        address to,
        bytes calldata encryptedAmount
    ) public virtual returns (bool) {
        transferFrom(from, to, e.newEuint256(encryptedAmount, msg.sender));
        return true;
    }

    // TransferFrom function for contracts
    function transferFrom(
        address from,
        address to,
        euint256 amount
    ) public virtual returns (bool) {
        ebool isTransferable = _updateAllowance(from, msg.sender, amount);
        _transfer(from, to, amount, isTransferable);
        return true;
    }

    // Internal function to update an allowance securely
    function _updateAllowance(
        address owner,
        address spender,
        euint256 amount
    ) internal virtual returns (ebool) {
        euint256 currentAllowance = _allowance(owner, spender);
        ebool allowedTransfer = e.ge(currentAllowance, amount);
        ebool canTransfer = e.ge(balances[owner], amount);
        ebool isTransferable = e.select(
            canTransfer,
            allowedTransfer,
            e.asEbool(false)
        );
        _approve(
            owner,
            spender,
            e.select(
                isTransferable,
                e.sub(currentAllowance, amount),
                currentAllowance
            )
        );
        return isTransferable;
    }

    // Internal transfer function for encrypted token transfer
    function _transfer(
        address from,
        address to,
        euint256 amount,
        ebool isTransferable
    ) internal virtual {
        euint256 transferValue = e.select(
            isTransferable,
            amount,
            e.asEuint256(0)
        );
        euint256 newBalanceTo = e.add(balances[to], transferValue);
        balances[to] = newBalanceTo;
        e.allow(newBalanceTo, address(this));
        e.allow(newBalanceTo, to);

        euint256 newBalanceFrom = e.sub(balances[from], transferValue);
        balances[from] = newBalanceFrom;
        e.allow(newBalanceFrom, address(this));
        e.allow(newBalanceFrom, from);

        _allowAuditorsToReadBalance(balances[from]);
        _allowAuditorsToReadBalance(balances[to]);

        emit Transfer(from, to);
    }

    // Owner-only function to request decryption of a user's balance
    function requestUserBalanceDecryption(
        address user
    ) public onlyOwner returns (uint256) {
        euint256 encryptedBalance = balances[user];
        e.allow(encryptedBalance, address(this));

        uint256 requestId = e.requestDecryption(
            encryptedBalance,
            this.onDecryptionCallback.selector,
            ""
        );
        requestIdToUserAddress[requestId] = user;
        return requestId;
    }

    // Callback function to handle decrypted balance for a user
    function onDecryptionCallback(
        uint256 requestId,
        bytes32 _decryptedAmount,
        bytes memory data
    ) public returns (bool) {
        address userAddress = requestIdToUserAddress[requestId];
        emit UserBalanceDecrypted(userAddress, uint256(_decryptedAmount));
        return true;
    }

    function requestBurnFor(
        address user,
        uint256 amount
    ) public returns (uint256) {
        euint256 encryptedBalance = balances[user];
        euint256 encryptedAmountToBurn = e.asEuint256(amount);
        ebool isBurnable = e.ge(encryptedBalance, encryptedAmountToBurn);
        ebool isBurnableAndAllowed = e.select(
            isBurnable,
            e.ge(allowances[user][address(this)], encryptedAmountToBurn),
            e.asEbool(false)
        );
        transferFrom(
            user,
            address(0),
            e.select(
                isBurnableAndAllowed,
                encryptedAmountToBurn,
                e.asEuint256(0)
            )
        );

        e.allow(isBurnableAndAllowed, address(this));

        uint256 requestId = e.requestDecryption(
            isBurnableAndAllowed,
            this.onBurnCallback.selector,
            ""
        );
        requestIdToUserAddress[requestId] = user;
        burnRqs[requestId] = amount;
        return requestId;
    }
    function onBurnCallback(
        uint256 requestId,
        bytes32 _decryptedBool,
        bytes memory data
    ) public returns (bool) {
        address userAddress = requestIdToUserAddress[requestId];
        uint256 amount = burnRqs[requestId];
        bool isBurnable = bool(uint256(_decryptedBool) == 1);
        if(isBurnable) {
            _burn(userAddress, amount);
        }
        return true;
    }
    
    // Internal function to handle burning of tokens
    function _burn(
        address user,
        uint256 amount
    ) internal virtual {
        totalSupply -= amount;
        emit Burn(user, address(0), amount);
    }

    // Function to allow auditors to read the balance of a user
    function _allowAuditorsToReadBalance(euint256 _handle) internal {
        for (uint256 i = 0; i < auditorAddresses.length; i++) {
            address auditor = auditorAddresses[i];
            e.allow(_handle, auditor);
        }
    }
}