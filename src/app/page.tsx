"use client"

import abi from '../utils/BuyMeACoffee.json';
import { ethers } from "ethers";
import Head from 'next/head'
import Image from 'next/image';
import React, { useEffect, useState } from "react";

export default function Home() {
  // Contract Address & ABI
  const contractAddress = "0x24085235faE69308f0048f2EbCb17C42Ff48E9a9";
  const contractABI = abi.abi;

  // Component state
  const [currentAccount, setCurrentAccount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [memos, setMemos] = useState<any>([]);

  const onNameChange = (event: any) => {
    setName(event.target.value);
  }

  const onMessageChange = (event: any) => {
    setMessage(event.target.value);
  }

  // Wallet connection logic
  const isWalletConnected = async () => {
    try {
      const { ethereum } = window as any;

      const accounts = await ethereum.request({method: 'eth_accounts'})
      console.log("accounts: ", accounts);

      if (accounts.length > 0) {
        const account = accounts[0];
        console.log("wallet is connected! " + account);
      } else {
        console.log("make sure MetaMask is connected");
      }
    } catch (error) {
      console.log("error: ", error);
    }
  }

  const connectWallet = async () => {
    try {
      const {ethereum} = window as any;

      if (!ethereum) {
        console.log("please install MetaMask");
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }

  const buyCoffee = async () => {
    try {
      const {ethereum} = window as any;

      if (ethereum) {
        const provider = new ethers.BrowserProvider(ethereum, "any");
        const signer = await provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("buying coffee..")
        const coffeeTxn = await buyMeACoffee.buyCoffee(
          name ? name : "anon",
          message ? message : "Enjoy your coffee!",
          {value: ethers.parseEther("0.001")}
        );

        await coffeeTxn.wait();

        console.log("mined ", coffeeTxn.hash);

        console.log("coffee purchased!");

        // Clear the form fields.
        setName("");
        setMessage("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Function to fetch all memos stored on-chain.
  const getMemos = async () => {
    try {
      const { ethereum } = window as any;
      if (ethereum) {
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        
        console.log("fetching memos from the blockchain..");
        const memos = await buyMeACoffee.getMemos();
        console.log("fetched!");
        setMemos(memos);
      } else {
        console.log("Metamask is not connected");
      }
      
    } catch (error) {
      console.log(error);
    }
  };
  
  useEffect(() => {
    let buyMeACoffee: ethers.Contract;
    isWalletConnected();
    getMemos();

    // Create an event handler function for when someone sends
    // us a new memo.
    const onNewMemo = (from: any, timestamp: number, name: any, message: any) => {
      console.log("Memo received: ", from, timestamp, name, message);
      setMemos((prevState: any) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message,
          name
        }
      ]);
    };

    const {ethereum} = window as any;

    const fetchData = async () => {
      const provider = new ethers.BrowserProvider(ethereum, "any");
      const signer = await provider.getSigner();
      buyMeACoffee = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      buyMeACoffee.on("NewMemo", onNewMemo);
    }

    // Listen for new memo events.
    if (ethereum) {
      fetchData();
    }

    return () => {
      if (buyMeACoffee) {
        buyMeACoffee.off("NewMemo", onNewMemo);
      }
    }
  }, []);

  return (
    <div className="mx-auto lg:w-6/12 w-full py-20 px-4">
      <Head>
        <title>Buy Harry Duong a Coffee!</title>
        <meta name="description" content="Tipping site" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
      <div className="w-20 h-20 rounded-full relative overflow-hidden"><Image fill src="/harryduong.jpeg" alt='' /></div>
        <h1 className="text-2xl">
          Buy Harry Duong a Coffee!
        </h1>
        
        {currentAccount ? (
          <div>
            <form>
              <div>
                <label>
                  Name
                </label>
                <br/>
                
                <input
                  className="w-full mt-1 border rounded-md p-2"
                  id="name"
                  type="text"
                  placeholder="Please type your name"
                  onChange={onNameChange}
                  />
              </div>
              <br/>
              <div>
                <label>
                  Send Harry Duong a message
                </label>
                <br/>

                <textarea
                  className="w-full mt-1 border rounded-md p-2"
                  placeholder="Enjoy your coffee!"
                  id="message"
                  onChange={onMessageChange}
                  required
                >
                </textarea>
              </div>
              <div>
                <button
                  className="rounded-md px-5 py-2 bg-teal-400 text-white mt-4"
                  type="button"
                  onClick={buyCoffee}
                >
                  &#x24; Send 1 Coffee for 0.001 ETH
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button className="rounded-md px-3 py-2 bg-teal-500 text-white mt-4" onClick={connectWallet}> Connect your wallet </button>
        )}
      </main>

      {currentAccount && (<h1 className="font-bold mt-10 mb-3">Coffee received:</h1>)}

      {currentAccount && (memos.map((memo: { message: any; name: any; timestamp: { toString: () => any }; }, idx: any) => {
        return (
          <div key={idx} className="border rounded-md p-2">
            <p>Message: <span className="font-bold">{memo.message}</span> </p>
            <p>From: {memo.name}</p>
          </div>
        )
      }))}

      <footer>
      </footer>
    </div>
  )
}
