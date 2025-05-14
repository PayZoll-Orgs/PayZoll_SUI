"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Briefcase, Wallet, Calendar, Clock, CheckCircle,
  AlertCircle, Copy, CheckCheck, DollarSign, Loader
} from "lucide-react";
import { Employee, Payment } from "@/lib/interfaces";
import { employerApi } from "@/api/employerApi";
import { formatDistanceToNow } from "date-fns";

interface EmployeeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({ isOpen, onClose, employee }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment history when modal opens and employee changes
  useEffect(() => {
    if (isOpen && employee && employee.wallet) {
      fetchPaymentHistory(employee.wallet);
    }
  }, [isOpen, employee]);

  // Function to fetch payment history
  const fetchPaymentHistory = async (wallet: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await employerApi.getEmployeePayroll(wallet);

      if (response.status === "success" && response.data) {
        // Map the API response to our Payment interface
        const formattedPayments: Payment[] = response.data.map((payment: any) => ({
          id: payment.id,
          amount: payment.amount,
          date: formatDate(payment.date),
          status: "completed" // Assuming all historical payments are completed
        }));
        setPaymentHistory(formattedPayments);
      } else {
        setPaymentHistory([]);
        setError("No payment history found");
      }
    } catch (err) {
      console.error("Error fetching payment history:", err);
      setError("Failed to load payment history");
      setPaymentHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date to readable format
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (err) {
      return "Unknown date";
    }
  };

  if (!isOpen || !employee) return null;

  // Status color mapping
  const statusColors: Record<string, string> = {
    completed: "text-green-500 bg-green-400/10",
    pending: "text-amber-500 bg-amber-400/10",
    failed: "text-red-500 bg-red-400/10",
  };

  // Status icon mapping
  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "completed") return <CheckCircle className="w-4 h-4 text-green-700  dark:text-green-400" />;
    if (status === "pending") return <Clock className="w-4 h-4 text-amber-400" />;
    return <AlertCircle className="w-4 h-4 text-red-400" />;
  };

  // Truncate wallet address with ellipsis in the middle
  const truncateAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  // Copy wallet address to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(employee.wallet);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    },
    exit: {
      y: -20, opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const paymentVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0, opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    },
    hover: {
      scale: 1.02,
      transition: { type: "spring", stiffness: 400, damping: 10 }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={onClose}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
      >
        <motion.div
          className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black/95 w-full max-w-3xl rounded-2xl border border-gray-200 dark:border-[#a5b4fc]/20 overflow-hidden shadow-2xl shadow-black/60 backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
          variants={itemVariants}
        >
          {/* Header */}
          <motion.div
            className="p-6 border-b border-gray-200 dark:border-[#a5b4fc]/10 flex items-center justify-between"
            variants={itemVariants}
          >
            <h2 className="text-2xl font-bold text-black dark:text-[#F2F2F2]" style={{
              textShadow: "0 0 5px rgba(59, 130, 246, 0.5), 0 0 10px rgba(96, 165, 250, 0.3)"
            }}>
              Employee Profile
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-[#93c5fd] transition-colors p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>

          <div className="p-6 space-y-8">
            {/* Employee Info Card */}
            <motion.div
              className="bg-gray-50 dark:bg-gray-900/80 rounded-xl p-6 border border-gray-200 dark:border-[#a5b4fc]/20 backdrop-blur-sm"
              variants={itemVariants}
            >
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-[#3b82f6]/20 dark:to-[#60a5fa]/10 flex items-center justify-center border border-blue-200 dark:border-[#60a5fa]/20">
                  <span className="text-2xl font-bold text-blue-700 dark:text-[#93c5fd]">
                    {employee.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-black dark:text-[#F2F2F2] mb-1">
                    {employee.name}
                  </h3>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Briefcase className="w-4 h-4 mr-2 text-blue-600 dark:text-[#93c5fd]" />
                    <span>{employee.designation}</span>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-[#3b82f6]/10 px-4 py-3 rounded-xl text-center border border-blue-100 dark:border-[#3b82f6]/20">
                  <div className="flex items-center justify-center text-blue-700 dark:text-[#93c5fd] mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-bold text-lg">{employee.salary}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Salary</p>
                </div>
              </div>

              {/* Wallet Address */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#a5b4fc]/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Wallet className="w-4 h-4 mr-2 text-blue-600 dark:text-[#93c5fd]" />
                    <span>Wallet Address</span>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-[#93c5fd] transition-colors flex items-center gap-2"
                    aria-label="Copy wallet address"
                  >
                    {copySuccess ? (
                      <span className="flex items-center text-green-700 dark:text-green-400">
                        <CheckCheck className="w-4 h-4 mr-1" /> Copied!
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Copy className="w-4 h-4 mr-1" /> Copy
                      </span>
                    )}
                  </button>
                </div>
                <div className="bg-gray-100 dark:bg-gray-900/90 p-3 rounded-lg border border-gray-200 dark:border-[#a5b4fc]/20">
                  <p className="text-sm text-black dark:text-gray-300 break-all">
                    {employee.wallet}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Payment History */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-[#93c5fd]" />
                <h3 className="text-lg font-semibold text-black dark:text-[#F2F2F2]" style={{
                  textShadow: "0 0 5px rgba(59, 130, 246, 0.3), 0 0 10px rgba(96, 165, 250, 0.2)"
                }}>
                  Payment History
                </h3>
              </div>

              {/* Payment History Content */}
              <div className="space-y-3 overflow-y-auto max-h-80 scrollbar-hide">
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader className="w-8 h-8 text-blue-600 dark:text-[#93c5fd] animate-spin" />
                  </div>
                ) : error ? (
                  <div className="bg-gray-100 dark:bg-gray-900/80 rounded-xl p-4 border border-gray-200 dark:border-[#a5b4fc]/20 text-center text-gray-500 dark:text-gray-400 backdrop-blur-sm">
                    <AlertCircle className="w-6 h-6 text-gray-400 dark:text-[#93c5fd]/50 mx-auto mb-2" />
                    <p>{error}</p>
                  </div>
                ) : paymentHistory.length === 0 ? (
                  <div className="bg-gray-100 dark:bg-gray-900/80 rounded-xl p-4 border border-gray-200 dark:border-[#a5b4fc]/20 text-center text-gray-500 dark:text-gray-400 backdrop-blur-sm">
                    <Calendar className="w-6 h-6 text-gray-400 dark:text-[#93c5fd]/50 mx-auto mb-2" />
                    <p>No payment history available</p>
                  </div>
                ) : (
                  paymentHistory.map((payment) => (
                    <motion.div
                      key={payment.id}
                      className="bg-white dark:bg-gray-900/80 rounded-xl p-4 border border-gray-200 dark:border-[#a5b4fc]/20 hover:border-gray-300 dark:hover:border-[#60a5fa]/30 backdrop-blur-sm"
                      variants={paymentVariants}
                      whileHover="hover"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <StatusIcon status={payment.status} />
                          <span className="font-medium text-black dark:text-[#F2F2F2]">
                            ${payment.amount}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {payment.date}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <span
                          className={`text-xs px-3 py-1 rounded-full ${statusColors[payment.status]}`}
                        >
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          TX: {truncateAddress(payment.id)}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <motion.div
            className="p-6 border-t border-gray-200 dark:border-[#a5b4fc]/10 flex justify-end bg-gray-50/50 dark:bg-transparent"
            variants={itemVariants}
          >
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-white dark:bg-gray-900/80 hover:bg-gray-100 dark:hover:bg-gray-900 text-black dark:text-white transition-colors border border-gray-300 dark:border-[#a5b4fc]/20 hover:border-gray-400 dark:hover:border-[#60a5fa]/30 backdrop-blur-sm"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmployeeDetailsModal;