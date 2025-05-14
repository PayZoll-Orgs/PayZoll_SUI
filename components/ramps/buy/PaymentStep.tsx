import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { PaymentQR } from '@/lib/interfaces';

// Define actual QR codes - these need to be real QR codes in production
const PAYMENT_QR_CODES: PaymentQR[] = [
    { id: 'upi1', name: 'UPI - PayZoll Finance', image: '/images/qr-codes/upi-payzoll.png' },
    { id: 'upi2', name: 'UPI - Finance Dept', image: '/images/qr-codes/upi-finance.png' },
    { id: 'bank1', name: 'Bank Transfer - HDFC', image: '/images/qr-codes/bank-hdfc.png' },
];

interface PaymentStepProps {
    fiatAmount: string;
    currencyCode: string;
    currencySymbol: string;
    orderId: string;
    onBack: () => void;
    onPaymentMade: () => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({
    fiatAmount,
    currencyCode,
    currencySymbol,
    orderId,
    onBack,
    onPaymentMade,
}) => {
    const [selectedQR, setSelectedQR] = useState(PAYMENT_QR_CODES[0]);

    return (
        <>
            <div className="p-4 space-y-4">
                <div className="flex justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">Pay using QR code</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Order: {orderId.substring(0, 8)}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex justify-center">
                    <img
                        src={selectedQR.image}
                        alt="Payment QR Code"
                        className="max-w-[200px] max-h-[200px]"
                    />
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_QR_CODES.map(qr => (
                        <button
                            key={qr.id}
                            className={`text-xs p-2 border rounded-md text-center ${selectedQR.id === qr.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                            onClick={() => setSelectedQR(qr)}
                        >
                            {qr.name}
                        </button>
                    ))}
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-900 dark:text-white font-medium">Amount to Pay:</span>
                        <span className="text-gray-900 dark:text-white font-bold">
                            {currencySymbol}{fiatAmount} {currencyCode}
                        </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Scan the QR code with your payment app and make the payment of exactly {currencySymbol}{fiatAmount}.
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex">
                    <AlertCircle className="text-blue-500 dark:text-blue-400 h-5 w-5 mr-2 flex-shrink-0" />
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                        After making the payment, please take a screenshot or photo of the payment confirmation and upload it in the next step.
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
                        onClick={onPaymentMade}
                        className="flex-1 py-2 px-4 font-medium rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        I've Made the Payment
                    </button>
                </div>
            </div>
        </>
    );
};

export default PaymentStep;