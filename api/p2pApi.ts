import axiosClient from './axiosClient';

// Address Book API endpoints
const ENDPOINTS = {
    ADDRESS_BOOK: '/addressBook',
    SEARCH: '/addressBook/search',
};

// Types
export interface AddressBookEntry {
    _id: string;
    company: string;
    nickname: string;
    walletAddress: string;
    createdAt: string;
    updatedAt: string;
}

interface AddressBookResponse {
    status: string;
    data: AddressBookEntry[];
    results?: number;
}

interface SingleAddressResponse {
    status: string;
    data: AddressBookEntry;
}

// Get all addresses in the address book
export const fetchAllAddresses = async (): Promise<AddressBookResponse> => {
    const response = await axiosClient.get(ENDPOINTS.ADDRESS_BOOK);
    return response.data;
};

// Search addresses by nickname
export const searchAddresses = async (query: string): Promise<AddressBookResponse> => {
    const response = await axiosClient.get(`${ENDPOINTS.SEARCH}?query=${encodeURIComponent(query)}`);
    return response.data;
};

// Add a new address to the address book
export const addAddress = async (
    nickname: string,
    walletAddress: string
): Promise<SingleAddressResponse> => {
    const response = await axiosClient.post(ENDPOINTS.ADDRESS_BOOK, {
        nickname,
        walletAddress
    });
    return response.data;
};

// Update an existing address
export const updateAddress = async (
    currentNickname: string,
    data: {
        walletAddress?: string;
        newNickname?: string;
    }
): Promise<SingleAddressResponse> => {
    const response = await axiosClient.patch(
        `${ENDPOINTS.ADDRESS_BOOK}/${encodeURIComponent(currentNickname)}`,
        data
    );
    return response.data;
};

// Delete an address from the address book
export const deleteAddress = async (nickname: string): Promise<void> => {
    await axiosClient.delete(`${ENDPOINTS.ADDRESS_BOOK}/${encodeURIComponent(nickname)}`);
};

// Get an address by nickname
export const getAddressByNickname = async (nickname: string): Promise<SingleAddressResponse> => {
    const response = await axiosClient.get(`${ENDPOINTS.ADDRESS_BOOK}/${encodeURIComponent(nickname)}`);
    return response.data;
};

// Resolve a recipient input (address or nickname) to a wallet address
export const resolveRecipient = async (recipientInput: string): Promise<string> => {
    // Skip resolution if input is already a valid SUI address (0x followed by 64 hex chars)
    if (/^0x[a-fA-F0-9]{64}$/.test(recipientInput)) {
        return recipientInput;
    }

    // Remove @ prefix if present
    const nickname = recipientInput.startsWith('@')
        ? recipientInput.substring(1)
        : recipientInput;

    try {
        const response = await getAddressByNickname(nickname);
        return response.data.walletAddress;
    } catch (error) {
        throw new Error(`Could not resolve nickname "${nickname}" to a wallet address`);
    }
};