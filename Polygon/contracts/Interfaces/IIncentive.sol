// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IIncentive {
    function owner() external view returns(address);
    function setIncentiveSpeed(uint256 _mercPerSecond) external;
    function startIncentive() external;
    function stopIncentive() external;    
}