import axios, { AxiosError, AxiosInstance } from 'axios';
import { backendDomain } from '@/lib/network';

const API_BASE_URL = backendDomain

const axiosClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding token
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for handling errors
axiosClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const { response } = error;

        // Handle token expiration/auth errors
        if (response?.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = '/';
        }

        // Enhanced error handling
        return Promise.reject({
            status: response?.status,
            message: typeof response?.data === 'object' && response?.data && 'message' in response.data
                ? (response.data as { message: string }).message
                : 'An unexpected error occurred',
            data: response?.data,
            originalError: error
        });
    }
);

export default axiosClient;