import React, { useState, useEffect, useCallback } from 'react';
import { fetchInvoicesByEmail, Invoice, updateInvoiceStatus } from '@/api/invoiceApi';
import { usePaymentsManager } from '@/hooks/usePaymentsManager';
import { SuiToken } from '@/lib/sui-tokens';
import { useAuth } from '@/context/authContext';
import { useNetwork } from '@/context/networkContext';
import { toast } from 'react-hot-toast';
import { Clock, CheckCircle, X, Loader, DollarSign, AlertCircle, Users } from 'lucide-react';
import { getExchangeRate } from '@/lib/sui-price-helper';
import { SplitBillModal } from './SplitBillModal';

interface InvoiceListProps {
    selectedToken: SuiToken | undefined;
}

export const InvoiceList = ({ selectedToken }: InvoiceListProps) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [exchangeRate, setExchangeRate] = useState(0);
    const [usdEquivalent, setUsdEquivalent] = useState('');
    const [suiAmount, setSuiAmount] = useState('');
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [splitInvoice, setSplitInvoice] = useState<Invoice | null>(null);
    const [splitBillRefresh, setSplitBillRefresh] = useState(0);
    const [hasShownSuccessToast, setHasShownSuccessToast] = useState(false);

    const { user } = useAuth();
    const { currentNetwork } = useNetwork();
    const {
        sendPayment,
        isLoading: paymentLoading,
        resultMessage,
        fetchUserCoins,
        coinObjects,
        setResultMessage
    } = usePaymentsManager(selectedToken);

    // Reset result message when unmounting or when invoice modal is closed
    useEffect(() => {
        return () => {
            setResultMessage({ type: '', message: '' });
            setErrorMessage('');
        };
    }, [setResultMessage]);

    // Fetch exchange rate when component mounts
    useEffect(() => {
        const fetchExchangeRate = async () => {
            try {
                const rate = await getExchangeRate('SUI');
                setExchangeRate(rate);
            } catch (error) {
                console.error('Failed to fetch SUI exchange rate:', error);
            }
        };

        fetchExchangeRate();
    }, []);

    // Calculate USD equivalent and SUI amount when invoice is selected
    useEffect(() => {
        if (selectedInvoice && exchangeRate > 0) {
            // The invoice amount is in USD, convert to SUI
            // USD to SUI: USD amount * (SUI/USD rate)
            const usdAmount = parseFloat(selectedInvoice.amount.toString());
            const calculatedSuiAmount = usdAmount * exchangeRate;
            setSuiAmount(calculatedSuiAmount.toFixed(6));
            setUsdEquivalent(usdAmount.toFixed(2)); // Keep the original USD amount
        } else {
            setSuiAmount('');
            setUsdEquivalent('');
        }
    }, [selectedInvoice, exchangeRate]);

    // Monitor resultMessage for transaction completion
    useEffect(() => {
        if (transactionInProgress && resultMessage.type && selectedInvoice) {
            if (resultMessage.type === 'success' && resultMessage.message.includes('digest')) {
                // Extract transaction digest from success message
                const txDigit = resultMessage.message.split('digest: ')[1];

                // Update invoice status in backend
                updateInvoiceStatus(selectedInvoice._id, 'paid', txDigit)
                    .then(() => {
                        // Update local invoice list
                        setInvoices(invoices.map(inv =>
                            inv._id === selectedInvoice._id
                                ? { ...inv, paymentStatus: 'paid', transactionHash: txDigit }
                                : inv
                        ));

                        // Only show toast once
                        if (!hasShownSuccessToast) {
                            toast.success('Invoice paid successfully!');
                            setHasShownSuccessToast(true);
                        }

                        setTimeout(() => {
                            setIsPayModalOpen(false);
                            setSelectedInvoice(null);
                            setTransactionInProgress(false);
                        }, 2000); // Give users time to see success message
                    })
                    .catch(error => {
                        console.error('Failed to update invoice status:', error);
                        if (!hasShownSuccessToast) {
                            toast.error('Payment was successful, but failed to update invoice status');
                            setHasShownSuccessToast(true);
                        }
                        setTransactionInProgress(false);
                        setErrorMessage('Payment successful but invoice update failed. Please contact support.');
                    });
            } else if (resultMessage.type === 'error') {
                setErrorMessage(`Payment failed: ${resultMessage.message}`);
                setTransactionInProgress(false);
            }
        }
    }, [resultMessage, transactionInProgress, selectedInvoice, invoices, hasShownSuccessToast]);

    useEffect(() => {
        const fetchInvoices = async () => {
            if (user?.email) {
                try {
                    setLoading(true);
                    const response = await fetchInvoicesByEmail(user.email);
                    setInvoices(response.data);
                } catch (error) {
                    toast.error('Failed to fetch invoices');
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchInvoices();
    }, [user?.email]);

    const handlePayInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsPayModalOpen(true);
        setErrorMessage('');
        setHasShownSuccessToast(false); // Reset the flag when opening a new payment
    };

    const handleSplitInvoice = (invoice: Invoice) => {
        setSplitInvoice(invoice);
        setShowSplitModal(true);
    };

    const handleSplitSuccess = () => {
        // Increase the refresh counter to trigger a refresh of the SplitBillList
        setSplitBillRefresh(prev => prev + 1);
        toast.success('Invoice split successfully!');
    };

    // Check if user has sufficient funds
    const hasSufficientFunds = useCallback((amount: string) => {
        if (!coinObjects || coinObjects.length === 0) return false;

        // Total balance across all coins
        const totalBalance = coinObjects.reduce(
            (sum, coin) => sum + Number(coin.balance),
            0
        );

        // Convert amount to MIST (1 SUI = 10^9 MIST)
        const amountInMist = Math.floor(parseFloat(amount) * 1_000_000_000);

        return totalBalance >= amountInMist;
    }, [coinObjects]);

    const executePayment = async () => {
        if (!selectedInvoice || !suiAmount) return;

        // Check if user has sufficient funds first
        if (!hasSufficientFunds(suiAmount)) {
            setErrorMessage(`Insufficient funds to pay this invoice (${suiAmount} SUI)`);
            return;
        }

        // Generate a unique payment ID
        const paymentId = `INV-${selectedInvoice._id}-${Date.now()}`;

        // Reset any previous result message
        setResultMessage({ type: '', message: '' });
        setErrorMessage('');

        // Set transaction in progress flag
        setTransactionInProgress(true);

        try {
            // Send the payment using the converted SUI amount
            await sendPayment(
                paymentId,
                selectedInvoice.walletAddress,
                suiAmount
            );

            fetchUserCoins(); // Refresh user's coins
        } catch (error) {
            console.error('Payment failed:', error);
            setErrorMessage('Failed to initiate payment');
            setTransactionInProgress(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="h-5 w-5 text-yellow-500" />;
            case 'paid':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'cancelled':
                return <X className="h-5 w-5 text-red-500" />;
            default:
                return null;
        }
    };

    const getPaymentStatusDisplay = () => {
        if (errorMessage) {
            return (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md p-4 my-4">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                        <span className="text-red-700 dark:text-red-400">{errorMessage}</span>
                    </div>
                </div>
            );
        }

        if (transactionInProgress || paymentLoading) {
            return (
                <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-md p-4 my-4">
                    <div className="flex items-center">
                        <Loader className="h-5 w-5 text-blue-500 mr-3 animate-spin" />
                        <span className="text-blue-700 dark:text-blue-400">
                            {resultMessage.message || "Processing your payment..."}
                        </span>
                    </div>
                </div>
            );
        }

        if (resultMessage.type === 'success') {
            return (
                <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-md p-4 my-4">
                    <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-green-700 dark:text-green-400">{resultMessage.message}</span>
                    </div>
                </div>
            );
        }

        return null;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader className="animate-spin h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="mt-4 w-full">
            <h2 className="text-xl font-bold mb-4">Your Invoices</h2>

            {invoices.length === 0 ? (
                <div className="text-center py-8 border border-gray-200 dark:border-gray-700 rounded-md">
                    No invoices found
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Invoice #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">From</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {invoices.map((invoice) => (
                                <tr key={invoice._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{invoice.invoiceNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{invoice.createdBy}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{invoice.amount} {selectedToken?.symbol || 'SUI'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap flex items-center">
                                        {getStatusIcon(invoice.paymentStatus)}
                                        <span className="ml-2">{invoice.paymentStatus}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {invoice.paymentStatus === 'pending' && (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handlePayInvoice(invoice)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded"
                                                    disabled={!invoice.walletAddress}
                                                >
                                                    Pay
                                                </button>
                                                <button
                                                    onClick={() => handleSplitInvoice(invoice)}
                                                    className="border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium py-1 px-3 rounded flex items-center"
                                                >
                                                    <Users size={16} className="mr-1" />
                                                    Split
                                                </button>
                                            </div>
                                        )}
                                        {invoice.paymentStatus === 'paid' && invoice.transactionHash && (
                                            <a
                                                href={`https://suiscan.xyz/${currentNetwork}/tx/${invoice.transactionHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:underline"
                                            >
                                                View Transaction
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Enhanced Payment Modal */}
            {isPayModalOpen && selectedInvoice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-xl w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Pay Invoice {selectedInvoice.invoiceNumber}</h3>
                            {!transactionInProgress && !paymentLoading && (
                                <button
                                    onClick={() => setIsPayModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {/* Invoice Details */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">From</p>
                                        <p className="font-medium">{selectedInvoice.createdBy}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
                                        <p className="font-medium">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Network</p>
                                        <p className="font-medium capitalize">{currentNetwork}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                        <div className="font-medium flex items-center">
                                            {getStatusIcon(selectedInvoice.paymentStatus)}
                                            <span className="ml-2 capitalize">{selectedInvoice.paymentStatus}</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedInvoice.description && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                                        <p className="font-medium">{selectedInvoice.description}</p>
                                    </div>
                                )}
                            </div>

                            {/* Payment Amount */}
                            <div className="p-4 border border-blue-100 dark:border-blue-900 rounded-md">
                                <div className="flex flex-col">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">USD Amount:</span>
                                        <div className="flex items-center">
                                            <DollarSign size={16} className="text-gray-400 mr-1" />
                                            <span className="text-lg font-bold">{selectedInvoice.amount}</span>
                                        </div>
                                    </div>

                                    {exchangeRate > 0 && suiAmount && (
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-gray-500 dark:text-gray-400">SUI to Pay:</span>
                                            <span className="text-lg font-bold">{suiAmount} {selectedToken?.symbol || 'SUI'}</span>
                                        </div>
                                    )}

                                    <div className="text-xs text-gray-500 mt-2">
                                        Exchange Rate: 1 USD = {exchangeRate > 0 ? exchangeRate.toFixed(6) : '...'} SUI
                                    </div>
                                </div>
                            </div>

                            {/* Wallet Address Info */}
                            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Recipient Address</p>
                                <p className="font-mono text-sm break-all mt-1">{selectedInvoice.walletAddress}</p>
                            </div>

                            {/* Payment Status/Messages */}
                            {getPaymentStatusDisplay()}
                        </div>

                        <div className="flex justify-end space-x-4 mt-6">
                            {!resultMessage.type && (
                                <>
                                    <button
                                        onClick={() => setIsPayModalOpen(false)}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                                        disabled={paymentLoading || transactionInProgress}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={executePayment}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                                        disabled={paymentLoading || transactionInProgress || !hasSufficientFunds(suiAmount)}
                                    >
                                        {paymentLoading || transactionInProgress ? (
                                            <span className="flex items-center">
                                                <Loader className="animate-spin mr-2 h-4 w-4" />
                                                Processing...
                                            </span>
                                        ) : (
                                            `Pay ${suiAmount} ${selectedToken?.symbol || 'SUI'} (${selectedInvoice.amount} USD)`
                                        )}
                                    </button>
                                </>
                            )}

                            {resultMessage.type === 'success' && (
                                <button
                                    onClick={() => setIsPayModalOpen(false)}
                                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                >
                                    Close
                                </button>
                            )}
                        </div>

                        {/* Show warning if insufficient funds */}
                        {selectedInvoice && !hasSufficientFunds(suiAmount) && (
                            <div className="mt-4 text-sm text-red-600 dark:text-red-400">
                                <AlertCircle className="inline h-4 w-4 mr-1" />
                                Insufficient funds to complete this payment
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Split Bill Modal */}
            {showSplitModal && splitInvoice && (
                <SplitBillModal
                    invoice={splitInvoice}
                    onClose={() => setShowSplitModal(false)}
                    onSuccess={handleSplitSuccess}
                />
            )}
        </div>
    );
};