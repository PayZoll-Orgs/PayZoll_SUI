"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, CheckCircle, XCircle, Clock, ExternalLink, ChevronDown, ChevronUp, Users } from "lucide-react";
import { payrollApi } from "@/api/payrollApi";
import { formatDistanceToNow } from "date-fns";
import { allMainnetChains } from "@/lib/evm-chains-mainnet"; // Import chains

// Define the transaction interface based on payroll schema
interface TransactionLogsProps {
  isOpen: boolean;
  onClose: () => void;
  onExchangeRateUpdate?: (rate: number, tokenSymbol: string) => void;
}

interface Transaction {
  _id: string;
  totalAmount: string;
  chain: string;
  tokenSymbol: string;
  company: string;
  employees: Array<{
    wallet: string;
    amount: string;
  }>;
  transactionHash: string;
  createdAt: string;
  updatedAt: string;
}

// Status Icon Component
interface StatusIconProps {
  status: "completed" | "pending" | "failed";
}

const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  if (status === "completed") return <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />;
  if (status === "pending") return <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />;
  return <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />;
};

// Format wallet address for display
const formatAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// TransactionsLog Component
const TransactionsLog: React.FC<TransactionLogsProps> =
  ({
    isOpen,
    onClose
  }) => {
    const [search, setSearch] = useState("");
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // New state to track which transaction is expanded
    const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

    // Fetch transaction history
    useEffect(() => {
      if (isOpen) {
        const fetchPayrollHistory = async () => {
          try {
            setIsLoading(true);
            const response = await payrollApi.getPayrollHistory();

            if (response.status === "success") {
              // Sort transactions by createdAt date (latest first)
              const sortedTransactions = [...(response.data || [])].sort((a, b) => {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              });
              setTransactions(sortedTransactions);
            } else {
              setError("Failed to load transaction history");
            }
          } catch (err) {
            console.error("Error fetching payroll history:", err);
            setError("Error loading transactions");
          } finally {
            setIsLoading(false);
          }
        };

        fetchPayrollHistory();
      }
    }, [isOpen]);

    // Format timestamp for display
    const formatTimestamp = (timestamp: string): string => {
      try {
        const date = new Date(timestamp);
        return formatDistanceToNow(date, { addSuffix: true });
      } catch (err) {
        return "Unknown date";
      }
    };

    // Toggle transaction expansion
    const toggleExpand = (id: string) => {
      setExpandedTxId(prev => prev === id ? null : id);
    };

    // Get block explorer URL based on chain - now using chain data from library
    const getExplorerUrl = (chainName: string, hash: string): string => {
      // Find the chain in our imported chains array that matches by name
      const chain = allMainnetChains.find(c =>
        c.name.toLowerCase() === chainName.toLowerCase()
      );

      if (chain?.blockExplorers?.default?.url) {
        return `${chain.blockExplorers.default.url}/tx/${hash}`;
      }

      // Fallback for chains not in our list
      const fallbackExplorers: Record<string, string> = {
        "Ethereum": "https://etherscan.io/tx/",
        "Base": "https://basescan.org/tx/",
        "Arbitrum": "https://arbiscan.io/tx/"
      };

      const fallbackUrl = fallbackExplorers[chainName];
      return fallbackUrl ? `${fallbackUrl}${hash}` : "#";
    };

    // Filtered Transactions
    const filteredTransactions = transactions.filter(
      (t) =>
        t.transactionHash.toLowerCase().includes(search.toLowerCase()) ||
        t.totalAmount.toLowerCase().includes(search.toLowerCase()) ||
        t.chain.toLowerCase().includes(search.toLowerCase()) ||
        t.tokenSymbol.toLowerCase().includes(search.toLowerCase()) ||
        t.company.toLowerCase().includes(search.toLowerCase())
    );

    // Function to export transactions as CSV
    const exportTransactions = () => {
      if (transactions.length === 0) return;

      // Create CSV header
      let csv = "Company,Transaction Hash,Total Amount,Token,Chain,Timestamp\n";

      // Add transaction data
      transactions.forEach(tx => {
        csv += `"${tx.company}","${tx.transactionHash}","${tx.totalAmount}","${tx.tokenSymbol}","${tx.chain}","${new Date(tx.createdAt).toLocaleString()}"\n`;
      });

      // Create blob and download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `payroll-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black/95 w-[90%] md:w-[80%] lg:w-[60%] max-h-[85vh]
                        rounded-2xl border border-gray-200 dark:border-[#a5b4fc]/20 overflow-hidden shadow-2xl shadow-black/60 backdrop-blur-xl"
            >
              {/* Header with close button */}
              <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-[#a5b4fc]/10 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-gradient-to-br dark:from-gray-900/90 dark:to-black/95 z-10 backdrop-blur-sm">
                <h2 className="text-lg sm:text-xl font-bold text-black dark:text-white" style={{
                  textShadow: "dark:0 0 5px rgba(59, 130, 246, 0.4), dark:0 0 10px rgba(96, 165, 250, 0.2)"
                }}>Transaction Log</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={exportTransactions}
                    className="bg-gray-100 dark:bg-gray-900 backdrop-blur-sm text-black dark:text-white px-2 sm:px-3 py-1 sm:py-2 rounded-xl flex items-center space-x-1 sm:space-x-2 shadow-md
                            hover:bg-gray-200 dark:hover:bg-gray-900 transition-all border border-gray-300 dark:border-[#a5b4fc]/20 text-xs sm:text-sm"
                    aria-label="Export transactions"
                    disabled={transactions.length === 0}
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600 dark:text-[#93c5fd]" />
                    <span className="font-bold">Export</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-[#93c5fd] transition-colors p-1"
                    aria-label="Close modal"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content area with scrolling */}
              <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(85vh-80px)]">
                {/* Search Input */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-300 dark:border-[#a5b4fc]/20 text-black dark:text-white rounded-xl py-1 sm:py-2 pl-8 sm:pl-10 pr-3 sm:pr-4
                              focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-[#60a5fa]/50 transition-all text-xs sm:text-sm placeholder-gray-500 dark:placeholder-gray-500"
                  />
                  <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-blue-600/60 dark:text-[#93c5fd]/60" />
                </div>

                {/* Transactions List */}
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-pulse flex space-x-2">
                        <div className="h-2 w-2 bg-blue-500 dark:bg-[#60a5fa] rounded-full"></div>
                        <div className="h-2 w-2 bg-blue-500 dark:bg-[#60a5fa] rounded-full"></div>
                        <div className="h-2 w-2 bg-blue-500 dark:bg-[#60a5fa] rounded-full"></div>
                      </div>
                    </div>
                  ) : error ? (
                    <p className="text-center text-red-600 dark:text-red-400 py-8">{error}</p>
                  ) : filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx, index) => (
                      <div key={tx._id}>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 sm:p-3 md:p-4 rounded-xl border
                                    ${expandedTxId === tx._id
                              ? 'border-blue-500/50 dark:border-[#60a5fa]/50 bg-blue-50/50 dark:bg-[#3b82f6]/5'
                              : 'border-gray-200 dark:border-[#a5b4fc]/20 bg-white/80 dark:bg-gray-900/80'}
                                    backdrop-blur-sm hover:border-blue-500/30 dark:hover:border-[#60a5fa]/30 transition-all cursor-pointer`}
                          onClick={() => toggleExpand(tx._id)}
                        >
                          <div className="mb-2 sm:mb-0 flex-grow">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-base sm:text-lg font-semibold text-black dark:text-white">{formatAddress(tx.transactionHash)}</h3>
                              <a
                                href={getExplorerUrl(tx.chain, tx.transactionHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-[#93c5fd] hover:text-blue-700 dark:hover:text-[#60a5fa]"
                                aria-label="View on explorer"
                                onClick={(e) => e.stopPropagation()} // Prevent toggling when clicking link
                              >
                                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                              </a>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                <span className="text-blue-600/60 dark:text-[#93c5fd]/60">Amount:</span> {tx.totalAmount} USD ({tx.tokenSymbol})
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                <span className="text-blue-600/60 dark:text-[#93c5fd]/60">Chain:</span> {tx.chain}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                <span className="text-blue-600/60 dark:text-[#93c5fd]/60">Employees:</span> {tx.employees.length}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 self-end sm:self-auto mt-2 sm:mt-0">
                            <div className="flex items-center space-x-1 mr-2">
                              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600/80 dark:text-[#93c5fd]/80" />
                              {expandedTxId === tx._id ? (
                                <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-[#93c5fd]" />
                              ) : (
                                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-[#93c5fd]" />
                              )}
                            </div>
                            <StatusIcon status="completed" /> {/* Assuming status is always completed for logs */}
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-400/40 text-green-700 dark:text-green-500">
                              {formatTimestamp(tx.createdAt)}
                            </span>
                          </div>
                        </motion.div>

                        {/* Expandable Employee Details */}
                        <AnimatePresence>
                          {expandedTxId === tx._id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-1 mb-3 overflow-hidden"
                            >
                              <div className="bg-gray-50 dark:bg-gray-900/90 border border-gray-200 dark:border-[#a5b4fc]/20 rounded-xl p-3 md:p-4 backdrop-blur-sm">
                                <h4 className="text-sm font-semibold text-blue-600 dark:text-[#93c5fd] mb-2 flex items-center gap-2">
                                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                                  Employee Payment Details
                                </h4>
                                <div className="max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                                  {tx.employees.map((emp, idx) => (
                                    <div
                                      key={idx}
                                      className="py-2 flex flex-col xs:flex-row justify-between border-b border-gray-200 dark:border-[#a5b4fc]/10 last:border-0"
                                    >
                                      <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 break-all">
                                        {emp.wallet}
                                      </div>
                                      <div className="text-xs sm:text-sm text-blue-700 dark:text-[#93c5fd] mt-1 xs:mt-0">
                                        {emp.amount} USD
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm py-6">No transactions found.</p>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-gray-200 dark:border-[#a5b4fc]/10 flex flex-col xs:flex-row items-start xs:items-center justify-between text-xs sm:text-sm gap-2 xs:gap-0">
                  <span className="text-gray-500 dark:text-gray-400">
                    Showing {filteredTransactions.length} transaction
                    {filteredTransactions.length !== 1 ? "s" : ""}
                  </span>
                  {transactions.length > filteredTransactions.length && (
                    <button
                      onClick={() => setSearch("")}
                      className="text-blue-600 dark:text-[#93c5fd] hover:text-blue-700 dark:hover:text-[#60a5fa] transition-colors"
                    >
                      View All Transactions
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

export default TransactionsLog;