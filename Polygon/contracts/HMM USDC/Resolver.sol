// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IHmm {
    struct tokenInfos {
        bool isWhitelisted;
        address priceFeed;
        uint24 poolFee;
        uint256 maxSize;
    }
    function getInfos(uint256 _id) external view returns(uint8 sens, address token, uint256 strike, uint256 expiration, uint256 amount, int256 loss, bool executed);
    function hedgeSwap(uint256 _id) external;
    function tokenToInfos(address _token) external view returns(tokenInfos memory);
    function getLatestPrice(address _priceFeedAddr) external view returns (int);
    function coverMargin() external view returns(uint256);
}

/*
 * @title Resolver contract
 * @notice This contract triggers hedgeSwap for the HMM contract through Gelato Networks.
 */
contract Resolver {

    address public immutable HMM;

    constructor() {
        HMM = msg.sender;
    }

    /*
     * @notice checker for Gelato Task
     * @dev "sens" indicate whether to sell or buy
     * @param _id Refers to the relevant HMM option contract
     * @returns canExec Return True to perform a HedgeSwap
     * @returns execPayload Returns the necessary data for the hedgeSwap
     */
    function checker(uint256 _id) external view returns (bool canExec, bytes memory execPayload) {
        
        (uint8 sens, address token, uint256 strike,,,,) = IHmm(HMM).getInfos(_id);

        address priceFeedAddr = IHmm(HMM).tokenToInfos(token).priceFeed;

        uint256 latestPrice = uint(IHmm(HMM).getLatestPrice(priceFeedAddr));

        if (sens == 0) {
            if (latestPrice >= strike) {
                canExec = true;
                execPayload = abi.encodeWithSelector(IHmm.hedgeSwap.selector, uint256(_id));
            } else {
                canExec = false;
                execPayload;
            } 
            
        }

        if (sens == 1) {
            uint256 coverMargin = IHmm(HMM).coverMargin();
            if (latestPrice <= (coverMargin*strike)/10**4) {
                canExec = true;
                execPayload = abi.encodeWithSelector(IHmm.hedgeSwap.selector, uint256(_id));
            } else {
                canExec = false;
                execPayload;
            }
        }

    }
}