"use client";

import { useState, useEffect } from 'react';
import { rampApi } from '@/api/rampApi';
import { useRouter } from 'next/navigation';
import { backendDomain } from '@/lib/network';
import { ExternalLink, Edit, Check, X, Eye, RefreshCw } from 'lucide-react';

// Type definitions
interface Order {
    _id: string;
    orderId: string;
    wallet: string;
    tokenBought: string;
    chain: string;
    amountToken: string;
    fiatType: string;
    amountFiat: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    paymentReceiptPath: string;
    transactionHash?: string;
    notes?: string;
    createdAt: string;
    exchangeRate?: string;
}

const AdminBuyOrdersPage = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [transactionHash, setTransactionHash] = useState('');
    const [notes, setNotes] = useState('');
    const [updating, setUpdating] = useState(false);
    const router = useRouter();

    // Edit order state
    const [editedOrder, setEditedOrder] = useState<Partial<Order>>({});

    // Load orders
    const loadOrders = async () => {
        try {
            setLoading(true);
            setError('');

            const filters: Record<string, string> = {};
            if (statusFilter) filters.status = statusFilter;

            const response = await rampApi.admin.getAllBuyOrders(page, 10, filters);

            if (response.success) {
                setOrders(response.data);
                setTotalPages(response.pagination.pages);
            } else {
                setError(response.message || 'Failed to load orders');
            }
        } catch (err) {
            setError('Error fetching orders. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        loadOrders();
    }, [page, statusFilter]);

    // Handle status change
    const handleStatusChange = async (orderId: string, status: string) => {
        try {
            setUpdating(true);
            const response = await rampApi.admin.updateBuyOrderStatus(orderId, status, notes);

            if (response.success) {
                // Refresh orders
                loadOrders();
                setShowModal(false);
                setNotes('');
            } else {
                setError(response.message || 'Failed to update status');
            }
        } catch (err) {
            setError('Error updating order. Please try again.');
            console.error(err);
        } finally {
            setUpdating(false);
        }
    };

    // Handle order completion with transaction hash
    const handleCompleteOrder = async () => {
        if (!selectedOrder) return;

        if (!transactionHash.trim()) {
            setError('Transaction hash is required');
            return;
        }

        try {
            setUpdating(true);
            const response = await rampApi.admin.completeBuyOrder(selectedOrder.orderId, transactionHash);

            if (response.success) {
                // Refresh orders
                loadOrders();
                setShowModal(false);
                setTransactionHash('');
            } else {
                setError(response.message || 'Failed to complete order');
            }
        } catch (err) {
            setError('Error completing order. Please try again.');
            console.error(err);
        } finally {
            setUpdating(false);
        }
    };

    // Handle edit order save
    const handleSaveEditedOrder = async () => {
        if (!selectedOrder || !editedOrder) return;

        try {
            setUpdating(true);

            // Update status and notes if they were changed
            if (editedOrder.status !== selectedOrder.status || editedOrder.notes !== selectedOrder.notes) {
                const response = await rampApi.admin.updateBuyOrderStatus(
                    selectedOrder.orderId,
                    editedOrder.status || selectedOrder.status,
                    editedOrder.notes
                );

                if (!response.success) {
                    throw new Error(response.message || 'Failed to update order');
                }
            }

            // If order is being completed and transaction hash is provided
            if (editedOrder.status === 'completed' && editedOrder.transactionHash) {
                const response = await rampApi.admin.completeBuyOrder(
                    selectedOrder.orderId,
                    editedOrder.transactionHash
                );

                if (!response.success) {
                    throw new Error(response.message || 'Failed to complete order');
                }
            }

            // Refresh orders and close modal
            await loadOrders();
            setShowEditModal(false);

        } catch (err) {
            console.error(err);
            setError('Error updating order. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    // Status badge color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500';
            case 'processing': return 'bg-blue-500';
            case 'completed': return 'bg-green-500';
            case 'failed': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    // Initialize edit order
    const handleEditOrder = (order: Order) => {
        setSelectedOrder(order);
        setEditedOrder({
            status: order.status,
            notes: order.notes || '',
            transactionHash: order.transactionHash || ''
        });
        setShowEditModal(true);
    };

    return (
        <div className="container mx-auto px-4 py-8 text-gray-900 dark:text-gray-100">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Buy Order Management</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="flex justify-between mb-6">
                <select
                    className="border rounded p-2 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                </select>

                <div className="flex space-x-2">
                    <button
                        className="bg-blue-500 dark:bg-gray-700 hover:bg-blue-600 dark:hover:bg-gray-600 text-white font-bold py-2 px-4 rounded flex items-center"
                        onClick={() => loadOrders()}
                    >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                                    <th className="py-3 px-4 text-left">Order ID</th>
                                    <th className="py-3 px-4 text-left">Date</th>
                                    <th className="py-3 px-4 text-left">Wallet</th>
                                    <th className="py-3 px-4 text-left">Amount</th>
                                    <th className="py-3 px-4 text-left">Fiat</th>
                                    <th className="py-3 px-4 text-left">Status</th>
                                    <th className="py-3 px-4 text-left">Receipt</th>
                                    <th className="py-3 px-4 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length > 0 ? (
                                    orders.map((order) => (
                                        <tr key={order._id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{order.orderId}</td>
                                            <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{new Date(order.createdAt).toLocaleString()}</td>
                                            <td className="py-3 px-4">
                                                <span className="text-gray-900 dark:text-gray-100 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer">
                                                    {order.wallet.substring(0, 6)}...{order.wallet.substring(order.wallet.length - 4)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                                                {order.amountToken} {order.tokenBought}
                                            </td>
                                            <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                                                {order.amountFiat} {order.fiatType}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`${getStatusColor(order.status)} text-white px-2 py-1 rounded-full text-xs`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <button
                                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-2 rounded text-sm flex items-center"
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setShowImageModal(true);
                                                    }}
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    View
                                                </button>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex space-x-1">
                                                    <button
                                                        className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded text-sm flex items-center"
                                                        onClick={() => handleEditOrder(order)}
                                                    >
                                                        <Edit className="h-3 w-3 mr-1" />
                                                        Edit
                                                    </button>

                                                    {order.status !== 'completed' && order.status !== 'failed' && (
                                                        <button
                                                            className="bg-green-500 hover:bg-green-700 text-white py-1 px-2 rounded text-sm flex items-center"
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setTransactionHash(order.transactionHash || '');
                                                                setShowModal(true);
                                                            }}
                                                        >
                                                            <Check className="h-3 w-3 mr-1" />
                                                            Complete
                                                        </button>
                                                    )}

                                                    {order.status !== 'completed' && order.status !== 'failed' && (
                                                        <button
                                                            className="bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded text-sm flex items-center"
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setNotes('');
                                                                handleStatusChange(order.orderId, 'failed');
                                                            }}
                                                        >
                                                            <X className="h-3 w-3 mr-1" />
                                                            Reject
                                                        </button>
                                                    )}

                                                    {order.transactionHash && (
                                                        <a
                                                            href={`https://etherscan.io/tx/${order.transactionHash}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded text-sm flex items-center"
                                                        >
                                                            <ExternalLink className="h-3 w-3 mr-1" />
                                                            View Tx
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="py-4 text-center text-gray-500 dark:text-gray-400">
                                            No orders found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center mt-6">
                            <button
                                className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-l disabled:opacity-50"
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-gray-900 dark:text-gray-100">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-r disabled:opacity-50"
                                disabled={page === totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Complete Order Modal */}
            {showModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Complete Buy Order</h3>
                            <button
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                onClick={() => setShowModal(false)}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="mb-4 text-gray-900 dark:text-gray-100">
                            <p><strong>Order ID:</strong> {selectedOrder.orderId}</p>
                            <p><strong>Wallet:</strong> {selectedOrder.wallet}</p>
                            <p><strong>Amount:</strong> {selectedOrder.amountToken} {selectedOrder.tokenBought}</p>
                            <p><strong>Payment:</strong> {selectedOrder.amountFiat} {selectedOrder.fiatType}</p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                                Transaction Hash
                            </label>
                            <input
                                type="text"
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={transactionHash}
                                onChange={(e) => setTransactionHash(e.target.value)}
                                placeholder="Enter blockchain transaction hash"
                            />
                            <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                                Enter the transaction hash for this payment
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Enter any notes for this transaction"
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded mr-2"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ${(updating || !transactionHash.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={handleCompleteOrder}
                                disabled={updating || !transactionHash.trim()}
                            >
                                {updating ? 'Processing...' : 'Complete Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Order Modal */}
            {showEditModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Buy Order</h3>
                            <button
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                onClick={() => setShowEditModal(false)}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="mb-4 text-gray-900 dark:text-gray-100">
                            <p><strong>Order ID:</strong> {selectedOrder.orderId}</p>
                            <p><strong>Customer:</strong> {selectedOrder.wallet.substring(0, 6)}...{selectedOrder.wallet.substring(selectedOrder.wallet.length - 4)}</p>
                            <p><strong>Amount:</strong> {selectedOrder.amountToken} {selectedOrder.tokenBought}</p>
                            <p><strong>Fiat:</strong> {selectedOrder.amountFiat} {selectedOrder.fiatType}</p>
                            <p><strong>Created:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                                Status
                            </label>
                            <select
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={editedOrder.status || selectedOrder.status}
                                onChange={(e) => setEditedOrder({ ...editedOrder, status: e.target.value as Order['status'] })}
                            >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>

                        {editedOrder.status === 'completed' && !selectedOrder.transactionHash && (
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                                    Transaction Hash
                                </label>
                                <input
                                    type="text"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editedOrder.transactionHash || ''}
                                    onChange={(e) => setEditedOrder({ ...editedOrder, transactionHash: e.target.value })}
                                    placeholder="Enter blockchain transaction hash"
                                />
                                <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                                    Required to set status to 'completed'
                                </p>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                                Notes
                            </label>
                            <textarea
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                value={editedOrder.notes || ''}
                                onChange={(e) => setEditedOrder({ ...editedOrder, notes: e.target.value })}
                                placeholder="Enter any notes for this order"
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded mr-2"
                                onClick={() => setShowEditModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${(updating || (editedOrder.status === 'completed' && !selectedOrder.transactionHash && !editedOrder.transactionHash)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={handleSaveEditedOrder}
                                disabled={updating || (editedOrder.status === 'completed' && !selectedOrder.transactionHash && !editedOrder.transactionHash)}
                            >
                                {updating ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Image Modal */}
            {showImageModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Receipt</h3>
                            <button
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                onClick={() => setShowImageModal(false)}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="text-center text-gray-900 dark:text-gray-100">
                            <div className="mb-4">
                                <p><strong>Order ID:</strong> {selectedOrder.orderId}</p>
                                <p><strong>Amount:</strong> {selectedOrder.amountFiat} {selectedOrder.fiatType}</p>
                            </div>

                            <div className="border p-2 border-gray-300 dark:border-gray-600">
                                <img
                                    src={`${backendDomain}${selectedOrder.paymentReceiptPath}`}
                                    alt="Payment Receipt"
                                    className="max-w-full max-h-96 mx-auto"
                                />
                            </div>

                            <div className="mt-4">
                                <button
                                    className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded"
                                    onClick={() => setShowImageModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBuyOrdersPage;