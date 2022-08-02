import React, {useState, useEffect} from 'react';
import { ethers } from 'ethers';
import WalletConnectProvider from "@walletconnect/web3-provider";
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import HMM_abi from './contracts/HMM_abi.json';
import putHMM_abi from './contracts/putHMM_abi.json';
import Treasurer_abi from './contracts/Treasurer_abi.json';
import Voucher_abi from './contracts/Voucher_abi.json';
import fakeOracle_abi from './contracts/fakeOracle_abi.json';
import ERC20_abi from './contracts/ERC20_abi.json';
import Incentive_abi from './contracts/Incentive_abi.json';
import './App.css';
import Logo from './images/Logo.png';
import ethLogo from './images/Ethereum.png';
import btcLogo from './images/Bitcoin.png';
import polygonLogo from './images/Polygon.png';
import metamask from './images/MetaMask.png';
import walletconnect from './images/walletconnect.png';
import usdcLogo from './images/usdc-logo.svg';
import questionLogo from './images/question-line.png';
import changeLogo from './images/changeLogo.svg';


/* global BigInt */

Chart.register(...registerables);


function App() {

  useEffect(()=>{
    setActivePage(1);
  } , [] );

  let hmmUSDCAddress = '0x3E64Be77DA56CF9549b38f2b2baBb36Ee537b62c';
  let hmmWETHAddress = '0xB1Ed0f01Cce7507C885da033DE80c1987A5348ff';
  let treasurerUSDCAddress = '0x113Cdcfeac2BadE423e7a9cF8F69067B2BF60440';
  let treasurerWETHAddress = '0x25509B799c6D3EC219bBde60a5346f21b85a016E';
  let voucherUSDCAddress = '0x0ED00cd6fD3B8FC1Eade437676BdDDE4b56d38A7';
  let voucherWETHAddress = '0x27e18C318Bd5f31536B280A6264ED75d25cf88f5';
  let incentiveUSDCAddress = '0xe8cFf6F7f7B3943c562f517C04E7441A5a11c251';
  let incentiveWETHAddress = '0x06b713Bd8C5f8df13F6F3dca5A81BE1d3390Cf6B';
  let ERC20HmmUSDCAddress = '0x1DB35c04635CAE44Ed348d8853fA0a2492AD3B9c';
  let ERC20HmmWETHAddress = '0x011dF81077Ada10C904e44BA88Ce6271778579b8';
  let btcOracleAddress = '0xc907E116054Ad103354f2D350FD2514433D57F6f';
  let ethOracleAddress = '0xF9680D99D6C9589e2a93a78A04A279e509205945';
  let usdcContractAddress = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
  let wethContractAddress = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619';

  ////////// BASE VARIABLES //////////

  const [activePage, setActivePage] = useState(null);
	const [errorMessage, setErrorMessage] = useState(<div id="errorMessage">Please connect your Metamask Wallet</div>);
	const [defaultAccount, setDefaultAccount] = useState(null);
	const [connButtonText, setConnButtonText] = useState('Connect Wallet');
  const [chainName, setChainName] = useState('Polygon');

	const [provider, setProvider] = useState(null);
	const [signer, setSigner] = useState(null);
	const [usdcHmm, setUSDCHmm] = useState(null);
  const [wethHmm, setWETHHmm] = useState(null);
  const [usdcTreasurer, setUSDCTreasurer] = useState(null);
  const [wethTreasurer, setWETHTreasurer] = useState(null);
  const [usdcVoucher, setUSDCVoucher] = useState(null);
  const [wethVoucher, setWETHVoucher] = useState(null);
  const [usdcIncentive, setUSDCIncentive] = useState(null);
  const [wethIncentive, setWETHIncentive] = useState(null);
  const [usdcErc20Hmm, setUSDCErc20Hmm] = useState(null);
  const [wethErc20Hmm, setWETHErc20Hmm] = useState(null);
  const [btcOracle, setBtcOracle] = useState(null);
  const [ethOracle, setEthOracle] = useState(null);
  const [usdcContract, setUsdcContract] = useState(null);
  const [wethContract, setWethContract] = useState(null);

  ////////// METAMASK //////////

	const connectMetamask = () => {
		if (window.ethereum && window.ethereum.isMetaMask) {

			window.ethereum.request({ method: 'eth_requestAccounts'})
			.then(result => {
				accountChangedHandler(result[0], window.ethereum);
			})
			.catch(error => {
				setErrorMessage(<div id="errorMessage">{error.message}</div>);
			});

		} else {
			console.log('Need to install MetaMask');
			setErrorMessage(<div id="errorMessage">Please install MetaMask browser extension to interact</div>);
		}
	}

  const connectWalletConnect = async () => {
		const wcProvider = new WalletConnectProvider({
      rpc: {
        137: "https://polygon-rpc.com",
        // ...
      },
    });

    await wcProvider.enable();

    accountChangedHandler(wcProvider.accounts[0], wcProvider);
  
	}

	// update account, will cause component re-render
	const accountChangedHandler = (newAccount, walletType) => {
		setDefaultAccount(newAccount);
    setConnButtonText(newAccount);

    if (walletType.chainId != "0x89") {
      setErrorMessage(<div id="errorMessage">Please connect to the Polygon Blockchain</div>);
    } else {
      setErrorMessage(null);
    }
		updateEthers(walletType)
	}

	const chainChangedHandler = () => {
		// reload the page to avoid any errors with chain change mid use of application
		window.location.reload();
	}

	// listen for account changes

  if (typeof window.ethereum != "undefined") {
    window.ethereum.on('accountsChanged', (result) => accountChangedHandler(result[0], window.ethereum));
	  window.ethereum.on('chainChanged', chainChangedHandler);
  }
  
  if (provider != null) {
    provider.on("accountsChanged", (result) => accountChangedHandler(result[0], provider));
    provider.on("chainChanged", chainChangedHandler);
  } 

	const updateEthers = (walletType) => {

    let tempProvider = new ethers.providers.Web3Provider(walletType);
		setProvider(tempProvider);

		let tempSigner = tempProvider.getSigner();
		setSigner(tempSigner);

		let tempHmm = new ethers.Contract(hmmUSDCAddress, HMM_abi, tempSigner);
		setUSDCHmm(tempHmm);

    let tempWETHHmm = new ethers.Contract(hmmWETHAddress, putHMM_abi, tempSigner);
		setWETHHmm(tempWETHHmm);
    
    let tempTreasurer = new ethers.Contract(treasurerUSDCAddress, Treasurer_abi, tempSigner);
		setUSDCTreasurer(tempTreasurer);

    let tempWETHTreasurer = new ethers.Contract(treasurerWETHAddress, Treasurer_abi, tempSigner);
		setWETHTreasurer(tempWETHTreasurer);

    let tempVoucher = new ethers.Contract(voucherUSDCAddress, Voucher_abi, tempSigner);
		setUSDCVoucher(tempVoucher);

    let tempWETHVoucher = new ethers.Contract(voucherWETHAddress, Voucher_abi, tempSigner);
		setWETHVoucher(tempWETHVoucher);

    let tempIncentive = new ethers.Contract(incentiveUSDCAddress, Incentive_abi, tempSigner);
		setUSDCIncentive(tempIncentive);

    let tempWETHIncentive = new ethers.Contract(incentiveWETHAddress, Incentive_abi, tempSigner);
		setWETHIncentive(tempWETHIncentive);

    let tempERC20Hmm = new ethers.Contract(ERC20HmmUSDCAddress, ERC20_abi, tempSigner);
		setUSDCErc20Hmm(tempERC20Hmm);

    let tempWETHERC20Hmm = new ethers.Contract(ERC20HmmWETHAddress, ERC20_abi, tempSigner);
		setWETHErc20Hmm(tempWETHERC20Hmm);

    let tempOracle = new ethers.Contract(btcOracleAddress, fakeOracle_abi, tempSigner);
		setBtcOracle(tempOracle);

    let tempEthOracle = new ethers.Contract(ethOracleAddress, fakeOracle_abi, tempSigner);
		setEthOracle(tempEthOracle);

    let tempUsdcContract = new ethers.Contract(usdcContractAddress, ERC20_abi, tempSigner);
		setUsdcContract(tempUsdcContract);

    let tempWethContract = new ethers.Contract(wethContractAddress, ERC20_abi, tempSigner);
		setWethContract(tempWethContract);
    
	}

  ////////// CONTRACT //////////

  ////////// PAGES //////////

  const Header = () => {

    return(
      <header>

        <a class="spaceLogo" href="http://mercantileservices.xyz/">
          <img src={Logo} id="logo"/>
        </a>

        <div class="browse">
          <div class={`browseButton ${activePage === 1 ? "active" : ""}`} id="buyButton" onClick={() => setActivePage(1)}>Buy</div>
          <div class={`browseButton ${activePage === 2 ? "active" : ""}`} id="earnButton" onClick={() => setActivePage(2)}>Earn</div>
          <div class={`browseButton ${activePage === 3 ? "active" : ""}`} id="dashboardButton" onClick={() => setActivePage(3)}>Dashboard</div>
          <div class={`browseButton ${activePage === 4 ? "active" : ""}`} id="analyticsButton" onClick={() => setActivePage(4)}>Analytics</div>
        </div>

        <div class="chain" onClick={() => setActivePage(1)}>
          <img src={polygonLogo} id="chainLogo"/>
          <div id="chainName">{chainName}</div>
        </div>

        <button id="walletMessage" onClick={() => document.getElementsByClassName("walletChoiceBox")[0].style.display = "flex"}>{connButtonText}</button>

        <div class="walletChoiceBox" onClick={() => document.getElementsByClassName("walletChoiceBox")[0].style.display = "none"}>
          <div class="walletSpace" onClick={connectMetamask}>
            <img src={metamask} class="walletLogo"/>
            <div class="walletName">Metamask</div>
          </div>
          <div class="walletSpace" onClick={connectWalletConnect}>
            <img src={walletconnect} class="walletLogo"/>
            <div class="walletName">WalletConnect</div>
          </div>     
        </div>

      </header>
      
    )
  }

  /// BUY PAGE
  const BuyPage = () => {

    const [activeType, setActiveType] = useState(1);
    const [premium, setPremium] = useState(null);
    const [transactionHash, setTransactionHash] = useState("");
    const [userInfos, setUserInfos] = useState("");

    const getPremium = async () => {

      try {
  
        const tokenAddress = document.querySelector("#asset-select").value;
  
        const date = new Date(document.querySelector("#expirationInput").value);
        const expiration = (Math.floor(date.getTime() / 1000)).toString();
  
        let decimal;
        let strikePrice;
        let amount;

        let data;
        let val;

        if (activeType === 1) {
          if(tokenAddress === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
            decimal = 10**18;
          }
    
          if(tokenAddress === "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6") {
            decimal = 10**8;   
          }
    
          strikePrice = BigInt(document.querySelector("#strikeInput").value * 10**8);
          amount = BigInt(document.querySelector("#amountInput").value * decimal);

          data = await usdcHmm.getPremium(tokenAddress, strikePrice, expiration, amount);
          val = (Number(data) / 10**8).toFixed(2);

          setPremium(val + " USDC");
        }

        if (activeType === 2) {
          let currentPriceResult;
          let currentPrice;

          if(tokenAddress === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
            currentPriceResult = await ethOracle.latestRoundData();
            currentPrice = currentPriceResult[1] / 10**8;

            strikePrice = BigInt((1/document.querySelector("#strikeInput").value) * 10**18);
            amount = BigInt(document.querySelector("#amountInput").value*document.querySelector("#strikeInput").value * 10**6);

            data = await wethHmm.getPremium(usdcContractAddress, strikePrice, expiration, amount);
            val = Number(data / 10**18).toFixed(2);

            setPremium(val + " ETH");
          }
          
        }
    
      } catch (error) {
        console.log(error);
        setPremium(<div class="premiumLoader"></div>);
      }
    
    }
  
    const setBuy = async (params) => {
      params.preventDefault();
  
      try {

        let userAddress = await signer.getAddress();

        let tokenAddress = params.target[1].value;
        let date = new Date(params.target[3].value);
        let expiration = (Math.floor(date.getTime() / 1000)).toString();

        let decimal;
        let allowance;

        let strikePrice;
        let amount;
        
        if (activeType === 1) {

          if(tokenAddress === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
            decimal = 10**18;
          }
    
          if(tokenAddress === "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6") {
            decimal = 10**8;   
          }

          allowance = BigInt(await usdcContract.allowance(userAddress, hmmUSDCAddress));
          strikePrice = BigInt(params.target[2].value * 10**8);
          amount = BigInt(params.target[0].value * decimal);

          let premium = await usdcHmm.getPremium(tokenAddress, strikePrice, expiration, amount);
          let premiumUsdc = (((Number(premium)*10**6) / 10**8)*1.5).toFixed(0);

          if (allowance < premiumUsdc) {

            let approval = await usdcContract.approve(hmmUSDCAddress, premiumUsdc);
            setTransactionHash(approval.hash);
            setUserInfos("Pending approval");
            let approvalReceipt = await approval.wait();
            setUserInfos("Approval confirmed");
            console.log(approvalReceipt);

            let pay = await usdcHmm.pay(treasurerUSDCAddress, tokenAddress, strikePrice, expiration, amount);
            setTransactionHash(pay.hash);
            setUserInfos("Pending payment");
            let payReceipt = await pay.wait();
            setUserInfos("Payment confirmed")
            console.log(payReceipt);

          } else {

            let pay = await usdcHmm.pay(treasurerUSDCAddress, tokenAddress, strikePrice, expiration, amount);
            setTransactionHash(pay.hash);
            setUserInfos("Pending payment");
            let payReceipt = await pay.wait();
            setUserInfos("Payment confirmed")
            console.log(payReceipt);

          }   
          
        }

        if (activeType === 2) {
          

          if(tokenAddress === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {

            allowance = BigInt(await wethContract.allowance(userAddress, hmmWETHAddress));
            strikePrice = BigInt((1/params.target[2].value) * 10**18);
            amount = BigInt(params.target[0].value * params.target[2].value * 10**6);

            let premium = await wethHmm.getPremium(usdcContractAddress, strikePrice, expiration, amount);
            let premiumMargin = (premium * 1.5).toFixed(0);

            if (allowance < premiumMargin) {

              let approval = await wethContract.approve(hmmWETHAddress, premiumMargin);
              setTransactionHash(approval.hash);
              setUserInfos("Pending approval");
              let approvalReceipt = await approval.wait();
              setUserInfos("Approval confirmed");
              console.log(approvalReceipt);

              let pay = await wethHmm.pay(treasurerWETHAddress, usdcContractAddress, strikePrice, expiration, amount);
              setTransactionHash(pay.hash);
              setUserInfos("Pending payment");
              let payReceipt = await pay.wait();
              setUserInfos("Payment confirmed")
              console.log(payReceipt);

            } else {

              let pay = await wethHmm.pay(treasurerWETHAddress, usdcContractAddress, strikePrice, expiration, amount);
              setTransactionHash(pay.hash);
              setUserInfos("Pending payment");
              let payReceipt = await pay.wait();
              setUserInfos("Payment confirmed")
              console.log(payReceipt);

            }
            
          }
          
        }       
  
      } catch (error) {
        setPremium("Please see conditions");
        console.log(error.data);
      }
      
    }

    const getMaxAmount = async() => {
      let asset = document.getElementById("asset-select").value;

      let available;
      let result;
      let maxSize;

      if (activeType === 1) {
        available = await usdcHmm.availableToWithdraw();

        result = await usdcHmm.tokenToInfos(asset);
        maxSize = Number(result.maxSize);
        
        if (available <= maxSize) {
          setUserInfos(`Maximum "Amount × Price" allowed : ${Number(available/10**6).toFixed(2)} $`)
        } else {
          setUserInfos(`Maximum "Amount × Price" allowed : ${Number(maxSize/10**6).toFixed(2)} $`)
        }

      }

      if (activeType === 2) {
        let currentPriceResult = await ethOracle.latestRoundData();
        let currentPrice = currentPriceResult[1] / 10**8;

        let data = await wethHmm.availableToWithdraw();
        available = (data*currentPrice)/10**18;

        result = await wethHmm.USDC();
        maxSize = Number((result.maxSize*currentPrice)/10**18);

        if (available <= maxSize) {
          setUserInfos(`Maximum "Amount × Price" allowed : ${Number(available).toFixed(2)} $`)
        } else {
          setUserInfos(`Maximum "Amount × Price" allowed : ${Number(maxSize).toFixed(2)} $`)
        }

      }


    }

    const getMinDesiredPrice = async() => {
      let asset = document.getElementById("asset-select").value;

      let oracle;
      let decimal;

      if (asset === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
        oracle = ethOracle;
        decimal = 10**18;
      }

      if (asset === "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6") {
        oracle = btcOracle;
        decimal = 10**8;
      }

      let lastPriceResult = await oracle.latestRoundData();
      let lastPrice = lastPriceResult[1];

      let minDesiredPrice;

      if (activeType === 1) {
        minDesiredPrice = ((lastPrice / 10**8) * 1.006).toFixed(2);
        setUserInfos(`Minimum "Strike Price" allowed : ${minDesiredPrice} $`);
      }

      if (activeType === 2) {
        minDesiredPrice = ((lastPrice / 10**8) * 0.994).toFixed(2);
        setUserInfos(`Maximum "Strike Price" allowed : ${minDesiredPrice} $`);
      }

      

    }

    const getAvailableDates = async() => {
      //let currentDate = Date.now();
      //let minDate = new Date(currentDate + 604800000);
      //let maxDate = new Date(currentDate + 31536000000);

      setUserInfos(`Minimum : 1 Week / Maximum : 1 Year`);
    }

    return (
      <div class="buyPage">
        <main>
          <div class="typeBox">
            <div class={`callType ${activeType === 1 ? "activeCall" : ""}`} onClick={() => setActiveType(1)}>Call</div>
            <div class={`putType ${activeType === 2 ? "activePut" : ""}`} onClick={() => setActiveType(2)}>Put</div>
          </div>
          <div class="box">
            <form class="form" onSubmit={setBuy} onChange={getPremium}>
              <label class="labelAmount">
                <div class="labelName">Amount :</div>
                <input id="amountInput" type="text" name="amount" placeholder="0.00" onMouseOver={getMaxAmount}/>
              </label>
              <select class="select" name="assets" id="asset-select">
                  <option id="eth" value="0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619">ETH</option>
                  <option id="btc" value="0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6">BTC</option>
              </select>
              <label class="label">
              <div class="labelName">Strike Price :</div>
                <input class="input" id="strikeInput" type="text" name="strike" placeholder="0.00 $" onMouseOver={getMinDesiredPrice}/>
              </label>
              <label class="label">
              <div class="labelName">Expiration :</div>
                <input class="input" id="expirationInput" type="date" name="expiration" placeholder="(1 year max) dd/mm/yy" onMouseOver={getAvailableDates}/>
              </label>
              <div class="premiumContainer">
                <div class="premium">Premium :</div>
                <div class="resultPremium">{premium}</div>
                <div class="helpButton" onMouseOver={() => document.getElementsByClassName("helpInfos")[0].style.display = "block"} onMouseOut={() => document.getElementsByClassName("helpInfos")[0].style.display = "none"}><img src={questionLogo} id="helpLogo"/></div>                
              </div>
              <input id="buyContract" class="scaleButton" type={"submit"} value="Buy" />
            </form>
          </div>
          <div class="helpInfos">
            <u><b>Call/Put:</b></u><br/>If you want to <b>buy later</b> at the Strike Price then it's a "Call". If you want to <b>sell later</b> at the Strike Price then it's a "Put".<br/>
            <br/>
            <u><b>Amount:</b></u><br/>The amount you want to be able to buy/sell, until expiration.<br/>
            <div class="needed">"Amount × Strike Price" must be less than the <u>available liquidity</u> (see Analytics tab) and the <u>maximum amount allowed</u> (depending on the asset).</div>
            <br/>
            <u><b>Strike Price:</b></u><br/>The price at which you want to be able to buy/sell it.<br/>
            <div class="needed">Must be 0.5% higher than the asset's current market price.</div>
            <br/>
            <u><b>Expiration:</b></u><br/>The expiration date of the contract. The contract will automatically execute within 7 days of this date (<b>sending you the profits</b> if there are any).<br/>
            <div class="needed">Must be between 1 week and 1 year.</div>
            <br/>
            <u><b>Premium:</b></u><br/>The price to pay to benefit from this contract. The premium is <b>reimbursable</b> according to the life of the contract and protocol fees.<br/>
          </div>
        </main>
        <footer>
          <div class="userInfos">
            <a id="hashLink" href={"https://polygonscan.com/tx/" + transactionHash} target="_blank">{transactionHash}</a>
            <div>{userInfos}</div>
          </div>
        </footer>

      </div>
    )
  }


  
  /// EARN PAGE
  const EarnPage = () => {

    const [transactionHash, setTransactionHash] = useState("");
    const [userInfos, setUserInfos] = useState("");

    const setDeposit = async (params) => {
      params.preventDefault();
  
      try {

        let address = await signer.getAddress();
    
        let decimal;
        let allowance;
        let amount;

        let hmmType = document.getElementById("asset-select").value;
  
        if(hmmType === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
          decimal = 10**18;
          allowance = await wethContract.allowance(address, hmmWETHAddress);
          amount = BigInt(params.target[1].value * decimal);

          if(allowance < amount) {
            let approval = await wethContract.approve(hmmUSDCAddress, amount);
            setTransactionHash(approval.hash);
            setUserInfos("Pending approval");
            let approvalReceipt = await approval.wait();
            setUserInfos("Approval confirmed");
            console.log(approvalReceipt);
  
            let deposit = await wethHmm.deposit(amount);
            setTransactionHash(deposit.hash);
            setUserInfos("Pending deposit");
            let depositReceipt = await deposit.wait();
            setUserInfos("Deposit confirmed");
            console.log(depositReceipt);
  
          } else {
            let deposit = await wethHmm.deposit(amount);
            setTransactionHash(deposit.hash);
            setUserInfos("Pending deposit");
            let depositReceipt = await deposit.wait();
            setUserInfos("Deposit confirmed");
            console.log(depositReceipt);
          }
        }
  
        if(hmmType === "btcAddress") {
          decimal = 10**8;
          //allowance = await wbtcContract.allowance(address, hmmWBTCAddress);
          amount = params.target[1].value * decimal;     
        }

        if(hmmType === "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174") {
          decimal = 10**6;
          allowance = await usdcContract.allowance(address, hmmUSDCAddress);
          amount = params.target[1].value * decimal;

          if(allowance < amount) {

            let approval = await usdcContract.approve(hmmUSDCAddress, amount);
            setTransactionHash(approval.hash);
            setUserInfos("Pending approval");
            let approvalReceipt = await approval.wait();
            setUserInfos("Approval confirmed");
            console.log(approvalReceipt);
  
            let deposit = await usdcHmm.deposit(amount);
            setTransactionHash(deposit.hash);
            setUserInfos("Pending deposit");
            let depositReceipt = await deposit.wait();
            setUserInfos("Deposit confirmed");
            console.log(depositReceipt);
  
          } else {
            let deposit = await usdcHmm.deposit(amount);
            setTransactionHash(deposit.hash);
            setUserInfos("Pending deposit");
            let depositReceipt = await deposit.wait();
            setUserInfos("Deposit confirmed");
            console.log(depositReceipt);
  
          }
        }    
  
      } catch (error) {
        console.log(error);
      }
      
    }

    return (
      <div class="earnPage">
        <main>
          <div class="box">
            <form class="earnForm" onSubmit={setDeposit}>
              <select class="earnSelect" name="assets" id="asset-select">
                <option id="usdc" value="0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174">USDC</option>
                <option id="eth" value="0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619">WETH</option>
              </select>
              <div class="AprContainer">
                <div class="Apr">Base APR :</div>
                <div class="resultAPR">13 %</div>
              </div>
              <div class="AprContainer">
                <div class="Apr">Reward APR :</div>
                <div class="resultAPR">7 %</div>
              </div>
              <div class="AprContainer">
                <div class="Apr" id="totalAPR">Total APR :</div>
                <div class="resultAPR">20 %</div>
              </div>
              <label class="earnLabel">
                <div class="amount">Amount :</div>
                <input class="earnInput" id="strikeInput" type="text" name="strike" placeholder=" 0.00" />
              </label>
              <input id="buyContract" class="scaleButton" type={"submit"} value="Deposit" />
            </form>
          </div>
        </main>
        <footer>
          <div class="userInfos">
            <a id="hashLink" href={"https://polygonscan.com/tx/" + transactionHash} target="_blank">{transactionHash}</a>
            <div>{userInfos}</div>
          </div>
        </footer>
      </div>
    )
  }
  
  /// DASHBOARD PAGE
  const DashboardPage = () => {

    useEffect(()=>{
      getDeposit();
      getUsdcClaimable();
      getMercClaimable();
      returnVouchers()
    } , [] );

    const [loadingPage, setLoadingPage] = useState(<div class="loader"></div>);
    const [deposit, setDeposit] = useState(null);
    const [usdcClaimable, setUsdcClaimable] = useState(null);
    const [mercClaimable, setMercClaimable] = useState(null);
    const [transactionHash, setTransactionHash] = useState("");
    const [userInfos, setUserInfos] = useState("");
    const [idOwned, setIdOwned] = useState("Searching IDs...");
    const [contractType, setContractType] = useState("");
    const [contractMethod, setContractMethod] = useState(1);
    const [contractAsset, setContractAsset] = useState("");
    const [contractAmount, setContractAmount] = useState("");
    const [contractStrike, setContractStrike] = useState("");
    const [changeStrike, setChangeStrike] = useState("");
    const [contractExpiration, setContractExpiration] = useState("");
    const [contractRefundable, setContractRefundable] = useState("");
    const [contractEarnings, setContractEarnings] = useState("0 $");
    const [newStrikeResult, setNewStrikeResult] = useState(null);
    const [strikeText1, setStrikeText1] = useState(null);
    const [strikeText2, setStrikeText2] = useState(null);
    const [inputNewStrike, setInputNewStrike] = useState(null);
    const [buttonNewStrike, setButtonNewStrike] = useState(null);




    const getDeposit = async () => {

      let hmmType = document.getElementById("asset-select").value;

      if (hmmType === "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174") {
        let decimal = 10**6;
        let data = await usdcErc20Hmm.balanceOf(defaultAccount);
        let signerDeposit = (Number(data) / decimal).toFixed(2);
        setDeposit(signerDeposit + " USDC");
      }

      if (hmmType === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
        let decimal = 10**18;
        let data = await wethErc20Hmm.balanceOf(defaultAccount);
        let signerDeposit = (Number(data) / decimal).toFixed(2);
        setDeposit(signerDeposit + " WETH");
      }

    }

    const getUsdcClaimable = async () => {

      let hmmType = document.getElementById("asset-select").value;

      if (hmmType === "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174") {
        let decimal = 10**6;
        let data = await usdcTreasurer.rewardAvailable(defaultAccount);
        let signerRewards = (Number(data) / decimal).toFixed(2);
        setUsdcClaimable(signerRewards + " USDC");
      }

      if (hmmType === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
        let decimal = 10**18;
        let data = await wethTreasurer.rewardAvailable(defaultAccount);
        let signerRewards = (Number(data) / decimal).toFixed(2);
        setUsdcClaimable(signerRewards + " WETH");
      }
    }

    const getMercClaimable = async () => {

      let hmmType = document.getElementById("asset-select").value;

      let decimal = 10**18;

      if (hmmType === "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174") {
        let data = await usdcIncentive.rewardsOf(defaultAccount);
        let signerRewards = (Number(data) / decimal).toFixed(2);
        setMercClaimable(signerRewards + " MERC");
      }

      if (hmmType === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
        let data = await wethIncentive.rewardsOf(defaultAccount);
        let signerRewards = (Number(data) / decimal).toFixed(2);
        setMercClaimable(signerRewards + " MERC");
      }

      setLoadingPage(null);
    }

    const claimUSDC = async () => {

      let hmmType = document.getElementById("asset-select").value;

      let claim;
      let claimReceipt;

      if (hmmType === "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174") {
        claim = await usdcTreasurer.claim()
        setTransactionHash(claim.hash);
        setUserInfos("Pending claim");
        claimReceipt = await claim.wait();
        setUserInfos("Claim confirmed");
        console.log(claimReceipt);
      }

      if (hmmType === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
        claim = await wethTreasurer.claim()
        setTransactionHash(claim.hash);
        setUserInfos("Pending claim");
        claimReceipt = await claim.wait();
        setUserInfos("Claim confirmed");
        console.log(claimReceipt);
      }

    }

    const claimMerc = async () => {

      let hmmType = document.getElementById("asset-select").value;

      let claim;
      let claimReceipt;

      if (hmmType === "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174") {
        claim = await usdcIncentive.claim()
        setTransactionHash(claim.hash);
        setUserInfos("Pending claim");
        claimReceipt = await claim.wait();
        setUserInfos("Claim confirmed");
        console.log(claimReceipt);
      }

      if (hmmType === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
        claim = await wethIncentive.claim()
        setTransactionHash(claim.hash);
        setUserInfos("Pending claim");
        claimReceipt = await claim.wait();
        setUserInfos("Claim confirmed");
        console.log(claimReceipt);
      }

      
    }

    const withdraw = async (params) => {
      params.preventDefault();

      try {

        let hmmType = document.getElementById("asset-select").value;

        let amount = params.target[0].value;
        let decimal;
        let amountToWithdraw;

        let tx;
        let receipt;

        if (hmmType === "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174") {
          decimal = 10**6;
          amountToWithdraw = amount * decimal;

          tx = await usdcHmm.withdraw(amountToWithdraw);
          setTransactionHash(tx.hash);
          setUserInfos("Pending withdrawal");
          receipt = await tx.wait();
          setUserInfos("Withdrawal confirmed");
          console.log(receipt);
        }

        if (hmmType === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
          decimal = 10**18;
          amountToWithdraw = BigInt(amount * decimal);

          tx = await wethHmm.withdraw(amountToWithdraw);
          setTransactionHash(tx.hash);
          setUserInfos("Pending withdrawal");
          receipt = await tx.wait();
          setUserInfos("Withdrawal confirmed");
          console.log(receipt);
        }

      } catch (error) {
        console.log(error)
      }  
    }

    
    const returnVouchers = async () => {

      let hmmType = document.getElementById("asset-select").value;

      let IDs = [];
      let balance;

      if (hmmType === "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174") {
        balance = await usdcVoucher.balanceOf(defaultAccount);
        for(let i = 0 ; i < balance ; i++){
          let ID = await usdcVoucher.tokenOfOwnerByIndex(defaultAccount, i);
          IDs.push(ID);
        }
        setIdOwned("Your Call Contracts ID : " + IDs.join());
      }

      if (hmmType === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
        balance = await wethVoucher.balanceOf(defaultAccount);
        for(let i = 0 ; i < balance ; i++){
          let ID = await wethVoucher.tokenOfOwnerByIndex(defaultAccount, i);
          IDs.push(ID);
        }
        setIdOwned("Your Put Contracts ID : " + IDs.join());
      }
    }

    const getContractInfos = async () => {

      let hmmType = document.getElementById("asset-select").value;
      let ID = document.querySelector("#idInput").value;

      if (hmmType === "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174") {
        let result = await usdcHmm.getInfos(ID);
        let TreasurerResult = await usdcTreasurer.getReceiptInfos(ID);

        let tempContractAsset = result[1];

        let assetName;
        let assetImage;
        let decimal;
        let currentPriceResult;
        let currentPrice;

        if (tempContractAsset === "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6") {
          decimal = 10**8;
          assetName = "BTC";
          assetImage = btcLogo;
          currentPriceResult = await btcOracle.latestRoundData();
          currentPrice = currentPriceResult[1] / 10**8;
        }

        if (tempContractAsset === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
          decimal = 10**18;
          assetName = "ETH"
          assetImage = ethLogo;
          currentPriceResult = await ethOracle.latestRoundData();
          currentPrice = currentPriceResult[1] / 10**8;
        }

        let tempContractAmount = (Number(result[4])) / decimal;
        let tempContractStrike = (Number(result[2])) / 10**8;

        let expirationUnix = Number(result[3]);
        let expirationLong = new Date(expirationUnix * 1000);
        let tempContractExpiration = expirationLong.toLocaleDateString();

        let received = Number(TreasurerResult[0]);
        let provided;
        let age = Math.floor(Date.now() / 1000) - Number(TreasurerResult[1]);
        let duration = Number(TreasurerResult[2]) - Number(TreasurerResult[1]);
        if (age > duration) {
          provided = received;
        } else {
          provided = received * (age / duration)
        }
        let tempContractRests = received - provided;
        let tempContractLosses = (Number(result[5]));
        let tempContractRefundable;
        if (tempContractLosses > tempContractRests) {
          tempContractRefundable = 0;
        } else {
          tempContractRefundable = ((tempContractRests - tempContractLosses) / 10**6).toFixed(2);
        }

        let tempContractEarnings;
        if (tempContractRests >= tempContractLosses) {
          tempContractEarnings = ((tempContractAmount*currentPrice) - (tempContractAmount*tempContractStrike)).toFixed(2);
        } else {
          tempContractEarnings = ((((tempContractAmount*currentPrice) - (tempContractAmount*tempContractStrike))*10**6 - (tempContractLosses - tempContractRests))/10**6).toFixed(2);
        }

        document.getElementsByClassName("contractMethod")[0].style.display = "block";

        setContractType("Call");
        setContractAsset(assetImage);
        setContractAmount(`${tempContractAmount} ${assetName}`);
        setContractStrike(`${tempContractStrike} $`);
        result[0] == 0 ? setChangeStrike(<img src={changeLogo} id="changeLogo" onClick={getNewStrike}/>) : setChangeStrike(null);
        setContractExpiration(tempContractExpiration);
        setContractRefundable(`${tempContractRefundable} USDC`);
      
        if (tempContractEarnings > 0) {
          setContractEarnings(`${tempContractEarnings} $`);
        } else {
          setContractEarnings(0)
        }
      }

      if (hmmType === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
        let result = await wethHmm.getInfos(ID);
        let TreasurerResult = await wethTreasurer.getReceiptInfos(ID);

        let assetName = "ETH";
        let assetImage = ethLogo;
        let decimal = 10**18;
        let currentPriceResult = await ethOracle.latestRoundData()
        let currentPrice = currentPriceResult[1] / 10**8;

        let tempContractAmount = (Number(result[4])/10**6)/(1/(Number(result[2])/decimal));
        let tempContractStrike = 1/ ((Number(result[2])) / decimal);
        
        let expirationUnix = Number(result[3]);
        let expirationLong = new Date(expirationUnix * 1000);
        let tempContractExpiration = expirationLong.toLocaleDateString();

        let received = Number(TreasurerResult[0]);
        let provided;
        let age = Math.floor(Date.now() / 1000) - Number(TreasurerResult[1]);
        let duration = Number(TreasurerResult[2]) - Number(TreasurerResult[1]);
        if (age > duration) {
          provided = received;
        } else {
          provided = received * (age / duration)
        }
        let tempContractRests = received - provided;
        let tempContractLosses = (Number(result[5]));
        let tempContractRefundable;
        if (tempContractLosses > tempContractRests) {
          tempContractRefundable = 0;
        } else {
          tempContractRefundable = (currentPrice*((tempContractRests - tempContractLosses) / 10**18)).toFixed(2);
        }

        let tempContractEarnings;
        if (tempContractRests >= tempContractLosses) {
          tempContractEarnings = ((tempContractAmount*tempContractStrike) - (tempContractAmount*currentPrice)).toFixed(2);
        } else {
          tempContractEarnings = (((tempContractAmount*tempContractStrike) - (tempContractAmount*currentPrice)) - ((tempContractLosses - tempContractRests)/10**18)*currentPrice).toFixed(2);
        }

        document.getElementsByClassName("contractMethod")[0].style.display = "block";

        setContractType("Put");
        setContractAsset(assetImage);
        setContractAmount(`${tempContractAmount} ${assetName}`);
        setContractStrike(`${tempContractStrike} $`);
        result[0] == 0 ? setChangeStrike(<img src={changeLogo} id="changeLogo" onClick={getNewStrike}/>) : setChangeStrike(null);
        setContractExpiration(tempContractExpiration);
        setContractRefundable(`${tempContractRefundable} USDC`);
      
        if (tempContractEarnings > 0) {
          setContractEarnings(`${tempContractEarnings} $`);
        } else {
          setContractEarnings(0)
        }
        
      }
      
    }

    const getNewStrike = async () => {

      let hmmType = document.getElementById("asset-select").value;
      let ID = document.querySelector("#idInput").value;

      let decimal;
      let currentPriceResult;
      let currentPrice;

      let minStrike = null;

      if (hmmType === "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174") {
        let result = await usdcHmm.getInfos(ID);
        let TreasurerResult = await usdcTreasurer.getReceiptInfos(ID);

        let tempContractAsset = result[1];

        if (tempContractAsset === "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6") {
          decimal = 10**8;
          currentPriceResult = await btcOracle.latestRoundData();
          currentPrice = currentPriceResult[1] / 10**8;
        }

        if (tempContractAsset === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
          decimal = 10**18;
          currentPriceResult = await ethOracle.latestRoundData();
          currentPrice = currentPriceResult[1] / 10**8;
        }

        let tempContractStrike = (Number(result[2])) / 10**8;

        let received = Number(TreasurerResult[0]);
        let provided;
        let age = Math.floor(Date.now() / 1000) - Number(TreasurerResult[1]);
        let duration = Number(TreasurerResult[2]) - Number(TreasurerResult[1]);
        if (age > duration) {
          provided = received;
        } else {
          provided = received * (age / duration)
        }
        let tempContractRests = received - provided;
        let tempContractLosses = (Number(result[5]));
        let tempContractRefundable;
        if (tempContractLosses > tempContractRests) {
          tempContractRefundable = 0;
        } else {
          tempContractRefundable = ((tempContractRests - tempContractLosses) / 10**6).toFixed(2);
        }

        let premiumPayable = tempContractRefundable / 0.90;
        let minStrike = null;

        for (let i = Number((1.006 * currentPrice).toFixed(2)) ; i < Number(tempContractStrike) ; i += Number((0.01 * currentPrice).toFixed(2))) {

          console.log(result[1]);
          console.log(Number(i*10**8).toFixed(0));
          console.log(Number(result[3]));
          console.log(BigInt(result[4]));

          let data = await usdcHmm.getPremium(result[1], Number(i*10**8).toFixed(0), Number(result[3]), BigInt(result[4]));
          let newPremium = Number((Number(data) / 10**8).toFixed(2));

          if (newPremium < premiumPayable) {
            minStrike = i.toFixed(2);
            break;
          }        

        }
      }

      if (hmmType === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
        let result = await wethHmm.getInfos(ID);
        let TreasurerResult = await wethTreasurer.getReceiptInfos(ID);

        decimal = 10**18;
        currentPriceResult = await ethOracle.latestRoundData();
        currentPrice = currentPriceResult[1] / 10**8;

        let tempContractStrike = 1/ ((Number(result[2])) / decimal);

        let received = Number(TreasurerResult[0]);
        let provided;
        let age = Math.floor(Date.now() / 1000) - Number(TreasurerResult[1]);
        let duration = Number(TreasurerResult[2]) - Number(TreasurerResult[1]);
        if (age > duration) {
          provided = received;
        } else {
          provided = received * (age / duration)
        }
        let tempContractRests = received - provided;
        let tempContractLosses = (Number(result[5]));
        let tempContractRefundable;
        if (tempContractLosses > tempContractRests) {
          tempContractRefundable = 0;
        } else {
          tempContractRefundable = (currentPrice*((tempContractRests - tempContractLosses) / 10**18)).toFixed(2);
        }

        let premiumPayable = tempContractRefundable / 0.90;
        console.log(premiumPayable)

        for (let i = Number((0.994 * currentPrice).toFixed(2)) ; i > Number(tempContractStrike) ; i -= Number((0.01 * currentPrice).toFixed(2))) {

          console.log(result[1])
          console.log((1/i)*10**18)  
          console.log(Number(result[3]))  
          console.log(Number(result[4]))  

          let data = await wethHmm.getPremium(result[1], ((1/i)*10**18).toFixed(0), Number(result[3]), Number(result[4]));
          console.log(data)
          console.log(data/10**18)
          let newPremium = Number(((data/10**18)*currentPrice).toFixed(2));

          console.log(newPremium)

          if (newPremium < premiumPayable) {
            minStrike = i.toFixed(2);
            break;
          }        

        }

      }

      if(minStrike === null) {
        setStrikeText1("No new Strike Price possible");
        setNewStrikeResult(null);
        setStrikeText2(null);
        setInputNewStrike(null);
        setButtonNewStrike(null);
      } else {
        setStrikeText1("Minimum New Strike Price :");
        setNewStrikeResult(<div class="newStrikeResult">{minStrike}</div>);
        setStrikeText2(<div class="strikeText2">Choice :</div>);
        setInputNewStrike(<input id="inputNewStrike" type="text" name="newStrike" placeholder=" 0.00 $" />);
        setButtonNewStrike(<div id="buttonNewStrike" onClick={setNewStrike}>Change Strike</div>);
      }
      
      document.getElementsByClassName("helpInfosStrike")[0].style.display === "flex" ? document.getElementsByClassName("helpInfosStrike")[0].style.display = "none" : document.getElementsByClassName("helpInfosStrike")[0].style.display = "flex";
      
    }

    const execute = async (params) => {
      params.preventDefault();

      let hmmType = document.getElementById("asset-select").value;

      let tx;
      let receipt;

      if (hmmType === "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174") {
        tx = await usdcHmm.execVoucher(params.target[0].value, contractMethod);
        setTransactionHash(tx.hash);
        setUserInfos("Pending transaction");
        receipt = await tx.wait();
        setUserInfos("Transaction confirmed");
        console.log(receipt);  
      }

      if (hmmType === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
        tx = await wethHmm.execVoucher(params.target[0].value, contractMethod);
        setTransactionHash(tx.hash);
        setUserInfos("Pending transaction");
        receipt = await tx.wait();
        setUserInfos("Transaction confirmed");
        console.log(receipt);  
      }

    }

    const setNewStrike = async() => {

      let hmmType = document.getElementById("asset-select").value;

      let id = document.getElementById("idInput").value;
      let data = document.getElementById("inputNewStrike").value;

      let newStrike;
      let tx;
      let receipt;

      if (hmmType === "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174") {
        newStrike = BigInt(data * 10**18)
        tx = await usdcHmm.changeStrike(id, newStrike);
        setTransactionHash(tx.hash);
        setUserInfos("Pending transaction");
        receipt = await tx.wait();
        setUserInfos("Transaction confirmed");
        console.log(receipt);  
      }

      if (hmmType === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
        newStrike = BigInt((1/data) * 10**18)
        tx = await usdcHmm.changeStrike(id, newStrike);
        setTransactionHash(tx.hash);
        setUserInfos("Pending transaction");
        receipt = await tx.wait();
        setUserInfos("Transaction confirmed");
        console.log(receipt);
  
      }

    }

    return (
      <div className="dashboardPage">
        <main>
          {loadingPage}
          <select class="dashboardSelect" name="assets" id="asset-select" onChange={() => {getDeposit(); getUsdcClaimable(); getMercClaimable(); returnVouchers()}}>
            <option id="usdc" value="0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174">USDC</option>
            <option id="eth" value="0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619">WETH</option>
          </select>
          <div class="contractBox">
            <div class="dashboardTitle">Contracts</div>
            <form class="contractDashboardForm" onChange={getContractInfos} onSubmit={execute}>
              <label class="idLabel">
                <input id="idInput" type="text" name="contractID" placeholder="ID" />
                <div class="contractType">{contractType}</div>
                <div class={`contractMethod ${contractMethod === 1 ? "method1" : "method0"}`} onClick={() => contractMethod === 1 ? setContractMethod(0) : setContractMethod(1)} onMouseOver={() => document.getElementsByClassName("helpInfosMethod")[0].style.display = "block"} onMouseOut={() => document.getElementsByClassName("helpInfosMethod")[0].style.display = "none"}>Auto</div>
              </label>
              <div class="infoSpace">
                <div class="contractSubTitle">Asset :</div>
                <div class="contractAsset"><img src={contractAsset} id="assetLogo"/></div>
              </div>
              <div class="infoSpace">
                <div class="contractSubTitle">Amount :</div>
                <div class="contractAmount">{contractAmount}</div>
              </div>
              <div class="infoSpace">
                <div class="contractSubTitle">Strike :</div>
                <div class="contractStrike">{contractStrike}</div>
                <div class="changeStrike">{changeStrike}</div> 
              </div>
              <div class="infoSpace">
                <div class="contractSubTitle">Expiration :</div>
                <div class="contractExpiration">{contractExpiration}</div>
              </div>
              <div class="infoSpace">
                <div class="contractSubTitle">Refundable :</div>
                <div class="contractLosses">{contractRefundable}</div>
              </div>
              <div class="earningSpace">
                <div class="earningSubTitle">Earnings :</div>
                <div class="contractEarning">{contractEarnings}</div>
                <div class="helpButtonEarnings" onMouseOver={() => document.getElementsByClassName("helpInfosEarnings")[0].style.display = "block"} onMouseOut={() => document.getElementsByClassName("helpInfosEarnings")[0].style.display = "none"}><img src={questionLogo} id="helpLogoEarnings"/></div>
              </div>
              <input id={`${contractEarnings === 0 ? "refundContract" : "executeContract"}`} class="scaleButton" type={"submit"} value={`${contractEarnings === 0 ? "Refund" : "Execute"}`} />
            </form>
          </div>
          <div class="depositBox">
            <div class="dashboardTitle">Deposits</div>
            <div class="spaceNeeded"></div>
            <div class="infoSpace">
              <div class="contractSubTitle">Amount :</div>
              <div class="deposits">{deposit}</div>
            </div>
            <div class="spaceNeeded"></div>
            <div class="infoSpace">
              <div class="contractSubTitle">Claimable :</div>
              <div class="usdcClaimable">{usdcClaimable}</div>
              <div class="mercClaimable">{mercClaimable}</div>
            </div>
            <div class="claimUSDC scaleButton" onClick={claimUSDC}>Claim Rewards</div>
            <div class="claimMERC scaleButton"onClick={claimMerc}>Claim MERC</div>
            <form class="withdrawForm" onSubmit={withdraw}>
              <label class="withdrawLabel">
                <div class="withdrawAmount">Amount :</div>
                <input class="withdrawInput" id="withdrawInput" type="text" name="withdraw" placeholder=" 00.00 $" onMouseOver={async() => setUserInfos(`Available liquidity : ${(Number(await usdcHmm.availableToWithdraw()) / 10**6).toFixed(2)} USDC`)}/>
              </label>
              <input class="withdraw scaleButton" id="withdrawButton" type={"submit"} value="Withdraw" />
            </form>
          </div>
          <div class="helpInfosEarnings">
            Earnings represents the <b>estimated earnings</b> you will receive when the protocol executes your contract with "Auto" activated.<br/>
            <br/>
            These gains will come from selling your asset at the current market price minus the strike price. Everything is done <b>automatically</b> by the smart-contract.<br/>
            <br/>
            In case of profit or not, you will also <b>receive your refundable amount</b>. 
          </div>
          <div class="helpInfosMethod">
            There are two methods for executing a contract.<br/>
            <br/>
            Auto: You will receive the earnings directly.<br/>
            <br/>
            <strike>Auto</strike>: You send the USDC amount due (amount × strike) and the smart-contract will send you the assets. 
          </div>
          <div class="helpInfosStrike">
            <div class="strikeText1">{strikeText1}</div>
            {newStrikeResult}
            {strikeText2}
            {inputNewStrike}
            {buttonNewStrike}
          </div>
        </main>
        <footer>
          <div class="userInfos">
            <div>{idOwned}</div>
            <a id="hashLink" href={"https://polygonscan.com/tx/" + transactionHash} target="_blank">{transactionHash}</a>
            <div>{userInfos}</div>
          </div>
        </footer>
      </div>
    )
  }

  /// ANALYTICS PAGE
  const AnalyticsPage = () => {

    useEffect(()=>{
      getAnalytics();
    } , [] );

    const [loadingPage, setLoadingPage] = useState(<div class="loader"></div>);
    const [TVL, setTVL] = useState(null);
    const [openInterest, setOpenInterest] = useState(null);
    const [temporaryLosses, setTemporaryLosses] = useState(null);
    const [actualLosses, setActualLosses] = useState(null);
    const [availableToWithdraw, setAvailableToWithdraw] = useState(null);
    const [chart, setChart] = useState("0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6");
    //const [APY, setAPY] = useState("");
    //const [reverseTVL, setReverseTVL] = useState("");
    //const [reverseOI, setReverseOI] = useState("");

    
    const getAnalytics = async () => {

      let hmmType = document.getElementById("asset-select").value;

      let assetName;
      let decimal;
      let hmmInfos;
      let tempTVL;
      let tempOI;
      let tempTemporaryLosses;
      let tempLosses;
      let data;
      let tempAvailableToWithdraw;

      if (hmmType === "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174") {
        assetName = "USDC"
        decimal = 10**6;

        hmmInfos = await usdcHmm.getHmmInfos();

        tempTVL = (Number(hmmInfos[1]) / decimal).toFixed(2);
        tempOI = (Number(hmmInfos[0]) / decimal).toFixed(2);
        tempTemporaryLosses = (Number(hmmInfos[2]) / decimal).toFixed(2);
        tempLosses = (Number(hmmInfos[3]) / decimal).toFixed(2);

        data = await usdcHmm.availableToWithdraw();
        tempAvailableToWithdraw = (Number(data) / decimal).toFixed(2);
        }

      if (hmmType === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
        assetName = "ETH"
        decimal = 10**18;

        hmmInfos = await wethHmm.getHmmInfos();

        tempTVL = (Number(hmmInfos[1]) / decimal).toFixed(2);
        tempOI = (Number(hmmInfos[0]) / decimal).toFixed(2);
        tempTemporaryLosses = (Number(hmmInfos[2]) / decimal).toFixed(2);
        tempLosses = (Number(hmmInfos[3]) / decimal).toFixed(2);

        data = await wethHmm.availableToWithdraw();
        tempAvailableToWithdraw = (Number(data) / decimal).toFixed(2);
      }

      

      setTVL(tempTVL + " " + assetName);
      setOpenInterest(tempOI + " " + assetName);
      setTemporaryLosses(tempTemporaryLosses + " " + assetName);
      setActualLosses(tempLosses + " " + assetName);
      setAvailableToWithdraw(tempAvailableToWithdraw + " " + assetName);

      setLoadingPage(null);
      
    }

    const BarChart = () => {

      useEffect(()=>{
        getData();
      } , [] );

      const [labels, setLabels] = useState(null);
      const [dataChart, setDataChart] = useState(null);
      const [loadingChart, setLoadingChart] = useState(<div class="chartLoader"></div>);

      const getData = async () => {
        let asset = document.querySelector("#assetGraph").value;

        let totalIds = await usdcHmm.count();

        let decimal;
        if (asset === "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6") {
          decimal = 10**8;
        }

        if (asset === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
          decimal = 10**18;
        }

        let strikes = [];

        for(let i = 0 ; i < totalIds ; i++) {
          let IdInfos = await usdcHmm.getInfos(i);
          if (IdInfos.token === asset && IdInfos.executed === false) {
            strikes.push(IdInfos[2]/10**8);
          }
        }

        let xMin = Math.min(...strikes);
        let xMax = Math.max(...strikes);
        
        let valueIntervals = ((Number(xMax) - Number(xMin)) / 10).toFixed(2);

        let label1 = (xMin + valueIntervals / 2).toFixed(0);
        let label2 = (Number(label1) + valueIntervals *1).toFixed(0);
        let label3 = (Number(label1) + valueIntervals *2).toFixed(0);
        let label4 = (Number(label1) + valueIntervals *3).toFixed(0);
        let label5 = (Number(label1) + valueIntervals *4).toFixed(0);
        let label6 = (Number(label1) + valueIntervals *5).toFixed(0);
        let label7 = (Number(label1) + valueIntervals *6).toFixed(0);
        let label8 = (Number(label1) + valueIntervals *7).toFixed(0);
        let label9 = (Number(label1) + valueIntervals *8).toFixed(0);
        let label10 = (Number(label1) + valueIntervals *9).toFixed(0);

        let tempLabels = [label1, label2, label3, label4, label5, label6, label7, label8, label9, label10];

        let value1 = 0;
        let value2 = 0;
        let value3 = 0;
        let value4 = 0;
        let value5 = 0;
        let value6 = 0;
        let value7 = 0;
        let value8 = 0;
        let value9 = 0;
        let value10 = 0;

        for(let i = 0 ; i < totalIds ; i++) {
          let IdInfos = await usdcHmm.getInfos(i);
          let strike;
          if (IdInfos.token === asset && IdInfos.executed === false) {
            strike = IdInfos[2]/10**8;
          }
          
          let amount = IdInfos[4]/decimal;

          if(strike <= xMin + valueIntervals * 1){
            value1 += amount;
          }

          if(strike > xMin + valueIntervals * 1 && strike <= xMin + valueIntervals * 2){
            value2 += amount;
          }

          if(strike > xMin + valueIntervals * 2 && strike <= xMin + valueIntervals * 3){
            value3 += amount;
          }

          if(strike > xMin + valueIntervals * 3 && strike <= xMin + valueIntervals * 4){
            value4 += amount;
          }

          if(strike > xMin + valueIntervals * 4 && strike <= xMin + valueIntervals * 5){
            value5 += amount;
          }

          if(strike > xMin + valueIntervals * 5 && strike <= xMin + valueIntervals * 6){
            value6 += amount;
          }

          if(strike > xMin + valueIntervals * 6 && strike <= xMin + valueIntervals * 7){
            value7 += amount;
          }

          if(strike > xMin + valueIntervals * 7 && strike <= xMin + valueIntervals * 8){
            value8 += amount;
          }

          if(strike > xMin + valueIntervals * 8 && strike <= xMin + valueIntervals * 9){
            value9 += amount;
          }

          if(strike > xMin + valueIntervals * 9){
            value10 += amount;
          }          
        }

        let amountPerInterval = [value1, value2, value3, value4, value5, value6, value7, value8, value9, value10];

        setLabels(tempLabels);
        setDataChart(amountPerInterval);
        setLoadingChart(null);

      }
    
      const data = {
        labels: labels,
        datasets: [{
          data: dataChart,
          label: 'Call Open Interest',
          backgroundColor: 'rgb	(0,0,0)',
          borderColor: 'rgb	(0,0,0)',      
        }]
      };

      const options = {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      };
      
      if (chart === "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6") {
        return (
          <div class="chart">
            {loadingChart}
            <Bar data={data} options={options}/>
          </div>
        )
      }

      if (chart === "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619") {
        return (
          <div class="chart">
            {loadingChart}
            <Bar data={data} options={options}/>
          </div>
        )
      }

      
    }

    return (
      <div className="analyticsPage">
        <main>
          {loadingPage}
          <select class="dashboardSelect" name="assets" id="asset-select" onChange={getAnalytics}>
            <option id="usdc" value="0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174">USDC</option>
            <option id="eth" value="0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619">WETH</option>
          </select>
          <div class="analyticsBox">
            <div class="leftPart">
              <div class="analyticsSpace">
                <div class="analyticsSubTitle">Total Value Locked :</div>
                <div class="analyticsInfos">{TVL}</div>
              </div>
              <div class="analyticsSpace">
                <div class="analyticsSubTitle">Open Interest :</div>
                <div class="analyticsInfos">{openInterest}</div>
              </div>
              <div class="analyticsSpace">
                <div class="analyticsSubTitle">Temporary Losses :</div>
                <div class="analyticsInfos">{temporaryLosses}</div>
              </div>
              <div class="analyticsSpace">
                <div class="analyticsSubTitle">Actual Losses :</div>
                <div class="analyticsInfos">{actualLosses}</div>
              </div>
            </div>
            <div class="rightPart">
              <div class="analyticsSpace">
                <div class="analyticsSubTitle">Available liquidity :</div>
                <div class="analyticsInfos">{availableToWithdraw}</div>
              </div>
              <div class="analyticsSpace">
                <div class="analyticsSubTitle">Deposit APY :</div>
                <div class="analyticsInfos">23 %</div>
              </div>
              <div class="reverseMarketBox">
                <div class="reverseMarketTitle">Reverse Market</div>
                <div class="reverseMarketSpace">
                  <div class="reverseMarketSubTitle">Total Value Locked :</div>
                  <div class="reverseMarketInfos">0.00 $</div>
                </div>
                <div class="reverseMarketSpace">
                  <div class="reverseMarketSubTitle">Open Interest :</div>
                  <div class="reverseMarketInfos">0.00 $</div>
                </div>
              </div>
            </div>
            <div class="graphBox">
              <select class="assetGraphSelect" name="assets" id="assetGraph" onChange={() => setChart(document.querySelector("#assetGraph").value)}>
                <option id="btc" value="0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6">BTC</option>
                <option id="eth" value="0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619">ETH</option>
              </select>
              <BarChart/>
            </div>            
          </div>
        </main>
      </div>
    )
  }

  const Body = () => {
    if (activePage === 1) {
      return <BuyPage/>
    }
    if (activePage === 2) {
      return <EarnPage/>
    }
    if (activePage === 3) {
      return <DashboardPage/>
    }
    if (activePage === 4) {
      return <AnalyticsPage/>
    }
  }

  ////////// HTML //////////

  return (
    <div class="myApp">
      
      <Header/>

      <Body/>

      {errorMessage}

    </div>
  );
}

export default App;
