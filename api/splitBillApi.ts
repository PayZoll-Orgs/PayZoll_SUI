import axiosClient from './axiosClient';
import { walrusApi } from './walrusApi';

// Types
export interface SplitParticipant {
    _id?: string;
    nickname: string;
    email: string;
    walletAddress: string;
    amount: number;
    status: 'pending' | 'paid';
    paymentDate?: string;
    transactionHash?: string;
}

export interface SplitBill {
    _id: string;
    splitId: string;
    invoiceId: string;
    invoiceNumber: string;
    createdBy: string;
    initiatorEmail: string;
    initiatorWalletAddress: string;
    totalAmount: number;
    dueDate: string;
    participants: SplitParticipant[];
    status: 'active' | 'completed' | 'cancelled';
    completedDate?: string;
    createdAt: string;
    updatedAt: string;
}

interface SplitBillResponse {
    status: string;
    data: SplitBill[];
    results?: number;
}

interface SingleSplitBillResponse {
    status: string;
    data: SplitBill;
    allPaid?: boolean;
}

// Create a new split bill
export const createSplitBill = async (
    invoiceId: string,
    initiatorWalletAddress: string,
    participants: { nickname: string; amount: number }[]
): Promise<SingleSplitBillResponse> => {
    const response = await axiosClient.post('/split-bill', {
        invoiceId,
        initiatorWalletAddress,
        participants
    });

    const splitBill = response.data.data;

    // Create blockchain audit record
    await walrusApi.storeAuditRecord({
        recordType: 'splitBill',
        recordId: splitBill._id,
        timestamp: Date.now(),
        walletAddresses: [
            initiatorWalletAddress,
            ...splitBill.participants.map((p: SplitParticipant) => p.walletAddress)
        ],
        amounts: [splitBill.totalAmount || 0],
        totalAmount: splitBill.totalAmount || 0,
        chain: 'SUI',
        status: 'created'
    });

    return response.data;
};

// Get all split bills initiated by the current user
export const getInitiatedSplitBills = async (): Promise<SplitBillResponse> => {
    const response = await axiosClient.get('/split-bill/initiated');
    return response.data;
};

// Get all split bills where the current user is a participant
export const getParticipantSplitBills = async (): Promise<SplitBillResponse> => {
    const response = await axiosClient.get('/split-bill/participating');
    return response.data;
};

// Get split bill by ID
export const getSplitBillById = async (id: string): Promise<SingleSplitBillResponse> => {
    const response = await axiosClient.get(`/split-bill/id/${id}`);
    return response.data;
};

// Get split bill by splitId
export const getSplitBillBySplitId = async (splitId: string): Promise<SingleSplitBillResponse> => {
    const response = await axiosClient.get(`/split-bill/split-id/${splitId}`);
    return response.data;
};

// Update participant payment status
export const updateParticipantPayment = async (
    splitId: string,
    participantEmail: string,
    transactionHash: string
): Promise<SingleSplitBillResponse> => {
    const response = await axiosClient.patch(`/split-bill/${splitId}/participant/${participantEmail}`, {
        transactionHash
    });

    // Get the split bill details with the updated participant
    const splitBill = response.data.data;
    const participant = splitBill.participants.find(
        (p: SplitParticipant) => p.email === participantEmail
    );

    // Create blockchain audit record for the payment
    if (participant) {
        await walrusApi.storeAuditRecord({
            recordType: 'splitBill',
            recordId: splitBill._id,
            timestamp: Date.now(),
            walletAddresses: [participant.walletAddress],
            amounts: [participant.amount || 0],
            totalAmount: participant.amount || 0,
            chain: 'SUI',
            status: 'participant_paid',
            transactionHash
        });
    }

    return response.data;
};