// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/*
 * @title ERC20HMM contract
 * @notice This contract will represent users' base Token deposits in the HMM
 */
contract ERC20HMM is ERC20 {

    address private _hmm;

    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        _hmm = msg.sender;
    }

    uint256 public depositors;
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public depositorID;
    mapping(uint256 => address) public idToDepositor;

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    function hmm() public view virtual returns (address) {
        return _hmm;
    }

    modifier onlyHmm() {
        require(hmm() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override virtual {
        if (depositorID[to] == 0) {
            depositors++;
            depositorID[to] = depositors;
            idToDepositor[depositors] = to;
        }

        if (from == address(0)) {
            deposits[to] += amount;
        } else if (to == address(0)) {
            deposits[from] -= amount;
        } else {
            deposits[from] -= amount;
            deposits[to] += amount;
        }
    
    }

    function mint(address _receiver, uint256 _amount) external onlyHmm {
        super._mint(_receiver, _amount);
    }

    function burn(address _account, uint256 _amount) external onlyHmm {
        super._burn(_account, _amount);
    }

}