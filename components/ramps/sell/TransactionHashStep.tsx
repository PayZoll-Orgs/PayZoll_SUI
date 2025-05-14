import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Upload, Trash } from 'lucide-react';
import { truncateAddress } from '@/lib/utils';
import { Chain } from 'viem';

interface TransactionHashStepProps {
    orderId: string;
    companyWalletAddress: string;
    selectedToken: any;
    selectedChain: Chain;
    cryptoAmount: string;
    transactionHash: string;
    onTransactionHashChange: (hash: string) => void;
    onBack: () => void;
    onSubmit: (file?: File) => void;
    isSubmitting: boolean;
    // Payment details props
    paymentDetails: string;
    onPaymentDetailsChange: (details: string) => void;
    onSetQrFile: React.Dispatch<React.SetStateAction<File | null>>;
}

export const TransactionHashStep: React.FC<TransactionHashStepProps> = ({
    orderId,
    companyWalletAddress,
    selectedToken,
    selectedChain,
    cryptoAmount,
    transactionHash,
    onTransactionHashChange,
    onBack,
    onSubmit,
    isSubmitting,
    paymentDetails,
    onPaymentDetailsChange,
    onSetQrFile,
}) => {
    const [qrImage, setQrImage] = useState<string | null>(null);
    const [qrFile, setQrFile] = useState<File | null>(null);
    const [upiId, setUpiId] = useState<string>(paymentDetails || '');

    // Determine which explorer to use based on the selected chain
    const getExplorerUrl = () => {
        if (!transactionHash) return '';

        const explorerUrl = selectedChain.blockExplorers?.default?.url;
        if (!explorerUrl) return ''; // Fallback if no explorer URL available

        return `${explorerUrl}/tx/${transactionHash}`;
    };

    // Handle QR image upload
    const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Store the file object for later submission
            setQrFile(file);

            // Also set it in the parent component
            onSetQrFile(file);

            // For preview purposes only
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                setQrImage(imageUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle removing QR image
    const handleRemoveQr = () => {
        setQrImage(null);
        setQrFile(null);
        onSetQrFile(null); // Also clear in parent component
    };

    // Handle UPI ID change
    const handleUpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setUpiId(value);
        onPaymentDetailsChange(value);
    };

    // Update the parent component's submission function to include the file
    const handleSubmit = () => {
        // Ensure we have both UPI ID and QR file
        if (upiId.trim() && qrFile) {
            onSubmit(qrFile);
        } else {
            // Don't submit if either is missing
            alert("Both UPI ID and QR Code are required");
        }
    };

    return (
        <div className="p-4 space-y-4">
            {/* Order Information */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Transaction Details</h4>
                <p className="text-blue-600 dark:text-blue-200 text-sm mb-1">Order ID: {orderId}</p>
                <p className="text-blue-600 dark:text-blue-200 text-sm mb-1">
                    Amount: {cryptoAmount} {selectedToken?.symbol}
                </p>
                <p className="text-blue-600 dark:text-blue-200 text-sm break-all">
                    To: {truncateAddress(companyWalletAddress, 10, 10)}
                </p>
            </div>

            {/* Payment Details Input - Both UPI and QR are now required */}
            <div className="space-y-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Please provide both your UPI ID and QR code so we can send you the money
                </p>

                {/* UPI ID input - Always shown and required */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        UPI ID <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={upiId}
                        onChange={handleUpiChange}
                        placeholder="username@upi"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* QR Code upload - Always shown and required */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        QR Code <span className="text-red-500">*</span>
                    </label>
                    {!qrImage ? (
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center">
                            <label className="cursor-pointer block">
                                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-500">Click to upload your payment QR code</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleQrUpload}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    ) : (
                        <div className="relative">
                            <img
                                src={qrImage}
                                alt="QR Code"
                                className="h-40 mx-auto rounded-lg object-contain bg-white"
                            />
                            <button
                                onClick={handleRemoveQr}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                            >
                                <Trash className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction Hash Input */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enter Transaction Hash
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    After sending tokens to our address, paste the transaction hash from your wallet below
                </p>
                <input
                    type="text"
                    value={transactionHash}
                    onChange={(e) => onTransactionHashChange(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                />
                {transactionHash && (
                    <a
                        href={getExplorerUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs flex items-center mt-1"
                    >
                        View on {selectedChain.blockExplorers?.default?.name || "Explorer"} <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                )}
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">Finding Your Transaction Hash:</h4>
                <ol className="list-decimal list-inside text-xs text-yellow-700 dark:text-yellow-200 space-y-1 pl-1">
                    <li>Open your wallet application (MetaMask, etc.)</li>
                    <li>Find the transaction in your activity/history</li>
                    <li>Click on the transaction to view details</li>
                    <li>Copy the transaction hash/ID (starts with 0x)</li>
                    <li>Paste it in the field above</li>
                </ol>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex space-x-3">
                <button
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium flex items-center justify-center disabled:opacity-50"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!transactionHash || !upiId.trim() || !qrFile || isSubmitting}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium ${transactionHash && upiId.trim() && qrFile && !isSubmitting
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Transaction'}
                </button>
            </div>
        </div>
    );
};