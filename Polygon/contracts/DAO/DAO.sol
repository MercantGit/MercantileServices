// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./stkMerc.sol";

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

interface IAffiliate {
    function addAffiliate(address _newAffiliate) external;
    function removeAffiliate(address _Affiliate) external;
    function setAffiliateFees(uint8 _fees) external;
}

interface IHmm {
    function refundETH() external;
    function setFees(uint8 _value) external;
    function transferOwnership(address newOwner) external;
    function addWhitelistedToken(address _token, address _priceFeed, uint24 _poolFee, uint256 _maxSize) external;
    function setUSDC(address _tokenAddress, address _priceFeed, uint24 _poolFee, uint256 _maxSize) external;
    function setCoverMargin(uint256 _coverMargin) external;
    function setMaxSlippage(uint256 _maxSlippage) external;
}

interface IIncentive {
    function setIncentiveSpeed(uint256 _mercPerSecond) external;
    function startIncentive() external;
    function stopIncentive() external;    
}

/*
 * @title Mercantile Services DAO contract
 * @notice This contract manages the governance of the Mercantile Services protocol
 */
contract DAO {

    uint256 decimals = 10**18;

    address constant USDC = 0xeb8f08a975Ab53E34D8a0330E0D34de942C95926; // (6 decimals)
    address public immutable MERC; // (18 decimals)
    address public stkMERC;
    address public pricer;
    address public hmm;
    address public affiliate;
    address public incentive;

    constructor(address _mercToken) {
        powerPercentNeeded = 50;

        MERC = _mercToken;

        STKMERC stkMercContract = new STKMERC("stkMercantile Token", "stkMERC");
        stkMERC = address(stkMercContract);

    }

    receive() external payable {}

    function sendETH(address _recipient, uint256 _amount) external needPower {
        (bool success, ) = _recipient.call{value: _amount}("");
        require(success, "_transfer: ETH transfer failed");
    }

    ////////// TREASURY //////////

    struct infos {
        uint256 reserve;
        uint256 dividends;
    }

    /*
     * @notice Gives several information about the DAO treasury
     */
    infos public daoInfos;

    /*
     * @notice Similar to dividend payout ratio
     */
    uint8 public payoutRatio;

    /*
     * @notice Several information about Merc Token stackers
     */
    mapping(address => uint256) public dividends;
    mapping(address => uint256) public unlockDate;

    uint256 public lockingPeriod;

    /*
     * @notice Allows to modify the payout ratio
     * @param _ratio Refers to the new payout ratio
     * @dev _ratio Must be between 0 and 100
     */
    function setPayoutRatio(uint8 _ratio) external needPower {
        payoutRatio = _ratio;
    }

    /*
     * @notice Allows to modify the locking period
     * @param _seconds Refers to the new wait time in seconds
     */
    function setLockingPeriod(uint256 _seconds) external needPower {
        require(_seconds >= 60, "Protection flash votes");
        lockingPeriod = _seconds;
    }

    /*
     * @notice Getter for the DAO dashboard
     */
    function getUsdcBalance() external view returns(uint256){
        return IERC20(USDC).balanceOf(address(this));
    }

    /*
     * @notice Allows sending USDC from the DAO treasury
     * @param _receiver Refers to the receiver address
     * @param _amount Refers to the amount to send
     */
    function sendUsdc(address _receiver, uint256 _amount) public needPower {
        require(_amount <= daoInfos.reserve, "there are not enough funds in the reserve");
        IERC20(USDC).transfer(_receiver, _amount);

        daoInfos.reserve -= _amount;
    }

    /*
     * @notice Allows sending a Token from the DAO
     * @param _token Refers to the token address
     * @param _receiver Refers to the receiver address
     * @param _amount Refers to the amount to send
     */
    function sendToken(address _token, address _receiver, uint256 _amount) public needPower {
        require(_token != USDC && _token != MERC, "Wrong token address");
        IERC20(_token).transfer(_receiver, _amount);
    }

    /*
     * @notice Allows to deposit Merc Token in the contract
     * @param _amount Refers to the amount to deposit
     */
    function stack(uint256 _amount) external {
        IERC20(MERC).transferFrom(msg.sender, address(this), _amount);
        STKMERC(stkMERC).mint(msg.sender, _amount);
    }

    /*
     * @notice Allows to start the waiting period to withdraw Merc Token
     */
    function startLockingPeriod() external {
        unlockDate[msg.sender] = block.timestamp + lockingPeriod;
    }

    /*
     * @notice Allows to withdraw Merc Token from the contract
     * @param _amount Refers to the amount to withdraw
     */
    function unstack(uint256 _amount) external {
        require(unlockDate[msg.sender] <= block.timestamp && unlockDate[msg.sender] != 0, "You can't unstack now, please see unlockDate." );
        require(_amount <= STKMERC(stkMERC).balanceOf(msg.sender), "You don't have enough stkMERC." );

        IERC20(MERC).transfer(msg.sender, _amount);
        STKMERC(stkMERC).burn(msg.sender, _amount);

        unlockDate[msg.sender] = 0;

    }

    /*
     * @notice Allows to give the proportion of the supply of the stkMerc held by the holder
     * @param _payee Refers to the token holder address
     */
    function sharesOf(address _payee) public view returns(uint256) {
        return (STKMERC(stkMERC).balanceOf(_payee)*decimals)/(STKMERC(stkMERC).totalSupply());
    }

    /*
     * @notice Allows to share the last generated gains among all Merc Token stackers
     */
    function dispatchRewards() external {
        require(STKMERC(stkMERC).totalSupply() > 0, "There is no stakers yet.");
        require(IERC20(USDC).balanceOf(address(this)) > (daoInfos.reserve + daoInfos.dividends), "There is no rewards.");

        uint256 newRewards = IERC20(USDC).balanceOf(address(this)) - (daoInfos.reserve + daoInfos.dividends);

        uint256 rewardsToDividends = (newRewards*payoutRatio)/100;
        uint256 rewardsToReserve = newRewards - rewardsToDividends;

        daoInfos.dividends += rewardsToDividends;
        daoInfos.reserve += rewardsToReserve;

        address payee;
        uint256 shares;
        uint256 amountForPayee;

        for(uint256 i = 1 ; i <= STKMERC(stkMERC).stackers(); i++) {
            payee = STKMERC(stkMERC).idToStacker(i);
            shares = sharesOf(payee);
            amountForPayee = (rewardsToDividends*shares)/decimals;
            dividends[payee] += amountForPayee;
        }
    }

    /*
     * @notice Allows each stacker to collect their earnings
     */
    function claim() external {
        require(dividends[msg.sender] > 0, "No rewards available");

        uint256 rewards = dividends[msg.sender];

        IERC20(USDC).transfer(msg.sender, rewards);

        dividends[msg.sender] = 0;

        daoInfos.dividends -= rewards;
        
    }

    ////////// VOTE //////////

     /*
     * @notice Restricts the use of functions only to holders of enough stkMerc
     */
    modifier needPower() {
        require(getPowerPercent(msg.sender) >= powerPercentNeeded, "You don't have enough power.");
        _;
    }

    mapping(address => bool) public hasDelegated;
    mapping(uint256 => address) public stackerDelegation;

    uint8 public powerPercentNeeded;

    /*
     * @notice Allows to know the voting power held by an address
     * @param _member Refers to the member address
     */    
    function getPowerPercent(address _member) public view returns(uint256) {
        require(hasDelegated[_member] == false, "This address has delagated his power.");

        uint256 actualBalance = IERC20(stkMERC).balanceOf(_member);

        uint256 delegation;

        for (uint256 i = 1 ; i <= STKMERC(stkMERC).stackers() ; i++) {
            if (stackerDelegation[i] == _member) {
                delegation += IERC20(stkMERC).balanceOf(STKMERC(stkMERC).idToStacker(i));
            } 
        }
        
        uint256 totalSupply = IERC20(stkMERC).totalSupply();

        return ((actualBalance + delegation)*10**2)/totalSupply;
    }

    /*
     * @notice Allows to change the voting power needed to perform a function
     * @param _value Refers to the new voting power needed
     * @dev _ratio Must be between 0 and 100
     */
    function setPowerPercentNeeded(uint8 _value) external needPower {
        powerPercentNeeded = _value;
    }

    /*
     * @notice Allows an stkMerc holder to delegate their voting power to another voter
     * @param _beneficiary Refers to the voter receiving voting power
     */
    function setDelegation(address _beneficiary) external {
        require(_beneficiary != msg.sender, "You cannot put your own address.");
        require(stackerDelegation[STKMERC(stkMERC).stackerID(msg.sender)] == 0x0000000000000000000000000000000000000000, "You have already delegated your power or you haven't stacked your tokens yet.");

        hasDelegated[msg.sender] = true;
        stackerDelegation[STKMERC(stkMERC).stackerID(msg.sender)] = _beneficiary;
    }

    /*
     * @notice Allows to revoke your voting delegation
     * @param _beneficiary Refers to the address of the voter who holds the delegated voting power
     */
    function revokeDelegation() external {
        hasDelegated[msg.sender] = false;
        stackerDelegation[STKMERC(stkMERC).stackerID(msg.sender)] = 0x0000000000000000000000000000000000000000;       
    }

    ////////// PRICER //////////
    /*
     * @notice Allows to set the Pricer contract connection
     */
    function setPricer(address _pricerAddr) external needPower {
        pricer = _pricerAddr;
    }

    function setA(uint256 _value) external needPower {
        IPricer(pricer).setA(_value);
    }

    function setB(uint256 _value) external needPower {
        IPricer(pricer).setB(_value);
    }

    function setC(uint256 _value) external needPower {
        IPricer(pricer).setC(_value);
    }

    function setD(uint256 _value) external needPower {
        IPricer(pricer).setD(_value);
    }

    function setF(uint256 _value) external needPower {
        IPricer(pricer).setF(_value);
    }

    function setK(uint256 _value) external needPower {
        IPricer(pricer).setK(_value);
    }

    function setT(uint256 _value) external needPower {
        IPricer(pricer).setT(_value);
    }

    function sett(uint256 _value) external needPower {
        IPricer(pricer).sett(_value);
    }

    function setQ(uint256 _value) external needPower {
        IPricer(pricer).setQ(_value);
    }

    function setU(uint256 _value) external needPower {
        IPricer(pricer).setU(_value);
    }

    function setP(uint256 _value) external needPower {
        IPricer(pricer).setP(_value);
    }

    ////////// HMM //////////
    /*
     * @notice Allows to set the HMM contract connection
     */
    function setHmm(address _hmm) external needPower {
        hmm = _hmm;
    }

    function refundETH() external needPower {
        IHmm(hmm).refundETH();
    }

    function setFees(uint8 _value) external  needPower {
        require ( 0 <= _value && _value < 100, "Fees must be between 0 and 100.");
        IHmm(hmm).setFees(_value);
    }

    function setCoverMargin(uint256 _coverMargin) external needPower {
        require(_coverMargin >= 0 && _coverMargin <= 10000, "Wrong value, must be between 0 and 10000.");
        IHmm(hmm).setCoverMargin(_coverMargin);
    }

    function setMaxSlippage(uint256 _maxSlippage) external needPower {
        require(_maxSlippage >= 0 && _maxSlippage <= 10000, "Wrong value, must be between 0 and 10000.");
        IHmm(hmm).setMaxSlippage(_maxSlippage);
    }

    function transferOwnership(address _newAddr) external needPower {
        IHmm(hmm).transferOwnership(_newAddr);
    }

    function addWhitelistedToken(address _token, address _priceFeed, uint24 _poolFee, uint256 _maxSize) external needPower {
        IHmm(hmm).addWhitelistedToken(_token, _priceFeed, _poolFee, _maxSize);
    }

    function setUSDC(address _tokenAddress, address _priceFeed, uint24 _poolFee, uint256 _maxSize) external needPower {
        IHmm(hmm).setUSDC(_tokenAddress, _priceFeed, _poolFee, _maxSize);
    }


    ////////// AFFILIATE //////////
    /*
     * @notice Allows to set the Affiliate contract connection
     */
    function setAffiliate(address _affiliate) external needPower {
        affiliate = _affiliate;
    }

    function addAffiliate(address _affiliate) external needPower {
        IAffiliate(affiliate).addAffiliate(_affiliate);
    }

    function removeAffiliate(address _affiliate) external needPower {
        IAffiliate(affiliate).removeAffiliate(_affiliate);
    }

    function setAffiliateFees(uint8 _fees) external needPower {
        IAffiliate(affiliate).setAffiliateFees(_fees);
    }

    ////////// INCENTIVE //////////
    /*
     * @notice Allows to set the Incentive contract connection
     */
    function setIncentive(address _incentive) external needPower {
        incentive = _incentive;
    }

    function setIncentiveSpeed(uint256 _mercPerSecond) external needPower {
        IIncentive(incentive).setIncentiveSpeed(_mercPerSecond);
    }

    function startIncentive() external needPower {
        IIncentive(incentive).startIncentive();
    }

    function stopIncentive() external needPower {
        IIncentive(incentive).stopIncentive();
    }

}