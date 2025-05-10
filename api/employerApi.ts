import axiosClient from './axiosClient';
import { Employee } from '@/lib/interfaces';

export const employerApi = {

    
    getAllEmployees: async () => {
        const response = await axiosClient.get(`/employee/`);
        return response.data;
    },

    getEmployeeByWallet: async (wallet: string) => {
        const response = await axiosClient.get(`/employee/${wallet}`);
        return response.data;
    },

    addEmployee: async (employeeData: Partial<Employee>) => {
        const response = await axiosClient.post('/employee/add', employeeData);
        return response.data;
    },

    getEmployeePayroll: async (wallet: string) => {
        const response = await axiosClient.get(`/employee/payroll/${wallet}`);
        return response.data;
    },

    // Bulk upload functionality
    bulkUploadEmployees: async (fileData: FormData) => {
        const response = await axiosClient.post('/employee/bulk-upload', fileData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // Update employee
    updateEmployee: async (wallet: string, employee: Partial<Employee>) => {
        const response = await axiosClient.patch(`/employee/update/${wallet}`, employee);
        return response.data;
    },

    // Delete employee
    deleteEmployee: async (wallet: string) => {
        const response = await axiosClient.delete(`/employee/delete/${wallet}`);
        return response.data;
    }
};