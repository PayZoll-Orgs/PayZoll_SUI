"use client";

import { useEffect, useState } from 'react';
import { ResultMessageDisplay } from './ResultMessageDisplay';
import { PaymentStatusInfo } from './shared/PaymentStatusInfo';
import { Payment, PaymentAction } from '@/types/payment-types';
import { useCurrentAccount } from '@mysten/dapp-kit';

interface ActionButtonProps {
    onClick: () => void;
    isDisabled: boolean;
    actionType: PaymentAction | null;
    buttonType: PaymentAction;
    isLoading: boolean;
    title: string;
    label: string;
    activeColor: string;
}

function ActionButton({
    onClick, isDisabled, actionType, buttonType, isLoading, title, label, activeColor
}: ActionButtonProps) {
    // Map color classes to their hover/focus variants
    const colorMap:any = {
        "dark:bg-green-500 bg-green-300": {
            base: "bg-green-300 dark:bg-green-500",
            hover: "hover:bg-green-400 dark:hover:bg-green-600",
            active: "active:bg-green-500 dark:active:bg-green-700",
            shadow: "shadow-green-200/50 dark:shadow-green-900/20"
        },
        "dark:bg-yellow-500 bg-yellow-300": {
            base: "bg-yellow-300 dark:bg-yellow-500",
            hover: "hover:bg-yellow-400 dark:hover:bg-yellow-600",
            active: "active:bg-yellow-500 dark:active:bg-yellow-700",
            shadow: "shadow-yellow-200/50 dark:shadow-yellow-900/20"
        }
    };

    // Get color variants or use defaults
    const colors = colorMap[activeColor] || {
        base: "bg-gray-300 dark:bg-gray-600",
        hover: "hover:bg-gray-400 dark:hover:bg-gray-700",
        active: "active:bg-gray-500 dark:active:bg-gray-800",
        shadow: "shadow-gray-200/50 dark:shadow-gray-900/20"
    };

    const isActive = actionType === buttonType;

    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            className={`
                flex-1 relative py-3 px-6 rounded-lg font-medium text-sm
                transition-all duration-200 ease-in-out
                transform hover:scale-[1.02] active:scale-[0.98]
                focus:outline-none focus:ring-2 focus:ring-opacity-50
                
                ${isActive ? `
                    ${colors.base}
                    shadow-lg ${colors.shadow}
                    ${colors.hover}
                    ${colors.active}
                    focus:ring-opacity-50 focus:ring-green-400 dark:focus:ring-green-700
                ` : `
                    bg-gray-200 dark:bg-gray-700
                    hover:bg-gray-300 dark:hover:bg-gray-600
                    shadow-md shadow-gray-200/30 dark:shadow-gray-900/10
                    active:bg-gray-400 dark:active:bg-gray-800
                    focus:ring-gray-400 dark:focus:ring-gray-500
                `}
                
                disabled:opacity-60 disabled:cursor-not-allowed
                disabled:shadow-none disabled:transform-none
                disabled:bg-gray-200 dark:disabled:bg-gray-800
                disabled:hover:scale-100
                
                text-gray-800 dark:text-white
            `}
            title={title}
        >
            {isLoading ? (
                <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                </div>
            ) : (
                <span>{label}</span>
            )}

            {/* Subtle gradient overlay for depth */}
            {!isDisabled && (
                <span className={`absolute inset-0 rounded-lg opacity-20 bg-gradient-to-t from-black/5 to-white/20 pointer-events-none`}></span>
            )}
        </button>
    );
}

interface ClaimReimburseTabProps {
    isLoading: boolean;
    payments: Payment[];
    onExecutePaymentAction: (paymentObjectId: string, action: PaymentAction) => void;
    preselectedPaymentId?: string;
    preselectedAction: PaymentAction | null;
    onClearAction: () => void;
}

export function ClaimReimburseTab({
    isLoading,
    payments,
    onExecutePaymentAction,
    preselectedPaymentId = '',
    preselectedAction,
    onClearAction
}: ClaimReimburseTabProps) {
    const currentAccount = useCurrentAccount();
    const [paymentObjectId, setPaymentObjectId] = useState(preselectedPaymentId);
    const [actionType, setActionType] = useState<PaymentAction | null>(preselectedAction);
    const [resultMessageState, setResultMessageState] = useState({ type: '', message: '' });

    const handleDismissMessage = () => {
        setResultMessageState({ type: '', message: '' });
    };

    // Sync with parent component when preselected values change
    useEffect(() => {
        setPaymentObjectId(preselectedPaymentId);
        setActionType(preselectedAction);
    }, [preselectedPaymentId, preselectedAction]);

    const handleExecuteAction = (action: PaymentAction) => {
        onExecutePaymentAction(paymentObjectId, action);
        setActionType(action);
    };

    // Find the selected payment to get additional context
    const selectedPayment = payments.find(
        payment => payment.parsedJson.payment_object_id === paymentObjectId
    );

    return (
        <div>
            <ResultMessageDisplay
                message={resultMessageState}
                onDismiss={handleDismissMessage}
            />

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Payment Object ID</label>
                <input
                    type="text"
                    value={paymentObjectId}
                    onChange={e => {
                        setPaymentObjectId(e.target.value);
                        setActionType(null); // Reset action type when ID changes manually
                        if (e.target.value !== preselectedPaymentId) {
                            onClearAction(); // Let parent know we changed from preselected
                        }
                    }}
                    placeholder="0x..."
                    className="bg-transparent w-full p-2 border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter the payment object ID you want to claim or reimburse</p>
            </div>

            {/* Payment Status Information */}
            {paymentObjectId && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-md">
                    <h4 className="font-medium text-sm mb-2 text-gray-900 dark:text-white">Payment Status Check</h4>
                    <PaymentStatusInfo />

                    {selectedPayment && (
                        <div className="mt-3 p-2 bg-white dark:bg-gray-800/50 border-b border-gray-300 dark:border-gray-700">
                            <div className="text-sm text-gray-900 dark:text-white"><strong>Payment ID:</strong> {
                                typeof selectedPayment.parsedJson.payment_id === 'string'
                                    ? selectedPayment.parsedJson.payment_id
                                    : new TextDecoder().decode(new Uint8Array(selectedPayment.parsedJson.payment_id))
                            }</div>
                            <div className="text-sm text-gray-900 dark:text-white"><strong>Amount:</strong> {
                                Number(selectedPayment.parsedJson.amount) / 1_000_000_000
                            } SUI</div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-row items-center justify-center">
                <div className='w-auto space-x-3'>
                    <ActionButton
                        onClick={() => handleExecuteAction('claim')}
                        isDisabled={isLoading ||
                            actionType === 'reimburse' ||
                            !selectedPayment ||
                            selectedPayment.parsedJson.statusInfo?.status !== 'SENT' ||
                            selectedPayment.parsedJson.from === currentAccount?.address}
                        actionType={actionType}
                        buttonType="claim"
                        isLoading={isLoading}
                        title="Claim this payment to your wallet"
                        label="Claim Payment"
                        activeColor="dark:bg-green-500 bg-green-300"
                    />

                    <ActionButton
                        onClick={() => handleExecuteAction('reimburse')}
                        isDisabled={isLoading ||
                            actionType === 'claim' ||
                            !selectedPayment ||
                            selectedPayment.parsedJson.statusInfo?.status !== 'SENT' ||
                            selectedPayment.parsedJson.from !== currentAccount?.address}
                        actionType={actionType}
                        buttonType="reimburse"
                        isLoading={isLoading}
                        title="Return this payment to your wallet"
                        label="Reimburse Payment"
                        activeColor="dark:bg-yellow-500 bg-yellow-300"
                    />
                </div>
            </div>
        </div>
    );
}