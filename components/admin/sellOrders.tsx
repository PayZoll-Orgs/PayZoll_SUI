"use client";

import { useState, useEffect, useRef } from 'react';
import { rampApi } from '@/api/rampApi';
import { useRouter } from 'next/navigation';
import { backendDomain } from '@/lib/network';
import { RefreshCw } from 'lucide-react';

// Type definitions
interface SellOrder {
    _id: string;
    orderId: string;
    wallet: string;
    tokenSold: string;
    chain: string;
    amountToken: string;
    fiatType: string;
    amountFiat: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    transactionHash: string;
    paymentMethod: string;
    paymentDetails: string;
    paymentProofPath?: string;
    paymentQrPath?: string;
    notes?: string;
    createdAt: string;
}

const AdminSellOrdersPage = () => {
    const [orders, setOrders] = useState<SellOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<SellOrder | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showQrImageModal, setShowQrImageModal] = useState(false);
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [notes, setNotes] = useState('');
    const [updating, setUpdating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load orders
    const loadOrders = async () => {
        try {
            setLoading(true);
            setError('');

            const filters: Record<string, string> = {};
            if (statusFilter) filters.status = statusFilter;

            const response = await rampApi.admin.getAllSellOrders(page, 10, filters);

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
            const response = await rampApi.admin.updateSellOrderStatus(orderId, status, notes);

            if (response.success) {
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

    // Handle payment proof file change
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPaymentProof(e.target.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setPaymentProofFile(e.target.files[0]);
        }
    };

    const handleCompleteOrder = async () => {
        if (!selectedOrder || !paymentProofFile) {
            alert("Please select a payment proof file");
            return;
        }

        try {
            setIsSubmitting(true);

            console.log("Completing order with file:", paymentProofFile.name);

            await rampApi.admin.completeSellOrder(
                selectedOrder.orderId,
                paymentProofFile
            );

            alert("Order completed successfully!");
            // Refresh order list
            loadOrders();
            // Close modal
            setShowUploadModal(false);
        } catch (error) {
            console.error("Error completing order:", error);
            alert("Failed to complete order. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle order completion with payment proof
    const handleCompleteSellOrder = async () => {
        if (!selectedOrder || !paymentProof) {
            setError('Payment proof is required');
            return;
        }

        try {
            setUpdating(true);
            const response = await rampApi.admin.completeSellOrder(selectedOrder.orderId, paymentProof);

            if (response.success) {
                loadOrders();
                setShowModal(false);
                setPaymentProof(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
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

    // Determine if a payment detail is a QR code (base64 image)
    const isQRCode = (details: string) => {
        return details.startsWith('data:image');
    };

    return (
        <div className="container mx-auto px-4 py-8 text-gray-900 dark:text-gray-100">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Admin Sell Order Management</h1>

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
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                                    <th className="py-2 px-3 text-left">Order ID</th>
                                    <th className="py-2 px-3 text-left">Date</th>
                                    <th className="py-2 px-3 text-left">Wallet</th>
                                    <th className="py-2 px-3 text-left">Amount</th>
                                    <th className="py-2 px-3 text-left">Fiat</th>
                                    <th className="py-2 px-3 text-left">Status</th>
                                    <th className="py-2 px-3 text-left">Payment Method</th>
                                    <th className="py-2 px-3 text-left">Payment Details</th>
                                    <th className="py-2 px-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length > 0 ? (
                                    orders.map((order) => (
                                        <tr key={order._id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="py-2 px-3 text-gray-900 dark:text-gray-100">{order.orderId}</td>
                                            <td className="py-2 px-3 text-gray-900 dark:text-gray-100">{new Date(order.createdAt).toLocaleString()}</td>
                                            <td className="py-2 px-3 text-gray-900 dark:text-gray-100">
                                                <span title={order.wallet}>
                                                    {order.wallet.substring(0, 6)}...{order.wallet.substring(order.wallet.length - 4)}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-gray-900 dark:text-gray-100">
                                                {order.amountToken} {order.tokenSold}
                                            </td>
                                            <td className="py-2 px-3 text-gray-900 dark:text-gray-100">
                                                {order.amountFiat} {order.fiatType}
                                            </td>
                                            <td className="py-2 px-3">
                                                <span className={`${getStatusColor(order.status)} text-white px-2 py-1 rounded-full text-xs`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-gray-900 dark:text-gray-100">
                                                UPI
                                            </td>
                                            <td className="py-2 px-3">
                                                <div className="flex space-x-1">
                                                    <button
                                                        className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-1 px-2 rounded text-sm"
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setShowDetailsModal(true);
                                                        }}
                                                    >
                                                        View Details
                                                    </button>
                                                    {order.paymentQrPath && (
                                                        <button
                                                            className="bg-indigo-200 dark:bg-gray-700 hover:bg-indigo-300 dark:hover:bg-gray-600 text-indigo-800 dark:text-gray-200 font-semibold py-1 px-2 rounded text-sm"
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setShowQrImageModal(true);
                                                            }}
                                                        >
                                                            View QR
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-2 px-3">
                                                {order.status !== 'completed' && order.status !== 'failed' && (
                                                    <div className="flex space-x-1">
                                                        {order.status === 'pending' && (
                                                            <button
                                                                className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded text-sm"
                                                                onClick={() => {
                                                                    setSelectedOrder(order);
                                                                    handleStatusChange(order.orderId, 'processing');
                                                                }}
                                                            >
                                                                Process
                                                            </button>
                                                        )}

                                                        <button
                                                            className="bg-green-500 hover:bg-green-700 text-white py-1 px-2 rounded text-sm"
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setPaymentProofFile(null);
                                                                setShowUploadModal(true);
                                                            }}
                                                        >
                                                            Complete
                                                        </button>

                                                        <button
                                                            className="bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded text-sm"
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                handleStatusChange(order.orderId, 'failed');
                                                            }}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}

                                                {order.status === 'completed' && order.paymentProofPath && (
                                                    <button
                                                        className="bg-purple-500 hover:bg-purple-700 text-white py-1 px-2 rounded text-sm"
                                                        onClick={() => window.open(`${backendDomain}${order.paymentProofPath}`, '_blank')}
                                                    >
                                                        View Payment
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="py-4 text-center text-gray-500 dark:text-gray-400">
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Complete Sell Order</h3>
                            <button
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                onClick={() => setShowModal(false)}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="mb-4">
                            <p><strong>Order ID:</strong> {selectedOrder.orderId}</p>
                            <p><strong>Customer:</strong> {selectedOrder.wallet.substring(0, 6)}...{selectedOrder.wallet.substring(selectedOrder.wallet.length - 4)}</p>
                            <p><strong>Sold:</strong> {selectedOrder.amountToken} {selectedOrder.tokenSold}</p>
                            <p><strong>To Pay:</strong> {selectedOrder.amountFiat} {selectedOrder.fiatType}</p>
                            <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod === 'upi' ? 'UPI' : selectedOrder.paymentMethod === 'bank' ? 'Bank Transfer' : 'QR Code'}</p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                                Upload Payment Proof
                            </label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="w-full text-sm text-gray-500 dark:text-gray-400
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-blue-50 dark:file:bg-gray-700
                                    file:text-blue-700 dark:file:text-gray-200
                                    hover:file:bg-blue-100 dark:hover:file:bg-gray-600"
                            />
                            <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                                Upload a screenshot of the payment you made to the customer
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 leading-tight focus:outline-none focus:shadow-outline"
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Enter any notes for this transaction"
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={`px-4 py-2 bg-green-500 dark:bg-green-600 text-white rounded hover:bg-green-600 dark:hover:bg-green-700 disabled:opacity-50`}
                                onClick={handleCompleteSellOrder}
                                disabled={updating || !paymentProof}
                            >
                                {updating ? 'Processing...' : 'Complete Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Details Modal */}
            {showDetailsModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Details</h3>
                            <button
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                onClick={() => setShowDetailsModal(false)}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="mb-4">
                            <p><strong>Order ID:</strong> {selectedOrder.orderId}</p>
                            <p><strong>Payment Method:</strong> UPI</p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            {isQRCode(selectedOrder.paymentDetails) ? (
                                <div className="text-center">
                                    <p className="mb-2 font-medium text-gray-900 dark:text-gray-100">Customer's QR Code:</p>
                                    <img
                                        src={`${backendDomain}${selectedOrder.paymentQrPath}`}
                                        alt="Payment QR Code"
                                        className="max-w-full h-auto max-h-60 mx-auto border border-gray-300 dark:border-gray-600 p-1 rounded"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">Customer's Payment Details:</p>
                                    <p className="mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">{selectedOrder.paymentDetails}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Use these details to make payment to the customer, then upload proof of payment to complete the order.
                            </p>
                        </div>

                        <div className="flex justify-end mt-4">
                            <button
                                className="bg-blue-500 dark:bg-gray-700 hover:bg-blue-600 dark:hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    // If it's not completed yet, open the complete modal
                                    if (selectedOrder.status !== 'completed' && selectedOrder.status !== 'failed') {
                                        setShowModal(true);
                                    }
                                }}
                            >
                                {selectedOrder.status === 'completed' ? 'Close' : 'Proceed to Complete Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Image Modal */}
            {showQrImageModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Customer QR Code</h3>
                            <button
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                onClick={() => setShowQrImageModal(false)}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="text-center">
                            <div className="mb-4">
                                <p className="text-gray-900 dark:text-gray-100"><strong>Order ID:</strong> {selectedOrder.orderId}</p>
                                <p className="text-gray-900 dark:text-gray-100"><strong>Customer UPI:</strong> {selectedOrder.paymentDetails}</p>
                            </div>

                            <div className="border p-2 bg-white dark:bg-gray-800">
                                <img
                                    src={`${backendDomain}${selectedOrder.paymentQrPath}`}
                                    alt="Payment QR Code"
                                    className="max-w-full max-h-96 mx-auto"
                                />
                            </div>

                            <div className="mt-4">
                                <button
                                    className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded"
                                    onClick={() => setShowQrImageModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Payment Proof Modal */}
            {showUploadModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upload Payment Proof</h3>
                            <button
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                onClick={() => setShowUploadModal(false)}
                            >
                                &times;
                            </button>
                        </div>

                        <div>
                            <p className="mb-4 text-gray-900 dark:text-gray-100">Order ID: {selectedOrder.orderId}</p>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Upload Payment Proof
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                />
                            </div>

                            {paymentProofFile && (
                                <div className="mb-4 p-2 border rounded bg-gray-50 dark:bg-gray-700">
                                    <p className="text-gray-900 dark:text-gray-100">Selected file: {paymentProofFile.name}</p>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3">
                                <button
                                    className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded"
                                    onClick={() => setShowUploadModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white px-4 py-2 rounded"
                                    onClick={handleCompleteOrder}
                                    disabled={!paymentProofFile || isSubmitting}
                                >
                                    {isSubmitting ? "Processing..." : "Complete Order"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSellOrdersPage;