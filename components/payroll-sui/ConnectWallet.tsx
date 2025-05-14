"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Wallet, ChevronDown, LogOut, Copy, CheckCircle,
    AlertCircle, X, ExternalLink, CreditCard, Coins, Globe
} from "lucide-react";
import {
    useCurrentWallet,
    useCurrentAccount,
    useWallets,
    useConnectWallet,
    useDisconnectWallet,
    useSwitchAccount,
    useAccounts,
    useSuiClient
} from "@mysten/dapp-kit";
import { useNetwork, SuiNetwork } from '@/context/networkContext';
import { suiNetworks, suiTokens, SuiToken } from '@/lib/sui-tokens';

export const StyledConnectButton = ({
    selectedToken,
    onTokenChange
}: {
    selectedToken?: SuiToken;
    onTokenChange?: (token: SuiToken) => void;
}) => {
    const { currentNetwork, setNetwork } = useNetwork();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { currentWallet, connectionStatus } = useCurrentWallet();
    const account = useCurrentAccount();
    const wallets = useWallets();
    const accounts = useAccounts();
    const { mutate: connect } = useConnectWallet();
    const { mutate: disconnect } = useDisconnectWallet();
    const { mutate: switchAccount } = useSwitchAccount();
    const [copied, setCopied] = useState(false);
    const [coinBalance, setCoinBalance] = useState<{ [key: string]: string }>({});
    const [activeTab, setActiveTab] = useState<'accounts' | 'tokens' | 'networks'>('accounts');
    const suiClient = useSuiClient();

    const [availableTokens, setAvailableTokens] = useState<SuiToken[]>(suiTokens[currentNetwork] || []);

    const modalRef = useRef<HTMLDivElement>(null);
    const isConnected = connectionStatus === 'connected' && account;

    useEffect(() => {
        setAvailableTokens(suiTokens[currentNetwork] || []);

        if (account && isModalOpen) {
            setCoinBalance({});
            fetchCoinBalances();
        }
    }, [currentNetwork]);

    const handleNetworkChange = (network: SuiNetwork) => {
        setNetwork(network);
    };

    const getNetworkColor = (network: string) => {
        switch (network) {
            case 'mainnet': return 'text-green-600 dark:text-green-400';
            case 'testnet': return 'text-amber-600 dark:text-amber-400';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    };

    const formatAddress = (address: string) => {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setIsModalOpen(false);
            }
        };

        if (isModalOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isModalOpen]);

    useEffect(() => {
        if (account && isModalOpen) {
            fetchCoinBalances();
        }
    }, [account, isModalOpen, currentNetwork, availableTokens]);

    const copyAddress = () => {
        if (account) {
            navigator.clipboard.writeText(account.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const fetchCoinBalances = async () => {
        if (!account) return;

        try {
            const balances: { [key: string]: string } = {};

            for (const coin of availableTokens) {
                try {
                    const coinData = await suiClient.getBalance({
                        owner: account.address,
                        coinType: coin.address,
                    });

                    const balance = coinData
                        ? (Number(coinData.totalBalance) / Math.pow(10, coin.decimals)).toFixed(6)
                        : "0.000000";

                    balances[coin.symbol] = balance;
                } catch (err) {
                    console.error(`Error fetching balance for ${coin.symbol}:`, err);
                    balances[coin.symbol] = "Error";
                }
            }

            setCoinBalance(balances);
        } catch (error) {
            console.error("Error fetching balances:", error);
        }
    };

    const handleTokenSelect = (token: SuiToken) => {
        if (onTokenChange) {
            onTokenChange(token);
        }
    };

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsModalOpen(true)}
                className="relative py-2 px-3 lg:py-2.5 lg:px-4 rounded-lg
                 dark:bg-transparent opacity-90 backdrop-blur-3xl border border-white/20 dark:border-white/10 
                shadow-sm hover:bg-white/30 dark:hover:bg-black/30 transition-all duration-300
                flex items-center justify-center gap-2"
                title="Wallet"
            >
                {isConnected && <div className="h-2 w-2 rounded-full bg-green-400 absolute left-1.5 top-1.5 animate-pulse"></div>}
                <Wallet className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="font-medium text-sm whitespace-nowrap">
                    {isConnected ? formatAddress(account.address) : "Connect Wallet"}
                </span>
                {isConnected && (
                    <>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getNetworkColor(currentNetwork)}  dark:bg-transparent opacity-90 backdrop-blur-3xl`}>
                            {suiNetworks[currentNetwork]?.name.split(' ')[1]}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                    </>
                )}
            </motion.button>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4  dark:bg-transparent opacity-90 backdrop-blur-3xl overflow-y-auto">
                        <motion.div
                            ref={modalRef}
                            className="w-full max-w-xl  dark:bg-transparent opacity-90 backdrop-blur-3xl
                            rounded-2xl shadow-lg border border-white/20 dark:border-white/10 
                            overflow-hidden transition-all duration-200"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100/50 dark:border-gray-800/50">
                                <h3 className="text-lg font-medium">
                                    {isConnected ? "Wallet Connected" : "Connect Wallet"}
                                </h3>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1.5 rounded-full  dark:bg-transparent opacity-90 backdrop-blur-3xl
                                    hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </motion.button>
                            </div>

                            {!isConnected ? (
                                <div className="p-6 space-y-5">
                                    <div className="text-center mb-6">
                                        <div className="mx-auto w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 
                                            flex items-center justify-center mb-4">
                                            <Wallet className="h-8 w-8" />
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                                            Connect your wallet to access all features
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        {wallets.length === 0 ? (
                                            <div className="text-center p-4">
                                                <AlertCircle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                                                <p className="text-gray-700 dark:text-gray-300">No wallets detected</p>
                                                <a
                                                    href="https://docs.sui.io/guides/developer/first-app/install"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1 justify-center mt-2 hover:underline"
                                                >
                                                    Get a wallet <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        ) : (
                                            wallets.map((wallet) => (
                                                <motion.button
                                                    key={wallet.name}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => {
                                                        connect({ wallet }, {
                                                            onSuccess: () => {
                                                                console.log('connected');
                                                                setActiveTab('accounts');
                                                            }
                                                        });
                                                    }}
                                                    className="w-full p-4 rounded-xl bg-white/50 dark:bg-gray-800/50
                                                    border border-white/20 dark:border-white/10
                                                    shadow-sm hover:bg-white/70 dark:hover:bg-gray-800/70 
                                                    transition-all duration-200 flex items-center gap-4"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10
                                                    flex items-center justify-center">
                                                        <Wallet className="h-5 w-5" />
                                                    </div>
                                                    <div className="text-left flex-1">
                                                        <span className="font-medium text-base">
                                                            {wallet.name}
                                                        </span>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            Connect to {wallet.name}
                                                        </p>
                                                    </div>
                                                </motion.button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10
                                            flex items-center justify-center">
                                                {currentWallet?.name?.charAt(0) || <Wallet className="h-5 w-5" />}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium">
                                                    {currentWallet?.name || "Connected Wallet"}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                                                        {formatAddress(account.address)}
                                                    </span>
                                                    <motion.button
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={copyAddress}
                                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                    >
                                                        {copied ? (
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <Copy className="h-4 w-4" />
                                                        )}
                                                    </motion.button>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-xs py-1 px-2 rounded-full bg-black/5 dark:bg-white/10 font-medium">
                                                    Connected
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <a
                                                href={`https://suiscan.xyz/mainnet/address/${account.address}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                                            >
                                                View on Explorer <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex border-b border-gray-200/50 dark:border-gray-800/50">
                                        <button
                                            onClick={() => setActiveTab('accounts')}
                                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2
                                                ${activeTab === 'accounts'
                                                    ? 'text-blue-600 dark:text-blue-400 border-b border-blue-600 dark:border-blue-400 bg-black/5 dark:bg-white/5'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'} transition-colors`}
                                        >
                                            <CreditCard className="h-4 w-4" />
                                            Accounts
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('tokens')}
                                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2
                                                ${activeTab === 'tokens'
                                                    ? 'text-blue-600 dark:text-blue-400 border-b border-blue-600 dark:border-blue-400 bg-black/5 dark:bg-white/5'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'} transition-colors`}
                                        >
                                            <Coins className="h-4 w-4" />
                                            Tokens
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('networks')}
                                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2
                                                ${activeTab === 'networks'
                                                    ? 'text-blue-600 dark:text-blue-400 border-b border-blue-600 dark:border-blue-400 bg-black/5 dark:bg-white/5'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'} transition-colors`}
                                        >
                                            <Globe className="h-4 w-4" />
                                            Networks
                                        </button>
                                    </div>

                                    <div className="p-4">
                                        {activeTab === 'accounts' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                    Available Accounts
                                                </h5>

                                                {accounts.length === 0 ? (
                                                    <div className="text-center p-4">
                                                        <p className="text-gray-500 dark:text-gray-400 text-sm">No accounts found</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                                        {accounts.map((acc) => (
                                                            <motion.button
                                                                key={acc.address}
                                                                whileHover={{ scale: 1.01 }}
                                                                whileTap={{ scale: 0.99 }}
                                                                onClick={() => {
                                                                    if (acc.address !== account.address) {
                                                                        switchAccount({ account: acc }, {
                                                                            onSuccess: () => console.log(`Switched to ${acc.address}`)
                                                                        });
                                                                    }
                                                                }}
                                                                className={`w-full py-3 px-4 rounded-xl flex items-center gap-4
                                                                    ${acc.address === account.address
                                                                        ? 'bg-black/5 dark:bg-white/5'
                                                                        : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                                                            >
                                                                <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
                                                                    {acc.address.substring(0, 1)}
                                                                </div>
                                                                <div className="flex-1 text-left">
                                                                    <span className="text-sm font-medium">
                                                                        Account {accounts.findIndex(a => a.address === acc.address) + 1}
                                                                    </span>
                                                                    <div className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                        {formatAddress(acc.address)}
                                                                    </div>
                                                                </div>
                                                                {acc.address === account.address && (
                                                                    <CheckCircle className="h-5 w-5 text-blue-500" />
                                                                )}
                                                            </motion.button>
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        {activeTab === 'tokens' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                    Token Balances ({currentNetwork})
                                                </h5>

                                                <div className="space-y-2">
                                                    {Object.keys(coinBalance).length === 0 ? (
                                                        <div className="text-center p-4">
                                                            <motion.div
                                                                animate={{ rotate: 360 }}
                                                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                                className="mx-auto w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
                                                            />
                                                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Loading balances...</p>
                                                        </div>
                                                    ) : (
                                                        Object.entries(coinBalance).map(([symbol, balance]) => {
                                                            const token = availableTokens.find(t => t.symbol === symbol);
                                                            const isSelected = selectedToken?.symbol === symbol;

                                                            return (
                                                                <div
                                                                    key={symbol}
                                                                    onClick={() => token && handleTokenSelect(token)}
                                                                    className={`p-3 rounded-xl border backdrop-blur-sm
                                                                        ${isSelected
                                                                            ? 'bg-black/5 dark:bg-white/5 border-blue-200 dark:border-blue-900'
                                                                            : 'bg-white/30 dark:bg-black/30 border-white/20 dark:border-white/10'} 
                                                                        cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
                                                                            <span className="font-medium">{symbol.charAt(0)}</span>
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="font-medium text-base">
                                                                                    {symbol}
                                                                                </span>
                                                                                <span className="font-mono font-medium">
                                                                                    {balance}
                                                                                </span>
                                                                            </div>
                                                                            <div className="mt-0.5 flex items-center justify-between">
                                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                                    {availableTokens.find(c => c.symbol === symbol)?.address.substring(0, 15)}...
                                                                                </span>
                                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                                    {balance === "Error" ? "Failed to load" :
                                                                                        parseFloat(balance) === 0 ? 'No balance' : 'Available'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        {isSelected && (
                                                                            <CheckCircle className="h-4 w-4 text-blue-500" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeTab === 'networks' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                    Select Network
                                                </h5>

                                                <div className="space-y-2">
                                                    {Object.entries(suiNetworks).map(([networkId, network]) => (
                                                        <motion.button
                                                            key={networkId}
                                                            whileHover={{ scale: 1.01 }}
                                                            whileTap={{ scale: 0.99 }}
                                                            onClick={() => handleNetworkChange(networkId as SuiNetwork)}
                                                            className={`w-full py-3 px-4 rounded-xl flex items-center gap-4
                                                                ${networkId === currentNetwork
                                                                    ? 'bg-black/5 dark:bg-white/5'
                                                                    : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                                                        >
                                                            <div className={`w-3 h-3 rounded-full
                                                                ${networkId === 'mainnet' ? 'bg-green-500' :
                                                                    networkId === 'testnet' ? 'bg-amber-500' : 'bg-purple-500'}`}
                                                            />
                                                            <div className="flex-1 text-left">
                                                                <span className="text-base font-medium">
                                                                    {network.name}
                                                                </span>
                                                            </div>
                                                            {networkId === currentNetwork && (
                                                                <CheckCircle className="h-4 w-4 text-blue-500" />
                                                            )}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="px-6 py-4 border-t border-gray-100/50 dark:border-gray-800/50">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                disconnect();
                                                setIsModalOpen(false);
                                            }}
                                            className="w-full py-2.5 rounded-lg bg-black/5 dark:bg-white/5
                                            text-gray-700 dark:text-gray-300 font-medium
                                            hover:bg-red-100/50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400
                                            transition-colors flex items-center justify-center gap-2"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Disconnect Wallet
                                        </motion.button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default StyledConnectButton;