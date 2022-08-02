// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IHMm {
    function owner() external view returns(address);
}

/*
 * @title Affiliate contract
 * @notice This contract allows to manage addresses whitelisted or not for affiliation within Mercantile Services
 */
contract Affiliate {

    address public immutable HMM;
    
    uint8 public affiliateFees;

    mapping(address => bool) public isAffiliated;

    constructor() {
        HMM = msg.sender;
    }

    modifier onlyDAO() {
        require(msg.sender == IHMm(HMM).owner(), "Caller is not the DAO");
        _;
    }

    /*
     * @notice Allows to add a new affiliate
     * @param _newAffiliate Refers to the new affiliate address
     */
    function addAffiliate(address _newAffiliate) external onlyDAO {
        isAffiliated[_newAffiliate] = true;
    }

    /*
     * @notice Allows to remove an affiliate
     * @param _Affiliate Refers to the affiliate address
     */
    function removeAffiliate(address _Affiliate) external onlyDAO {
        isAffiliated[_Affiliate] = false;
    }

    /*
     * @notice Allows to change affiliate fees
     * @param _fees Must be between 1 and 100
     */    
    function setAffiliateFees(uint8 _fees) external onlyDAO {
        affiliateFees = _fees;
    }   

}