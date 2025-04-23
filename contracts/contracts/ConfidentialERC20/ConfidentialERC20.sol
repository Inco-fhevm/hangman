// SPDX-License-Identifier: BSD-3-Clause-Clear
// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/ERC20.sol)

pragma solidity ^0.8.24;

import { IConfidentialERC20 } from "./Interfaces/IConfidentialERC20.sol";
import { IERC20Metadata } from "./Utils/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20Errors } from "./Utils/IERC6093.sol";
import "@inco/lightning/src/Lib.sol";

/**
 * @dev Implementation of the {IERC20} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.openzeppelin.com/t/how-to-implement-erc20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * The default value of {decimals} is 6. To change this, you should override
 * this function so it returns a different value.
 *
 * We have followed general OpenZeppelin Contracts guidelines: functions revert
 * instead returning `false` on failure. This behavior is nonetheless
 * conventional and does not conflict with the expectations of ERC-20
 * applications.
 */
abstract contract ConfidentialERC20 is Ownable, IConfidentialERC20, IERC20Metadata, IERC20Errors {
    mapping(address account => euint256) public _balances;

    mapping(address account => mapping(address spender => euint256)) internal _allowances;

    uint256 public _totalSupply;
    address[] public auditorAddresses;

    string private _name;
    string private _symbol;

    /**
     * @dev Sets the values for {name} and {symbol}.
     *
     * All two of these values are immutable: they can only be set once during
     * construction.
     */
    constructor(string memory name_, string memory symbol_, address[] memory _auditorAddresses) Ownable(msg.sender) {
        _name = name_;
        _symbol = symbol_;
        auditorAddresses = _auditorAddresses;
    }
    struct BurnRq {
        address account;
        uint256 amount;
    }
    mapping(uint256 => BurnRq) public burnRqs;
    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the default value returned by this function, unless
     * it's overridden.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual returns (uint8) {
        return 18;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account) public view virtual returns (euint256) {
        return _balances[account];
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `value`.
     */
    function transfer(address to, euint256 value) public virtual returns (bool) {
        require(inco.persistAllowed(euint256.unwrap(value),msg.sender));
        address owner = _msgSender();
        ebool isTransferable = e.ge( _balances[msg.sender], value);
        _transfer(owner, to, value, isTransferable);
        return true;
    }

    function transfer(address to, bytes calldata encryptedAmount) public virtual returns (bool) {
        transfer(to, e.newEuint256(encryptedAmount,msg.sender));
        return true;
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    function allowance(address owner, address spender) public view virtual returns (euint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * NOTE: If `value` is the maximum `uint256`, the allowance is not updated on
     * `transferFrom`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, euint256 value) public virtual returns (bool) {
        require(inco.persistAllowed(euint256.unwrap(value),msg.sender));
        address owner = _msgSender();
        _approve(owner, spender, value);
        return true;
    }
    function approve(address spender, bytes calldata encryptedAmount) public virtual returns (bool) {
        approve(spender, e.newEuint256(encryptedAmount, msg.sender));
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint64`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `value`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `value`.
     */
    function transferFrom(address from, address to, euint256 value) public virtual returns (bool) {
        require(inco.persistAllowed(euint256.unwrap(value),msg.sender));
        address spender = _msgSender();
        ebool isTransferable = _decreaseAllowance(from, spender, value);
        _transfer(from, to, value, isTransferable);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        bytes calldata encryptedAmount
    ) public virtual returns (bool) {
        transferFrom(from, to, e.newEuint256(encryptedAmount,msg.sender));
        return true;
    }

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _transfer(address from, address to, euint256 value, ebool isTransferable) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        euint256 transferValue = e.select(isTransferable, value, e.asEuint256(0));
        euint256 newBalanceTo = e.add(_balances[to], transferValue);
        _balances[to] = newBalanceTo;
        e.allow(newBalanceTo, address(this));
        e.allow(newBalanceTo, to);
        euint256 newBalanceFrom = e.sub(_balances[from], transferValue);
        _balances[from] = newBalanceFrom;
        e.allow(newBalanceFrom, address(this));
        e.allow(newBalanceFrom, from);
        _allowAuditorsToReadBalance(_balances[from]);
        _allowAuditorsToReadBalance(_balances[to]);
    }

    /**
     * @dev Transfers a `value` amount of tokens from `from` to `to`, or alternatively mints (or burns) if `from`
     * (or `to`) is the zero address. All customizations to transfers, mints, and burns should be done by overriding
     * this function.
     *
     * Emits a {Transfer} event.
     */

    /**
     * @dev Creates a `value` amount of tokens and assigns them to `account`, by transferring it from address(0).
     * Relies on the `_update` mechanism
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _balances[account] = e.add(_balances[account], e.asEuint256(value));
        e.allow(_balances[account], address(this));
        e.allow(_balances[account], account);
        _allowAuditorsToReadBalance(_balances[account]);
        _totalSupply += value;
    }

    /**
     * @dev Destroys a `value` amount of tokens from `account`, lowering the total supply.
     * Relies on the `_update` mechanism.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead
     */
    function _requestBurn(address account, uint256 amount) internal virtual {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        ebool enoughBalance = e.ge(_balances[account], e.asEuint256(amount));
        e.allow(enoughBalance, address(this));

        uint256 requestID =  e.requestDecryption(
            enoughBalance,
            this._burnCallback.selector,
            ""
        );

        burnRqs[requestID] = BurnRq(account, amount);
    }

    function _burnCallback(uint256 requestID, 
        bytes32 decryptedBoolInput, 
        bytes memory data) public virtual  {
        data;
        bool decryptedInput = uint256(decryptedBoolInput) != 0;
        BurnRq memory burnRequest = burnRqs[requestID];
        address account = burnRequest.account;
        uint256 amount = burnRequest.amount;
        if (!decryptedInput) {
            revert("Decryption failed");
        }
        _totalSupply = _totalSupply - amount;
        _balances[account] = e.sub(_balances[account], e.asEuint256(amount));
        e.allow(_balances[account], address(this));
        e.allow(_balances[account], account);
        _allowAuditorsToReadBalance(_balances[account]);
        delete burnRqs[requestID];
    }

    /**
     * @dev Sets `value` as the allowance of `spender` over the `owner` s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     *
     * Overrides to this logic should be done to the variant with an additional `bool emitEvent` argument.
     */
    function _approve(address owner, address spender, euint256 value) internal {
        _approve(owner, spender, value, true);
    }

    /**
     * @dev Variant of {_approve} with an optional flag to enable or disable the {Approval} event.
     *
     * By default (when calling {_approve}) the flag is set to true. On the other hand, approval changes made by
     * `_spendAllowance` during the `transferFrom` operation set the flag to false. This saves gas by not emitting any
     * `Approval` event during `transferFrom` operations.
     *
     * Anyone who wishes to continue emitting `Approval` events on the`transferFrom` operation can force the flag to
     * true using the following override:
     *
     * ```solidity
     * function _approve(address owner, address spender, euint64 value, bool) internal virtual override {
     *     super._approve(owner, spender, value, true);
     * }
     * ```
     *
     * Requirements are the same as {_approve}.
     */
    function _approve(address owner, address spender, euint256 value, bool emitEvent) internal virtual {
        if (owner == address(0)) {
            revert ERC20InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        _allowances[owner][spender] = value;
        if (emitEvent) {
            emit Approval(owner, spender, value);
        }
        e.allow(value, address(this));
        e.allow(value, owner);
        e.allow(value, spender);
        _allowAuditorsToReadBalance(value);
    }

    /**
     * @dev Reduces `owner` s allowance for `spender` based on spent `value`.
     *
     *
     * Does not emit an {Approval} event.
     */
    function _decreaseAllowance(address owner, address spender, euint256 amount) internal virtual returns (ebool) {
        euint256 currentAllowance = _allowances[owner][spender];

        ebool allowedTransfer = e.ge(currentAllowance, amount);

        ebool canTransfer = e.ge(_balances[owner], amount);
        ebool isTransferable = e.asEbool(false);
        isTransferable = e.select(canTransfer, allowedTransfer,isTransferable);
        _approve(owner, spender, e.select(isTransferable, e.sub(currentAllowance, amount), currentAllowance));
        return isTransferable;
    }
    /**
     * @dev Increases `owner` s allowance for `spender` based on spent `value`.
     *
     *
     * Does not emit an {Approval} event.
     */
    function _increaseAllowance(address spender, euint256 addedValue) internal virtual returns (ebool) {
        require(inco.persistAllowed(euint256.unwrap(addedValue),msg.sender));
        address owner = _msgSender();
        ebool isTransferable = e.ge(_balances[owner], addedValue);
        euint256 newAllowance = e.add(_allowances[owner][spender], addedValue);
        e.allow(newAllowance, address(this));
        e.allow(newAllowance, owner);
        _approve(owner, spender, newAllowance);
        return isTransferable;
    }

    function increaseAllowance(address spender, euint256 addedValue) public virtual returns (ebool) {
        return _increaseAllowance(spender, addedValue);
    }

    function increaseAllowance(
        address spender,
        bytes calldata encryptedAmount
    ) public virtual returns (ebool) {
        return increaseAllowance(spender, e.newEuint256(encryptedAmount,msg.sender));
    }

    function decreaseAllowance(address spender, euint256 subtractedValue) public virtual returns (ebool) {
        require(inco.persistAllowed(euint256.unwrap(subtractedValue),msg.sender));
        return _decreaseAllowance(_msgSender(), spender, subtractedValue);
    }

    function decreaseAllowance(
        address spender,
        bytes calldata encryptedAmount
    ) public virtual returns (ebool) {
        return decreaseAllowance(spender, e.newEuint256(encryptedAmount,msg.sender));
    }

    function _allowAuditorsToReadBalance(euint256 _handle) internal {
        for (uint256 i = 0; i < auditorAddresses.length; i++) {
            address auditor = auditorAddresses[i];
            e.allow(_handle, auditor);
        }
    }
}
