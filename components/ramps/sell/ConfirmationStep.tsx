import React from 'react';
import { Copy, ArrowLeft, Send } from 'lucide-react';
import { truncateAddress } from '@/lib/utils';

interface ConfirmationStepProps {
    orderId: string;
    selectedToken: any;
    selectedChain: any;
    cryptoAmount: string;
    fiatAmount: string;
    selectedCurrency: any;
    exchangeRate: number;
    paymentMethod: any;
    paymentDetails: string;
    companyWalletAddress: string;
    onBack: () => void;
    onConfirm: () => void;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
    orderId,
    selectedToken,
    selectedChain,
    cryptoAmount,
    fiatAmount,
    selectedCurrency,
    exchangeRate,
    paymentMethod,
    paymentDetails,
    companyWalletAddress,
    onBack,
    onConfirm,
}) => {
    return (
        <div className="p-4 space-y-4">
            {/* Order Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Order Summary</h4>
                <p className="text-blue-600 dark:text-blue-200 text-sm mb-1">Order ID: {orderId}</p>
            </div>

            {/* Amount Details */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">You're selling:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                        {cryptoAmount} {selectedToken?.symbol}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">You'll receive:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                        {selectedCurrency?.symbol}{fiatAmount}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Network:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                        {selectedChain?.name}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Exchange Rate:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                        1 {selectedToken?.symbol} = {selectedCurrency?.symbol}{exchangeRate.toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Payment Details */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">Payment Details</h4>
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">Method:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {paymentMethod?.icon} {paymentMethod?.name}
                        </span>
                    </div>
                    <div className="text-sm">
                        <div className="text-gray-600 dark:text-gray-400">Details:</div>
                        <div className="whitespace-pre-wrap bg-white dark:bg-gray-700 p-2 rounded mt-1 text-gray-900 dark:text-white text-xs">
                            {paymentDetails}
                        </div>
                    </div>
                </div>
            </div>

            {/* Destination Wallet Information */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <div className="flex items-start">
                    <Send className="text-purple-500 dark:text-purple-400 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300">Send tokens to this address</h4>
                        <p className="text-purple-700 dark:text-purple-200 text-sm mt-1 break-all">
                            {companyWalletAddress}
                        </p>
                        <button
                            className="mt-1 text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center"
                            onClick={() => {
                                navigator.clipboard.writeText(companyWalletAddress);
                                alert('Address copied to clipboard!');
                            }}
                        >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy address
                        </button>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">Next Steps:</h4>
                <ol className="list-decimal list-inside text-xs text-yellow-700 dark:text-yellow-200 space-y-1 pl-1">
                    <li>Send exactly {cryptoAmount} {selectedToken?.symbol} to the address above</li>
                    <li>Wait for the transaction to be confirmed on the blockchain</li>
                    <li>Provide the transaction hash in the next step</li>
                </ol>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex space-x-3">
                <button
                    onClick={onBack}
                    className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium flex items-center justify-center"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                    Confirm & Continue
                </button>
            </div>
        </div>
    );
};