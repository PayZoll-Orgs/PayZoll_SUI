'use client';

import React, { useState, useEffect } from 'react';
import { walrusApi, BlockchainAuditRecord } from '@/api/walrusApi';

const AuditPage = () => {
    const [auditRecords, setAuditRecords] = useState<BlockchainAuditRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('all'); // 'all', 'invoice', 'payroll', 'splitBill', 'payment'
    const [isRecovering, setIsRecovering] = useState(false);

    async function fetchAuditData() {
        try {
            setLoading(true);
            // Fetch both regular audit records and payment records
            const records = await walrusApi.getAllAuditRecords();
            setAuditRecords(records);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching audit data:', err);
            setError('Failed to load audit data from blockchain');
            setLoading(false);
        }
    }
    useEffect(() => {
        fetchAuditData();
    }, []);

    // Format timestamp to readable date
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    // Format wallet address to truncated form
    const formatWalletAddress = (address: string) => {
        if (!address || address.length <= 12) return address;
        return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
    };

    // Get type badge class based on record type
    const getTypeBadgeClass = (recordType: string) => {
        switch (recordType) {
            case 'invoice': return 'bg-blue-100 text-blue-800';
            case 'payroll': return 'bg-green-100 text-green-800';
            case 'splitBill': return 'bg-purple-100 text-purple-800';
            case 'payment': return 'bg-amber-100 text-amber-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Get action badge class for payment actions
    const getActionBadgeClass = (action: string) => {
        switch (action) {
            case 'send': return 'bg-blue-100 text-blue-800';
            case 'claim': return 'bg-green-100 text-green-800';
            case 'reimburse': return 'bg-amber-100 text-amber-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Filter records based on selected filter
    const filteredRecords = filter === 'all' 
        ? auditRecords 
        : auditRecords.filter(record => record.recordType === filter);

    const handleRecoverAuditIndex = async () => {
        setIsRecovering(true);
        try {
            await walrusApi.recoverAuditIndex();
            // Refetch audit data
            fetchAuditData();
        } catch (error) {
            console.error('Error recovering audit index:', error);
        } finally {
            setIsRecovering(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Blockchain Audit Records</h1>

            {/* Filter controls */}
            <div className="mb-6 flex flex-wrap gap-2">
                <button 
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
                >
                    All
                </button>
                <button 
                    onClick={() => setFilter('invoice')}
                    className={`px-3 py-1 rounded text-sm ${filter === 'invoice' ? 'bg-blue-600 text-white' : 'bg-blue-100'}`}
                >
                    Invoices
                </button>
                <button 
                    onClick={() => setFilter('payroll')}
                    className={`px-3 py-1 rounded text-sm ${filter === 'payroll' ? 'bg-green-600 text-white' : 'bg-green-100'}`}
                >
                    Payrolls
                </button>
                <button 
                    onClick={() => setFilter('splitBill')}
                    className={`px-3 py-1 rounded text-sm ${filter === 'splitBill' ? 'bg-purple-600 text-white' : 'bg-purple-100'}`}
                >
                    Split Bills
                </button>
                <button 
                    onClick={() => setFilter('payment')}
                    className={`px-3 py-1 rounded text-sm ${filter === 'payment' ? 'bg-amber-600 text-white' : 'bg-amber-100'}`}
                >
                    Payments
                </button>
            </div>

            {/* Recover Audit Records button */}
            <div className="mb-4 flex justify-end">
                <button
                    onClick={handleRecoverAuditIndex}
                    disabled={isRecovering}
                    className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-300 flex items-center gap-2"
                >
                    {isRecovering ? (
                        <>
                            <span className="animate-spin">⟳</span> Recovering...
                        </>
                    ) : (
                        <>
                            <span>🔄</span> Recover Audit Records
                        </>
                    )}
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : error ? (
                <div className="p-8 text-center">
                    <div className="bg-red-100 p-4 rounded-lg text-red-700 mb-4">
                        {error}
                    </div>
                    <p>Please try again later or contact support.</p>
                </div>
            ) : filteredRecords.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                    <p>No records found for the selected filter.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status/Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRecords.sort((a, b) => b.timestamp - a.timestamp).map((record, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeClass(record.recordType)}`}>
                                                {record.recordType === 'payment'
                                                    ? 'Payment'
                                                    : record.recordType === 'invoice'
                                                        ? 'Invoice'
                                                        : record.recordType === 'payroll'
                                                            ? 'Payroll'
                                                            : 'Split Bill'
                                                }
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(record.timestamp)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {/* Different display for payment records */}
                                            {record.recordType === 'payment' ? (
                                                <div>
                                                    <p className="text-sm font-medium">Amount: {record.totalAmount.toFixed(6)} {record.chain}</p>
                                                    {record.paymentId && (
                                                        <p className="text-xs text-gray-500 mt-1">Payment ID: {record.paymentId}</p>
                                                    )}
                                                    <div className="text-xs font-mono mt-1">
                                                        <p>From: {formatWalletAddress(record.walletAddresses[0] || '')}</p>
                                                        <p>To: {formatWalletAddress(record.walletAddresses[1] || '')}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Original display for non-payment records
                                                <div>
                                                    <p className="text-sm font-medium">Total: {record.totalAmount} {record.chain}</p>

                                                    {/* For payroll, show all employees with their amounts */}
                                                    {record.recordType === 'payroll' && record.walletAddresses.length > 1 && (
                                                        <div className="mt-2">
                                                            <p className="text-xs text-gray-500 mb-1">Recipients:</p>
                                                            {record.walletAddresses.map((address, i) => (
                                                                <div key={i} className="flex justify-between text-xs font-mono mb-1">
                                                                    <span>{formatWalletAddress(address)}</span>
                                                                    <span className="ml-4">{record.amounts?.[i] ?? '—'} {record.chain}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* For other record types, just show the wallet addresses */}
                                                    {(record.recordType !== 'payroll' || record.walletAddresses.length <= 1) && (
                                                        <div className="text-xs font-mono mt-1">
                                                            {record.walletAddresses.map((address, i) => (
                                                                <div key={i}>{formatWalletAddress(address)}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {record.recordType === 'payment' && record.paymentAction ? (
                                                <span className={`px-2 py-1 text-xs rounded-full ${getActionBadgeClass(record.paymentAction)}`}>
                                                    {record.paymentAction.toUpperCase()}
                                                </span>
                                            ) : (
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    record.status === 'paid' || record.status === 'completed' ?
                                                        'bg-green-100 text-green-800' :
                                                        record.status === 'pending' ?
                                                            'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {record.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {record.transactionHash ? (
                                                <a
                                                    href={`https://suiexplorer.com/txblock/${record.transactionHash}?network=testnet`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-xs font-mono"
                                                >
                                                    {formatWalletAddress(record.transactionHash)}
                                                </a>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="mt-4 text-sm text-gray-500">
                <p>Data stored on Sui blockchain via Walrus testnet with 10 epoch retention.</p>
                <p>This audit log provides an immutable record of all financial transactions.</p>
            </div>
        </div>
    );
};

export default AuditPage;