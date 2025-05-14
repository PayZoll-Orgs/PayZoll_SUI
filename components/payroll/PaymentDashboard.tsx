"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Wallet } from "lucide-react";
import { Employee } from '@/lib/interfaces';
import PaymentStatus from './PaymentStatus';
import EmployeeTable from './EmployeeTable';
import { useState } from 'react';

interface PaymentDashboardProps {
    exchangeRate?: number;
    selectedTokenSymbol?: string;
    employees: Employee[];
    isConnected: boolean;
    selectedEmployees: string[];
    toggleEmployeeSelection: (employeeId: string) => void;
    toggleAllEmployees: () => void;
    allEmployeesSelected: boolean;
    handleTransaction: () => Promise<void>;
    usdToToken: (usdAmount: string) => string;
    isLoadingDerived: boolean;
    needsApproval: boolean;
    isApproving: boolean;
    isSending: boolean;
    isWritePending: boolean;
    isTxLoading: boolean;
    isTxSuccess: boolean;
    isTxError: boolean;
    txHash: `0x${string}` | undefined;
    txError: string;
    approvalTxHash: `0x${string}` | undefined;
    showPaymentStatus: boolean;
    hasTransactionActivity: boolean;
    getExplorerUrl: (txHash: `0x${string}` | undefined) => string;
    selectedToken: any;
    selectedChain: any;
    handleAddEmployeeClick: () => void;
    handleEditEmployee: (employee: Employee) => void;
    deleteEmployeeById: (wallet: string) => void;
    handleAutoClose: () => void;
}

const PaymentDashboard = ({
    exchangeRate = 1,
    selectedTokenSymbol,
    employees,
    isConnected,
    selectedEmployees,
    toggleEmployeeSelection,
    toggleAllEmployees,
    allEmployeesSelected,
    handleTransaction,
    usdToToken,
    isLoadingDerived,
    needsApproval,
    isApproving,
    isSending,
    isWritePending,
    isTxLoading,
    isTxSuccess,
    isTxError,
    txHash,
    txError,
    approvalTxHash,
    showPaymentStatus,
    hasTransactionActivity,
    getExplorerUrl,
    selectedToken,
    handleAddEmployeeClick,
    handleEditEmployee,
    deleteEmployeeById,
    selectedChain,
    handleAutoClose,
}: PaymentDashboardProps) => {


    return (
        <div className="max-h-screen w-[90vw] flex flex-col items-center justify-center md:mt-10">
            <div className="flex flex-col">
                <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Payment Status - Only shown when there is transaction activity */}
                    <AnimatePresence>
                        {showPaymentStatus && hasTransactionActivity && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <PaymentStatus
                                    txError={txError}
                                    isWritePending={isWritePending}
                                    isTxLoading={isTxLoading}
                                    isTxSuccess={isTxSuccess}
                                    isTxError={isTxError}
                                    approvalTxHash={approvalTxHash}
                                    isApproving={isApproving}
                                    txHash={txHash}
                                    getExplorerUrl={getExplorerUrl}
                                    needsApproval={needsApproval}
                                    selectedTokenSymbol={selectedToken?.symbol}
                                    selectedEmployeesCount={selectedEmployees.length}
                                    chainId={selectedChain.id}
                                    onAutoClose={handleAutoClose}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {isConnected ? (
                        /* Employee Table with action button passed as props */
                        <EmployeeTable
                            employees={employees}
                            selectedEmployees={selectedEmployees}
                            toggleEmployeeSelection={toggleEmployeeSelection}
                            usdToToken={usdToToken}
                            selectedTokenSymbol={selectedTokenSymbol || selectedToken?.symbol}
                            isLoading={isLoadingDerived}
                            exchangeRate={exchangeRate}
                            deleteEmployeeById={deleteEmployeeById}
                            onEditEmployee={handleEditEmployee}
                            /* Action button props */
                            handleTransaction={handleTransaction}
                            isLoadingDerived={isLoadingDerived}
                            needsApproval={needsApproval}
                            isApproving={isApproving}
                            isSending={isSending}
                            isWritePending={isWritePending}
                            isTxLoading={isTxLoading}
                            selectedToken={selectedToken}
                        />
                    ) : (
                        <motion.div
                            className="dark:bg-black rounded-lg p-12 border flex flex-col items-center justify-center space-y-6 text-center"
                            style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="p-4 bg-[#60DFCD]/10 rounded-full border border-[#60DFCD]/30">
                                <Wallet className="w-12 h-12 text-[#60DFCD]" />
                            </div>
                            <div className="space-y-2 max-w-md">
                                <h2 className="text-xl font-bold">Connect Your Wallet</h2>
                                <p className="text-[#486581]">
                                    Connect your wallet to start managing employee payments with cryptocurrency
                                </p>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default PaymentDashboard;