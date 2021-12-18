import { useEffect, useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { ethers } from 'ethers'
import myEpicNft from '../utils/MyEpicNFT.json'
import Mining from '../components/Mining'
// import styles from '../styles/Home.module.css'

import twitterLogo from '../public/twitter-logo.svg'

// Constants
const TWITTER_HANDLE = 'austinbcodes';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const BUILDSPACE_TWITTER_HANDLE = '_buildspace';
const OPENSEA_LINK = '';
const TOTAL_MINT_COUNT = 5;

const CONTRACT_ADDRESS = "0x76C4585Dd5776095219a71131911e696a63dACc5";

const Home: NextPage = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [totalNFTsMintedSoFar, setTotalNFTsMintedSoFar] = useState(0)
  const [mining, setMining] = useState(false)
  
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
    } else {
        console.log("We have the ethereum object", ethereum);
    }

    /*
    * Check if we're authorized to access the user's wallet
    */
    const accounts = await ethereum.request({ method: 'eth_accounts' });

    /*
    * User can have multiple authorized accounts, we grab the first one if its there!
    */
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account)
      // Setup listener! This is for the case where a user comes to our site
      // and ALREADY had their wallet connected + authorized.
      setupEventListener()
    } else {
      console.log("No authorized account found")
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window; // metamask injects the 'ethereum' object into our window object

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      /*
      * Fancy method to request access to account.
      */
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      /*
      * Boom! This should print out public address once we authorize Metamask.
      */
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener()
    } catch (error) {
      console.log(error)
    }
  }

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        // Get total NFTs minted so far...
        const totalNFTsMintedSoFar = await connectedContract.getTotalNFTsMintedSoFar()
        if (totalNFTsMintedSoFar > 0) {
          setTotalNFTsMintedSoFar(totalNFTsMintedSoFar)
        }

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", async (from, tokenId) => {
          console.log(from, tokenId.toNumber())
          const newTotalNFTsMintedSoFar = await connectedContract.getTotalNFTsMintedSoFar()
          setTotalNFTsMintedSoFar(newTotalNFTsMintedSoFar)
          alert(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on Rarible. Here's the link: https://rinkeby.rarible.com/token/${CONTRACT_ADDRESS}:${tokenId.toNumber()}`)
        });

        console.log("Setup event listener!")

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      let chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log("Connected to chain " + chainId);

      // String, hex code of the chainId of the Rinkebey test network
      const rinkebyChainId = "0x4";
      // IDs of other chains - https://docs.metamask.io/guide/ethereum-provider.html#chain-ids
      if (chainId !== rinkebyChainId) {
        alert("You are not connected to the Rinkeby Test Network!");
        throw new Error('not connected to the Rinkeby Test Network')
      }
  
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);
  
        console.log("Going to pop wallet now to pay gas...")
        let nftTxn = await connectedContract.makeAnEpicNFT();
  
        console.log("Mining...please wait.")
        setMining(true)
        await nftTxn.wait();
        console.log(nftTxn);
        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
  
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    } finally {
      setMining(false)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  const renderMintUI = () => (
    <>
      <div>
        <p className="sub-text">{`${totalNFTsMintedSoFar}/${TOTAL_MINT_COUNT} tokens minted so far`}</p>
        <button onClick={askContractToMintNft} disabled={mining} className="cta-button connect-wallet-button">
          Mint NFT
        </button>
      </div>
      {mining && <Mining />}
    </>
  )

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {currentAccount === "" ? renderNotConnectedContainer() : renderMintUI()}
        </div>
        <div className="footer-container">
          <Image alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
          <p className="footer-buildspace-attribution-text">{`following a @${BUILDSPACE_TWITTER_HANDLE} project`}</p>
        </div>
      </div>
    </div>
  );
}

export default Home