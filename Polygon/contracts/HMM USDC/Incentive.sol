// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC20Hmm {
    function depositors() external view returns(uint256);
    function deposits(address _address) external view returns(uint256);
    function depositorID(address _address) external view returns(uint256);
    function idToDepositor(uint256 _id) external view returns(address);
}

interface IhmmIncentive {
    function owner() external view returns(address);
}

/*
 * @title Incentive contract
 * @notice This contract will encourage liquidity providers to deposit funds in the HMM contract
 */
contract Incentive {

    address public immutable HMM;

    uint256 decimals = 10**18;

    address public immutable ERC20HMM;
    address public immutable MercToken;

    uint256 public startTimestamp;
    bool public incentiveActivated;

    uint256 public mercPerSecond;

    constructor(address _erc20HmmAddress, address _mercToken) {

        HMM = msg.sender;
        ERC20HMM = _erc20HmmAddress;
        MercToken = _mercToken;

    }

    mapping(address => uint256) private _rewardsOf;

    modifier onlyDAO() {
        require(msg.sender == IhmmIncentive(HMM).owner(), "Caller is not the DAO");
        _;
    }

    mapping(address => uint256) private _deposits;

    /*
     * @notice Returns MERC deposits from an address
     * @param _payee Refers to the address of the depositor of MERC
     */
    function depositsOf(address _payee) external view returns (uint256) {
        return _deposits[_payee];
    }

    /*
     * @notice Allows to deposit MERC in the smart contract
     * @param _amount Refers to the amount to be deposited
     */
    function depositMERC(uint256 _amount) external {
        IERC20(MercToken).transferFrom(msg.sender, address(this), _amount);
        _deposits[msg.sender] += _amount;
    }

    /*
     * @notice Allows to withdraw MERC from the smart contract
     * @param _amount Refers to the amount to be withdrawn
     */
    function withdrawMERC(uint256 _amount) external {
        require(_deposits[msg.sender] >= _amount, "Amount exceeds deposits");
        IERC20(MercToken).transfer(msg.sender, _amount);
        _deposits[msg.sender] -= _amount;
    }

    /*
     * @notice Returns the balance of MERC held by the smart contract
     */
    function balanceMERC() external view returns(uint256) {
        return IERC20(MercToken).balanceOf(address(this));
    }

    /*
     * @notice Allows to modify the speed of diffusion of the MERC
     * @param _mercPerSecond Refers to the new speed (in MERC per seconds)
     */
    function setIncentiveSpeed(uint256 _mercPerSecond) external onlyDAO {
        dispatchIncentive();
        mercPerSecond = _mercPerSecond;
    }

    /*
     * @notice Allows to start the incentive
     */
    function startIncentive() external onlyDAO {
        incentiveActivated = true;
        startTimestamp = block.timestamp;
    }

    /*
     * @notice Allows to stop the incentive
     */
    function stopIncentive() external onlyDAO {
        dispatchIncentive();
        incentiveActivated = false;
    }

    /*
     * @notice Returns the proportion of liquidity held by an address (1x10**18 for 100%)
     */
    function sharesOf(address _payee) public view returns(uint256) {
        if(IERC20(ERC20HMM).totalSupply() > 0) {
            return (IERC20(ERC20HMM).balanceOf(_payee)*decimals)/IERC20(ERC20HMM).totalSupply();
        } else {
            return 0;
        }
        
    }

    /*
     * @notice makes Rewards "claimable" for LPs
     */
    function dispatchIncentive() public {

        address payee;
        uint256 shares;
        uint256 amountForPayee;

        for(uint256 i = 1 ; i <= IERC20Hmm(ERC20HMM).depositors() ; i++) {
            payee = IERC20Hmm(ERC20HMM).idToDepositor(i);
            shares = sharesOf(payee);
            amountForPayee = (newReleased()*shares)/decimals;
            _rewardsOf[payee] += amountForPayee;
        }

        startTimestamp = block.timestamp;

    }

    /*
     * @notice Returns claimable rewards by an LP
     * @param _address Refers to the address of the beneficiary
     */
    function rewardsOf(address _address) external view returns(uint256) {
        uint256 actualRewards = _rewardsOf[_address];

        uint256 shares = sharesOf(_address);
        uint256 newRewards = (newReleased()*shares)/decimals;

        return actualRewards + newRewards;
    }

    /*
     * @notice Returns rewards that can be made "claimable" to LPs
     */
    function newReleased() public view returns(uint256) {
        if (incentiveActivated == true) {
            uint256 timeElapsed = block.timestamp - startTimestamp;
            uint256 newRealeased = timeElapsed * mercPerSecond;
            return newRealeased;
        } else {
            return 0;
        }
        
    }

    /*
     * @notice Allows an LP to claim their rewards
     */
    function claim() external {
        dispatchIncentive();

        require(_rewardsOf[msg.sender] != 0, "No rewards available");

        uint256 rewards = _rewardsOf[msg.sender];

        IERC20(MercToken).transfer(msg.sender, rewards);

        _rewardsOf[msg.sender] = 0;
    }
    

}