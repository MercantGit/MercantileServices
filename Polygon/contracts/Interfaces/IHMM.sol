// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IHmm {
    struct tokenInfos {
        address tokenAddress;
        address priceFeed;
        uint24 poolFee;
        uint256 maxSize;
    }
    function owner() external view returns(address);
    function refundETH() external;
    function setFees(uint8 _value) external;
    function transferOwnership(address newOwner) external;
    function addWhitelistedToken(address _token, address _priceFeed, uint24 _poolFee, uint256 _maxSize) external;
    function setUSDC(address _tokenAddress, address _priceFeed, uint24 _poolFee, uint256 _maxSize) external;
    function setCoverMargin(uint256 _coverMargin) external;
    function setMaxSlippage(uint256 _maxSlippage) external;
    function count() external view returns(uint256);
    function getInfos(uint256 _id) external view returns(uint8 sens, address token, uint256 strike, uint256 expiration, uint256 amount, int256 loss, bool executed);
    function getHmmInfos() external view returns(uint256 OI, uint256 value, int256 temporaryLoss, int256 loss);
    function reimburseHmmLoss(int256 _loss) external;
    function USDC() external view returns(tokenInfos memory);
    function getLatestPrice(address _priceFeedAddr) external view returns (int);
    function coverMargin() external view returns(uint256);
    function deposit(uint256 _amount) external;
    function withdraw(uint256 _amount) external;
    function availableToWithdraw() external view returns(int256);
    function changeStrike(uint256 _id, uint256 _newStrike) external;
    function getPremium(address _token, uint256 _strike, uint256 _expiration, uint256 _amount) external view returns(uint256);
    function pay(address _affiliate, address _token, uint256 _strike, uint256 _expiration, uint256 _amount) external;
    function execVoucher(uint256 _id, uint8 _method) external;
    function execExpiry() external;
    function tokenToInfos(address _addr) external returns(tokenInfos memory);
}