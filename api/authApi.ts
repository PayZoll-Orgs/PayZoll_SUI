import axiosClient from './axiosClient';
import { LoginFormData, RegisterFormData } from '@/lib/interfaces';

export const authApi = {
    login: async (credentials: LoginFormData) => {
        const response = await axiosClient.post('/auth/login', credentials);

        if (response.data?.token) {
            localStorage.setItem('authToken', response.data.token);
        }

        if (response.data?.safeUser) {
            localStorage.setItem("user", JSON.stringify(response.data.safeUser)); // <- fix here
        }

        console.log('Login response:', response.data);

        return response.data;
    },

    register: async (data: RegisterFormData) => {
        const response = await axiosClient.post('/auth/register', data);
        return response.data;
    },

    forgotPassword: async (email: string) => {
        const response = await axiosClient.post('/auth/forgotPassword', { email });
        return response.data;
    },

    ping: async () => {
        const response = await axiosClient.post('/auth/ping');
        return response.data;
    }
};