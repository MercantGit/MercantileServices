// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/*
 * @title MERC Token contract
 * @notice Represents Mercantile Services protocol governance shares
 */
contract MERC is ERC20 {

    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        _mint(msg.sender, 1000000000000000000000000000);
    }

}