"use client";
import { useState, useEffect } from 'react';
import { X, User, Briefcase, Wallet as WalletIcon, DollarSign, Mail, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Employee } from '@/lib/interfaces';

interface EditEmployeeModalProps {
    employee: Employee | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (employee: Employee) => void;
}

const EditEmployeeModal = ({ employee, isOpen, onClose, onSave }: EditEmployeeModalProps) => {
    const [formData, setFormData] = useState<Employee>({
        name: '',
        wallet: '',
        salary: '',
        designation: '',
        email: '',
        company: '',
    });

    const [errors, setErrors] = useState({
        wallet: '',
        salary: ''
    });

    useEffect(() => {
        if (employee) {
            setFormData(employee);
        }
    }, [employee]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Validation
        if (name === 'wallet') {
            if (!value.startsWith('0x') || value.length !== 42) {
                setErrors(prev => ({
                    ...prev,
                    wallet: 'Invalid wallet address. Must start with 0x and be 42 characters long.'
                }));
            } else {
                setErrors(prev => ({
                    ...prev,
                    wallet: ''
                }));
            }
        } else if (name === 'salary') {
            if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
                setErrors(prev => ({
                    ...prev,
                    salary: 'Salary must be a positive number.'
                }));
            } else {
                setErrors(prev => ({
                    ...prev,
                    salary: ''
                }));
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Final validation before save
        if (!formData.wallet.startsWith('0x') || formData.wallet.length !== 42) {
            setErrors(prev => ({
                ...prev,
                wallet: 'Invalid wallet address. Must start with 0x and be 42 characters long.'
            }));
            return;
        }

        if (isNaN(parseFloat(formData.salary)) || parseFloat(formData.salary) <= 0) {
            setErrors(prev => ({
                ...prev,
                salary: 'Salary must be a positive number.'
            }));
            return;
        }

        if (!errors.wallet && !errors.salary) {
            onSave(formData);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", damping: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-gradient-to-br from-gray-900 to-black/95 w-full max-w-md rounded-2xl border border-[#a5b4fc]/20 overflow-hidden  shadow-2xl shadow-black/60 backdrop-blur-xl"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-[#a5b4fc]/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2.5 rounded-full bg-[#3b82f6]/20 shadow-inner shadow-[#60a5fa]/10">
                                    <User className="w-6 h-6 text-[#93c5fd]" />
                                </div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">
                                    {employee ? 'Edit Employee' : 'Add Employee'}
                                </h2>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="text-gray-400 hover:text-[#93c5fd] transition-colors p-1.5 rounded-full hover:bg-white/5"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="flex gap-2 items-center text-sm text-gray-400">
                                    <User className="w-4 h-4 text-[#93c5fd]" />
                                    Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 bg-gray-900/50 backdrop-blur-sm border border-gray-800/60 rounded-xl 
                                           text-white focus:outline-none focus:border-[#60a5fa] focus:ring-1 focus:ring-[#60a5fa]/30 
                                           placeholder-gray-500 transition-all"
                                    placeholder="Employee name"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="flex gap-2 items-center text-sm text-gray-400">
                                    <Mail className="w-4 h-4 text-[#93c5fd]" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email || ''}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-900/50 backdrop-blur-sm border border-gray-800/60 rounded-xl 
                                           text-white focus:outline-none focus:border-[#60a5fa] focus:ring-1 focus:ring-[#60a5fa]/30 
                                           placeholder-gray-500 transition-all"
                                    placeholder="employee@company.com"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="flex gap-2 items-center text-sm text-gray-400">
                                    <Briefcase className="w-4 h-4 text-[#93c5fd]" />
                                    Department
                                </label>
                                <input
                                    type="text"
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 bg-gray-900/50 backdrop-blur-sm border border-gray-800/60 rounded-xl 
                                           text-white focus:outline-none focus:border-[#60a5fa] focus:ring-1 focus:ring-[#60a5fa]/30 
                                           placeholder-gray-500 transition-all"
                                    placeholder="Engineering, Marketing, etc."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="flex gap-2 items-center text-sm text-gray-400">
                                    <Building className="w-4 h-4 text-[#93c5fd]" />
                                    Company
                                </label>
                                <input
                                    type="text"
                                    name="company"
                                    value={formData.company || ''}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-900/50 backdrop-blur-sm border border-gray-800/60 rounded-xl 
                                           text-white focus:outline-none focus:border-[#60a5fa] focus:ring-1 focus:ring-[#60a5fa]/30 
                                           placeholder-gray-500 transition-all"
                                    placeholder="Company name"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="flex gap-2 items-center text-sm text-gray-400">
                                    <WalletIcon className="w-4 h-4 text-[#93c5fd]" />
                                    Wallet Address
                                </label>
                                <input
                                    type="text"
                                    name="wallet"
                                    value={formData.wallet}
                                    onChange={handleChange}
                                    required
                                    className={`w-full p-3 bg-gray-900/50 backdrop-blur-sm border rounded-xl text-white 
                                            focus:outline-none focus:ring-1 transition-all placeholder-gray-500 ${errors.wallet
                                            ? 'border-red-400/70 focus:border-red-400 focus:ring-red-400/30'
                                            : 'border-gray-800/60 focus:border-[#60a5fa] focus:ring-[#60a5fa]/30'
                                        }`}
                                    placeholder="0x..."
                                />
                                {errors.wallet && (
                                    <p className="text-xs text-red-400 mt-1 ml-1">{errors.wallet}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="flex gap-2 items-center text-sm text-gray-400">
                                    <DollarSign className="w-4 h-4 text-[#93c5fd]" />
                                    Salary (USD)
                                </label>
                                <input
                                    type="text"
                                    name="salary"
                                    value={formData.salary}
                                    onChange={handleChange}
                                    required
                                    className={`w-full p-3 bg-gray-900/50 backdrop-blur-sm border rounded-xl text-white 
                                            focus:outline-none focus:ring-1 transition-all placeholder-gray-500 ${errors.salary
                                            ? 'border-red-400/70 focus:border-red-400 focus:ring-red-400/30'
                                            : 'border-gray-800/60 focus:border-[#60a5fa] focus:ring-[#60a5fa]/30'
                                        }`}
                                    placeholder="1000.00"
                                />
                                {errors.salary && (
                                    <p className="text-xs text-red-400 mt-1 ml-1">{errors.salary}</p>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-6 py-5 border-t border-gray-800/60 bg-gradient-to-b from-transparent to-gray-900/50 backdrop-blur-sm">
                        <div className="flex justify-end gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl border border-gray-700/80 bg-gray-800/50 text-gray-300
                                        hover:bg-gray-800 hover:text-white hover:border-gray-600 transition-all duration-200 backdrop-blur-sm"
                            >
                                Cancel
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmit}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#60a5fa] to-[#3b82f6]
                                        hover:from-[#3b82f6] hover:to-[#2563eb] text-white transition-all duration-200
                                        shadow-lg shadow-[#3b82f6]/20 hover:shadow-[#3b82f6]/30 font-medium"
                            >
                                {employee ? 'Update Employee' : 'Add Employee'}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default EditEmployeeModal;