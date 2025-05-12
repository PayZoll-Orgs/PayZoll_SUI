export type PaymentStatus = 'SENT' | 'CLAIMED' | 'REIMBURSED';

export type PaymentAction = 'claim' | 'reimburse';

export interface PaymentFields {
    payment_id: string | Uint8Array;
    from: string;
    to: string;
    amount: string;
    payment_object_id: string;
    statusInfo?: {
        status: PaymentStatus;
        timestamp?: string;
    };
}

export interface Payment {
    parsedJson: PaymentFields;
}

export interface ResultMessage {
    type: string | null;
    message: string | null;
}