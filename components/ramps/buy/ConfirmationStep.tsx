import React from 'react';
import { Copy, AlertCircle } from 'lucide-react';
import { Token } from '@/lib/evm-tokens-mainnet';
import { allMainnetChains } from '@/lib/evm-chains-mainnet';
import { truncateAddress } from '@/lib/utils';

interface ConfirmationStepProps {
    address: string;
    selectedToken: Token | null;
    selectedChain: typeof allMainnetChains[0]; // Use the actual chain type
    cryptoAmount: string;
    fiatAmount: string;
    selectedCurrency: { code: string; symbol: string; name: string };
    exchangeRate: number;
    orderId: string;
    onBack: () => void;
    onConfirm: () => void;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
    address,
    selectedToken,
    selectedChain,
    cryptoAmount,
    fiatAmount,
    selectedCurrency,
    exchangeRate,
    orderId,
    onBack,
    onConfirm,
}) => {
    return (
        <>
            <div className="p-4 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">Purchase Details</h4>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-500 dark:text-gray-400">Receiving Address:</div>
                        <div className="text-gray-900 dark:text-white font-medium">{truncateAddress(address, 8, 6)}</div>

                        <div className="text-gray-500 dark:text-gray-400">Cryptocurrency:</div>
                        <div className="text-gray-900 dark:text-white font-medium">{selectedToken?.symbol} on {selectedChain.name}</div>

                        <div className="text-gray-500 dark:text-gray-400">Amount to Buy:</div>
                        <div className="text-gray-900 dark:text-white font-medium">{cryptoAmount} {selectedToken?.symbol}</div>

                        <div className="text-gray-500 dark:text-gray-400">Payment Amount:</div>
                        <div className="text-gray-900 dark:text-white font-medium">{selectedCurrency.symbol}{fiatAmount} {selectedCurrency.code}</div>

                        <div className="text-gray-500 dark:text-gray-400">Exchange Rate:</div>
                        <div className="text-gray-900 dark:text-white font-medium">
                            1 {selectedToken?.symbol.includes('USDT') ? 'USDT' : 'USDC'} = {selectedCurrency.symbol}{exchangeRate.toFixed(2)}
                        </div>

                        <div className="text-gray-500 dark:text-gray-400">Order ID:</div>
                        <div className="text-gray-900 dark:text-white font-medium flex items-center">
                            <span className="mr-1">{orderId.substring(0, 12)}...</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(orderId);
                                    alert("Order ID copied to clipboard");
                                }}
                                className="text-blue-500 hover:text-blue-600"
                            >
                                <Copy size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg flex">
                    <AlertCircle className="text-yellow-500 dark:text-yellow-400 h-5 w-5 mr-2 flex-shrink-0" />
                    <p className="text-yellow-700 dark:text-yellow-200 text-sm">
                        Please confirm these details are correct. After confirmation, you'll be shown payment options.
                    </p>
                </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex space-x-3">
                    <button
                        onClick={onBack}
                        className="flex-1 py-2 px-4 font-medium rounded-lg shadow-sm bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700"
                    >
                        Back
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2 px-4 font-medium rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Confirm & Pay
                    </button>
                </div>
            </div>
        </>
    );
};

export default ConfirmationStep;