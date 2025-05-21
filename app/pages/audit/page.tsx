'use client';

import React, { useState, useEffect } from 'react';
import { walrusApi, BlockchainAuditRecord } from '@/api/walrusApi';

const AuditPage = () => {
    const [auditRecords, setAuditRecords] = useState<BlockchainAuditRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAuditData() {
            try {
                setLoading(true);
                const records = await walrusApi.getAllAuditRecords();
                setAuditRecords(records);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching audit data:', err);
                setError('Failed to load audit data from blockchain');
                setLoading(false);
            }
        }

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

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Blockchain Audit Records</h1>

            {loading ? (
                <div className="flex justify-center items-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : error ? (
                <div className="p-8 text-center">
                    <div className="bg-red-100 p-4 rounded-lg text-red-700 mb-4">
                        {error}
                    </div>
                    <p>Please try again later or contact support.</p>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {auditRecords.sort((a, b) => b.timestamp - a.timestamp).map((record, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${record.recordType === 'invoice' ? 'bg-blue-100 text-blue-800' :
                                                    record.recordType === 'payroll' ? 'bg-green-100 text-green-800' :
                                                        'bg-purple-100 text-purple-800'
                                                }`}>
                                                {record.recordType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(record.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
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
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${record.status === 'paid' || record.status === 'completed' ?
                                                    'bg-green-100 text-green-800' :
                                                    record.status === 'pending' ?
                                                        'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {record.status}
                                            </span>
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