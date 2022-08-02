import React, {useState, useEffect} from 'react';
import axios from 'axios';
import './App.css';
import Logo from './images/Logo.png';
//import Twitter from './images/icons8-twitter-30.png';
import Twitter from './images/Twitter.png';
import Telegram from './images/Telegram.png';
import Discord from './images/Discord-Logo-Black.png';
import Youtube from './images/Youtube.png';
import ethLogo from './images/Ethereum.png';
import btcLogo from './images/Bitcoin.png';
import questionLogo from './images/question-line.png';

/* global BigInt */

function App() {

  useEffect(()=>{
    setActivePage(1);
  } , [] );

  ////////// BASE VARIABLES //////////

  const [activePage, setActivePage] = useState(null);
	const [errorMessage, setErrorMessage] = useState(<div id="errorMessage">Please connect your Metamask Wallet</div>);

  ////////// PAGES //////////

  const Header = () => {

    return(
      <header>
          <div class={`spaceLogo ${activePage === 1 ? "active" : ""}`} onClick={() => setActivePage(1)}><img id="logo" src={Logo}/></div>
          <a class={`governance ${activePage != 1 ? "mobileHiden" : ""}`} href="http://gov.mercantileservices.xyz" target="blank">Governance</a>
          <a class={`browse ${activePage != 1 ? "mobileHiden" : ""}`} href="https://mercantile-services.gitbook.io/docs/" target="blank">Docs</a>
          <a class={`browse ${activePage != 1 ? "mobileHiden" : ""}`} href="https://medium.com/@mercantile.services" target="blank">Blog</a>
          <div class={`browse ${activePage != 1 ? "mobileHiden" : ""} ${activePage === 3 ? "active" : ""}`} id="faqButton" onClick={() => setActivePage(3)}>FAQ</div>
          <div class={`browse ${activePage != 1 ? "mobileHiden" : ""} ${activePage === 4 ? "active" : ""}`} id="jobsButton" onClick={() => setActivePage(4)}>Jobs</div>
          <div class={`browse ${activePage != 1 ? "mobileHiden" : ""} ${activePage === 2 ? "active" : ""}`} id="backtestButton" onClick={() => setActivePage(2)}>Backtest</div>
          <a class={`lauchApp ${activePage != 1 ? "mobileHiden" : ""}`} href="http://app.mercantileservices.xyz">Lauch App</a>
      </header>
      
    )
  }

  /// LANDING PAGE
  const LandingPage = () => {

    return (
      <div class="landingPage">
        <main>
            <div class="nom">Mercantile Services</div>
        </main>

        <footer>
            <div class="spitchBox">
                <div class="text1">Enter the next generation options market.
                </div>
                <div class="socialLogos">
                    <a href="https://twitter.com/MercantServices" target="blank"><img id="twitter" src={Twitter}/></a>
                    <a href="https://t.me/+Jf8oy5Ufo19jOTA0" target="blank"><img id="telegram" src={Telegram}/></a>
                    <a href="https://www.youtube.com/channel/UCqvvFz6SIKNZRUi78WCva6w/featured" target="blank"><img id="telegram" src={Youtube}/></a>
                </div>
            </div>

            <div class="affiliateBox">
                <div class="text2">Want to become an affiliate ?</div>
                <a class="text3" href="https://mercantile-services.gitbook.io/docs/getting-started/become-affiliate" target="blank">Read this.</a>
            </div>
        </footer>
        <script src="app.js"></script>
            
      </div>
    )
  }

  /// BUY PAGE
  const BacktestPage = () => {

    const [activeType, setActiveType] = useState(1);    
    const [premium, setPremium] = useState(null);
    const [refundable, setRefundable] = useState(null);
    const [earnings, setEarnings] = useState(null);
    const [receive, setReceive] = useState(null);
    //const [roi, setRoi] = useState(null);

    function getAPR(_seconds, _v) {
      let a = 0.4;
      let b = 10;
      let c = 1;
      let d = 0.04;
      let f = 1.3;
      let k = 0.1;
      let q = 1;
      let u = 3;
      let p = 4;
      let o = 0.5;
      let T = 31536000;

      let liquidity = (a*(1 / o))**q;

      let distance = ((1/(b*_v + 1))**(((T-_seconds)/T)**u)) - f*_v;

      let time = c * ((T-_seconds)/T)**p;

      let APR = liquidity * (distance * time + k) + d;

      return APR;

    }

    async function getPremium() {

      let Date1 = new Date(document.getElementById("Date1").value);
      let day = Date1.getDate();
      let month = Date1.getMonth()+1;
      let year = Date1.getFullYear();
      let coingeckoDate = `${day}-${month}-${year}`
      let startDate = (Math.floor(Date1.getTime() / 1000)).toString();

      let amount = document.getElementById("amountInput").value;
      let strike = document.getElementById("strikeInput").value;
      let expirationInput = new Date(document.getElementById("expirationInput").value);
      let expiration = (Math.floor(expirationInput.getTime() / 1000)).toString();

      let result = await axios.get(`https://api.coingecko.com/api/v3/coins/ethereum/history?date=${coingeckoDate}`);
      let currentPrice = result.data.market_data.current_price.usd.toFixed(2);      

      let _s = expiration - startDate;
      let _v;

      if (activeType === 1) {
        _v = (strike - currentPrice)/currentPrice;
      } else {
        _v = (currentPrice - strike)/currentPrice;
      }

      let APR = getAPR(_s, _v);
      console.log(APR);

      let PremiumYear = APR * strike;
      let PremiumDuration = PremiumYear * (_s/31536000);
      let Premium = (PremiumDuration * amount).toFixed(2);

      if (activeType === 1) {
        if (strike < currentPrice && strike != 0) {
          Premium = "Strike Price must be higher than the current price"
        }
      } else {
        if (strike > currentPrice && strike != 0) {
          Premium = "Strike Price must be lower than the current price"
        }
      }

      if (expiration <= startDate || expiration - startDate > 31536000) {
        Premium = "Wrong expiration date..."
      }

      if (Premium == "NaN") {
        Premium = "..."
      }

      setPremium(`${Premium} $`);

      return {Premium, strike, amount};

    }

    async function getInfos() {

      let result = await getPremium();

      let Date1 = new Date(document.getElementById("Date1").value);
      let startDate = (Math.floor(Date1.getTime() / 1000)).toString();

      let Date2 = new Date(document.getElementById("Date2").value);
      let day = Date2.getDate();
      let month = Date2.getMonth()+1;
      let year = Date2.getFullYear();
      let coingeckoDate = `${day}-${month}-${year}`
      let executionDate = (Math.floor(Date2.getTime() / 1000)).toString();

      let data = await axios.get(`https://api.coingecko.com/api/v3/coins/ethereum/history?date=${coingeckoDate}`);
      let currentPrice2 = data.data.market_data.current_price.usd.toFixed(2);

      let expirationInput = new Date(document.getElementById("expirationInput").value);
      let expiration = (Math.floor(expirationInput.getTime() / 1000)).toString();

      let age = executionDate - startDate;

      let duration = expiration - startDate;

      let proportion = age / duration;

      let refundable = (result.Premium * (1-proportion)).toFixed(2);

      let earnings;

      if (activeType === 1) {
        earnings = ((currentPrice2 - result.strike) * result.amount).toFixed(2);
      } else {
        earnings = ((result.strike - currentPrice2) * result.amount).toFixed(2);
      }
      

      if (proportion > 1) {
        refundable = 0
      }

      if (earnings < 0) {
        earnings = 0
      }

      let receive = (Number(earnings) + Number(refundable)).toFixed(2);

      //let roi = (((receive/result.Premium) - 1) * 100).toFixed(2);

      if (result.strike == 0) {
        earnings = "..."
      }

      if (refundable == "NaN") {
        refundable = "..."
      }

      if (receive == "NaN") {
        receive = "..."
      }

      setRefundable(`${refundable} $`);
      setEarnings(`${earnings} $`);
      setReceive(`${receive} $`);
      //setRoi(`${roi} %`);

    }


    return (
      <div class="backtestPage">
        <main>
          <div class="dateSpace">
            <div id="startInput">
              <div class="dateTitle">Start date :</div>
              <input class="dateInput" id="Date1" type="date" name="start" placeholder="dd/mm/yy" onChange={() => {getPremium() ; getInfos()}}/>
            </div>
            <div class="typeBox">
              <div class={`callType ${activeType === 1 ? "activeCall" : ""}`} onClick={() => setActiveType(1)}>Call</div>
              <div class={`putType ${activeType === 2 ? "activePut" : ""}`} onClick={() => setActiveType(2)}>Put</div>
            </div>
            <div id="executionInput">
            <div class="dateTitle">Execution date :</div>
              <input class="dateInput" id="Date2" type="date" name="execution" placeholder="dd/mm/yy" onChange={getInfos}/>
            </div>
          </div>
          <div class="buyBox">
            <form class="form" onChange={() => {getPremium() ; getInfos()}}>
              <label class="labelAmount">
                <div class="labelName">Amount :</div>
                <input id="amountInput" type="text" name="amount" placeholder="0.00"/>
              </label>
              <select class="select" name="assets" id="asset-select">
                  <option id="eth" value="0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619">ETH</option>
              </select>
              <label class="label">
              <div class="labelName">Strike Price :</div>
                <input class="input" id="strikeInput" type="text" name="strike" placeholder="0.00 $"/>
              </label>
              <label class="label">
              <div class="labelName">Expiration :</div>
                <input class="input" id="expirationInput" type="date" name="expiration" placeholder="(1 year max) dd/mm/yy"/>
              </label>
              <div class="premiumContainer">
                <div class="premium">Premium :</div>
                <div class="resultPremium">{premium}</div>
              </div>
            </form>
          </div>
          <div class="resultBox">
            <div class="dashboardTitle">Contracts</div>
              <div class="infoSpace">
                <div class="refundableSubTitle">Refundable :</div>
                <div class="resultInfos">{refundable}</div>
              </div>
              <div class="infoSpace">
                <div class="earningSubTitle">Earnings :</div>
                <div class="resultInfos">{earnings}</div>
              </div>
              <div class="infoSpace">
                <div class="receiveSubTitle">Receive :</div>
                <div class="resultInfos">{receive}</div>
              </div>
          </div>
          <iframe src="https://charts.cointrader.pro/charts.html?coin=ETHEREUM%3AUSD" class="chart" ></iframe>
        </main>
      </div>
    )
  }


  
  /// FAQ PAGE
  const FaqPage = () => {

    return (
      <div class="faqPage">
        <main>
          <div class="faqText">
            <h1>Frequently Asked Questions</h1>
            <br/>
            <h2>What is Mercantile Services ?</h2>
            Mercantile Services is a decentralized application allowing to achieve financial compromises between two types of investor (contract buyers & liquidity providers).<br/>
            <br/>
            Contract buyers use the liquidity provided by liquidity providers to lock in the price of an asset for a desired duration in exchange for a premium.
            <br/>
            <br/>
            <h2>How do I use the Mercantile Services ?</h2>
            To <b>buy a contract</b>, go to the application, connect a Web3 wallet then go to the “Buy” tab. You will be able to fill in every detail of the desired contract.<br/>
            <br/>
            To <b>provide liquidity</b>, go to the “Earn” tab and fill in the amount you wish to deposit.<br/>
            <br/>
            In the “Dashboard” tab you will find all the information relating to the contracts you have purchased but also for your deposits
            <br/>
            <br/>
            <h2>How Mercantile Services works ?</h2>
            Let’s take an example, a contract buyer wants to keep the bitcoin price at $41 000 for 300 days (with a current bitcoin price of $40 000) and for an amount of 1 bitcoin. <br/>
            The liquidity pool will lock $41 000 for 300 days and will no longer be withdrawable by liquidity providers. If the price of bitcoin reaches $41 000 then the pool trades $41 000 for 1 bitcoin. If the price drops back to $41 000, the pool trades bitcoin for $41 000.<br/>
            <br/>
            If during the 300 days, the bitcoin reaches $100 000, the buyer will be able to exercise his contract and will receive the profits ($59 000).<br/>
            If the contract reaches its term with a bitcoin price below $41 000, the buyer of the contracts has gained nothing, but will only have lost the premium.<br/>
            <br/>
            In both cases, the liquidity providers lost nothing, and earned the premium.     
          </div>

          <div class="faqNom">Mercantile Services</div>

        </main>    
      </div>
    )
  }
  
  /// JOBS PAGE
  const JobsPage = () => {
    
    return (
      <div className="jobsPage">
        <main>
          <div class="jobsText">
              <h1>Mercantile Services Labs</h1>
              <br/>
              Mercantile Services Labs is the originator of the Mercantile Services protocol.<br/>
              <br/>
              We are looking for motivated profiles to help us move forward on the main product but also to build more services within the protocol.<br/>
              <br/>
              We are currently working 100% remotely.<br/>
              <br/>
              <h2>Current jobs openings</h2>
              Detailed soon...
          </div>

          <div class="jobsNom">Mercantile Services</div>
            
        </main>
        
      </div>
    )
  }

  const Body = () => {
    if (activePage === 1) {
      return <LandingPage/>
    }
    if (activePage === 2) {
      return <BacktestPage/>
    }
    if (activePage === 3) {
      return <FaqPage/>
    }
    if (activePage === 4) {
      return <JobsPage/>
    }
  }

  ////////// HTML //////////

  return (
    <div class="myApp">
      
      <Header/>

      <Body/>

    </div>
  );
}

export default App;

