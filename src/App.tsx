import React, {useEffect, useState} from "react";
import './App.css';
import {Ethereumish} from "./react-app-env";
import {ethers} from "ethers";
import abi from "./utils/WavePortal.json"

declare global {
    interface Window {
        ethereum: Ethereumish;
    }
}

export default function App() {

    const contractAddress = "0x6B03E58A67974Ed227161c86960a49992c95a013";
    const contractABI = abi.abi;
    const [currentAccount, setCurrentAccount] = useState("");
    const [waveCount, setWaveCount] = useState(0);
    const [isWaitingForTxn, setIsWaitingForTxn] = useState(false);
    const [wavePortalContract, setWavePortalContract] = useState<ethers.Contract | null>(null);

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

    const connectToContract = () => {
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
    }

    const getTotalWaves = async () => {
        if (wavePortalContract) {
            let count = await wavePortalContract.getTotalWaves()
            setWaveCount(count.toNumber())
        }
    }

    useEffect(() => {
        checkIfWalletIsConnected()
        connectToContract()
    }, [])

    useEffect(() => {
        getTotalWaves()
    }, [wavePortalContract])

    const wave = async () => {
        try {
            const {ethereum} = window

            if (ethereum && wavePortalContract) {
                setIsWaitingForTxn(true)
                const waveTxn = await wavePortalContract.wave()
                console.log("Mining", waveTxn.hash)
                await waveTxn.wait()
                console.log("Mined", waveTxn.hash)
                setWaveCount(waveCount + 1)
                setIsWaitingForTxn(false)
            } else {
                console.log("Ethereum object doesn't exist or contract not defined")
            }

        } catch (error) {
            console.error(error)
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

                <div className="paragraph">
                    Total waves: {waveCount}
                </div>

                {isWaitingForTxn && <div className="paragraph">
                    Sending a wave...
                </div>}

                <button className="waveButton" onClick={wave}>
                    Wave at Me
                </button>

                {!currentAccount && <button className="waveButton" onClick={connectToWallet}>
                    Connect Wallet
                </button>}
            </div>
        </div>
    );
}
