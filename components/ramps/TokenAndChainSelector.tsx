import React, { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Check, Plus, ExternalLink, ChevronDown } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { allMainnetChains } from '@/lib/evm-chains-mainnet';
import { tokensPerMainnetChain, Token } from '@/lib/evm-tokens-mainnet';
import { truncateAddress } from '@/lib/utils';

interface TokenAndChainSelectorProps {
    selectedChain: typeof allMainnetChains[0] | null;
    selectedToken: Token | null;
    onChainChange: (chain: typeof allMainnetChains[0]) => void;
    onTokenChange: (token: Token) => void;
    showBalance?: boolean;
    tokenBalance?: string;
    isBalanceLoading?: boolean;
}

export const TokenAndChainSelector: React.FC<TokenAndChainSelectorProps> = ({
    selectedChain,
    selectedToken,
    onChainChange,
    onTokenChange,
    showBalance = false,
    tokenBalance = '0.00',
    isBalanceLoading = false,
}) => {
    const { address, isConnected } = useAccount();
    const currentChainId = useChainId();

    // UI States
    const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);

    // Get stablecoin tokens (USDT, USDC) for the selected chain
    const stableTokens = selectedChain
        ? tokensPerMainnetChain[selectedChain.id]?.filter(
            token => token.symbol.includes('USDT') || token.symbol.includes('USDC')
        ) || []
        : [];

    // Update selected chain when wallet chain changes
    useEffect(() => {
        if (currentChainId) {
            const matchingChain = allMainnetChains.find(chain => chain.id === currentChainId);
            if (matchingChain) {
                onChainChange(matchingChain);
            }
        }
    }, [currentChainId, onChainChange]);

    // Function to add token to wallet
    const addTokenToWallet = async (token: Token, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent dropdown from closing

        try {
            // Check if window.ethereum is available (MetaMask or compatible wallet)
            if (window.ethereum) {
                await window.ethereum.request({
                    method: 'wallet_watchAsset',
                    params: {
                        type: 'ERC20',
                        options: {
                            address: token.address,
                            symbol: token.symbol,
                            decimals: token.decimals,
                            // You might want to add a token image URL here
                            image: '',
                        },
                    },
                });
            } else {
                alert('Please install MetaMask or a compatible wallet to add tokens');
            }
        } catch (error) {
            console.error("Failed to add token to wallet:", error);
        }
    };

    return (
        <div className="space-y-4">
            {/* Wallet and Chain Selection */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex flex-col space-y-4">
                    {/* RainbowKit Chain and Account Selector */}
                    <ConnectButton.Custom>
                        {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
                            const ready = mounted && authenticationStatus !== 'loading';
                            const connected = ready && account && chain;

                            return (
                                <div className="flex flex-col sm:flex-row gap-3 w-full">
                                    {!connected ? (
                                        <button
                                            onClick={openConnectModal}
                                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-md transition-all"
                                        >
                                            Connect Wallet
                                        </button>
                                    ) : (
                                        <>
                                            {/* Chain Selector */}
                                            <button
                                                onClick={openChainModal}
                                                className="flex-1 py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                                            >
                                                {chain.hasIcon && (
                                                    <div className="w-5 h-5 overflow-hidden rounded-full">
                                                        {chain.iconUrl && (
                                                            <img
                                                                alt={chain.name ?? 'Chain icon'}
                                                                src={chain.iconUrl}
                                                                className="w-5 h-5"
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                                <span className="truncate">{chain.name ?? chain.id}</span>
                                            </button>

                                            {/* Account Button */}
                                            <button
                                                onClick={openAccountModal}
                                                className="flex-1 py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                                            >
                                                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"></div>
                                                <span className="truncate">{account.displayName}</span>
                                                <ExternalLink size={14} className="text-gray-500 dark:text-gray-400" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            );
                        }}
                    </ConnectButton.Custom>
                </div>
            </div>

            {/* Token Selection */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Token
                </label>
                <div className="relative">
                    <button
                        onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
                        disabled={stableTokens.length === 0 || !isConnected}
                        className={`w-full flex items-center justify-between px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg ${stableTokens.length === 0 || !isConnected
                                ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                    >
                        <div className="flex items-center space-x-2">
                            <span className="text-gray-900 dark:text-white">
                                {selectedToken?.symbol || "Select Token"}
                            </span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>

                    {isTokenDropdownOpen && stableTokens.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md py-1 border border-gray-200 dark:border-gray-700">
                            {stableTokens.map((token) => (
                                <div
                                    key={token.address}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between cursor-pointer"
                                    onClick={() => {
                                        onTokenChange(token);
                                        setIsTokenDropdownOpen(false);
                                    }}
                                >
                                    <span className="text-gray-900 dark:text-white flex items-center">
                                        {token.symbol}
                                        <span
                                            className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full cursor-pointer"
                                            onClick={(e) => addTokenToWallet(token, e)}
                                            title={`Add ${token.symbol} to wallet`}
                                        >
                                            <Plus size={12} className="text-blue-500" />
                                        </span>
                                    </span>
                                    {selectedToken?.address === token.address && (
                                        <Check className="h-4 w-4 text-green-500" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Balance Display (Optional) */}
            {showBalance && selectedToken && (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Your Balance:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                            {isBalanceLoading ? 'Loading...' : `${tokenBalance} ${selectedToken.symbol}`}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};