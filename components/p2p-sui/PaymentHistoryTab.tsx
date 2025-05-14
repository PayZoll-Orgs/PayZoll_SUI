"use client";

import { useCurrentAccount } from '@mysten/dapp-kit';
import { SuiToken } from '@/lib/sui-tokens';
import { Payment, PaymentAction } from '@/types/payment-types';
import { PaymentStatusBadge } from './shared/PaymentStatusBadge';

interface PaymentRowProps {
    payment: Payment;
    currentUserAddress: string;
    selectedToken?: SuiToken;
    onActionSelected: (paymentObjectId: string, action: PaymentAction) => void;
}

function PaymentRow({
    payment, currentUserAddress, selectedToken, onActionSelected
}: PaymentRowProps) {
    const fields = payment.parsedJson;
    const isSender = fields.from === currentUserAddress;
    const isRecipient = fields.to === currentUserAddress;
    const status = fields.statusInfo?.status || 'SENT';
    const canClaim = isRecipient && status === 'SENT';
    const canReimburse = isSender && status === 'SENT';

    const paymentIdText = typeof fields.payment_id === 'string'
        ? fields.payment_id
        : new TextDecoder().decode(new Uint8Array(fields.payment_id));

    return (
        <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/10">
            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{paymentIdText}</td>
            <td className="px-4 py-2 text-sm">
                <span className={`px-2 py-1 rounded text-xs ${isSender ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                    {isSender ? 'Sent' : 'Received'}
                </span>
            </td>
            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                {isSender
                    ? `To: ${fields.to.substring(0, 8)}...`
                    : `From: ${fields.from.substring(0, 8)}...`
                }
            </td>
            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                {Number(fields.amount) / 1_000_000_000} {selectedToken?.symbol || 'SUI'}
            </td>
            <td className="px-4 py-2 text-sm">
                <PaymentStatusBadge status={status} />
                {fields.statusInfo?.timestamp && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {fields.statusInfo.timestamp}
                    </div>
                )}
            </td>
            <td className="px-4 py-2 text-sm">
                <div className="flex space-x-2">
                    {canClaim && (
                        <button
                            onClick={() => onActionSelected(fields.payment_object_id, 'claim')}
                            className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                            title="Claim this payment to your wallet"
                        >
                            Claim
                        </button>
                    )}

                    {canReimburse && (
                        <button
                            onClick={() => onActionSelected(fields.payment_object_id, 'reimburse')}
                            className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                            title="Return this payment to your wallet"
                        >
                            Reimburse
                        </button>
                    )}

                    {/* Status indicator when no actions available */}
                    {!canClaim && !canReimburse && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {status === 'CLAIMED' ? 'Payment claimed' : 'Payment reimbursed'}
                        </span>
                    )}
                </div>

                {/* Payment object ID for reference */}
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    ID: {fields.payment_object_id.substring(0, 8)}...
                </div>
            </td>
        </tr>
    );
}

interface PaymentHistoryTabProps {
    payments: Payment[];
    selectedToken: SuiToken | undefined;
    onActionSelected: (paymentObjectId: string, action: PaymentAction) => void;
}

export function PaymentHistoryTab({
    payments,
    selectedToken,
    onActionSelected
}: PaymentHistoryTabProps) {
    const currentAccount = useCurrentAccount();

    if (!currentAccount) {
        return <div className="text-gray-900 dark:text-white">Please connect your wallet to view payment history.</div>;
    }

    return (
        <div>
            <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Payment History</h3>

            {payments.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No payments found.</p>
            ) : (
                <div className="overflow-hidden">
                    <table className="w-full">
                        <thead className="border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Payment ID</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Direction</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Address</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment, index) => (
                                <PaymentRow
                                    key={index}
                                    payment={payment}
                                    currentUserAddress={currentAccount.address}
                                    selectedToken={selectedToken}
                                    onActionSelected={onActionSelected}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}