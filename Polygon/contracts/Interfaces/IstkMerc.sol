// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IstkMerc {
    function stackers() external view returns(uint256);
    function stacked(address _address) external view returns(uint256);
    function stackerID(address _address) external view returns(uint256);
    function idToStacker(uint256 _id) external view returns(address);
}