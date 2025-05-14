"use client";

import { useState, useEffect, KeyboardEvent } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Search, DollarSign } from 'lucide-react';
import { fetchAllAddresses, searchAddresses, resolveRecipient } from '@/api/p2pApi';
import { ResultMessageDisplay } from './ResultMessageDisplay';
import { getExchangeRate } from '@/lib/sui-price-helper';

export default function SendPaymentTab({
    selectedToken,
    isLoading,
    resultMessage,
    onSendPayment,
    onDismissResult
}: {
    selectedToken: any;
    isLoading: boolean;
    resultMessage?: { type: string; message: string };
    onSendPayment: (paymentId: string, payeeAddress: string, amount: string) => void;
    onDismissResult?: () => void;
}) {
    const [amount, setAmount] = useState(''); // SUI amount
    const [usdAmount, setUsdAmount] = useState(''); // USD amount
    const [exchangeRate, setExchangeRate] = useState(0);
    const [isConvertingPrice, setIsConvertingPrice] = useState(false);
    const [recipient, setRecipient] = useState('');
    const [paymentId, setPaymentId] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [localIsLoading, setLocalIsLoading] = useState(false);

    // Combined message state - using parent message or local error
    const displayMessage = errorMessage
        ? { type: 'error', message: errorMessage }
        : resultMessage || { type: '', message: '' };

    interface AddressBookEntry {
        _id: string;
        nickname: string;
        walletAddress: string;
    }

    const [addressBookEntries, setAddressBookEntries] = useState<AddressBookEntry[]>([]);
    const [showAddressBookDropdown, setShowAddressBookDropdown] = useState(false);
    const [addressSearchQuery, setAddressSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const currentAccount = useCurrentAccount();
    const address = currentAccount?.address;

    // Initialize payment ID
    useEffect(() => {
        setPaymentId(`payment-${Date.now()}-${Math.floor(Math.random() * 1000000)}`);
    }, []);

    // Fetch address book
    useEffect(() => {
        if (address) {
            loadAddressBook();
        }
    }, [address]);

    // Sync loading state from parent
    useEffect(() => {
        setLocalIsLoading(isLoading);
    }, [isLoading]);

    // Fetch SUI price on component mount
    useEffect(() => {
        const fetchExchangeRate = async () => {
            try {
                const rate = await getExchangeRate('SUI');
                setExchangeRate(rate);
            } catch (error) {
                console.error('Failed to fetch SUI exchange rate:', error);
                setErrorMessage('Could not fetch current SUI price. Using fallback rate.');
            }
        };

        fetchExchangeRate();
    }, []);

    // Convert USD to SUI when USD amount changes
    useEffect(() => {
        const convertUsdToSui = async () => {
            if (!usdAmount || isNaN(parseFloat(usdAmount)) || parseFloat(usdAmount) <= 0) {
                setAmount('');
                return;
            }

            setIsConvertingPrice(true);

            try {
                // If we don't have an exchange rate yet, fetch it
                let rate = exchangeRate;
                if (rate <= 0) {
                    rate = await getExchangeRate('SUI');
                    setExchangeRate(rate);
                }

                // Convert USD to SUI: USD amount × (SUI/USD rate)
                const usdAmountNum = parseFloat(usdAmount);
                const suiAmount = usdAmountNum * rate;

                // Format to 6 decimal places max
                setAmount(suiAmount.toFixed(6));
            } catch (error) {
                console.error('Error converting USD to SUI:', error);
                setErrorMessage('Could not convert USD to SUI. Please try again.');
            } finally {
                setIsConvertingPrice(false);
            }
        };

        convertUsdToSui();
    }, [usdAmount, exchangeRate]);

    const handleDismissMessage = () => {
        setErrorMessage('');

        // Notify parent component if needed
        if (onDismissResult) {
            onDismissResult();
        }
    };

    const loadAddressBook = async () => {
        try {
            const response = await fetchAllAddresses();
            setAddressBookEntries(response.data);
        } catch (error) {
            console.error('Failed to load address book:', error);
        }
    };

    const handleAddressSearch = async (query: string) => {
        setAddressSearchQuery(query);

        if (query.length > 0) {
            setIsSearching(true);
            try {
                const result = await searchAddresses(query);
                setAddressBookEntries(result.data);
            } catch (error) {
                console.error('Address search failed:', error);
            } finally {
                setIsSearching(false);
            }
        } else {
            loadAddressBook();
        }
    };

    const selectContact = (contact: AddressBookEntry) => {
        setRecipient(contact.walletAddress);
        setShowAddressBookDropdown(false);
    };

    const handleSendPayment = async () => {
        if (!recipient || !amount) {
            setErrorMessage('Please provide both recipient and amount');
            return;
        }

        setErrorMessage('');
        setLocalIsLoading(true);

        try {
            let resolvedAddress = recipient;
            if (!recipient.startsWith('0x')) {
                try {
                    resolvedAddress = await resolveRecipient(recipient);
                } catch (error) {
                    setErrorMessage(`Could not resolve nickname: ${recipient}`);
                    setLocalIsLoading(false);
                    return;
                }
            }

            onSendPayment(paymentId, resolvedAddress, amount);
            // Note: Don't reset localIsLoading here, the parent component will control that
        } catch (error) {
            setErrorMessage('Payment failed: ' + (error instanceof Error ? error.message : String(error)));
            setLocalIsLoading(false);
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setShowAddressBookDropdown(true);
            handleAddressSearch(recipient);
        }
    };

    const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setRecipient(value);

        if (value.length > 2) {
            setShowAddressBookDropdown(true);
            handleAddressSearch(value);
        } else if (value.length === 0) {
            setShowAddressBookDropdown(false);
        }
    };

    const handleUsdAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow valid number inputs
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setUsdAmount(value);
        }
    };

    // Use either parent or local loading state
    const effectiveIsLoading = isLoading || localIsLoading;

    return (
        <div className="flex justify-center items-center">
            <div className="max-w-4xl w-full space-y-6 backdrop-blur-sm p-8 rounded-lg">
                <ResultMessageDisplay
                    message={displayMessage}
                    onDismiss={handleDismissMessage}
                />

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Recipient Address or Username
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={recipient}
                            onChange={handleRecipientChange}
                            onKeyPress={handleKeyPress}
                            className="w-full p-2 pr-10 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none text-gray-900 dark:text-white"
                            placeholder="wallet address or username"
                            disabled={effectiveIsLoading}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddressBookDropdown(!showAddressBookDropdown);
                                if (!showAddressBookDropdown) loadAddressBook();
                            }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            disabled={effectiveIsLoading}
                        >
                            <Search size={18} />
                        </button>

                        {showAddressBookDropdown && (
                            <div className="absolute z-10 w-full mt-1 backdrop-blur-md bg-white/70 dark:bg-gray-800/70 rounded-md shadow-lg">
                                <div className="max-h-48 overflow-y-auto">
                                    {isSearching ? (
                                        <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                                            Searching...
                                        </div>
                                    ) : addressBookEntries.length > 0 ? (
                                        addressBookEntries.map((contact) => (
                                            <div
                                                key={contact._id}
                                                className="p-3 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 cursor-pointer border-b border-gray-200/50 dark:border-gray-700/50"
                                                onClick={() => selectContact(contact)}
                                            >
                                                <div className="font-medium text-gray-900 dark:text-white">{contact.nickname}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {contact.walletAddress}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                                            {addressSearchQuery ? 'No contacts found' : 'Your address book is empty'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* USD Amount Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Amount (USD)
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-2">
                                <DollarSign size={16} className="text-gray-500 dark:text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={usdAmount}
                                onChange={handleUsdAmountChange}
                                className="w-full p-2 pl-8 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none text-gray-900 dark:text-white"
                                placeholder="0.00"
                                disabled={effectiveIsLoading}
                            />
                        </div>
                    </div>

                    {/* SUI Amount Display */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Equivalent in SUI
                        </label>
                        <div className="relative">
                            {isConvertingPrice ? (
                                <div className="w-full p-2 bg-transparent border-b border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400">
                                    Converting...
                                </div>
                            ) : (
                                <div className="w-full p-2 bg-transparent border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                                    {amount ? `${amount} SUI` : '0.00 SUI'}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Exchange Rate: 1 USD ≈ {exchangeRate > 0 ? exchangeRate.toFixed(6) : '...'} SUI
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleSendPayment}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-md font-medium shadow-md transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={effectiveIsLoading || isConvertingPrice || !amount || !recipient}
                >
                    {effectiveIsLoading ? 'Sending...' : `Send ${amount ? amount + ' SUI' : 'Payment'}`}
                </button>
            </div>
        </div>
    );
}