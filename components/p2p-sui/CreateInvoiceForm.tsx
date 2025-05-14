import React, { useState } from 'react';
import { createInvoice } from '@/api/invoiceApi';
import { addContactFromInvoice } from '@/api/p2pApi';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/authContext';

export const CreateInvoiceForm = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        clientName: '',
        clientEmail: '',
        dueDate: '',
        description: '',
        amount: '',
        walletAddress: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [addToAddressBook, setAddToAddressBook] = useState(true);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAddToAddressBook(e.target.checked);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validation
        if (!formData.clientEmail || !formData.amount || !formData.dueDate) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setIsLoading(true);

            // Create the invoice
            const invoiceResponse = await createInvoice({
                ...formData,
                amount: parseFloat(formData.amount),
            });

            // If successful and user wants to add to address book
            if (addToAddressBook && invoiceResponse.data?._id) {
                try {
                    // Add contact to address book from invoice
                    await addContactFromInvoice(invoiceResponse.data._id);
                    toast.success('Invoice created and contact added to address book');
                } catch (error) {
                    console.error('Failed to add contact to address book:', error);
                    toast.success('Invoice created, but failed to add contact');
                }
            } else {
                toast.success('Invoice created successfully');
            }

            // Clear form
            setFormData({
                clientName: '',
                clientEmail: '',
                dueDate: '',
                description: '',
                amount: '',
                walletAddress: '',
            });

        } catch (error) {
            console.error('Failed to create invoice:', error);
            toast.error('Failed to create invoice');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="p-4 text-center">
                Please sign in to create invoices.
            </div>
        );
    }

    return (
        <div className="p-4 rounded-lg mt-10">

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="clientName" className="block text-sm font-medium mb-1">
                            Client Name
                        </label>
                        <input
                            type="text"
                            id="clientName"
                            name="clientName"
                            value={formData.clientName}
                            onChange={handleChange}
                            className="w-full p-2 border-b border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="clientEmail" className="block text-sm font-medium mb-1">
                            Client Email *
                        </label>
                        <input
                            type="email"
                            id="clientEmail"
                            name="clientEmail"
                            value={formData.clientEmail}
                            onChange={handleChange}
                            className="w-full p-2 border-b border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium mb-1">
                            Amount *
                        </label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            min="0.000000001"
                            step="0.000000001"
                            className="w-full p-2 border-b border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium mb-1">
                            Due Date *
                        </label>
                        <input
                            type="date"
                            id="dueDate"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full p-2 border-b border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="walletAddress" className="block text-sm font-medium mb-1">
                        Your Wallet Address (to receive payment)
                    </label>
                    <input
                        type="text"
                        id="walletAddress"
                        name="walletAddress"
                        value={formData.walletAddress}
                        onChange={handleChange}
                        className="w-full p-2 border-b border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:border-blue-500"
                        placeholder="0x..."
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-1">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full p-2 border-b border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:border-blue-500"
                    ></textarea>
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="addToAddressBook"
                        checked={addToAddressBook}
                        onChange={handleCheckboxChange}
                        className="mr-2 h-4 w-4"
                    />
                    <label htmlFor="addToAddressBook" className="text-sm text-gray-700 dark:text-gray-300">
                        Add client to address book
                    </label>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                    >
                        {isLoading ? 'Creating...' : 'Create Invoice'}
                    </button>
                </div>
            </form>
        </div>
    );
};