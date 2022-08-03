// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface ITreasurer {
    function getAllRewards() external view returns(uint256);
    function restToDispatch() external view returns(uint256);
    function dispatch() external;
    function reimburse(uint256 _id) external returns(int256);
    function receivePremium(uint256 _id, uint256 _amount) external;
    function rewardAvailable(address _user) external view returns(uint256);
    function getRest(uint256 _id) external view returns(uint256);
    function getReceiptInfos(uint256 _id) external view returns(uint256 receivedAmount, uint256 dateReceived, uint256 dateExpiration, uint256 finallyProvided, bool finalized);
    function sharesOf(address _payee) external view returns(uint256);
    function claim() external;    
}