import axiosClient from './axiosClient';

// Types
export interface Invoice {
    _id: string;
    invoiceNumber: string;
    createdBy: string;
    clientName: string;
    clientEmail: string;
    issueDate: string;
    dueDate: string;
    description: string;
    amount: number;
    walletAddress: string;
    paymentStatus: 'pending' | 'paid' | 'cancelled';
    transactionHash?: string;
}

interface InvoiceResponse {
    status: string;
    data: Invoice[];
    results?: number;
}

interface SingleInvoiceResponse {
    status: string;
    data: Invoice;
}

// Fetch invoices by email
export const fetchInvoicesByEmail = async (email: string): Promise<InvoiceResponse> => {
    const response = await axiosClient.get(`/invoices/client-invoices?email=${encodeURIComponent(email)}`);
    return response.data;
};

// Create a new invoice
export const createInvoice = async (invoiceData: {
    clientName: string;
    clientEmail: string;
    dueDate: string;
    description: string;
    amount: number;
    walletAddress?: string;
}): Promise<SingleInvoiceResponse> => {
    const response = await axiosClient.post('/invoices', invoiceData);
    return response.data;
};

// Update invoice payment status
export const updateInvoiceStatus = async (
    invoiceId: string,
    paymentStatus: 'pending' | 'paid' | 'cancelled',
    transactionHash?: string
): Promise<SingleInvoiceResponse> => {
    const response = await axiosClient.patch(`/invoices/${invoiceId}/payment`, {
        paymentStatus,
        transactionHash
    });
    return response.data;
};

// Get invoice by ID
export const getInvoiceById = async (id: string): Promise<SingleInvoiceResponse> => {
    const response = await axiosClient.get(`/invoices/${id}`);
    return response.data;
};