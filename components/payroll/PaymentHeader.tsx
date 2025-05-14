"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, LogOut, ClipboardList, Menu, X as CloseIcon } from "lucide-react"; // Import icons
import TransactionsLog from "./TransactionsLog";
import QuickActions from "./QuickActions";
import { useAuth } from "@/context/authContext";

interface PaymentsHeaderProps {
  onConfigurePayments: () => void;
  onAddEmployee: () => void;
  onBulkUpload: () => void;
}

const PaymentsHeader: React.FC<PaymentsHeaderProps> = ({
  onConfigurePayments,
  onAddEmployee,
  onBulkUpload,
}) => {
  const [showLogs, setShowLogs] = useState(false);
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const handleMenuAction = (action: () => void) => {
    action();
    setIsMobileMenuOpen(false); // Close menu after action
  };

  return (
    // Adjusted width and padding for responsiveness
    <div className="mb-6 sm:mb-8 px-4 md:px-6 lg:px-8 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 relative">
        {/* Left Side: Title and Description */}
        <div className="w-full md:w-auto">
          <h1 className="text-lg sm:text-2xl md:text-3xl lg:text font-bold text-black dark:text-white">
            {user?.company || "PayZoll Dashboard"}
          </h1>
          <p className="text-sm hidden sm:block sm:text-base md:text-lg text-gray-600 dark:text-gray-300 mt-1">
            Add, Edit, Control and Process Payroll
          </p>
        </div>

        {/* Right Side: Actions (Desktop) */}
        <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
          <QuickActions
            onAddEmployee={onAddEmployee}
            onBulkUpload={onBulkUpload}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowLogs(true)}
            className="relative py-2 px-3 lg:py-2.5 lg:px-4 rounded-lg backdrop-blur-md bg-gray-200/30 dark:bg-white/10 border border-gray-300/50 dark:border-white/20 shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-300/40 dark:hover:bg-gradient-to-r dark:hover:from-gray-600/30 dark:hover:to-gray-700/30 hover:border-gray-400/60 dark:hover:border-white/30 flex items-center justify-center gap-2"
            title="Transaction Logs"
          >
            <ClipboardList className="h-4 w-4 lg:h-5 lg:w-5 text-black dark:text-white" />
            <span className="hidden lg:inline font-medium text-sm whitespace-nowrap text-black dark:text-white">Logs</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onConfigurePayments}
            className="relative py-2 px-3 lg:py-2.5 lg:px-4 rounded-lg backdrop-blur-md bg-gray-200/30 dark:bg-white/10 border border-gray-300/50 dark:border-white/20 shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-300/40 dark:hover:bg-gradient-to-r dark:hover:from-gray-600/30 dark:hover:to-gray-700/30 hover:border-gray-400/60 dark:hover:border-white/30 flex items-center justify-center gap-2"
            title="Configure Payments"
          >
            <Settings className="h-4 w-4 lg:h-5 lg:w-5 text-black dark:text-white" />
            <span className="hidden lg:inline font-medium text-sm whitespace-nowrap text-black dark:text-white">Configure</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowLogoutModal(true)}
            className="relative text-white py-2 px-3 lg:py-2.5 lg:px-4 rounded-lg backdrop-blur-md bg-blue-500 border border-blue-400 shadow-md hover:shadow-lg
                       transition-all duration-300 hover:bg-gradient-to-r hover:from-indigo-400 hover:to-indigo-600 hover:border-indigo-500
                       flex items-center justify-center gap-2"
            title="Logout"
          >
            <LogOut className="h-4 w-4 lg:h-5 lg:w-5" />
            <span className="hidden lg:inline font-medium text-sm whitespace-nowrap">Logout</span>
          </motion.button>
        </div>

        {/* Hamburger Menu Button (Mobile/Tablet) */}
        <div className="md:hidden absolute top-0 right-0 mt-1 mr-1">
          <motion.button
            ref={buttonRef}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-gray-200/50 dark:bg-white/10 border border-gray-300/50 dark:border-white/20 text-black dark:text-white"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <CloseIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-16 right-4 z-40 mt-2 w-64 origin-top-right rounded-xl bg-white dark:bg-black shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-white/10 focus:outline-none backdrop-blur-lg border border-gray-200 dark:border-gray-700/50"
          >
            <div className="py-2 px-2 space-y-1">
              {/* Quick Actions integrated into mobile menu */}
              <button
                onClick={() => handleMenuAction(onAddEmployee)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60 flex items-center gap-3 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Employee
              </button>
              <button
                onClick={() => handleMenuAction(onBulkUpload)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60 flex items-center gap-3 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Bulk Upload
              </button>
              <hr className="border-gray-200 dark:border-gray-700/50 my-1" />
              <button
                onClick={() => handleMenuAction(() => setShowLogs(true))}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60 flex items-center gap-3 transition-colors"
              >
                <ClipboardList className="h-4 w-4" />
                Transaction Logs
              </button>
              <button
                onClick={() => handleMenuAction(onConfigurePayments)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60 flex items-center gap-3 transition-colors"
              >
                <Settings className="h-4 w-4" />
                Configure Payments
              </button>
              <hr className="border-gray-200 dark:border-gray-700/50 my-1" />
              <button
                onClick={() => handleMenuAction(() => setShowLogoutModal(true))}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <TransactionsLog
        isOpen={showLogs}
        onClose={() => setShowLogs(false)}
      />

      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4" // Added padding
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }} // Adjusted damping
              onClick={(e) => e.stopPropagation()}
              // Adjusted styles for responsiveness and consistency
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl p-5 sm:p-6 w-full max-w-sm shadow-xl"
            >
              <h3 className="text-black dark:text-white text-lg font-semibold mb-2">Confirm Logout</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-5 text-sm">Are you sure you want to logout?</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="w-full sm:w-auto flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 text-black dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowLogoutModal(false);
                  }}
                  className="w-full sm:w-auto flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentsHeader;