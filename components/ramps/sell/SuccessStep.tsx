import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';

interface SuccessStepProps {
    orderId: string;
    cryptoAmount: string;
    tokenSymbol: string;
    fiatAmount: string;
    currencySymbol: string;
    onClose: () => void;
}

export const SuccessStep: React.FC<SuccessStepProps> = ({
    orderId,
    cryptoAmount,
    tokenSymbol,
    fiatAmount,
    currencySymbol,
    onClose,
}) => {
    return (
        <div className="p-4 space-y-4 text-center">
            <div className="flex justify-center my-6">
                <CheckCircle className="h-16 w-16 text-green-500" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Sale Submitted Successfully!
            </h3>

            <p className="text-gray-600 dark:text-gray-300">
                Your order to sell {cryptoAmount} {tokenSymbol} for {currencySymbol}{fiatAmount} has been submitted.
            </p>

            {/* Order Details */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mx-auto max-w-xs">
                <p className="text-sm text-gray-500 dark:text-gray-400">Order ID</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{orderId}</p>
            </div>

            {/* Timeline */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-left">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-1" /> Next Steps:
                </h4>
                <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-200 space-y-1 pl-1">
                    <li>Our team will verify your transaction</li>
                    <li>We'll process your payment to the provided details</li>
                    <li>You'll receive {currencySymbol}{fiatAmount} within 24 hours</li>
                </ol>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
                You can view your order status in the "Orders" section of your account.
            </div>

            <button
                onClick={onClose}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium mt-2"
            >
                Done
            </button>
        </div>
    );
};