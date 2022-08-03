// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IAffiliate {
    function addAffiliate(address _newAffiliate) external;
    function removeAffiliate(address _Affiliate) external;
    function setAffiliateFees(uint8 _fees) external;
}