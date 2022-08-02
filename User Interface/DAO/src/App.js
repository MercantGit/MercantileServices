import React, {useState, useEffect} from 'react';
import {ethers} from 'ethers';
import WalletConnectProvider from "@walletconnect/web3-provider";
import DAO_abi from './contracts/DAO_abi.json';
import Merc_abi from './contracts/Merc_abi.json';
import stkMerc_abi from './contracts/stkMerc_abi.json';
import Affiliate_abi from './contracts/Affiliate_abi.json';
import './App.css';
import Logo from './images/Logo.png';
import mercLogo from './images/tokenLogo.png';
import ethLogo from './images/Ethereum.png';
import polygonLogo from './images/Polygon.png';
import metamask from './images/MetaMask.png';
import walletconnect from './images/walletconnect.png';
import snapshotLogo from './images/snapshotLogo.jpg';

/* global BigInt */

function App() {

  let daoAddress = '0xC38F66b375A0BE2D6E47bc49926316448ef968F4';
  let mercAddress = '0x72BCF5FbAC8f64B08763b6498712044549108A93';
  let stkMercAddress = '0xb52a92E3aDb5a4Eb72e04F467f958be1c47A9E3F';
  let usdcAddress = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
  let affiliateAddress = '0x45f046d464FFB398b08238BaD9b1374f9ca39419';

  

  ////////// BASE VARIABLES //////////
  
  const [activePage, setActivePage] = useState(1);
  const [errorMessage, setErrorMessage] = useState(<div id="errorMessage">Please connect your Metamask Wallet</div>);
	const [defaultAccount, setDefaultAccount] = useState(null);
	const [connButtonText, setConnButtonText] = useState('Connect Wallet');
  const [chainName, setChainName] = useState('Polygon');

	const [provider, setProvider] = useState(null);
	const [signer, setSigner] = useState(null);
	const [dao, setDao] = useState(null);
  const [merc, setMerc] = useState(null);
  const [stkMerc, setStkMerc] = useState(null);
  const [usdc, setUsdc] = useState(null);
  const [affiliate, setAffiliate] = useState(null);

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
		updateEthers(walletType);
	}

	const chainChangedHandler = () => {
		// reload the page to avoid any errors with chain change mid use of application
		window.location.reload();
	}


	// listen for account changes
	if (typeof window.ethereum != "undefined") {
    window.ethereum.on('accountsChanged', (result) => accountChangedHandler(result[0]));
	  window.ethereum.on('chainChanged', chainChangedHandler);
  } else {
    console.log("Web3 connexion impossible")
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

		let tempDao = new ethers.Contract(daoAddress, DAO_abi, tempSigner);
		setDao(tempDao);

    let tempMerc = new ethers.Contract(mercAddress, Merc_abi, tempSigner);
		setMerc(tempMerc);

    let tempStkMerc = new ethers.Contract(stkMercAddress, stkMerc_abi, tempSigner);
		setStkMerc(tempStkMerc);

    let tempUsdc = new ethers.Contract(usdcAddress, stkMerc_abi, tempSigner);
		setUsdc(tempUsdc);

    let tempAffiliate = new ethers.Contract(affiliateAddress, Affiliate_abi, tempSigner);
		setAffiliate(tempAffiliate);

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
          <div class={`browseButton ${activePage === 1 ? "active" : ""}`} id="buyButton" onClick={() => setActivePage(1)}>Information</div>
          <div class={`browseButton ${activePage === 2 ? "active" : ""}`} id="earnButton" onClick={() => setActivePage(2)}>Dashboard</div>
          <div class={`browseButton ${activePage === 3 ? "active" : ""}`} id="dashboardButton" onClick={() => setActivePage(3)}>Governance</div>
        </div>

        <div class="chain">
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

  /// INFORMATION PAGE
  const InformationPage = () => {

    return (
      <div class="informationPage">
        <main>
          <div class="informationBox">
            <div class="firstSpitch">
              The Mercantile Services Protocol is a public good <b>owned</b> and <b>governed</b> by MERC token holders
            </div>
            <div class="secondSpitch">
              <img src={mercLogo} id="mercLogo"/>
              <div class="secondSpitchText">
                <div class="useCases">
                  <b>Uses :</b><br/>
                    - Govern<br/>
                    - Earn fees
                </div>
                <div class="useCases">
                  <b>Max Supply :</b><br/>
                    - 1 000 000 000 MERC
                </div>           
              </div>
            </div>
            <div class="informationSpitch">
              <div class="informationSpitchSpace">
                MERC holders must stack their token to fully benefit from its usefulness. They will receive in return the token <b>stkMERC</b>. To recover the MERC tokens, each stkMERC holder will have to start a one-month unlocking period.<br/>
                <br/>
                The fees generated by the protocol are divided between the reserve and the holders of the stkMERC token. "Payout Ratio" represents the share of fees sent to holders. They can <b>claim</b> these dividends from the dashboard tab.<br/>
                <br/>
                Each holder of the stkMERC token holds their respective voting power, and can <b>delegate</b> it to another address in order to gather enough voting power to modify the protocol.<br/>
              </div>              
            </div>
            <div class="redirectionSpace">
              <div class="redirectionBox">
                <img src={Logo} id="redirectionLogo"/>
                <a href="" class="redirectionLink">Governance Forum</a>
                <div class="spitchBox">
                  A forum for governance-related discussion. Share proposals, provide feedback, and shape the future of the protocol with the Uniswap community.
                </div>
              </div>
              <div class="redirectionBox">
                <img src={snapshotLogo} id="redirectionLogo"/>
                <a href="" class="redirectionLink">Snapshot</a>
                <div class="spitchBox">
                  A simple off-chain voting interface for community members to signal sentiment during the early stages of a proposal's life cycle.
                </div>
              </div>
            </div>     
          </div>
        </main>
      </div>
    )
  }

  /// DASHBOARD PAGE
  const DashboardPage = () => {

    useEffect(()=>{
      getInfos();
    } , [] );

    const [loadingPage, setLoadingPage] = useState(<div class="loader"></div>);
    const [mercHolding, setMercHolding] = useState(null);
    const [stkMercHolding, setStkMercHolding] = useState(null);
    const [userPower, setUserPower] = useState(null);
    const [userDelegation, setUserDelegation] = useState(null);
    const [userDividends, setUserDividends] = useState(null);
    const [daoReserve, setDaoReserve] = useState(null);
    const [daoDividends, setDaoDividends] = useState(null);
    const [payoutRatio, setPayoutRatio] = useState(null);
    const [lastEarnings, setLastEarnings] = useState(null);
    const [affiliateFees, setAffiliateFees] = useState(null);
    const [transactionHash, setTransactionHash] = useState("");
    const [userInfos, setUserInfos] = useState("");


    const getInfos = async () => {

      let mercDecimal = 10**18;
      let usdcDecimal = 10**6;

      let tempMercHolding = await merc.balanceOf(defaultAccount);
      let tempStkMercHolding = await stkMerc.balanceOf(defaultAccount);

      let tempUserPower;    
      try{
        tempUserPower = await dao.getPowerPercent(defaultAccount);
      } catch {
        tempUserPower = 0;
      }
      let stackerId = await stkMerc.stackerID(defaultAccount);
      let tempDelegation = await dao.stackerDelegation(stackerId);
      let tempDividends = await dao.dividends(defaultAccount);

      let tempDaoInfos = await dao.daoInfos();
      let tempPayoutRatio = await dao.payoutRatio();

      let result = await usdc.balanceOf(daoAddress);
      let tempLastEarnings = Number(result) - (Number(tempDaoInfos[0]) + Number(tempDaoInfos[1]));

      let tempAffiliateFees = await affiliate.affiliateFees();
      
      setMercHolding((Number(tempMercHolding) / mercDecimal).toFixed(2) + " MERC");
      setStkMercHolding((Number(tempStkMercHolding) / mercDecimal).toFixed(2) + " stkMERC");
      setUserPower(tempUserPower + " %");
      setUserDividends((Number(tempDividends) / usdcDecimal).toFixed(2) + " USDC");

      if (tempDelegation === "0x0000000000000000000000000000000000000000") {
        setUserDelegation("None");
      } else {
        setUserDelegation(tempDelegation);
      }

      setDaoReserve((Number(tempDaoInfos[0]) / usdcDecimal).toFixed(2) + " USDC");
      setDaoDividends((Number(tempDaoInfos[1]) / usdcDecimal).toFixed(2) + " USDC");
      setPayoutRatio(tempPayoutRatio + " %");
      setLastEarnings((Number(tempLastEarnings) / usdcDecimal).toFixed(2) + " USDC");
      setAffiliateFees(tempAffiliateFees +" %");

      setLoadingPage(null);
    }

    const stake = async () => {
      let data = document.getElementById("amoutInput").value;
      let amount = BigInt(data * 10**18);

      let userAddress = await signer.getAddress();

      let allowance = BigInt(await merc.allowance(userAddress, daoAddress));

      if (allowance < amount) {

        let approval = await merc.approve(daoAddress, amount);
        setTransactionHash(approval.hash);
        setUserInfos("Pending approval");
        let approvalReceipt = await approval.wait();
        setUserInfos("Approval confirmed");
        console.log(approvalReceipt);

        let stake = await dao.stack(amount);
        setTransactionHash(stake.hash);
        setUserInfos("Pending transaction");
        let stakeReceipt = await stake.wait();
        setUserInfos("Transaction confirmed")
        console.log(stakeReceipt);

      } else {

        let stake = await dao.stack(amount);
        setTransactionHash(stake.hash);
        setUserInfos("Pending transaction");
        let stakeReceipt = await stake.wait();
        setUserInfos("Transaction confirmed")
        console.log(stakeReceipt);

      }

    }

    const unstake = async () => {
      let data = document.getElementById("amoutInput").value;

      let amount = BigInt(data * 10**18);

      let tx = await dao.unstack(amount);

      setTransactionHash(tx.hash);
    }

    const unlock = async () => {

      let tx = await dao.startLockingPeriod();

      setTransactionHash(tx.hash);
    }

    const claim = async () => {

      let tx = await dao.claim();

      setTransactionHash(tx.hash);
    }

    const delegate = async () => {
      let data = document.getElementById("addressInput").value;

      let tx = await dao.setDelegation(data);

      setTransactionHash(tx.hash);
    }

    const revoke = async () => {
      let data = document.getElementById("addressInput").value;

      let tx = await dao.revokeDelegation(data);

      setTransactionHash(tx.hash);
    }

    const dispatch = async () => {

      let tx = await dao.dispatchRewards();

      setTransactionHash(tx.hash);
    }
    
    return (
      <div class="dashboardPage">
        <main>
          {loadingPage}
          <div class="firstDashboardBox">
            <div class="boxTitle">Account</div>
            <div class="leftPart">
              <div class="analyticsSpace">
                <div class="analyticsSubTitle">MERC Holding :</div>
                <div class="analyticsInfos">{mercHolding}</div>
              </div>
              <div class="analyticsSpace">
                <div class="analyticsSubTitle">stkMERC Holding :</div>
                <div class="analyticsInfos">{stkMercHolding}</div>
              </div>
              <div class="analyticsSpace">
                <div class="analyticsSubTitle">Power :</div>
                <div class="analyticsInfos">{userPower}</div>
              </div>
              <input type="text" placeholder="Amount" id="amoutInput"/>
              <div class="leftButtonSpace">
                <button class="leftButton" type="button" onClick={() => stake()}>Stake</button>
                <button class="leftButton" type="button" onClick={() => unstake()}>Unstake</button>
                <button class="leftButton" type="button" onClick={() => unlock()}>Unlock</button>                
              </div>
            </div>
            <div class="rightPart">
              <div class="analyticsSpace">
                <div class="analyticsSubTitle">Vote Delegation :</div>
                <div class="analyticsInfos">{userDelegation}</div>
              </div>
              <div class="analyticsSpace">
                <div class="analyticsSubTitle">Dividends :</div>
                <div class="analyticsInfosDividends">{userDividends}</div>
                <div class="claimButton" onClick={() => claim()}>Claim</div>
              </div>
              <div class="analyticsSpace">
                <div class="analyticsSubTitle">APR :</div>
                <div class="analyticsInfos">6 %</div>
              </div> 
              <input type="text" placeholder="Address" id="addressInput"/>
              <div class="rightButtonSpace">
                <button class="rightButton" type="button" onClick={() => delegate()}>Delegate</button>
                <button class="rightButton" type="button" onClick={() => revoke()}>Revoke</button>
              </div>             
            </div>
          </div>
          <div class="secondDashboardBox">
            <div class="boxTitle">DAO</div>
            <div class="leftPart">
              <div class="analyticsSpace">
                <div class="analyticsSubTitle">Reserve :</div>
                <div class="analyticsInfos">{daoReserve}</div>
              </div>
              <div class="analyticsSpace">
                <div class="analyticsSubTitle">Dividends :</div>
                <div class="analyticsInfos">{daoDividends}</div>
              </div>
              <div class="analyticsSpace">
                <div class="analyticsSubTitle">Payout Ratio :</div>
                <div class="analyticsInfos">{payoutRatio}</div>
              </div>
            </div>
            <div class="rightPart">
              <div class="analyticsSpace">
                <div class="analyticsSubTitle">Last Earnings :</div>
                <div class="analyticsInfosEarnings">{lastEarnings}</div>
                <div class="dispatchButton" onClick={() => dispatch()}>Dispatch</div>
              </div>
              <div class="analyticsSpace">
                <div class="analyticsSubTitle">Affiliate Fees :</div>
                <div class="analyticsInfos">{affiliateFees}</div>
              </div>
              <div class="needSpace"></div>          
            </div>
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

  /// GOVERNANCE PAGE
  const GovernancePage = () => {

    useEffect(()=>{
      getInfos();
    } , [] );

    const [loadingPage, setLoadingPage] = useState(<div class="loader"></div>);
    const [transactionHash, setTransactionHash] = useState("");
    const [userPower, setUserPower] = useState(null);
    const [powerPercentNeeded, setPowerPercentNeeded] = useState(null);

    const getInfos = async () => {

      let tempUserPower;    
      try{
        tempUserPower = await dao.getPowerPercent(defaultAccount);
      } catch {
        tempUserPower = 0;
      }

      let tempPowerNeeded = await dao.powerPercentNeeded()

      setUserPower(tempUserPower + " %");
      setPowerPercentNeeded(tempPowerNeeded + " %");

      setLoadingPage(null);
    }

    const sendEth = async () => {
      let address = document.getElementById("sendEthAddress").value;
      let data = document.getElementById("sendEthAmount").value;
      let amount = BigInt(data * 10**18);
      let tx = await dao.sendETH(address, amount);
      setTransactionHash(tx.hash);
    }

    const sendUsdc = async () => {
      let address = document.getElementById("sendUsdcAddress").value;
      let data = document.getElementById("sendUsdcAmount").value;
      let amount = BigInt(data * 10**6);
      let tx = await dao.sendUsdc(address, amount);
      setTransactionHash(tx.hash);
    }

    const setPayoutRatio = async () => {
      let data = document.getElementById("setPayoutAmount").value;
      let tx = await dao.setPayoutRatio(data);
      setTransactionHash(tx.hash);
    }

    const setLockingPeriod = async () => {
      let data = document.getElementById("setLockingAmount").value;
      let tx = await dao.setLockingPeriod(data);
      setTransactionHash(tx.hash);
    }

    const setPowerNeeded = async () => {
      let data = document.getElementById("setPowerAmount").value;
      let tx = await dao.setPowerPercentNeeded(data);
      setTransactionHash(tx.hash);
    }

    const refundEth = async () => {
      let tx = await dao.refundETH();
      setTransactionHash(tx.hash);
    }

    const setFees = async () => {
      let data = document.getElementById("setFeesAmount").value;
      let tx = await dao.setFees(data);
      setTransactionHash(tx.hash);
    }

    const addWhitelist = async () => {
      let tokenAddress = document.getElementById("addWhitelistAddress").value;
      let oracleAddress = document.getElementById("addWhitelistOracleAddress").value;
      let poolFees = document.getElementById("poolFees").value;
      let tx = await dao.addWhitelistedToken(tokenAddress, oracleAddress, poolFees);
      setTransactionHash(tx.hash);
    }

    const removeWhitelist = async () => {
      let tokenAddress = document.getElementById("removeWhitelistAddress").value;
      let tx = await dao.removeWhitelistedToken(tokenAddress);
      setTransactionHash(tx.hash);
    }

    const addAffiliate = async () => {
      let data = document.getElementById("addAffiliateAddress").value;
      let tx = await dao.addAffiliate(data);
      setTransactionHash(tx.hash);
    }

    const removeAffiliate = async () => {
      let data = document.getElementById("removeAffiliateAddress").value;
      let tx = await dao.removeAffiliate(data);
      setTransactionHash(tx.hash);
    }

    const setAffiliateFees = async () => {
      let data = document.getElementById("affiliateFeesAmount").value;
      let tx = await dao.setAffiliateFees(data);
      setTransactionHash(tx.hash);
    }

    const setA = async () => {
      let data = document.getElementById("pricerAmount").value;
      let tx = await dao.setA(data);
      setTransactionHash(tx.hash);
    }

    const setB = async () => {
      let data = document.getElementById("pricerAmount").value;
      let tx = await dao.setB(data);
      setTransactionHash(tx.hash);
    }

    const setC = async () => {
      let data = document.getElementById("pricerAmount").value;
      let tx = await dao.setC(data);
      setTransactionHash(tx.hash);
    }

    const setD = async () => {
      let data = document.getElementById("pricerAmount").value;
      let tx = await dao.setD(data);
      setTransactionHash(tx.hash);
    }

    const setF = async () => {
      let data = document.getElementById("pricerAmount").value;
      let tx = await dao.setF(data);
      setTransactionHash(tx.hash);
    }

    const setK = async () => {
      let data = document.getElementById("pricerAmount").value;
      let tx = await dao.setK(data);
      setTransactionHash(tx.hash);
    }

    const setT = async () => {
      let data = document.getElementById("pricerAmount").value;
      let tx = await dao.setT(data);
      setTransactionHash(tx.hash);
    }

    const sett = async () => {
      let data = document.getElementById("pricerAmount").value;
      let tx = await dao.sett(data);
      setTransactionHash(tx.hash);
    }

    const setQ = async () => {
      let data = document.getElementById("pricerAmount").value;
      let tx = await dao.setQ(data);
      setTransactionHash(tx.hash);
    }

    const setU = async () => {
      let data = document.getElementById("pricerAmount").value;
      let tx = await dao.setU(data);
      setTransactionHash(tx.hash);
    }

    const setP = async () => {
      let data = document.getElementById("pricerAmount").value;
      let tx = await dao.setP(data);
      setTransactionHash(tx.hash);
    }

    return (
      <div class="governancePage">
        <main>
          {loadingPage}
          <div class="governanceBox">
            <div class="leftPartInfos">
              <div class="analyticsSpace">
                <div class="analyticsSubTitle">Power :</div>
                <div class="analyticsInfos">{userPower}</div>
              </div>
            </div>
            <div class="rightPartInfos">
              <div class="analyticsSpace">
                <div class="analyticsSubTitle">Power Needed :</div>
                <div class="analyticsInfos">{powerPercentNeeded}</div>
              </div>
            </div>
            <div class="leftSpace">
              <div class="contractBox">
                <div class="contractBoxTitle">DAO</div>
                <div class="inputSpace">
                  <button class ="governanceButton" type="button" onClick={() => sendEth()}>Send ETH</button>
                  <input class="doubleInput" type="text" placeholder="Address" id="sendEthAddress"/>
                  <input class="doubleInput" type="text" placeholder="Amount" id="sendEthAmount"/>
                </div>
                <div class="inputSpace">
                  <button class ="governanceButton" type="button" onClick={() => sendUsdc()}>Send USDC</button>
                  <input class="doubleInput" type="text" placeholder="Address" id="sendUsdcAddress"/>
                  <input class="doubleInput" type="text" placeholder="Amount" id="sendUsdcAmount"/>
                </div>
                <div class="inputSpace">
                  <button class ="governanceButton" type="button" onClick={() => setPayoutRatio()}>Set payout ratio</button>
                  <input class="simpleInput" type="text" placeholder="Amount" id="setPayoutAmount"/>
                </div>
                <div class="inputSpace">
                  <button class ="governanceButton" type="button" onClick={() => setLockingPeriod()}>Set locking period</button>
                  <input class="simpleInput" type="text" placeholder="Amount" id="setLockingAmount"/>
                </div>
                <div class="inputSpace">
                  <button class ="governanceButton" type="button" onClick={() => setPowerNeeded()}>Set power needed</button>
                  <input class="simpleInput" type="text" placeholder="Amount" id="setPowerAmount"/>
                </div>
              </div>

              <div class="contractBox">
                <div class="contractBoxTitle">HMM</div>
                <div class="inputSpace">
                  <button class ="governanceButton" type="button" onClick={() => refundEth()}>Refund ETH</button>
                </div>
                <div class="inputSpace">
                  <button class ="governanceButton" type="button" onClick={() => setFees()}>Set fees</button>
                  <input class="simpleInput" type="text" placeholder="Amount" id="setFeesAmount"/>
                </div>
                <div class="inputSpace">
                  <button class ="governanceButton" type="button" onClick={() => addWhitelist()}>Add whitelist</button>
                  <input class="tripleInput" type="text" placeholder="Address" id="addWhitelistAddress"/>
                  <input class="tripleInput" type="text" placeholder="Address" id="addWhitelistOracleAddress"/>
                  <input class="tripleInput" type="text" placeholder="Amount" id="poolFees"/>
                </div>
                <div class="inputSpace">
                  <button class ="governanceButton" type="button" onClick={() => removeWhitelist()}>Remove whitelist</button>
                  <input class="simpleInput" type="text" placeholder="Address" id="removeWhitelistAddress"/>
                </div>
              </div>         
            </div>

            <div class="rightSpace">
              <div class="contractBox">
                <div class="contractBoxTitle">Affiliate</div>
                <div class="inputSpace">
                  <button class ="governanceButton" type="button" onClick={() => addAffiliate()}>Add affiliate</button>
                  <input class="simpleInput" type="text" placeholder="Address" id="addAffiliateAddress"/>
                </div>
                <div class="inputSpace">
                  <button class ="governanceButton" type="button" onClick={() => removeAffiliate()}>Remove affiliate</button>
                  <input class="simpleInput" type="text" placeholder="Address" id="removeAffiliateAddress"/>
                </div>
                <div class="inputSpace">
                  <button class ="governanceButton" type="button" onClick={() => setAffiliateFees()}>Set Affiliate fees</button>
                  <input class="simpleInput" type="text" placeholder="Amount" id="affiliateFeesAmount"/>
                </div>
              </div>

              <div class="contractBox">
                <div class="contractBoxTitle">Pricer</div>
                <div class="inputSpace">
                  <input class="simpleInput" type="text" placeholder="Amount" id="pricerAmount"/>
                </div>
                <div class="inputSpace">
                  <button class ="governanceButton" type="button" onClick={() => setA()}>Set A</button>
                  <button class ="governanceButton" type="button" onClick={() => setB()}>Set B</button>
                  <button class ="governanceButton" type="button" onClick={() => setC()}>Set C</button>
                </div>
                <div class="inputSpace">
                  <button class ="governanceButton" type="button" onClick={() => setD()}>Set D</button>
                  <button class ="governanceButton" type="button" onClick={() => setF()}>Set F</button>
                  <button class ="governanceButton" type="button" onClick={() => setK()}>Set K</button>
                </div>
                <div class="inputSpace">
                  <button class ="governanceButton" type="button" onClick={() => setT()}>Set T</button>
                  <button class ="governanceButton" type="button" onClick={() => setQ()}>Set Q</button>
                  <button class ="governanceButton" type="button" onClick={() => setU()}>Set U</button>
                </div>
                <div class="inputSpace">
                  <button class ="governanceButton" type="button" onClick={() => setP()}>Set P</button>
                  <button class ="governanceButton" type="button" onClick={() => sett()}>Set t</button>
                </div>
              </div>         
            </div>
          </div>
        </main>
        <footer>
          <div class="userInfos">
            <a id="hashLink" href={"https://polygonscan.com/tx/" + transactionHash} target="_blank">{transactionHash}</a>
          </div>
        </footer>
      </div>
    )
  }

  const Body = () => {
    if (activePage === 1) {
      return <InformationPage/>
    }
    if (activePage === 2) {
      return <DashboardPage/>
    }
    if (activePage === 3) {
      return <GovernancePage/>
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
