import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { v4 as uuidv4 } from 'uuid';
import { X, AlertCircle, ChevronDown, Check, Wallet, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TokenAndChainSelector } from './TokenAndChainSelector';
import { Token } from '@/lib/evm-tokens-mainnet';
import { allMainnetChains } from '@/lib/evm-chains-mainnet';
import { truncateAddress } from '@/lib/utils';
import { rampApi } from '@/api/rampApi';
import { BuyFormData } from '@/lib/interfaces';

// Import step components
import ConfirmationStep from './buy/ConfirmationStep';
import PaymentStep from './buy/PaymentStep';
import ReceiptUploadStep from './buy/ReceiptUploadStep';
import SuccessStep from './buy/SuccessStep';

// Supported fiat currencies
const FIAT_CURRENCIES = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', enabled: true },
    { code: 'USD', name: 'US Dollar', symbol: '$', enabled: false },
    { code: 'EUR', name: 'Euro', symbol: '€', enabled: false },
    { code: 'GBP', name: 'British Pound', symbol: '£', enabled: false },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', enabled: false },
];

interface BuyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => Promise<void>;
}

// Steps in the buying process
enum BuyStep {
    FORM,           // Initial form
    CONFIRMATION,   // Confirm details
    PAYMENT,        // Show QR for payment
    UPLOAD_RECEIPT, // Upload payment receipt
    SUCCESS,        // Success message
}

const BuyModal: React.FC<BuyModalProps> = ({ isOpen, onClose }) => {
    const { isConnected, address } = useAccount();

    // UI States
    const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState<BuyStep>(BuyStep.FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Form States
    const [selectedChain, setSelectedChain] = useState(allMainnetChains[0]);
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);
    const [selectedCurrency, setSelectedCurrency] = useState(FIAT_CURRENCIES[0]);
    const [cryptoAmount, setCryptoAmount] = useState('');
    const [fiatAmount, setFiatAmount] = useState('');

    // Replace the static EXCHANGE_RATES with a state
    const [EXCHANGE_RATES, setEXCHANGE_RATES] = useState<{
        [key: string]: Record<SupportedCurrency, number>
    }>({
        USDT: { INR: 0, USD: 0, EUR: 0, GBP: 0, AUD: 0 },
        USDC: { INR: 0, USD: 0, EUR: 0, GBP: 0, AUD: 0 }
    });

    // Add loading state
    const [isLoadingRates, setIsLoadingRates] = useState(true);

    // Add this effect to fetch rates when needed
    useEffect(() => {
        const fetchExchangeRates = async () => {
            try {
                // Fetch rates for both tokens
                const [usdtRates, usdcRates] = await Promise.all([
                    rampApi.getExchangeRates('USDT'),
                    rampApi.getExchangeRates('USDC')
                ]);

                // Transform the response to match existing structure
                setEXCHANGE_RATES({
                    USDT: {
                        INR: usdtRates.data.INR.buyRate,
                        USD: usdtRates.data.USD.buyRate,
                        EUR: usdtRates.data.EUR.buyRate,
                        GBP: usdtRates.data.GBP.buyRate,
                        AUD: usdtRates.data.AUD.buyRate,
                    },
                    USDC: {
                        INR: usdcRates.data.INR.buyRate,
                        USD: usdcRates.data.USD.buyRate,
                        EUR: usdcRates.data.EUR.buyRate,
                        GBP: usdcRates.data.GBP.buyRate,
                        AUD: usdcRates.data.AUD.buyRate,
                    }
                });
                setIsLoadingRates(false);
            } catch (error) {
                console.error('Error fetching exchange rates:', error);
            }
        };

        // Fetch initially when component mounts
        fetchExchangeRates();

        // Set up an interval to refresh rates every minute
        const intervalId = setInterval(fetchExchangeRates, 60000);

        // Cleanup interval on unmount
        return () => clearInterval(intervalId);
    }, []);

    // Generate an order ID on component mount
    useEffect(() => {
        if (isOpen) {
            // Generate a unique order ID
            setOrderId(uuidv4());
        }
    }, [isOpen]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setCurrentStep(BuyStep.FORM);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    // Calculate fiat amount when crypto amount changes
    useEffect(() => {
        if (cryptoAmount && selectedToken && selectedCurrency) {
            const baseSymbol = selectedToken.symbol.includes('USDT') ? 'USDT' : 'USDC';
            const rate = EXCHANGE_RATES[baseSymbol as keyof typeof EXCHANGE_RATES][selectedCurrency.code as keyof (typeof EXCHANGE_RATES)['USDT']] || 0;
            const amount = parseFloat(cryptoAmount) * rate;
            setFiatAmount(amount.toFixed(2));
        } else {
            setFiatAmount('');
        }
    }, [cryptoAmount, selectedToken, selectedCurrency, EXCHANGE_RATES]);

    // Calculate crypto amount when fiat amount changes
    const handleFiatAmountChange = (value: string) => {
        setFiatAmount(value);
        if (value && selectedToken && selectedCurrency) {
            const baseSymbol = selectedToken.symbol.includes('USDT') ? 'USDT' : 'USDC';
            const rate = EXCHANGE_RATES[baseSymbol as keyof typeof EXCHANGE_RATES][selectedCurrency.code as keyof (typeof EXCHANGE_RATES)['USDT']] || 0;
            const amount = parseFloat(value) / rate;
            setCryptoAmount(amount.toFixed(6));
        } else {
            setCryptoAmount('');
        }
    };

    // Handle the file upload and complete the purchase
    const handleSubmitPurchase = async (file: File) => {
        if (!selectedToken || !address) {
            throw new Error("Missing required data");
        }

        try {
            setIsSubmitting(true);

            // Create the buy data object
            const buyData: BuyFormData = {
                wallet: address,
                tokenBought: selectedToken.symbol,
                chain: selectedChain.id.toString(), // Use the ID as a string instead of name
                amountToken: cryptoAmount,
                fiatType: selectedCurrency.code,
                amountFiat: fiatAmount,
                exchangeRate: EXCHANGE_RATES[selectedToken.symbol.includes('USDT') ? 'USDT' : 'USDC' as keyof typeof EXCHANGE_RATES][selectedCurrency.code as keyof (typeof EXCHANGE_RATES)['USDT']].toString(),
                orderId: orderId,
            };

            // Send data with file to the API - ensure file is passed
            await rampApi.buy(buyData, file); // Make sure file is passed here

            // Show success screen
            setCurrentStep(BuyStep.SUCCESS);
        } catch (error) {
            console.error("Error submitting purchase:", error);
            alert("There was an error processing your purchase. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle closing with confirmation if in the middle of a flow
    const handleCloseModal = () => {
        if (currentStep !== BuyStep.FORM && currentStep !== BuyStep.SUCCESS) {
            setShowConfirmDialog(true);
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    // First, add a type for supported currencies
    type SupportedCurrency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD';

    // Then modify the getExchangeRate function
    const getExchangeRate = () => {
        if (!selectedToken || isLoadingRates) return 0;
        const baseSymbol = selectedToken.symbol.includes('USDT') ? 'USDT' : 'USDC';
        return EXCHANGE_RATES[baseSymbol][selectedCurrency.code as SupportedCurrency] || 0;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md mx-4 my-8 overflow-hidden max-h-[90vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header - Keep fixed at top */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    {currentStep === BuyStep.FORM && "Buy Cryptocurrency"}
                                    {currentStep === BuyStep.CONFIRMATION && "Confirm Purchase"}
                                    {currentStep === BuyStep.PAYMENT && "Make Payment"}
                                    {currentStep === BuyStep.UPLOAD_RECEIPT && "Upload Payment Receipt"}
                                    {currentStep === BuyStep.SUCCESS && "Purchase Complete"}
                                </h3>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Add a scrollable container for the content */}
                            <div className="flex-1 overflow-y-auto">
                                {currentStep === BuyStep.FORM && (
                                    <div className="p-4 space-y-4">
                                        {/* Token and Chain Selector */}
                                        <TokenAndChainSelector
                                            selectedChain={selectedChain}
                                            selectedToken={selectedToken}
                                            onChainChange={setSelectedChain}
                                            onTokenChange={setSelectedToken}
                                        />

                                        {/* Receiving Wallet Information */}
                                        {isConnected && address && (
                                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                                                <div className="flex items-start">
                                                    <Wallet className="text-yellow-500 dark:text-yellow-400 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Tokens will be sent to</h4>
                                                        <p className="text-yellow-700 dark:text-yellow-200 text-sm mt-1">
                                                            {truncateAddress(address, 8, 8)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Currency Selection */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Payment Currency
                                            </label>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                                                    className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-gray-900 dark:text-white">
                                                            {selectedCurrency?.code} ({selectedCurrency?.symbol})
                                                        </span>
                                                    </div>
                                                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                </button>

                                                {isCurrencyDropdownOpen && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md py-1 border border-gray-200 dark:border-gray-700">
                                                        {FIAT_CURRENCIES.map((currency) => (
                                                            <button
                                                                key={currency.code}
                                                                disabled={!currency.enabled}
                                                                className={`w-full text-left px-4 py-2 flex items-center justify-between ${currency.enabled
                                                                    ? 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                                    : 'opacity-50 cursor-not-allowed'
                                                                    }`}
                                                                onClick={() => {
                                                                    if (currency.enabled) {
                                                                        setSelectedCurrency(currency);
                                                                        setIsCurrencyDropdownOpen(false);
                                                                    }
                                                                }}
                                                            >
                                                                <span className="text-gray-900 dark:text-white flex items-center">
                                                                    {currency.code} ({currency.symbol})
                                                                    {!currency.enabled && (
                                                                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                                                            Coming soon
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                {selectedCurrency?.code === currency.code && (
                                                                    <Check className="h-4 w-4 text-green-500" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Amount Inputs */}
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Amount to Buy
                                                </label>
                                                <div className="flex rounded-md shadow-sm">
                                                    <input
                                                        type="number"
                                                        value={cryptoAmount}
                                                        onChange={(e) => setCryptoAmount(e.target.value)}
                                                        placeholder="0.00"
                                                        min="0"
                                                        step="0.01"
                                                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-sm">
                                                        {selectedToken?.symbol || "Token"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Payment Amount
                                                </label>
                                                <div className="flex rounded-md shadow-sm">
                                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-sm">
                                                        {selectedCurrency.symbol}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        value={fiatAmount}
                                                        onChange={(e) => handleFiatAmountChange(e.target.value)}
                                                        placeholder="0.00"
                                                        min="0"
                                                        step="0.01"
                                                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-r-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Conversion Rate Display */}
                                        {selectedToken && selectedCurrency && (
                                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-500 dark:text-gray-400">Conversion Rate:</span>
                                                    <span className="text-gray-900 dark:text-white font-medium">
                                                        1 {selectedToken.symbol.includes('USDT') ? 'USDT' : 'USDC'} = {selectedCurrency.symbol}
                                                        {getExchangeRate().toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Order ID Display */}
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">Order ID:</span>
                                                <span className="text-gray-900 dark:text-white font-medium">
                                                    {orderId.substring(0, 8)}...
                                                </span>
                                            </div>
                                        </div>

                                        {/* Information Box */}
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex">
                                            <AlertCircle className="text-blue-500 dark:text-blue-400 h-5 w-5 mr-2 flex-shrink-0" />
                                            <p className="text-blue-700 dark:text-blue-300 text-sm">
                                                After confirming your details, you'll be shown payment options to complete your purchase.
                                            </p>
                                        </div>

                                        {/* Action Button */}
                                        <div className="pt-4">
                                            <button
                                                onClick={() => setCurrentStep(BuyStep.CONFIRMATION)}
                                                disabled={!isConnected || !selectedToken || !cryptoAmount || !fiatAmount || parseFloat(cryptoAmount) <= 0}
                                                className={`w-full py-2 px-4 font-medium rounded-lg shadow-sm ${isConnected && selectedToken && cryptoAmount && fiatAmount && parseFloat(cryptoAmount) > 0
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                Continue to Confirmation
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {currentStep === BuyStep.CONFIRMATION && (
                                    <ConfirmationStep
                                        address={address || ""}
                                        selectedToken={selectedToken}
                                        selectedChain={selectedChain}
                                        cryptoAmount={cryptoAmount}
                                        fiatAmount={fiatAmount}
                                        selectedCurrency={selectedCurrency}
                                        exchangeRate={getExchangeRate()}
                                        orderId={orderId}
                                        onBack={() => setCurrentStep(BuyStep.FORM)}
                                        onConfirm={() => setCurrentStep(BuyStep.PAYMENT)}
                                    />
                                )}

                                {currentStep === BuyStep.PAYMENT && (
                                    <PaymentStep
                                        fiatAmount={fiatAmount}
                                        currencyCode={selectedCurrency.code}
                                        currencySymbol={selectedCurrency.symbol}
                                        orderId={orderId}
                                        onBack={() => setCurrentStep(BuyStep.CONFIRMATION)}
                                        onPaymentMade={() => setCurrentStep(BuyStep.UPLOAD_RECEIPT)}
                                    />
                                )}

                                {currentStep === BuyStep.UPLOAD_RECEIPT && (
                                    <ReceiptUploadStep
                                        orderId={orderId}
                                        onBack={() => setCurrentStep(BuyStep.PAYMENT)}
                                        onSubmit={handleSubmitPurchase}
                                    />
                                )}

                                {currentStep === BuyStep.SUCCESS && (
                                    <SuccessStep
                                        orderId={orderId}
                                        cryptoAmount={cryptoAmount}
                                        tokenSymbol={selectedToken?.symbol || ""}
                                        onClose={onClose}
                                    />
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Confirmation Dialog */}
                    {showConfirmDialog && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
                            >
                                <div className="p-4 flex flex-col items-center">
                                    <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/20 mb-4">
                                        <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        Cancel Purchase?
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                                        Are you sure you want to cancel this purchase? Your progress will be lost.
                                    </p>
                                    <div className="flex space-x-3 w-full">
                                        <button
                                            onClick={() => setShowConfirmDialog(false)}
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            Keep editing
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowConfirmDialog(false);
                                                onClose();
                                            }}
                                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            Yes, cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </>
            )}
        </AnimatePresence>
    );
};

export default BuyModal;