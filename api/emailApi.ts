import axiosClient from './axiosClient';
import {
    EmailResponse,
    NewsletterSubscriptionRequest,
    WaitlistRegistrationRequest
} from '@/lib/interfaces';

/**
 * Email service API client for PayZoll
 */
const emailApi = {
    /**
     * Subscribe a user to the newsletter
     * @param data Object containing the email address
     * @returns Promise with the subscription result
     */
    subscribeToNewsletter: async (data: NewsletterSubscriptionRequest): Promise<EmailResponse> => {
        try {
            const response = await axiosClient.post('/email/subscribe', data);
            return response.data as EmailResponse;
        } catch (error: any) {
            console.error('Newsletter subscription error:', error);
            return {
                success: false,
                message: error.message || 'Failed to subscribe to newsletter',
                error: error.toString()
            };
        }
    },

    /**
     * Register a user to the waitlist
     * @param data Object containing the email address
     * @returns Promise with the registration result
     */
    joinWaitlist: async (data: WaitlistRegistrationRequest): Promise<EmailResponse> => {
        try {
            const response = await axiosClient.post('/email/waitlist', data);
            return response.data as EmailResponse;
        } catch (error: any) {
            console.error('Waitlist registration error:', error);
            return {
                success: false,
                message: error.message || 'Failed to join waitlist',
                error: error.toString()
            };
        }
    }
};

export default emailApi;