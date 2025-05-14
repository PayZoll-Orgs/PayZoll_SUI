"use client";

import { useState } from 'react';
import { SuiToken } from '@/lib/sui-tokens';
import { usePaymentsManager } from '@/hooks/usePaymentsManager';
import SendPaymentTab from './SendPaymentTab';
import { ClaimReimburseTab } from './ClaimReimburseTab';
import { PaymentHistoryTab } from './PaymentHistoryTab';
import { PaymentAction } from '@/types/payment-types';
import AddressBookTab from './addressBook/AddressBookTab';

interface SecureTransferInterfaceProps {
    selectedToken: SuiToken | undefined;
}

export function SecureTransferInterface({ selectedToken }: SecureTransferInterfaceProps) {
    const [tab, setTab] = useState('send');
    const [paymentObjectId, setPaymentObjectId] = useState('');
    const [actionType, setActionType] = useState<PaymentAction | null>(null);

    const {
        payments,
        isLoading,
        resultMessage,
        setResultMessage,
        sendPayment,
        executePaymentAction
    } = usePaymentsManager(selectedToken);

    const handleActionSelected = (id: string, action: PaymentAction) => {
        setPaymentObjectId(id);
        setActionType(action);
        setTab('claim'); // Automatically switch to claim tab
    };

    const handleClearAction = () => {
        setPaymentObjectId('');
        setActionType(null);
    };

    const handleDismissResult = () => {
        setResultMessage({ type: '', message: '' });
    };

    const tabs = [
        { id: 'send', label: 'Send Payment' },
        { id: 'claim', label: 'Claim/Reimburse' },
        { id: 'history', label: 'Payment History' },
        { id: 'addressBook', label: 'Address Book' },
    ];

    return (
        <div className="mt-8 min-w-[70vw] bg-transparent rounded-xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 mb-4">
                {tabs.map((tabItem) => (
                    <button
                        key={tabItem.id}
                        onClick={() => {
                            setTab(tabItem.id);
                            handleClearAction();
                        }}
                        className={`px-4 py-3 text-sm font-medium ${tab === tabItem.id
                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
                            }`}
                    >
                        {tabItem.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="p-4">
                {tab === 'send' && (
                    <SendPaymentTab
                        selectedToken={selectedToken}
                        isLoading={isLoading}
                        resultMessage={resultMessage}
                        onSendPayment={sendPayment}
                        onDismissResult={handleDismissResult}
                    />
                )}
                {tab === 'claim' && (
                    <ClaimReimburseTab
                        isLoading={isLoading}
                        payments={payments}
                        onExecutePaymentAction={executePaymentAction}
                        preselectedPaymentId={paymentObjectId}
                        preselectedAction={actionType}
                        onClearAction={handleClearAction}
                    />
                )}
                {tab === 'history' && (
                    <PaymentHistoryTab
                        payments={payments}
                        selectedToken={selectedToken}
                        onActionSelected={handleActionSelected}
                    />
                )}
                {tab === 'addressBook' && <AddressBookTab />}
            </div>
        </div>
    );
}