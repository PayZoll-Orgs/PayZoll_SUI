import axiosClient from './axiosClient';
import { PayrollData } from '@/lib/interfaces';
import { walrusApi } from './walrusApi';

export const payrollApi = {
    addPayroll: async (payrollData: PayrollData) => {
        try {
            console.log('Sending payroll data to API:', payrollData);
            const response = await axiosClient.post('/payroll/add', payrollData);
            console.log('Payroll API response:', response);

            // Generate a safe recordId based on available data
            let recordId = Date.now().toString(); // Default fallback
            
            // Check if we have _id or id in the response data
            if (response?.data?.data?._id) {
                recordId = response.data.data._id;
            } else if (response?.data?.data?.id) {
                recordId = response.data.data.id;
            } else if (response?.data?._id) {
                recordId = response.data._id;
            } else if (response?.data?.id) {
                recordId = response.data.id;
            }
            
            console.log('Using recordId for audit:', recordId);

            // Create blockchain audit record
            await walrusApi.storeAuditRecord({
                recordType: 'payroll',
                recordId: recordId,
                timestamp: Date.now(),
                // Extract all wallet addresses from the employees array
                walletAddresses: payrollData.employees.map(emp => emp.wallet),
                // Extract all amounts from the employees array
                amounts: payrollData.employees.map(emp => parseFloat(emp.amount)),
                // Convert totalAmount to number
                totalAmount: parseFloat(payrollData.totalAmount),
                chain: payrollData.chain.toString(),
                status: 'completed',
                transactionHash: payrollData.transactionHash
            });

            return response.data;
        } catch (error) {
            console.error('Error in addPayroll:', error);
            
            // Try to store audit data even if the main API call failed
            try {
                await walrusApi.storeAuditRecord({
                    recordType: 'payroll',
                    recordId: `failed-${Date.now()}`,
                    timestamp: Date.now(),
                    walletAddresses: payrollData.employees.map(emp => emp.wallet),
                    amounts: payrollData.employees.map(emp => parseFloat(emp.amount)),
                    totalAmount: parseFloat(payrollData.totalAmount),
                    chain: payrollData.chain.toString(),
                    status: 'failed',
                    transactionHash: payrollData.transactionHash
                });
                console.log('Stored audit record for failed payroll transaction');
            } catch (auditError) {
                console.error('Failed to store audit record for failed transaction:', auditError);
            }
            
            throw error;
        }
    },

    getPayrollHistory: async () => {
        const response = await axiosClient.get('/payroll/history');
        return response.data;
    }
};