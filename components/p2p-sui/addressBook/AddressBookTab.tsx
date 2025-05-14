import { useState, useEffect } from 'react';
import { PlusCircle, Search, Trash2, Edit, Check, X, Mail, Shield } from 'lucide-react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { fetchAllAddresses, addAddress, updateAddress, deleteAddress, searchAddresses } from '@/api/p2pApi';
import AddressForm from './AddressForm';
import { toast } from 'react-hot-toast';

interface AddressBookEntry {
  _id: string;
  nickname: string;
  walletAddress: string;
  email?: string;
  isVerifiedUser?: boolean;
}

export default function AddressBookTab() {
  const [addresses, setAddresses] = useState<AddressBookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressBookEntry | null>(null);

  const currentAccount = useCurrentAccount();
  const address = currentAccount?.address;

  // Fetch addresses on load
  useEffect(() => {
    if (address) {
      loadAddresses();
    }
  }, [address]);

  const loadAddresses = async () => {
    setIsLoading(true);
    try {
      const response = await fetchAllAddresses();
      setAddresses(response.data);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      toast.error('Failed to load address book');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = async (e: any) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 0) {
      setIsLoading(true);
      try {
        const result = await searchAddresses(query);
        setAddresses(result.data);
      } catch (error) {
        console.error('Search failed:', error);
        toast.error('Search failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      loadAddresses();
    }
  };

  // Handle form submission for adding new address
  const handleAddAddress = async (formData: any) => {
    try {
      await addAddress(formData.nickname, formData.walletAddress, formData.email);
      setShowAddForm(false);
      toast.success('Contact added successfully');
      loadAddresses();
    } catch (error: any) {
      console.error('Failed to add address:', error);
      toast.error(error.response?.data?.message || 'Failed to add contact');
    }
  };

  // Handle editing address
  const handleEditAddress = async (formData: any) => {
    try {
      if (!editingAddress) return;

      const updateData = {
        ...(formData.walletAddress !== editingAddress.walletAddress ? { walletAddress: formData.walletAddress } : {}),
        ...(formData.nickname !== editingAddress.nickname ? { newNickname: formData.nickname } : {}),
        ...(formData.email !== editingAddress.email ? { email: formData.email } : {})
      };

      await updateAddress(editingAddress.nickname, updateData);
      setEditingAddress(null);
      toast.success('Contact updated successfully');
      loadAddresses();
    } catch (error: any) {
      console.error('Failed to update address:', error);
      toast.error(error.response?.data?.message || 'Failed to update contact');
    }
  };

  // Handle deleting address
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingNickname, setDeletingNickname] = useState('');

  const handleDeleteAddress = (nickname: string) => {
    setDeletingNickname(nickname);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteAddress(deletingNickname);
      toast.success('Contact deleted successfully');
      loadAddresses();
    } catch (error) {
      console.error('Failed to delete address:', error);
      toast.error('Failed to delete contact');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Address Book</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-3 py-2 rounded-md"
        >
          <PlusCircle size={16} />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search contacts..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-white"
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <AddressForm
          onSubmit={handleAddAddress}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingAddress && (
        <AddressForm
          initialData={editingAddress}
          onSubmit={handleEditAddress}
          onCancel={() => setEditingAddress(null)}
        />
      )}

      {/* Address List */}
      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : addresses.length > 0 ? (
          <div className="grid gap-2">
            {addresses.map((item) => (
              <div
                key={item._id}
                className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <h3 className="font-medium text-gray-900 dark:text-white">{item.nickname}</h3>
                    {item.isVerifiedUser && (
                      <Shield size={16} className="ml-2 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 break-all">{item.walletAddress}</p>
                  {item.email && (
                    <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <Mail size={12} className="mr-1" />
                      <span>{item.email}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingAddress(item)}
                    className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(item.nickname)}
                    className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No contacts found' : 'Your address book is empty'}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-transparent opacity-90 backdrop-blur-3xl p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-medium mb-4">Confirm Deletion</h3>
            <p className="mb-6">Are you sure you want to delete {deletingNickname}?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}