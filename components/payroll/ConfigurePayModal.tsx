"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, AlertCircle, Wallet, RefreshCw, CheckCircle } from "lucide-react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, usePublicClient } from 'wagmi';
import TokenSelector from './TokenSelector';
import { allMainnetChains as chains } from '@/lib/evm-chains-mainnet';
import { tokensPerMainnetChain as tokens, Token } from '@/lib/evm-tokens-mainnet';
import { getExchangeRate } from '@/lib/chainlink-helper';
import { ethers } from 'ethers';
import { CardSpotlight } from "../ui/cardSpotlight";

interface ConfigurePayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExchangeRateUpdate?: (rate: number, tokenSymbol: string) => void;
}

const ConfigurePayModal: React.FC<ConfigurePayModalProps> = ({
  isOpen,
  onClose,
  onExchangeRateUpdate
}) => {
  // Wallet connection state
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();

  // UI state
  const [selectedChain, setSelectedChain] = useState<number | undefined>(undefined);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationComplete, setCalculationComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-update exchange rate state
  const [autoUpdateActive, setAutoUpdateActive] = useState(true);
  const autoUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());

  // Initialize or update chain and token when connected or chain changes
  useEffect(() => {
    if (chainId) {
      // Set the chain
      setSelectedChain(chainId);

      // Find a valid token for this chain - if current token isn't valid for this chain
      const availableTokens = tokens[chainId] || [];
      if (availableTokens.length > 0) {
        // Always select the first token when chain changes
        const newToken = availableTokens[0];
        setSelectedToken(newToken);

        // Fetch exchange rate for the new token on this chain
        fetchChainlinkExchangeRate(newToken, chainId);
      } else {
        setSelectedToken(null);
        setError("No tokens available for this chain");
      }
    } else if (!chainId && isConnected) {
      // Default to first chain if connected but no chain ID
      const defaultChain = chains[0];
      setSelectedChain(defaultChain.id);

      const defaultToken = tokens[defaultChain.id]?.[0];
      if (defaultToken) {
        setSelectedToken(defaultToken);
        fetchChainlinkExchangeRate(defaultToken, defaultChain.id);
      }
    } else {
      // Not connected, use defaults
      const defaultChain = chains[0];
      setSelectedChain(defaultChain.id);
      setSelectedToken(tokens[defaultChain.id]?.[0] || null);
    }
  }, [chainId, isConnected]);

  // Setup auto-update interval
  useEffect(() => {
    // Clear any existing interval
    if (autoUpdateIntervalRef.current) {
      clearInterval(autoUpdateIntervalRef.current);
      autoUpdateIntervalRef.current = null;
    }

    // Only set up interval if auto-update is active and we have a valid token and chain
    if (autoUpdateActive && selectedToken && selectedChain && isOpen) {
      autoUpdateIntervalRef.current = setInterval(() => {
        // Only fetch if we're not already calculating and at least 30 seconds have passed
        const now = Date.now();
        if (!isCalculating && now - lastUpdateTimeRef.current >= 30000) {
          console.log("Auto-updating exchange rate...");
          lastUpdateTimeRef.current = now;
          fetchChainlinkExchangeRate(selectedToken, selectedChain, true);
        }
      }, 5000); // Check every 5 seconds, but only update if 30 seconds have passed
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (autoUpdateIntervalRef.current) {
        clearInterval(autoUpdateIntervalRef.current);
        autoUpdateIntervalRef.current = null;
      }
    };
  }, [autoUpdateActive, selectedToken, selectedChain, isOpen, isCalculating]);

  // Cancel auto-updates when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAutoUpdateActive(false);
      if (autoUpdateIntervalRef.current) {
        clearInterval(autoUpdateIntervalRef.current);
        autoUpdateIntervalRef.current = null;
      }
    } else {
      // Re-enable auto-updates when modal opens
      setAutoUpdateActive(true);
    }
  }, [isOpen]);

  // Fetch exchange rate from Chainlink oracle
  const fetchChainlinkExchangeRate = async (token: Token, chainForRate: number, isAutoUpdate = false) => {
    if (!token || !chainForRate) return;

    // For auto-updates, use a less intrusive UI update
    if (!isAutoUpdate) {
      setIsCalculating(true);
      setCalculationComplete(false);
      setError(null);
    } else {
      // For auto-updates, just set a simple calculating flag but don't reset other UI states
      setIsCalculating(true);
    }

    try {
      // Create ethers provider from the Wagmi publicClient
      let provider;
      if (publicClient && 'transport' in publicClient && 'url' in publicClient.transport) {
        provider = new ethers.JsonRpcProvider(publicClient.transport.url);
      } else {
        // Fallback to a default provider if we can't get one from publicClient
        const chainConfig = chains.find(c => c.id === chainForRate);
        if (!chainConfig?.rpcUrls?.default?.http?.[0]) {
          throw new Error(`No RPC URL found for chain ${chainForRate}`);
        }

        provider = new ethers.JsonRpcProvider(chainConfig.rpcUrls.default.http[0]);
      }

      // Only show loading delay for manual updates, not auto-updates
      if (!isAutoUpdate) {
        await new Promise(resolve => setTimeout(resolve, 800)); // Reduced from 1500ms for better UX
      }

      // Get the exchange rate - make sure we use the passed chain ID
      // This will automatically use CoinGecko as fallback if Chainlink fails
      const rate = await getExchangeRate(
        provider,
        token.symbol,
        chainForRate
      );

      setExchangeRate(rate);

      if (onExchangeRateUpdate) {
        onExchangeRateUpdate(rate, token.symbol);
      }

      setIsCalculating(false);

      // Only update completion UI for manual updates
      if (!isAutoUpdate) {
        setCalculationComplete(true);
        // Reset completion status after a delay
        setTimeout(() => {
          setCalculationComplete(false);
        }, 3000);
      }
    } catch (err) {
      console.error("Error fetching exchange rate:", err);

      // Only show errors for manual updates
      if (!isAutoUpdate) {
        setError("Failed to fetch current exchange rate. Using estimated rate instead.");
      }

      // Let the getExchangeRate function handle all fallbacks
      try {
        // Even if provider creation failed, we can pass null and let getExchangeRate handle it
        const fallbackRate = await getExchangeRate(
          null as any, // This will trigger the fallback logic in getExchangeRate
          token.symbol,
          chainForRate
        );

        setExchangeRate(fallbackRate);

        if (onExchangeRateUpdate) {
          onExchangeRateUpdate(fallbackRate, token.symbol);
        }
      } catch (fallbackErr) {
        // If even the fallback fails, use a simple default
        const safeRate = token.symbol.includes('USD') ? 1 : 0.01;
        setExchangeRate(safeRate);

        if (onExchangeRateUpdate) {
          onExchangeRateUpdate(safeRate, token.symbol);
        }
      }

      setIsCalculating(false);

      // Only update completion UI for manual updates
      if (!isAutoUpdate) {
        setCalculationComplete(true);
        setTimeout(() => {
          setCalculationComplete(false);
          setError(null);
        }, 3000);
      }
    }
  };

  // Handle token change
  const handleTokenChange = (token: Token) => {
    setSelectedToken(token);

    // Update lastUpdateTimeRef to now since we're doing a manual update
    lastUpdateTimeRef.current = Date.now();

    // Make sure we pass the current chain ID when fetching the exchange rate
    if (selectedChain) {
      fetchChainlinkExchangeRate(token, selectedChain);
    }
  };

  // Handle Apply Settings button
  const handleApplySettings = () => {
    // Stop auto-updating when settings are applied
    setAutoUpdateActive(false);
    if (autoUpdateIntervalRef.current) {
      clearInterval(autoUpdateIntervalRef.current);
      autoUpdateIntervalRef.current = null;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (

    (isConnected && selectedToken && selectedChain) ? (

      <AnimatePresence>
        {/* Updated overlay style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 dark:bg-black/90 bg-white/90 z-50 p-4 overflow-y-auto"
          onClick={onClose}
        >
          <div className="relative w-full min-h-full flex items-center justify-center py-6">
            <CardSpotlight className="dark:bg-black/60 border border-gray-200">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent relative w-full max-w-md sm:max-w-lg md:max-w-lg"
              >
                <div className="border-b border-gray-200 dark:border-gray-800/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="p-2 sm:p-2.5 rounded-full bg-gray-100 dark:bg-gray-800/20 shadow-inner shadow-gray-200/50 dark:shadow-gray-700/10">
                        <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-300" />
                      </div>
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-black/70 dark:text-white tracking-tight">
                        Configure Payments
                      </h2>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      // Updated close button styles
                      className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1 sm:p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
                      aria-label="Close modal"
                      disabled={isCalculating}
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                  </div>
                </div>
                <div className="p-4 sm:p-5 rounded-xl bg-white/50 dark:bg-gray-900/20 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 sm:p-2 rounded-full bg-purple-100 dark:bg-purple-900/10">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-300" />
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-black dark:text-white">Wallet Connection</span>
                  </div>
                  </div>
                  
                  <ConnectButton.Custom>
                  {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
                    const ready = mounted && authenticationStatus !== 'loading';
                    const connected = ready && account && chain;
                    
                    return (
                    <div
                      className="w-full"
                      {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                      })}
                    >
                      {(() => {
                      if (!connected) {
                        return (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={openConnectModal}
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 dark:from-purple-500 dark:to-blue-500 dark:hover:from-purple-600 dark:hover:to-blue-600 text-white font-medium shadow-lg shadow-purple-500/20 dark:shadow-purple-800/20 transition-all"
                        >
                          Connect Wallet
                        </motion.button>
                        );
                      }

                      return (
                        <div className="flex flex-col sm:flex-row gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={openChainModal}
                          className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
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
                          <span>{chain.name ?? chain.id}</span>
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={openAccountModal}
                          className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                        >
                          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"></div>
                          <span>{account.displayName}</span>
                        </motion.button>
                        </div>
                      );
                      })()}
                    </div>
                    );
                  }}
                  </ConnectButton.Custom>
                </div>

                <div className="space-y-4 sm:space-y-5">
                  {/* Token Selection - Updated styles */}
                  <div className="p-4 sm:p-5 rounded-xl border border-gray-200 dark:border-gray-800/60 bg-white/50 dark:bg-gray-900/20 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-5">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 sm:p-2 rounded-full bg-blue-100 dark:bg-blue-900/10">
                          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-300" />
                        </div>
                        <span className="font-semibold text-sm sm:text-base text-black dark:text-white">Payment Token</span>
                      </div>
                      <div className="flex items-center px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700/20">
                        <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 ${isCalculating ? 'animate-spin text-blue-600 dark:text-blue-300' : 'text-blue-500 dark:text-blue-400'}`} />
                        <span className="text-xs text-blue-800 dark:text-blue-200">Auto-updates every 30s</span>
                      </div>
                    </div>

                    <TokenSelector
                      tokens={tokens[selectedChain] || []}
                      selectedToken={selectedToken}
                      onTokenChange={handleTokenChange}
                      address={address as `0x${string}`}
                      chainId={selectedChain}
                      isConnected={isConnected}
                      isLoading={isCalculating}
                      exchangeRate={exchangeRate}
                      onExchangeRateChange={() => { }}
                    />
                  </div>

                  {/* Exchange Rate Status - Updated styles */}
                  {isCalculating && !calculationComplete && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      // Style similar to upload status pending
                      className="rounded-xl p-4 sm:p-5 border border-blue-300 dark:border-blue-700/20 bg-blue-50 dark:bg-blue-900/10 backdrop-blur-sm"
                    >
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="p-1.5 sm:p-2 rounded-full bg-blue-100 dark:bg-blue-900/10">
                          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-300 animate-spin" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm sm:text-base text-blue-700 dark:text-blue-300">
                            Fetching Price Feed
                          </h4>
                          <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            Getting latest Chainlink rate for {selectedToken?.symbol}...
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {calculationComplete && !error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      // Style similar to upload status success
                      className="rounded-xl p-4 sm:p-5 border border-green-300 dark:border-green-700/20 bg-green-50 dark:bg-green-900/10 backdrop-blur-sm"
                    >
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="p-1.5 sm:p-2 rounded-full bg-green-100 dark:bg-green-900/10">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-300" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm sm:text-base text-green-700 dark:text-green-300">
                            Rate Updated
                          </h4>
                          <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            1 USD = {exchangeRate.toFixed(6)} {selectedToken?.symbol}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      // Style similar to upload status error
                      className="rounded-xl p-4 sm:p-5 border border-red-300 dark:border-red-400/20 bg-red-50 dark:bg-red-400/10 backdrop-blur-sm"
                    >
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="p-1.5 sm:p-2 rounded-full bg-red-100 dark:bg-red-400/10">
                          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm sm:text-base text-red-700 dark:text-red-400">
                            Update Failed
                          </h4>
                          <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            {error} Using estimated rate.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Info Block - Updated styles */}
                  <div className="p-4 sm:p-5 rounded-lg border border-gray-200 dark:border-gray-700/20 bg-gray-50/50 dark:bg-gray-800/10 backdrop-blur-sm">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="p-1.5 sm:p-2 rounded-full bg-gray-200 dark:bg-gray-800/30 mt-0.5 flex-shrink-0">
                        <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-300 flex-shrink-0" />
                      </div>
                      <div className="flex-1">
                        <p className="text-black dark:text-white font-medium text-sm sm:text-base mb-1.5 sm:mb-2">About Exchange Rates</p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed">
                          Rates are fetched from Chainlink price feeds. Salaries are converted from USD to the selected token using this rate.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Action Buttons - Updated styles */}
                <div className="px-4 py-4 sm:px-6 sm:py-5 border-t border-gray-200 dark:border-gray-800/60 bg-gray-50/50 dark:bg-transparent backdrop-blur-sm">
                  <div className="flex flex-col-reverse sm:flex-row justify-center sm:justify-end gap-3 sm:gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      // Style similar to BulkUpload Cancel button
                      className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl border border-gray-300 dark:border-gray-700/80 bg-white dark:bg-gray-800/50 text-black dark:text-gray-300
                    hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 backdrop-blur-sm text-sm sm:text-base"
                      disabled={isCalculating}
                    >
                      {isCalculating ? (
                        <span className="flex items-center justify-center"> {/* Added justify-center */}
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </span>
                      ) : "Cancel"}
                    </motion.button>

                    {isConnected && ( // Show Apply button if connected, handle disabled state inside
                      <motion.button
                        whileHover={!isCalculating ? { scale: 1.02 } : {}}
                        whileTap={!isCalculating ? { scale: 0.98 } : {}}
                        onClick={handleApplySettings}
                        disabled={isCalculating}
                        // Style similar to BulkUpload Upload button
                        className={`w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl transition-all font-medium text-sm sm:text-base
                        ${isCalculating
                            ? "bg-gradient-to-r from-gray-400/70 to-gray-500/70 dark:from-gray-600/40 dark:to-gray-700/40 text-white/70 cursor-not-allowed"
                            // Use blue gradient for primary action
                            : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-800/20 hover:shadow-blue-500/30 dark:hover:shadow-blue-800/30"
                          }`}
                      >
                        {isCalculating ? (
                          <span className="flex items-center justify-center"> {/* Added justify-center */}
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </span>
                        ) : (
                          "Apply Settings"
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            </CardSpotlight>
          </div>
        </motion.div>
      </AnimatePresence >
    ) : (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 dark:bg-black bg-white z-50 p-4 overflow-y-auto"
        >
          <div className="relative w-full min-h-full flex items-center justify-center py-6">
            <CardSpotlight>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 20 }}
                className="relative w-full max-w-md sm:max-w-lg md:max-w-xl p-6 sm:p-8 rounded-xl bg-transparent"
              >
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <Wallet className="w-8 h-8 text-blue-600 dark:text-blue-300" />
                  </div>
                  
                  <div className="space-y-3">
                    <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
                      Connect Your Wallet
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base max-w-sm mx-auto">
                      Connect your wallet to configure payment settings and manage your payroll tokens.
                    </p>
                  </div>
                  
                  <div className="w-full max-w-xs mx-auto pt-2">
                    <ConnectButton.Custom>
                      {({ account, chain, openConnectModal, mounted }) => {
                        return (
                          <div
                            {...(!mounted && {
                              'aria-hidden': true,
                              'style': {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none',
                              },
                            })}
                          >
                            {(() => {
                              return (
                                <motion.button
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={openConnectModal}
                                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg shadow-blue-500/20 dark:shadow-blue-800/20 transition-all"
                                >
                                  Connect Wallet
                                </motion.button>
                              )
                            })()}
                          </div>
                        )
                      }}
                    </ConnectButton.Custom>
                  </div>
                </div>
              </motion.div>
            </CardSpotlight>
          </div>
        </motion.div>
      </AnimatePresence>
    )
  )
};

export default ConfigurePayModal;