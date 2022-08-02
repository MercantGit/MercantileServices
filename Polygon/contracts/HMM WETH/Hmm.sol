// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Resolver.sol";
import "./Erc20Hmm.sol";
import "./Pricer.sol";
import "./Voucher.sol";
import "./OpsReady.sol";
import "./Treasurer.sol";
import "./Affiliate.sol";
import "./Incentive.sol";

interface ISwapRouter {
    struct ExactInputSingleParams { address tokenIn; address tokenOut; uint24 fee; address recipient; uint256 amountIn; uint256 amountOutMinimum; uint160 sqrtPriceLimitX96;}
    struct ExactOutputSingleParams {address tokenIn; address tokenOut; uint24 fee; address recipient; uint256 amountOut; uint256 amountInMaximum; uint160 sqrtPriceLimitX96;}
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
    function exactOutputSingle(ExactOutputSingleParams calldata params) external payable returns (uint256 amountIn);
}

/*
 * @title HMM contract
 * @notice This contract represent the Market Maker that allows users to obtain options, and sellers to hedge.
 */
contract HMM is OpsReady {

    ////////// VARIABLES //////////

    address private constant WETH = 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619; // (18 decimals)
    address immutable private resolver;
    address immutable private erc20HMM;
    address immutable private pricer;
    address immutable private voucher;
    address immutable private hmmTreasurer;
    address immutable private affiliate;
    address immutable private incentive;
    uint8 private fees;
    address private constant ROUTER_ADDRESS = 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45;
    ISwapRouter private immutable swapRouter;
    uint256 public coverMargin;
    uint256 private maxSlippage;

    ////////// CONSTRUCTOR //////////
    constructor(address _mercToken) {

        Resolver resolverContract = new Resolver();
        resolver = address(resolverContract);

        ERC20HMM erc20HmmContract = new ERC20HMM("msEthereum", "msETH");
        erc20HMM = address(erc20HmmContract);

        Pricer pricerContract = new Pricer();
        pricer = address(pricerContract);

        Voucher voucherContract = new Voucher("msETH Voucher", "msVCH" );
        voucher = address(voucherContract);

        Treasurer treasurerContract = new Treasurer(address(erc20HmmContract), address(voucherContract));
        hmmTreasurer = address(treasurerContract);

        Affiliate affiliateContract = new Affiliate();
        affiliate = address(affiliateContract);

        Incentive incentiveContract = new Incentive(address(erc20HmmContract), _mercToken);
        incentive = address(incentiveContract);

        swapRouter = ISwapRouter(ROUTER_ADDRESS);        

        IERC20(WETH).approve(ROUTER_ADDRESS, 2**250);

        _owner = msg.sender;
  
    }

    receive() external payable {}

    function refundETH() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "");
    }

    ///////// OWNABLE //////////
    address private _owner;

    /**
     * @notice Returns the address of the current owner.
     */
    function owner() public view virtual returns(address) {
        return _owner;
    }

    /**
     * @notice Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owner() == msg.sender, "");
        _;
    }

    /**
     * @notice Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) external virtual onlyOwner {
        _owner = newOwner;
    }

    ////////// ADDRESS //////////

    /**
     * @notice Returns the address of the Resolver contract.
     */    
    function resolverAddr() external view returns(address) {
        return resolver;
    }

    /**
     * @notice Returns the address of the Treasurer contract.
     */
    function treasurerAddr() external view returns(address) {
        return hmmTreasurer;
    }

    /**
     * @notice Returns the address of the Affiliate contract.
     */
    function affiliateAddr() external view returns(address) {
        return affiliate;
    }

    /**
     * @notice Returns the address of the Pricer contract.
     */
    function pricerAddr() external view returns(address) {
        return pricer;
    }

    /**
     * @notice Returns the address of the Incentive contract.
     */
    function incentiveAddr() external view returns(address) {
        return incentive;
    }

    ////////// HMM DEPOSIT & WITHDRAW //////////
    
    /*
     * @notice Deposits liquidity in base Token in the HMM
     * @param _amount Refers to the amount to deposit
     */
    function deposit(uint256 _amount) external {

        Treasurer(hmmTreasurer).dispatch();
        Incentive(incentive).dispatchIncentive();

        HmmInfos.value += _amount;

        IERC20(WETH).transferFrom(msg.sender, address(this), _amount);
        ERC20HMM(erc20HMM).mint(msg.sender, _amount);        
    }

    /*
     * @notice Withdraws liquidity in base Token from the HMM
     * @param _amount Refers to the amount to withdraw
     * @dev _amount Must not be greater than the quantity available in the pool
     */
    function withdraw(uint256 _amount) external {
        require(availableToWithdraw() >= int(_amount), "");

        Treasurer(hmmTreasurer).dispatch();
        Incentive(incentive).dispatchIncentive();

        HmmInfos.value -= _amount;
        
        IERC20(WETH).transfer(msg.sender, _amount);
        ERC20HMM(erc20HMM).burn(msg.sender, _amount);
    }

    /*
     * @notice Refers to the quantity available in the pool
     */
    function availableToWithdraw() public view returns(int256) {
        return int(HmmInfos.value - ((HmmInfos.OI * 1010)/1000)) - HmmInfos.temporaryLoss - HmmInfos.loss;
    }

    ////////// HMM INFOS //////////

    struct hmmInfos {
        uint256 OI;
        uint256 value;
        int256 temporaryLoss;
        int256 loss;
    }

    hmmInfos HmmInfos;

    function reimburseHmmLoss(int256 _loss) external {
        require(msg.sender == hmmTreasurer, "");
        HmmInfos.loss -= _loss;
    }

    /*
     * @notice Provides several information on the state of the protocol (base Token decimal)
     */
    function getHmmInfos() external view returns(uint256 OI, uint256 value, int256 temporaryLoss, int256 loss) {
        return (HmmInfos.OI, HmmInfos.value, HmmInfos.temporaryLoss, HmmInfos.loss);
    }

    ////////// OPTIONS INFOS //////////
    uint256 public count;

    struct infos {
        uint8 sens;
        address token;
        uint256 strike;
        uint256 expiration;
        uint256 amount;
        int256 loss;
        bytes32 gelatoId;
        bool executed;
    }

    mapping(uint256 => infos) IdToInfos;

    /*
     * @notice Percentage of liquidity available in the HMM (10*4 basis)
     */
    function getO() private view returns(uint) {
        return ((HmmInfos.value - HmmInfos.OI)*10000)/HmmInfos.value;
    }

    function setInfos(address _token, uint _strike, uint256 _expiration, uint256 _amount) private returns(uint256) {
        infos memory newInfos = infos(0, _token, _strike, _expiration, _amount, 0, 0x00, false);

        uint256 newId = count;
        IdToInfos[newId] = newInfos;

        count++;

        return newId;
    }

    /*
     * @notice Returns several information about the option
     * @dev "sens" indicate whether to sell or buy
     * @param _id Refers to the relevant HMM option contract     
     */
    function getInfos(uint256 _id) public view returns(uint8 sens, address token, uint256 strike, uint256 expiration, uint256 amount, int256 loss, bool executed) {
        return (IdToInfos[_id].sens, IdToInfos[_id].token, IdToInfos[_id].strike, IdToInfos[_id].expiration, IdToInfos[_id].amount, IdToInfos[_id].loss, IdToInfos[_id].executed);
    }

    function changeSensInfos(uint256 _id) private {
        IdToInfos[_id].sens == 0 ? IdToInfos[_id].sens = 1 : IdToInfos[_id].sens = 0;
    }

    /*
     * @notice Allows to modify the Strike Price of a contract
     * @param _id Refers to the relevant HMM option contract
     * @param _newStrike Refers to the new Strike Price     
     */
    function changeStrike(uint256 _id, uint256 _newStrike) external {

        uint256 loss;
        IdToInfos[_id].loss >= 0 ? loss = uint256(IdToInfos[_id].loss) : loss = 0;

        require(Voucher(voucher).ownerOf(_id) == msg.sender && Treasurer(hmmTreasurer).getRest(_id) >= ((getPremium(IdToInfos[_id].token, _newStrike, IdToInfos[_id].expiration, IdToInfos[_id].amount)*(100 - fees))/10**4) + loss && IdToInfos[_id].sens == 0, ""); //10**4 refers to * 10**6(usdc decimal) / 10**8(getPremium decimal) * 10**2(fees decimal)
        
        HmmInfos.OI -= wethSize(IdToInfos[_id].token, IdToInfos[_id].strike, IdToInfos[_id].amount);
        IdToInfos[_id].strike = _newStrike;
        HmmInfos.OI += wethSize(IdToInfos[_id].token, _newStrike, IdToInfos[_id].amount);

    }

    function wethSize(address _token, uint256 _strike, uint256 _amount) private view returns(uint256) {
        return (_strike*_amount*10**18)/(10**(ERC20(_token).decimals()+18));
    }

    ////////// BUYERS SPACE //////////

    /*
     * @notice Returns Chainlink price feed  
     */
    function getLatestPrice(address _priceFeedAddr) public view returns (int) {
        (, int price,,,) = AggregatorV3Interface(_priceFeedAddr).latestRoundData();
        return 10**26/price; //To get a USD/WETH in 18 decimal;
    }

    /*
     * @notice Returns the premium that must be paid for an option
     * @param _token Refers to the address of the desired asset
     * @param _strike Refers to the desired strike price
     * @param _expiration Refers to the desired Unix expiration date (seconds)
     * @param _amount Refers to the desired amount
     * @dev _strike & _amount Must be given with the decimal associated with the desired asset
     * @returns Premium Price (asset decimal)
     */
    function getPremium(address _token, uint256 _strike, uint256 _expiration, uint256 _amount) public view returns(uint256) {

        // Premium
        uint256 duration = _expiration - block.timestamp;

        uint256 latestPrice = uint256(getLatestPrice(USDC.priceFeed));
        uint256 v = ((_strike - latestPrice)*10**4)/latestPrice;

        uint256 PriceAPR = Pricer(pricer).getPrice(duration, v, getO());
        uint256 PriceOneYear = (PriceAPR*_strike)/10**4;
        uint256 PriceDuration = ((PriceOneYear*duration)/31536000);
        uint256 price = (PriceDuration*_amount)/10**ERC20(_token).decimals();

        return price;          
    }

    /*
     * @notice Allows the buyer to buy an option, indicating the strike, the expiration date and the amount
     * @param _affiliate Refers to the address of the affiliate (by default address of the Treasurer contract)
     * @param _token Refers to the address of the desired asset
     * @param _strike Refers to the desired strike price
     * @param _expiration Refers to the desired Unix expiration date (seconds)
     * @param _amount Refers to the desired amount
     * @dev This function will also create the task within Gelato Network for the new option, and send an NFT representing the option to the buyer
     */
    function pay(address _affiliate, address _token, uint256 _strike, uint256 _expiration, uint256 _amount) external {
        require(int(wethSize(_token, _strike, _amount)) <= availableToWithdraw() && wethSize(_token, _strike, _amount) <= USDC.maxSize && wethSize(_token, _strike, _amount) >= 1000000000000000, "");

        uint256 premium = getPremium(_token, _strike, _expiration, _amount);
        uint256 premiumToETH = (premium*10**ERC20(WETH).decimals())/10**18;       

        HmmInfos.OI += wethSize(_token, _strike, _amount);
        
        //Set Infos
        uint256 newId = setInfos(_token, _strike, _expiration, _amount);

        //Send to Treasurer & DAO
        uint256 amountToDAO = (premiumToETH*fees)/100;
        uint256 amountToTreasurer = premiumToETH - amountToDAO;

        if(_affiliate != hmmTreasurer) {
            require(Affiliate(affiliate).isAffiliated(_affiliate), "");
            uint256 amountToAffiliate = (amountToDAO*Affiliate(affiliate).affiliateFees())/100;

            IERC20(WETH).transferFrom(msg.sender, _affiliate, amountToAffiliate);
            sendToDAO(msg.sender, amountToDAO-amountToAffiliate);
            sendToTreasurer(newId, amountToTreasurer);

        } else {
            sendToDAO(msg.sender, amountToDAO);
            sendToTreasurer(newId, amountToTreasurer);
        }

        //CreateTask
        createTask(newId);              

        //CreateVoucher
        createVoucher(msg.sender, newId);
    }

    function sendToTreasurer(uint256 _id, uint256 _amount) private {
        IERC20(WETH).transferFrom(msg.sender, hmmTreasurer, _amount);
        Treasurer(hmmTreasurer).receivePremium(_id, _amount);
    }

    function sendToDAO(address _from, uint256 _premium) private {
        IERC20(WETH).transferFrom(_from, owner(), _premium); 
    }

    /*
     * @notice Allows you to modify the percentage of fees for the DAO when buying an option
     * @param _newFees Refers to the new fee percentage   
     * @dev _newFees Must be between 0 and 100
     */
    function setFees(uint8 _value) external onlyOwner {
        fees = _value;
    }

    function createTask(uint256 _id) private {
        bytes4 execSelector = HMM.hedgeSwap.selector;
        bytes memory resolverData = abi.encodeWithSelector(Resolver.checker.selector, uint256(_id));

        bytes32 taskId = IOps(ops).createTaskNoPrepayment(
            address(this),
            execSelector,
            resolver,
            resolverData,
            ETH
        );
        IdToInfos[_id].gelatoId = taskId;
    }

    function cancelTask(bytes32 _id) private {
        IOps(ops).cancelTask(_id);
    }

    function createVoucher(address _to, uint256 _id) private {
        Voucher(voucher).mint(_to, _id);
    }

    function burnVoucher(uint256 _id) private {
        Voucher(voucher).burn(_id);
    }

    /*
     * @notice Allows the holder of an option contract to execute it
     * @param _id Refers to the id of the option contract to be executed
     * @param _method "0" the option buyer sends the necessary amount and receives the asset due
     * @param _method "1" the option buyer receives the profits of his position directly
     * @dev This function will also create the task within Gelato Network for the new option, and send an NFT representing the option to the buyer
     */
    function execVoucher(uint256 _id, uint8 _method) external {
        require(Voucher(voucher).ownerOf(_id) == msg.sender && (_method == 0 || _method == 1), "");

        (uint8 sens, address token, uint256 strike,, uint256 amount, int256 loss,) = getInfos(_id);

        if (sens == 1) {
            earnVoucher(msg.sender, _id, token, strike, amount, _method);
        } else {
            require(uint256(getLatestPrice(USDC.priceFeed)) <= strike, "");
            int256 resteToReimburse = Treasurer(hmmTreasurer).reimburse(_id);
            if (resteToReimburse > 0) {
                HmmInfos.loss += resteToReimburse;
            } else {
                IERC20(WETH).transfer(msg.sender, uint256(-resteToReimburse));
            }
        }

        burnVoucher(_id);

        cancelTask(IdToInfos[_id].gelatoId);

        HmmInfos.OI -= wethSize(token, strike, amount);
        HmmInfos.temporaryLoss -= loss;

        IdToInfos[_id].executed = true;
    }

    function earnVoucher(address _buyer, uint256 _id, address _token, uint256 _strike, uint256 _amount, uint8 _method) private {

        if (_method == 0) {
            //receive USDC and send BTC
            int256 resteToReimburse = Treasurer(hmmTreasurer).reimburse(_id);
            if (int256(wethSize(_token, _strike, _amount)) + resteToReimburse >= 0) {
                IERC20(WETH).transferFrom(_buyer, address(this), uint256(int256(wethSize(_token, _strike, _amount)) + resteToReimburse));
                IERC20(_token).transfer(_buyer, _amount);
            } else {
                IERC20(_token).transfer(_buyer, _amount);
                HmmInfos.loss += (int256(wethSize(_token, _strike, _amount)) + resteToReimburse);
            }
            
        }

        if (_method == 1) {
            //send benefits from selling BTC
            uint256 amountOutMin = (((_amount*uint(getLatestPrice(USDC.priceFeed))*(10000-maxSlippage))/10000)*10**ERC20(WETH).decimals())/10**(ERC20(_token).decimals()+18);

            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
                tokenIn: _token,
                tokenOut: WETH,
                fee: USDC.poolFee,
                recipient: address(this),
                amountIn: _amount,
                amountOutMinimum: amountOutMin,
                sqrtPriceLimitX96: 0
            });

            uint256 amountOut = swapRouter.exactInputSingle(params);

            uint256 benefits = amountOut - wethSize(_token, _strike, _amount); //return error if overflow
            
            int256 resteToReimburse = Treasurer(hmmTreasurer).reimburse(_id);

            require(int256(benefits) >= resteToReimburse, "");

            IERC20(WETH).transfer(_buyer, uint256(int256(benefits) - resteToReimburse)); //return error if overflow

        }

    }


    ////////// HEDGE SPACE //////////

    /*
     * @notice This function allows to modify the difference in value between the strike price and the return swap price
     * @param _coverMargin Must be between 0 and 10000
     * @dev Set 9900 for 1% margin  
     */
    function setCoverMargin(uint256 _coverMargin) external onlyOwner {
        coverMargin = _coverMargin;
    }

    /*
     * @notice This function allows you to modify the tolerated slippage for hedgeSwaps
     * @param _maxSlippage Must be between 0 and 10000
     * @dev Set 100 for 1% slippage 
     */
    function setMaxSlippage(uint256 _maxSlippage) external onlyOwner {
        maxSlippage = _maxSlippage;
    }

    /*
     * @notice This function will be called when a swap is needed to hedge a position
     * @param _id The Option ID       
     */
    function hedgeSwap(uint256 _id) external onlyOps {
        (uint8 sens, address token, uint256 strike,, uint256 amount,,bool executed) = getInfos(_id);
        require(!executed, "");

        int loss;

        if (sens == 0) {
            //Buy amount BTC

            uint256 amountInMax = (((amount*uint(getLatestPrice(USDC.priceFeed))*(10000+maxSlippage))/10000)*10**ERC20(WETH).decimals())/10**(ERC20(token).decimals()+18);

            ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter.ExactOutputSingleParams({
                tokenIn: WETH,
                tokenOut: token,
                fee: USDC.poolFee,
                recipient: address(this),
                amountOut: amount,
                amountInMaximum: amountInMax,
                sqrtPriceLimitX96: 0
            });

            uint256 amountIn = swapRouter.exactOutputSingle(params);

            loss = int(amountIn) - int(wethSize(token, strike, amount));

            IdToInfos[_id].loss += loss;
            HmmInfos.temporaryLoss += loss;          

        }

        if (sens == 1) {
            //Sell amount BTC
            
            uint256 amountOutMin = (((amount*uint(getLatestPrice(USDC.priceFeed))*(10000-maxSlippage))/10000)*10**ERC20(WETH).decimals())/10**(ERC20(token).decimals()+18);

            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
                tokenIn: token,
                tokenOut: WETH,
                fee: USDC.poolFee,
                recipient: address(this),
                amountIn: amount,
                amountOutMinimum: amountOutMin,
                sqrtPriceLimitX96: 0
            });

            uint256 amountOut = swapRouter.exactInputSingle(params);

            loss = int(wethSize(token, strike, amount)) - int(amountOut);

            IdToInfos[_id].loss += loss;
            HmmInfos.temporaryLoss += loss;

        }

        changeSensInfos(_id);

        // Pay Gelato Network
        uint256 fee;
        address feeToken;

        (fee, feeToken) = IOps(ops).getFeeDetails();

        _transfer(fee, ETH);

    }

    ////////// EXPIRY //////////

    /*
     * @notice This function will execute all expired options
     */
    function execExpiry() external {

        for(uint256 i = 0 ; i < count ; i++) {
            if (IdToInfos[i].expiration < block.timestamp && IdToInfos[i].executed == false) {
                execExpiredVoucher(i);
            }
        }
    }

    function execExpiredVoucher(uint256 _id) private {
        (uint8 sens, address token, uint256 strike,, uint256 amount, int256 loss,) = getInfos(_id);

        if (sens == 1) {
            // If the buyer is beneficial then execVoucher method 1      
            // If the buyer is in profit but his loss exceeds, then similar to execVoucher method 1 but we keep the USDC recovered by selling the WBTC and we add the remaining loss to the loss hmm

            int256 realAmountUsed = int(wethSize(token, strike, amount)) + loss;

            uint256 amountOutMin = (((amount*uint(getLatestPrice(USDC.priceFeed))*(10000-maxSlippage))/10000)*10**ERC20(WETH).decimals())/10**(ERC20(token).decimals()+18);

            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
                tokenIn: token,
                tokenOut: WETH,
                fee: USDC.poolFee,
                recipient: address(this),
                amountIn: amount,
                amountOutMinimum: amountOutMin,
                sqrtPriceLimitX96: 0
            });

            uint256 amountOut = swapRouter.exactInputSingle(params);

            int256 benefits = int(amountOut) - realAmountUsed;
            
            if (benefits >= 0) {
                IERC20(WETH).transfer(Voucher(voucher).ownerOf(_id), uint(benefits));
            } else {
                HmmInfos.loss -= benefits;
            }            

        }

        if (sens == 0) {
            HmmInfos.loss += loss;
        }

        burnVoucher(_id);

        cancelTask(IdToInfos[_id].gelatoId);

        HmmInfos.OI -= wethSize(token, strike, amount);
        HmmInfos.temporaryLoss -= loss;

        IdToInfos[_id].executed = true;

    }

    ////////// USDC TOKEN //////////
    struct tokenInfos {
        address tokenAddress;
        address priceFeed;
        uint24 poolFee;
        uint256 maxSize;
    }

    tokenInfos public USDC;

    function setUSDC(address _tokenAddress, address _priceFeed, uint24 _poolFee, uint256 _maxSize) external onlyOwner {
        IERC20(_tokenAddress).approve(ROUTER_ADDRESS, 2**250);
        USDC.tokenAddress = _tokenAddress;
        USDC.priceFeed = _priceFeed;
        USDC.poolFee = _poolFee;
        USDC.maxSize = _maxSize;
    }

}
