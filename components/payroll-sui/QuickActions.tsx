"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  UserPlus,
  Upload,
  ArrowUpRight,
  ChevronDown,
  X
} from "lucide-react";

interface QuickActionsProps {
  onAddEmployee: () => void;
  onBulkUpload: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAddEmployee, onBulkUpload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Define quick action cards
  const actionCards = [
    {
      title: "Add Employee",
      description: "Add a new team member", // Shortened description
      icon: UserPlus,
      onClick: () => {
        onAddEmployee();
        setIsOpen(false);
      }
    },
    {
      title: "Bulk Upload",
      description: "Import multiple employees", // Shortened description
      icon: Upload,
      onClick: () => {
        onBulkUpload();
        setIsOpen(false);
      }
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Glassmorphic Trigger Button - Responsive padding and text size */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-2 backdrop-blur-md
                  bg-gray-200/30 dark:bg-white/10 border border-gray-300/50 dark:border-white/20
                  shadow-md hover:shadow-lg transition-all duration-300
                  hover:bg-gray-300/40 dark:hover:bg-gradient-to-r dark:hover:from-gray-600/30 dark:hover:to-gray-700/30
                  hover:border-gray-400/60 dark:hover:border-white/30
                  rounded-lg px-3 py-2 lg:px-4 lg:py-2.5 focus:outline-none /* Adjusted padding */
                  ${isOpen ? 'bg-gray-300/40 dark:bg-white/15 border-gray-400/60 dark:border-white/30' : ''}`}
      >
        <ClipboardList className="w-4 h-4 lg:w-5 lg:w-5 text-black dark:text-white" /> {/* Responsive icon size */}
        {/* Responsive text size and visibility */}
        <span className="font-medium text-xs lg:text-sm text-black dark:text-white whitespace-nowrap">Quick Actions</span>
        {isOpen ? (
          <X className="w-4 h-4 text-black dark:text-white" />
        ) : (
          <ChevronDown className={`w-4 h-4 text-black dark:text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </motion.button>

      {/* Glassmorphic Dropdown Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            // Responsive width
            className="absolute right-0 top-full mt-2 z-50 w-64 sm:w-72 md:w-80"
          >
            <div className="rounded-xl p-4 sm:p-5 overflow-hidden /* Responsive padding */
                           bg-gradient-to-br from-gray-100/80 to-gray-200/90 dark:from-white/8 dark:to-white/3
                           backdrop-blur-lg border border-gray-300/50 dark:border-white/10
                           shadow-xl shadow-black/20 dark:shadow-black/40">
              {/* Responsive text size */}
              <div className="mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold text-black dark:text-white">Quick Actions</h2>
                <p className="text-gray-600 dark:text-white/70 text-xs sm:text-sm mt-1">Manage your workforce</p> {/* Shortened */}
              </div>

              {/* Glassmorphic Quick Action Cards - Responsive padding and text size */}
              <div className="space-y-2 sm:space-y-3">
                {actionCards.map((card, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={card.onClick}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full group rounded-lg sm:rounded-xl p-2.5 sm:p-3 flex items-start gap-2.5 sm:gap-3 transition-all /* Responsive padding and gap */
                              duration-300
                              bg-gradient-to-br from-gray-50/50 to-gray-100/70 dark:from-white/5 dark:to-white/2
                              border border-gray-200/60 dark:border-white/10 shadow-sm hover:shadow-md /* Adjusted shadow */
                              hover:bg-gradient-to-br hover:from-gray-100/60 hover:to-gray-200/80 dark:hover:from-white/10 dark:hover:to-white/5"
                  >
                    {/* Responsive icon container size */}
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg flex-shrink-0 flex items-center justify-center
                                  transform transition-all group-hover:scale-110
                                  bg-gradient-to-br from-gray-200/50 to-gray-300/40 dark:from-white/10 dark:to-white/5
                                  border border-gray-300/40 dark:border-white/10">
                      <card.icon className="w-4 h-4 sm:w-5 sm:h-5 text-black dark:text-white" /> {/* Responsive icon size */}
                    </div>

                    <div className="flex-1 text-left"> {/* Ensure text aligns left */}
                      <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                        {/* Responsive text size */}
                        <h3 className="font-semibold text-sm sm:text-base text-black dark:text-white group-hover:text-gray-800 dark:group-hover:text-white/90 transition-colors">
                          {card.title}
                        </h3>
                        <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 dark:text-white/60 group-hover:text-gray-700 dark:group-hover:text-white/80 transition-colors mt-0.5" /> {/* Adjusted size and margin */}
                      </div>
                      {/* Responsive text size */}
                      <p className="text-xs text-gray-600 dark:text-white/70 group-hover:text-gray-700 dark:group-hover:text-white/80 transition-colors">{card.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Responsive padding and text size */}
              <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-300/50 dark:border-white/10">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-gray-700 dark:text-white/80 hover:text-black dark:hover:text-white transition-colors w-full text-center py-1"
                >
                  Close
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickActions;