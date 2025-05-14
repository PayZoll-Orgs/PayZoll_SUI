import { PaymentStatus } from '@/types/payment-types';

interface PaymentStatusBadgeProps {
    status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
    // Style and text based on status
    let statusStyle = 'bg-blue-100 text-blue-800'; // Default for SENT
    let statusText = 'Pending';

    if (status === 'CLAIMED') {
        statusStyle = 'bg-green-100 text-green-800';
        statusText = 'Claimed';
    } else if (status === 'REIMBURSED') {
        statusStyle = 'bg-yellow-100 text-yellow-800';
        statusText = 'Reimbursed';
    }

    return (
        <span className={`px-2 py-1 rounded text-xs ${statusStyle}`}>
            {statusText}
        </span>
    );
}