// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IPricer {
    function setA(uint256 _value) external;
    function setB(uint256 _value) external;
    function setC(uint256 _value) external;
    function setD(uint256 _value) external;
    function setF(uint256 _value) external;
    function setK(uint256 _value) external;
    function setT(uint256 _value) external;
    function sett(uint256 _value) external;
    function setQ(uint256 _value) external;
    function setU(uint256 _value) external;
    function setP(uint256 _value) external;
}