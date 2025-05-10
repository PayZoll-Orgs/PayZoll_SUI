import axiosClient from './axiosClient';
import { BuyFormData, SellFormData } from '@/lib/interfaces';

// Admin token - in a real app, this should be stored securely
const ADMIN_TOKEN = '1807';

export const rampApi = {
    buy: async (credentials: BuyFormData, receiptFile?: File) => {
        if (!receiptFile) {
            throw new Error("Receipt file is required for buy transactions");
        }

        // Use FormData to handle file uploads
        const formData = new FormData();

        // Add the file with a specific field name that your backend expects
        formData.append('receipt', receiptFile);

        // Add all other fields
        Object.keys(credentials).forEach(key => {
            formData.append(key, credentials[key as keyof BuyFormData]);
        });

        // Log for debugging - can be removed in production
        console.log('Sending buy request with file:', receiptFile.name);

        const response = await axiosClient.post('/buyOrders/buy', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    sell: async (data: SellFormData, qrFile: File) => {
        const formData = new FormData();

        // Add the QR file
        formData.append('qrImage', qrFile);

        // Add all other fields to FormData
        Object.keys(data).forEach(key => {
            formData.append(key, data[key as keyof SellFormData]);
        });

        const response = await axiosClient.post('/sellOrders/sell', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    getUserBuyOrders: async (walletAddress: string, page = 1, limit = 10, status?: string) => {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (status) {
            queryParams.append('status', status);
        }

        const response = await axiosClient.get(`/buyOrders/wallet/${walletAddress}?${queryParams}`);
        return response.data;
    },

    getUserSellOrders: async (walletAddress: string, page = 1, limit = 10, status?: string) => {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (status) {
            queryParams.append('status', status);
        }

        const response = await axiosClient.get(`/sellOrders/wallet/${walletAddress}?${queryParams}`);
        return response.data;
    },

    // Get exchange rates for a specific token
    getExchangeRates: async (tokenSymbol: string) => {
        try {
            const response = await axiosClient.get(`/exchange-rates/${tokenSymbol}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching exchange rates:', error);
            throw error;
        }
    },

    // Admin Functions
    admin: {
        // Buy Order Functions
        getAllBuyOrders: async (page = 1, limit = 10, filters = {}) => {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                token: ADMIN_TOKEN,
                ...filters
            });

            const response = await axiosClient.get(`/buyOrders/all?${queryParams}`);
            return response.data;
        },

        getBuyOrderById: async (orderId: string) => {
            const response = await axiosClient.get(`/buyOrders/detail/${orderId}?token=${ADMIN_TOKEN}`);
            return response.data;
        },

        updateBuyOrderStatus: async (orderId: string, status: string, notes?: string) => {
            const response = await axiosClient.put(`/buyOrders/${orderId}/status`, {
                status,
                notes,
                token: ADMIN_TOKEN
            });
            return response.data;
        },

        completeBuyOrder: async (orderId: string, transactionHash: string) => {
            const response = await axiosClient.put(`/buyOrders/${orderId}/complete`, {
                transactionHash,
                token: ADMIN_TOKEN
            });
            return response.data;
        },

        // Sell Order Functions
        getAllSellOrders: async (page = 1, limit = 10, filters = {}) => {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                token: ADMIN_TOKEN,
                ...filters
            });

            const response = await axiosClient.get(`/sellOrders/all?${queryParams}`);
            return response.data;
        },

        getSellOrderById: async (orderId: string) => {
            const response = await axiosClient.get(`/sellOrders/detail/${orderId}?token=${ADMIN_TOKEN}`);
            return response.data;
        },

        updateSellOrderStatus: async (orderId: string, status: string, notes?: string) => {
            const response = await axiosClient.put(`/sellOrders/${orderId}/status`, {
                status,
                notes,
                token: ADMIN_TOKEN
            });
            return response.data;
        },

        completeSellOrder: async (orderId: string, paymentProofFile: File) => {
            // Use FormData to handle file uploads
            const formData = new FormData();

            // Add the payment proof file
            formData.append('paymentProof', paymentProofFile);

            // Add the admin token - THIS WAS MISSING
            formData.append('token', ADMIN_TOKEN);

            console.log("Uploading payment proof for order:", orderId);

            const response = await axiosClient.put(`/sellOrders/${orderId}/complete`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        }
    }
};