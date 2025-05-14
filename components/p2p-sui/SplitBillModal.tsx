import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { X, Plus, Minus, Users, AlertTriangle } from 'lucide-react';
import { fetchAllAddresses, AddressBookEntry } from '@/api/p2pApi';
import { createSplitBill } from '@/api/splitBillApi';
import { toast } from 'react-hot-toast';

interface SplitBillModalProps {
    invoice: {
        _id: string;
        invoiceNumber: string;
        amount: number;
        dueDate: string;
    };
    onClose: () => void;
    onSuccess: () => void;
}

export const SplitBillModal = ({ invoice, onClose, onSuccess }: SplitBillModalProps) => {
    const [contacts, setContacts] = useState<AddressBookEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [participants, setParticipants] = useState<{ nickname: string; amount: number }[]>([]);
    const [remainingAmount, setRemainingAmount] = useState(invoice.amount);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentAccount = useCurrentAccount();
    const walletAddress = currentAccount?.address || '';

    useEffect(() => {
        // Load contacts from address book
        const loadContacts = async () => {
            setIsLoading(true);
            try {
                const response = await fetchAllAddresses();
                setContacts(response.data);
            } catch (error) {
                console.error('Failed to load contacts:', error);
                toast.error('Failed to load your contacts');
                setError('Could not load your contacts. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        loadContacts();
    }, []);

    // Calculate remaining amount when participants change
    useEffect(() => {
        const totalSplit = participants.reduce((sum, p) => sum + p.amount, 0);
        const remaining = parseFloat((invoice.amount - totalSplit).toFixed(8));
        setRemainingAmount(remaining);
    }, [participants, invoice.amount]);

    const addParticipant = () => {
        if (contacts.length === 0) {
            setError('No contacts available in your address book.');
            return;
        }

        // Find the first contact that isn't already added
        const availableContacts = contacts.filter(
            contact => !participants.some(p => p.nickname === contact.nickname)
        );

        if (availableContacts.length === 0) {
            setError('All your contacts have been added already.');
            return;
        }

        // Calculate an even split for the remaining amount
        const evenSplitAmount = remainingAmount / (participants.length + 1);
        const formattedAmount = parseFloat(evenSplitAmount.toFixed(8));

        setParticipants([
            ...participants,
            { nickname: availableContacts[0].nickname, amount: formattedAmount }
        ]);
    };

    const removeParticipant = (index: number) => {
        setParticipants(participants.filter((_, i) => i !== index));
    };

    const handleAmountChange = (index: number, newAmount: number) => {
        const updatedParticipants = [...participants];
        updatedParticipants[index].amount = newAmount;
        setParticipants(updatedParticipants);
    };

    const handleContactChange = (index: number, nickname: string) => {
        const updatedParticipants = [...participants];
        updatedParticipants[index].nickname = nickname;
        setParticipants(updatedParticipants);
    };

    const handleSubmit = async () => {
        // Validation
        if (participants.length === 0) {
            setError('Add at least one friend to split the bill with.');
            return;
        }

        if (Math.abs(remainingAmount) > 0.000001) {
            setError('The total split amount must equal the invoice amount.');
            return;
        }

        if (!walletAddress) {
            setError('Your wallet address is required to create a split.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await createSplitBill(invoice._id, walletAddress, participants);
            toast.success('Split bill created successfully!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to create split bill:', error);
            setError(error.response?.data?.message || 'Failed to create split bill. Please try again.');
            toast.error('Failed to create split bill');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate split evenly for all participants
    const splitEvenly = () => {
        if (participants.length === 0) {
            setError('Add friends first to split evenly.');
            return;
        }

        const evenAmount = parseFloat((invoice.amount / participants.length).toFixed(8));
        setParticipants(participants.map(p => ({ ...p, amount: evenAmount })));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Split Invoice {invoice.invoiceNumber}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        disabled={isSubmitting}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Invoice Amount</p>
                            <p className="font-medium text-lg">{invoice.amount} SUI</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
                            <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md p-3 mb-4">
                            <div className="flex items-center">
                                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                                <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
                            </div>
                        </div>
                    )}

                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                                <Users className="h-5 w-5 mr-2" />
                                <h4 className="font-medium">Friends to Split With</h4>
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={splitEvenly}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline mr-4"
                                    disabled={participants.length === 0 || isSubmitting}
                                >
                                    Split Evenly
                                </button>
                                <button
                                    type="button"
                                    onClick={addParticipant}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded text-sm"
                                    disabled={isLoading || isSubmitting}
                                >
                                    <Plus size={14} className="inline mr-1" />
                                    Add Friend
                                </button>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="text-center py-4">Loading contacts...</div>
                        ) : (
                            <div>
                                {participants.length === 0 ? (
                                    <div className="text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                                        Click "Add Friend" to start splitting
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {participants.map((participant, index) => (
                                            <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                                                <div className="flex-1">
                                                    <select
                                                        value={participant.nickname}
                                                        onChange={(e) => handleContactChange(index, e.target.value)}
                                                        className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 py-1 focus:outline-none"
                                                        disabled={isSubmitting}
                                                    >
                                                        {contacts.map((contact) => (
                                                            <option
                                                                key={contact._id}
                                                                value={contact.nickname}
                                                                disabled={participants.some(
                                                                    (p, i) => i !== index && p.nickname === contact.nickname
                                                                )}
                                                            >
                                                                {contact.nickname}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <input
                                                        type="number"
                                                        value={participant.amount}
                                                        onChange={(e) => handleAmountChange(index, parseFloat(e.target.value) || 0)}
                                                        step="0.00000001"
                                                        min="0.00000001"
                                                        max={invoice.amount.toString()}
                                                        className="w-24 bg-transparent border-b border-gray-300 dark:border-gray-600 py-1 text-right focus:outline-none"
                                                        disabled={isSubmitting}
                                                    />
                                                    <span className="ml-1">SUI</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeParticipant(index)}
                                                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                                    disabled={isSubmitting}
                                                >
                                                    <Minus size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Remaining Amount Display */}
                                <div className="flex justify-between mt-4 text-sm">
                                    <span className="font-medium">Remaining to be split:</span>
                                    <span className={`font-medium ${Math.abs(remainingAmount) < 0.000001 ? 'text-green-600 dark:text-green-500' : 'text-yellow-600 dark:text-yellow-500'}`}>
                                        {remainingAmount.toFixed(8)} SUI
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                        disabled={
                            isSubmitting ||
                            isLoading ||
                            participants.length === 0 ||
                            Math.abs(remainingAmount) > 0.000001
                        }
                    >
                        {isSubmitting ? 'Creating...' : 'Create Split Bill'}
                    </button>
                </div>
            </div>
        </div>
    );
};