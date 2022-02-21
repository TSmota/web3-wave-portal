import React, { useCallback, useEffect, useState } from "react";
import './App.css';
import { BigNumber, ethers } from "ethers";
import abi from "./utils/WavePortal.json"
import { Ethereumish } from "./react-app-env";

interface Wave {
    waver: string;
    message: string;
    timestamp: BigNumber;
}

interface ParsedWave extends Omit<Wave, 'timestamp'> {
    timestamp: Date;
}

export default function App() {

    const contractAddress = "0x1c791764035D16339617810aC5bDa9A35b234727";
    const [contractABI] = useState(abi.abi);
    const [currentAccount, setCurrentAccount] = useState("");
    const [inputMessage, setInputMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [allWaves, setAllWaves] = useState<ParsedWave[]>([]);
    const [isWaitingForTxn, setIsWaitingForTxn] = useState(false);
    const maxMessageLength = 280;

    const getContract = useCallback((ethereum?: Ethereumish) => {
        const provider = ethereum
            ? new ethers.providers.Web3Provider(ethereum)
            : new ethers.providers.JsonRpcBatchProvider('https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161')

        const signer = provider.getSigner()

        return new ethers.Contract(contractAddress, contractABI, ethereum ? signer : provider)
    }, [contractABI])

    const switchNetwork = async () => {
        const { ethereum } = window;

        if (!ethereum || !ethereum.request) {
            return false
        }

        try {
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x4' }],
            });
            return true
        } catch (error: any) {
            if (error.code === 4001) {
                setErrorMessage("You must use the Rinkeby testnet to interact with this app")
            } else if (error.code !== -32002) {
                console.error("Error connecting wallet:", error)
                setErrorMessage((error.message))
            }
            return false
        }
    }

    const connectToWallet = async () => {

        const { ethereum } = window;

        if (!ethereum || !ethereum.request) {
            return
        }

        if (await switchNetwork()) {
            try {
                const accounts = await ethereum.request({
                    method: "eth_requestAccounts",
                });
                console.log("Connected", accounts);
                setCurrentAccount(accounts[0]);

            } catch (error: any) {
                if (error.code !== 4001)
                    console.error("Error connecting wallet:", error)
            }
        }
    }

    const getAllWaves = useCallback(async () => {

        try {
            const wavePortalContract = getContract();

            const waves: Wave[] = await wavePortalContract.getAllWaves();

            let wavesCleaned: ParsedWave[] = [];
            waves.forEach((wave) => {
                wavesCleaned.push({
                    waver: wave.waver,
                    timestamp: new Date(wave.timestamp.toNumber() * 1000),
                    message: wave.message
                });
            });

            setAllWaves(wavesCleaned);

        } catch (error) {
            console.log(error);
        }

    }, [getContract])

    useEffect(() => {

        const checkIfWalletIsConnected = async () => {

            const { ethereum } = window;

            if (!ethereum || !ethereum.request) {
                return false
            }

            if (await switchNetwork()) {
                try {
                    const accounts = await ethereum.request({ method: "eth_accounts" });

                    if (accounts.length) {
                        setCurrentAccount(accounts[0]);
                        return true
                    }
                } catch (error: any) {
                    console.error(error)
                    setErrorMessage(error.message)
                    return false
                }
            }
        }

        checkIfWalletIsConnected()
        getAllWaves()

    }, [getAllWaves, currentAccount])

    useEffect(() => {
        let wavePortalContract: ethers.Contract;

        const onNewWave = (from: string, timestamp: BigNumber, message: string) => {
            console.log("NewWave", from, timestamp, message);
            setAllWaves(prevState => [
                ...prevState,
                {
                    waver: from,
                    timestamp: new Date(timestamp.toNumber() * 1000),
                    message: message,
                },
            ]);
        };

        if (window.ethereum) {
            wavePortalContract = getContract(window.ethereum)
            wavePortalContract.on("NewWave", onNewWave);
        }

        return () => {
            if (wavePortalContract) {
                wavePortalContract.off("NewWave", onNewWave);
            }
        };
    }, [getContract]);

    const wave = async () => {
        setErrorMessage("")
        if (inputMessage.length < 3) {
            setErrorMessage("You must type at least 3 characters")
            return
        }

        if (await switchNetwork()) {
            try {
                const { ethereum } = window

                if (ethereum) {
                    const wavePortalContract = getContract(ethereum);
                    setIsWaitingForTxn(true)
                    const waveTxn = await wavePortalContract.wave(inputMessage, { gasLimit: 300000 })
                    console.log("Mining", waveTxn.hash)
                    await waveTxn.wait()
                    console.log("Mined", waveTxn.hash)
                    setIsWaitingForTxn(false)
                    setInputMessage("")
                } else {
                    console.log("Ethereum object doesn't exist or contract not defined")
                }

            } catch (error: any) {
                console.error(error)
                setErrorMessage("Transaction error, failed to wave 😢")
                setIsWaitingForTxn(false)
            }
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

                {!!window.ethereum
                    ? (
                        <>
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
                                                values="0 50 50.65;360 50 50.65" />
                                        </path>
                                    </svg>
                                </div>
                            </div>}

                            {!isWaitingForTxn && currentAccount &&
                                <textarea className={"messageInput"}
                                    onChange={e => setInputMessage(e.currentTarget.value)}
                                    maxLength={maxMessageLength} />}

                            {errorMessage && <div className={"errorMessage"}>{errorMessage}</div>}

                            {!isWaitingForTxn && currentAccount &&
                                <button className="waveButton" onClick={wave}>
                                    Wave at Me
                                </button>}

                            {!currentAccount && <button className="waveButton" onClick={connectToWallet}>
                                Connect Wallet
                            </button>}
                        </>
                    )
                    : <div className="paragraph">
                        You need to have metamask to interact with this website, get it <a href="https://metamask.io/" target={"_blank"} rel="noreferrer">here</a>.
                    </div>}


                {[...allWaves].reverse().map((wave, index) => {
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
