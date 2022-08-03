// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IERC20Hmm {
    function depositors() external view returns(uint256);
    function deposits(address _address) external view returns(uint256);
    function depositorID(address _address) external view returns(uint256);
    function idToDepositor(uint256 _id) external view returns(address);
}