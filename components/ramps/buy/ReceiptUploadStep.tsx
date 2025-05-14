import React, { useRef, useState } from 'react';
import { Upload, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface ReceiptUploadStepProps {
    orderId: string;
    onBack: () => void;
    onSubmit: (file: File) => Promise<void>;
}

const ReceiptUploadStep: React.FC<ReceiptUploadStepProps> = ({
    orderId,
    onBack,
    onSubmit,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setReceiptFile(file);

            // Create a preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleSubmitPurchase = async () => {
        if (!receiptFile) {
            alert("Please upload a payment receipt to continue");
            return;
        }

        try {
            setIsSubmitting(true);
            await onSubmit(receiptFile);
        } catch (error) {
            console.error("Error submitting receipt:", error);
            alert("There was an error uploading your receipt. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="p-4 space-y-4">
                <div className="flex justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">Upload Payment Screenshot</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Order: {orderId.substring(0, 8)}</p>
                </div>

                <div
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center ${receiptFile
                        ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
                        : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
                        }`}
                    onClick={handleUploadClick}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />

                    {receiptPreview ? (
                        <div className="space-y-3">
                            <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                            <img
                                src={receiptPreview}
                                alt="Receipt preview"
                                className="max-h-[150px] mx-auto rounded-md border border-gray-200 dark:border-gray-700 shadow-sm"
                            />
                            <div className="text-sm text-green-700 dark:text-green-400 font-medium">
                                {receiptFile?.name}
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setReceiptFile(null);
                                    setReceiptPreview(null);
                                }}
                                className="px-3 py-1 text-xs bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300 rounded-full hover:bg-green-200 dark:hover:bg-green-800/50"
                            >
                                Change File
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto" />
                            <div className="space-y-1">
                                <p className="text-gray-700 dark:text-gray-300 font-medium">Upload payment confirmation</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Click to upload or drag and drop a screenshot of your payment
                                </p>
                            </div>
                            <span className="text-xs inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                                PNG, JPG or JPEG up to 5MB
                            </span>
                        </div>
                    )}
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg flex">
                    <AlertCircle className="text-yellow-500 dark:text-yellow-400 h-5 w-5 mr-2 flex-shrink-0" />
                    <p className="text-yellow-700 dark:text-yellow-200 text-sm">
                        Your payment screenshot helps us verify your transaction. Please ensure it clearly shows the payment details and transaction ID.
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
                        onClick={handleSubmitPurchase}
                        disabled={!receiptFile || isSubmitting}
                        className={`flex-1 py-2 px-4 font-medium rounded-lg shadow-sm flex items-center justify-center ${receiptFile && !isSubmitting
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {isSubmitting ? (
                            <>
                                <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                                Processing...
                            </>
                        ) : (
                            'Complete Purchase'
                        )}
                    </button>
                </div>
            </div>
        </>
    );
};

export default ReceiptUploadStep;