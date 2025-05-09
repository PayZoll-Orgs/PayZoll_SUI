import axiosClient from './axiosClient';
import { AuditLogData } from '@/lib/interfaces';

export const auditApi = {
    addAuditLog: async (logData: AuditLogData) => {
        const response = await axiosClient.post('/audit/add', logData);
        return response.data;
    },

    getCompanyLogs: async (companyName: string) => {
        const response = await axiosClient.get(`/audit/logs/${companyName}`);
        return response.data;
    }
};