import React, {useEffect, useState} from "react";
import './App.css';
import {BigNumber, ethers} from "ethers";
import abi from "./utils/WavePortal.json"

interface Wave {
    waver: string;
    message: string;
    timestamp: BigNumber;
}

interface ParsedWave extends Omit<Wave, 'timestamp'> {
    timestamp: Date;
}

export default function App() {

    const contractAddress = "0xa9765E97e2d2e2Dd1A77eB536F395A77c32829ac";
    const contractABI = abi.abi;
    const [currentAccount, setCurrentAccount] = useState("");
    const [inputMessage, setInputMessage] = useState("");
    const [allWaves, setAllWaves] = useState<ParsedWave[]>([]);
    const [isWaitingForTxn, setIsWaitingForTxn] = useState(false);
    const [wavePortalContract, setWavePortalContract] = useState<ethers.Contract | null>(null);
    const maxMessageLength = 280;

    const checkIfWalletIsConnected = async () => {

        const {ethereum} = window;

        if (!ethereum || !ethereum.request) {
            return
        }

        try {
            const accounts = await ethereum.request({method: "eth_accounts"});

            if (accounts.length) {
                setCurrentAccount(accounts[0]);
            } else {
                console.log("No Authorized accounts found");
            }
        } catch (error) {
            console.error(error)
        }

    }

    const connectToWallet = async () => {
        try {
            const {ethereum} = window;

            if (!ethereum || !ethereum.request) {
                alert("You don't have metamask!")
                return
            }

            const accounts = await ethereum.request({method: "eth_requestAccounts"});
            console.log("Connected", accounts);
            setCurrentAccount(accounts[0]);

        } catch (error) {
            console.error("Error connecting wallet:", error)
        }
    }

    useEffect(() => {
        checkIfWalletIsConnected()

        try {
            const {ethereum} = window

            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum)
                const signer = provider.getSigner()
                setWavePortalContract(new ethers.Contract(contractAddress, contractABI, signer))
            } else {
                console.log("Ethereum object doesn't exist")
            }

        } catch (error) {
            console.error(error)
        }
    }, [contractABI])

    useEffect(() => {
        const getAllWaves = async () => {
            try {
                const {ethereum} = window;
                if (ethereum) {
                    const provider = new ethers.providers.Web3Provider(ethereum);
                    const signer = provider.getSigner();
                    const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

                    /*
                     * Call the getAllWaves method from your Smart Contract
                     */
                    const waves: Wave[] = await wavePortalContract.getAllWaves();


                    /*
                     * We only need address, timestamp, and message in our UI so let's
                     * pick those out
                     */
                    let wavesCleaned: ParsedWave[] = [];
                    waves.forEach((wave) => {
                        console.log(wave);
                        wavesCleaned.push({
                            waver: wave.waver,
                            timestamp: new Date(wave.timestamp.toNumber() * 1000),
                            message: wave.message
                        });
                    });

                    /*
                     * Store our data in React State
                     */
                    setAllWaves(wavesCleaned);
                } else {
                    console.log("Ethereum object doesn't exist!")
                }
            } catch (error) {
                console.log(error);
            }
        }

        getAllWaves()
    }, [wavePortalContract, contractABI])

    const wave = async () => {
        try {
            const {ethereum} = window

            if (ethereum && wavePortalContract) {
                setIsWaitingForTxn(true)
                const waveTxn = await wavePortalContract.wave(inputMessage)
                console.log("Mining", waveTxn.hash)
                await waveTxn.wait()
                console.log("Mined", waveTxn.hash)
                setIsWaitingForTxn(false)
            } else {
                console.log("Ethereum object doesn't exist or contract not defined")
            }

        } catch (error) {
            console.error(error)
            setIsWaitingForTxn(false)
        }
    }

    return (
        <div className="mainContainer">

            <div className="dataContainer">
                <div className="header">
                    😎 Hey there!
                </div>

                <div className="paragraph">
                    I am Thiago Mota and this is my first web3 project.
                </div>

                {!currentAccount && <div className="paragraph">
                    Connect your Rinkeby Ethereum wallet to send me a wave!
                </div>}

                {isWaitingForTxn && <div className="paragraph">
                    <p>Sending a wave...</p>
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg"
                             width="200px"
                             height="200px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
                            <path d="M27 50A23 23 0 0 0 73 50A23 24.3 0 0 1 27 50" fill="#cbdde8" stroke="none">
                                <animateTransform attributeName="transform" type="rotate" dur="1s"
                                                  repeatCount="indefinite" keyTimes="0;1"
                                                  values="0 50 50.65;360 50 50.65"/>
                            </path>
                        </svg>
                    </div>
                </div>}

                {!isWaitingForTxn && currentAccount &&
                    <textarea className={"messageInput"}
                              onChange={e => setInputMessage(e.currentTarget.value)}
                              maxLength={maxMessageLength}/>}

                {!isWaitingForTxn && currentAccount &&
                    <button className="waveButton" onClick={wave}>
                        Wave at Me
                    </button>}

                {!currentAccount && <button className="waveButton" onClick={connectToWallet}>
                    Connect Wallet
                </button>}

                {allWaves.reverse().map((wave, index) => {
                    return (
                        <div key={index} className={"wave"}>
                            <div className={"waveHeader"}>
                                <span>Address: {wave.waver.replace(wave.waver.substring(5, wave.waver.length - 4), '...')}</span>
                                <span>Time: {wave.timestamp.toLocaleDateString()} - {wave.timestamp.toLocaleTimeString()}</span>
                            </div>
                            <div className={"waveBody"}>
                                <div>Message: {wave.message}</div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
