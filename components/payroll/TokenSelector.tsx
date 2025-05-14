"use client";
import { useEffect, useState, useCallback } from 'react';
import { Wallet, AlertTriangle, PlusCircle, ChevronDown, RefreshCw, BarChart3 } from 'lucide-react';
import { useBalance } from 'wagmi';
import { formatUnits } from 'ethers';
import { NATIVE_ADDRESS, Token } from '@/lib/evm-tokens-mainnet';
import { ethers } from 'ethers';

interface TokenSelectorProps {
    tokens: Token[];
    selectedToken: Token;
    onTokenChange: (token: Token) => void;
    address?: `0x${string}`;
    chainId?: number;
    isConnected: boolean;
    isLoading: boolean;
    exchangeRate: number;
    onExchangeRateChange: (rate: number) => void;
}

const PHAROS_CHAIN_ID = 50002;

const TokenSelector = ({
    tokens,
    selectedToken,
    onTokenChange,
    address,
    chainId,
    isConnected,
    isLoading,
    exchangeRate,
    onExchangeRateChange
}: TokenSelectorProps) => {
    const [isFallbackLoading, setIsFallbackLoading] = useState(false);
    const [fallbackBalance, setFallbackBalance] = useState<string | null>(null);
    const [fallbackError, setFallbackError] = useState<Error | null>(null);

    // Check if we're on Pharos chain
    const isPharosChain = chainId === PHAROS_CHAIN_ID;

    // Only enable wagmi hook if NOT on Pharos chain
    const {
        data: balance,
        isLoading: isBalanceLoading,
        error: balanceError,
        refetch: refetchBalance
    } = useBalance({
        address: address,
        token: selectedToken?.address === NATIVE_ADDRESS
            ? undefined
            : (selectedToken?.address as `0x${string}`),
        chainId: chainId,
        query: {
            // Disable the hook for Pharos chain
            enabled: isConnected && !!selectedToken && !!address && !isPharosChain,
            retry: 3,
            retryDelay: 1000
        }
    });

    const fetchBalanceWithEthers = useCallback(async () => {
        if (!address || !selectedToken?.address || !window.ethereum) return null;

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);

            if (selectedToken.address === NATIVE_ADDRESS) {
                const balance = await provider.getBalance(address as string);
                return formatUnits(balance, selectedToken.decimals);
            } else {
                const erc20ABI = [
                    "function balanceOf(address owner) view returns (uint256)",
                    "function decimals() view returns (uint8)"
                ];

                const tokenContract = new ethers.Contract(selectedToken.address, erc20ABI, provider);
                const balance = await tokenContract.balanceOf(address);
                return formatUnits(balance, selectedToken.decimals);
            }
        } catch (error) {
            console.error("Ethers fallback balance fetch failed:", error);
            throw error;
        }
    }, [address, selectedToken]);

    // Format balance for display - handle both sources
    const formattedBalance = balance
        ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)
        : fallbackBalance
            ? parseFloat(fallbackBalance).toFixed(4)
            : '0';

    // For Pharos chain, fetch directly with ethers whenever relevant dependencies change
    useEffect(() => {
        if (isPharosChain && isConnected && address && selectedToken && !fallbackBalance && !isFallbackLoading) {
            setIsFallbackLoading(true);
            setFallbackError(null);

            fetchBalanceWithEthers()
                .then(result => {
                    if (result) setFallbackBalance(result);
                })
                .catch(err => {
                    setFallbackError(err as Error);
                    console.error("Error fetching Pharos chain balance:", err);
                })
                .finally(() => {
                    setIsFallbackLoading(false);
                });
        }
    }, [isPharosChain, isConnected, address, selectedToken, fetchBalanceWithEthers, fallbackBalance, isFallbackLoading]);

    // Effect for non-Pharos chains when wagmi hook fails
    useEffect(() => {
        if (!isPharosChain && balanceError && !fallbackBalance && !isFallbackLoading) {
            setIsFallbackLoading(true);
            setFallbackError(null);

            fetchBalanceWithEthers()
                .then(result => {
                    if (result) setFallbackBalance(result);
                })
                .catch(err => {
                    setFallbackError(err as Error);
                })
                .finally(() => {
                    setIsFallbackLoading(false);
                });
        }
    }, [isPharosChain, balanceError, fetchBalanceWithEthers, fallbackBalance, isFallbackLoading]);

    // Reset fallback data when token changes
    useEffect(() => {
        setFallbackBalance(null);
        setFallbackError(null);
    }, [selectedToken?.address, chainId]);

    const handleAddToken = async () => {
        if (!window.ethereum) return false;
        if (selectedToken.address === NATIVE_ADDRESS) return true;

        try {
            const wasAdded = await window.ethereum.request({
                method: "wallet_watchAsset",
                params: {
                    type: "ERC20",
                    options: {
                        address: selectedToken.address,
                        symbol: selectedToken.symbol,
                        decimals: selectedToken.decimals || 18,
                    },
                },
            });
            return !!wasAdded;
        } catch (error) {
            console.error("Error adding token to wallet:", error);
            return false;
        }
    };

    // Handle balance refresh based on chain
    const handleRefreshBalance = () => {
        setFallbackBalance(null);
        setFallbackError(null);

        if (isPharosChain) {
            // For Pharos, directly trigger ethers fetch by resetting state
            setIsFallbackLoading(true);
            fetchBalanceWithEthers()
                .then(result => {
                    if (result) setFallbackBalance(result);
                })
                .catch(err => {
                    setFallbackError(err as Error);
                })
                .finally(() => {
                    setIsFallbackLoading(false);
                });
        } else {
            // For other chains, use wagmi refetch
            refetchBalance();
        }
    };

    // Effect to fetch balance when token/chain changes (for non-Pharos chains)
    useEffect(() => {
        if (isConnected && selectedToken && address && !isPharosChain) {
            refetchBalance();
        }
    }, [selectedToken?.address, refetchBalance, isConnected, address, isPharosChain]);

    // Determine loading state based on active fetch method
    const isAnyBalanceLoading = (isPharosChain ? isFallbackLoading : (isBalanceLoading || isFallbackLoading));

    // Error state - for Pharos we only check fallback error, for others we check both
    const hasRealBalanceError = isPharosChain ? fallbackError : (balanceError && fallbackError);

    if (!isConnected) {
        return (
            <div className="flex items-center justify-center p-4 rounded-lg bg-gray-100 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-800/60 backdrop-blur-sm">
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    Connect your wallet to select payment tokens
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3 sm:space-y-4">
            <div className="relative">
                <select
                    value={selectedToken.address}
                    onChange={(e) => {
                        const token = tokens.find(t => t.address === e.target.value);
                        if (token) onTokenChange(token);
                    }}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl
                             text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-500/50
                             focus:border-blue-500 dark:focus:border-blue-500
                             transition-all text-sm sm:text-base appearance-none backdrop-blur-sm"
                    disabled={isLoading}
                >
                    {tokens?.map(token => (
                        <option key={token.address} value={token.address} className="bg-white dark:bg-gray-900 text-black dark:text-white">
                            {token.symbol}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
                    {selectedToken.address !== NATIVE_ADDRESS && (
                        <button
                            onClick={handleAddToken}
                            className="p-1 sm:p-1.5 text-blue-600 dark:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                            title="Add token to wallet"
                            disabled={isLoading}
                        >
                            <PlusCircle className="w-4 h-4" />
                        </button>
                    )}
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-gray-50/50 dark:bg-gray-800/20 rounded-lg border border-gray-200 dark:border-gray-700/30 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
                            <p className="text-gray-600 dark:text-gray-400 text-xs">Balance</p>
                        </div>
                        <button
                            onClick={handleRefreshBalance}
                            className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                            title="Refresh balance"
                            disabled={isAnyBalanceLoading}
                        >
                            <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isAnyBalanceLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-black dark:text-white text-sm sm:text-base font-medium truncate mr-2">
                            {isAnyBalanceLoading ? '...' : formattedBalance}
                        </p>
                        <span className="text-blue-800 dark:text-blue-200 text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/20 rounded font-medium">
                            {selectedToken?.symbol}
                        </span>
                    </div>
                </div>

                <div className="p-3 sm:p-4 bg-gray-50/50 dark:bg-gray-800/20 rounded-lg border border-gray-200 dark:border-gray-700/30 backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
                        <p className="text-gray-600 dark:text-gray-400 text-xs">Exchange Rate</p>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <div className="text-black dark:text-white text-sm sm:text-base font-medium flex items-baseline gap-1">
                            <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">1 USD =</span>
                            <span className="text-blue-700 dark:text-blue-300">
                                {isLoading ? '...' : exchangeRate.toFixed(4)}
                            </span>
                        </div>
                        <span className="text-blue-800 dark:text-blue-200 text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/20 rounded font-medium">
                            {selectedToken?.symbol}
                        </span>
                    </div>
                </div>
            </div>

            {hasRealBalanceError && (
                <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-400/10 border border-red-300 dark:border-red-400/20 rounded-lg flex gap-2 sm:gap-3 items-center backdrop-blur-sm">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-red-800 dark:text-red-200 text-xs sm:text-sm">
                        Error fetching balance. Please check connection or try again.
                    </p>
                </div>
            )}
        </div>
    );
};

export default TokenSelector;