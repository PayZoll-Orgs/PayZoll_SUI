export function PaymentStatusInfo() {
    return (
        <div className="space-y-2 text-sm">
            <p>
                <span className="font-medium">Important:</span> Only payments with 'Sent' status can be claimed or reimbursed.
            </p>
            <ul className="list-disc pl-5 text-sm">
                <li><span className="font-medium text-blue-600">Sent</span> - Payment is waiting to be claimed by recipient or reimbursed by sender</li>
                <li><span className="font-medium text-green-600">Claimed</span> - Payment has already been claimed by the recipient</li>
                <li><span className="font-medium text-yellow-600">Reimbursed</span> - Payment has been returned to the sender</li>
            </ul>

            <div className="mt-2 text-xs">
                <span className="font-medium">Note:</span> If a payment has already been claimed, it cannot be reimbursed. If it has been reimbursed, it cannot be claimed.
            </div>
        </div>
    );
}