// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/*
 * @title Staked MERC Token contract
 * @notice Represents 1:1 the amount of MERC token blocked on the DAO smart contract
 */
contract STKMERC is ERC20 {

    address private _dao;

    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        _dao = msg.sender;
    }

    uint256 public stackers;
    mapping(address => uint256) public stacked;
    mapping(address => uint256) public stackerID;
    mapping(uint256 => address) public idToStacker;

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    function dao() public view virtual returns (address) {
        return _dao;
    }

    modifier onlyDao() {
        require(dao() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override virtual {
        if (stackerID[to] == 0) {
            stackers++;
            stackerID[to] = stackers;
            idToStacker[stackers] = to;
        }

        if (from == address(0)) {
            stacked[to] += amount;
        } else if (to == address(0)) {
            stacked[from] -= amount;
        } else {
            stacked[from] -= amount;
            stacked[to] += amount;
        }
        
    }

    function mint(address _receiver, uint256 _amount) external onlyDao {
        super._mint(_receiver, _amount);
    }

    function burn(address _account, uint256 _amount) external onlyDao {
        super._burn(_account, _amount);
    }

}