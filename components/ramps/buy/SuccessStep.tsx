import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface SuccessStepProps {
    orderId: string;
    cryptoAmount: string;
    tokenSymbol: string;
    onClose: () => void;
}

const SuccessStep: React.FC<SuccessStepProps> = ({
    orderId,
    cryptoAmount,
    tokenSymbol,
    onClose,
}) => {
    return (
        <>
            <div className="p-4 space-y-4 text-center">
                <div className="mx-auto bg-green-100 dark:bg-green-900/20 rounded-full p-3 w-16 h-16 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
                </div>

                <h4 className="text-lg font-medium text-gray-900 dark:text-white">Purchase Successful!</h4>

                <p className="text-gray-600 dark:text-gray-300">
                    Your order has been successfully submitted. You will receive {cryptoAmount} {tokenSymbol} to your wallet within 24 hours.
                </p>

                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400">Order ID:</span>
                        <span className="text-gray-900 dark:text-white font-medium">{orderId}</span>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-left flex">
                    <AlertCircle className="text-blue-500 dark:text-blue-400 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                        You can check the status of your order in the "Orders" section of your account. For any questions, please contact our support team.
                    </p>
                </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <button
                    onClick={onClose}
                    className="w-full py-2 px-4 font-medium rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
                >
                    Close
                </button>
            </div>
        </>
    );
};

export default SuccessStep;