"use client";
import React, { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import {
    Edit, Trash2, Search, Download, DollarSign, Eye, RefreshCcw, CheckSquare, Square,
    ChevronLeft, ChevronRight, SortAsc, SortDesc, X, ArrowUpDown, MoreVertical
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Employee } from '@/lib/interfaces';
import EmployeeDetailsModal from "./EmployeeDetailsModal";
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';

const sortableColumns: { key: keyof Employee; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'designation', label: 'Designation' },
    { key: 'salary', label: 'Salary' },
    { key: 'wallet', label: 'Wallet' },
    { key: 'company', label: 'Company' },
];

const ITEMS_PER_PAGE = 10;

interface EmployeeTableProps {
    employees: Employee[];
    selectedEmployees: string[];
    toggleEmployeeSelection: (id: string) => void;
    usdToToken: (usdAmount: string) => string;
    selectedTokenSymbol: string;
    isLoading: boolean;
    deleteEmployeeById: (id: string) => void;
    onEditEmployee?: (employee: Employee) => void;
    exchangeRate: number;
    handleTransaction: () => Promise<void>;
    isLoadingDerived: boolean;
    needsApproval: boolean;
    isApproving: boolean;
    isSending: boolean;
    isWritePending: boolean;
    isTxLoading: boolean;
    selectedToken: any;
    refreshEmployees?: () => Promise<void> | void;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({
    employees = [],
    selectedEmployees,
    toggleEmployeeSelection,
    usdToToken,
    selectedTokenSymbol,
    isLoading,
    deleteEmployeeById,
    onEditEmployee,
    exchangeRate,
    handleTransaction,
    isLoadingDerived,
    needsApproval,
    isApproving,
    isSending,
    isWritePending,
    isTxLoading,
    selectedToken,
    refreshEmployees,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Employee | null; direction: 'asc' | 'desc' }>({
        key: 'name',
        direction: 'asc',
    });
    const [currentPage, setCurrentPage] = useState(1);

    // Dynamically create the token amount column definition
    const tokenAmountColumnKey = `amount_${selectedTokenSymbol}`;
    const tokenAmountColumn = { key: tokenAmountColumnKey, label: `Amount (${selectedTokenSymbol})` };

    // Update allPossibleColumns to include the dynamic token amount column
    const allPossibleColumns: { key: keyof Employee | 'actions' | string; label: string }[] = useMemo(() => [
        ...sortableColumns,
        tokenAmountColumn, // Add the token amount column here
        { key: 'actions', label: 'Actions' },
    ], [selectedTokenSymbol]); // Recalculate when symbol changes

    // Initialize visibleColumns state including the token amount column key
    const [visibleColumns, setVisibleColumns] = useState<Set<keyof Employee | 'actions' | string>>(() =>
        new Set(['name', 'designation', 'salary', tokenAmountColumnKey, 'wallet', 'actions']) // Ensure tokenAmountColumnKey is here
    );

    // Effect to update visible columns if the token symbol changes and the key needs updating
    useEffect(() => {
        setVisibleColumns(prev => {
            const newSet = new Set(prev);
            // Remove old token amount keys if they exist
            prev.forEach(key => {
                if (typeof key === 'string' && key.startsWith('amount_') && key !== tokenAmountColumnKey) {
                    newSet.delete(key);
                }
            });
            // Add the current token amount key if it wasn't already there (or was removed)
            if (!newSet.has(tokenAmountColumnKey)) {
                // Check if 'salary' is visible, if so, add the token amount column too
                // Or add it regardless if you always want it visible by default when token changes
                if (newSet.has('salary')) { // Optional: only add if salary is visible
                    newSet.add(tokenAmountColumnKey);
                }
                // If you want it always added when token changes, uncomment the line below and remove the if block above
                // newSet.add(tokenAmountColumnKey);
            }
            // Ensure minimum columns are visible if needed after changes
            while (newSet.size < 3 && allPossibleColumns.length >= 3) {
                const firstAvailable = allPossibleColumns.find(col => !newSet.has(col.key));
                if (firstAvailable) newSet.add(firstAvailable.key);
                else break; // Avoid infinite loop if not enough columns exist
            }
            return newSet;
        });
    }, [tokenAmountColumnKey, allPossibleColumns]); // Rerun when token key or all columns change

    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);

    const [exportNotification, setExportNotification] = useState('');
    const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState<Employee | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (columnMenuRef.current && !columnMenuRef.current.contains(target)) {
                const columnsButton = document.getElementById('columns-button');
                if (!columnsButton || !columnsButton.contains(target)) {
                    setIsColumnMenuOpen(false);
                }
            }
        };
        if (isColumnMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isColumnMenuOpen]);

    const filteredEmployees = useMemo(() => {
        if (!employees) return [];
        return employees.filter((employee) =>
            Object.entries(employee).some(([key, value]) => {
                if (typeof value === 'string' || typeof value === 'number') {
                    return value.toString().toLowerCase().includes(searchTerm.toLowerCase());
                }
                return false;
            })
        );
    }, [employees, searchTerm]);

    const sortedEmployees = useMemo(() => {
        if (!sortConfig.key) return filteredEmployees;
        return [...filteredEmployees].sort((a, b) => {
            const aValue = a[sortConfig.key!];
            const bValue = b[sortConfig.key!];
            if (sortConfig.key === 'salary') {
                const numA = parseFloat(String(aValue).replace(/[^0-9.-]+/g, "")) || 0;
                const numB = parseFloat(String(bValue).replace(/[^0-9.-]+/g, "")) || 0;
                return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
            }
            const strA = String(aValue ?? '').toLowerCase();
            const strB = String(bValue ?? '').toLowerCase();
            return sortConfig.direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
        });
    }, [filteredEmployees, sortConfig]);

    const totalPages = Math.ceil(sortedEmployees.length / ITEMS_PER_PAGE);
    const paginatedEmployees = useMemo(() => {
        return sortedEmployees.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    }, [sortedEmployees, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortConfig]);

    const handleSortKeyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newKey = event.target.value as keyof Employee;
        setSortConfig({ key: newKey, direction: 'asc' });
    };

    const toggleSortDirection = () => {
        if (!sortConfig.key) return;
        setSortConfig((prev) => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }));
    };

    const toggleColumn = (columnKey: keyof Employee | 'actions' | string) => { // Update type to include string
        setVisibleColumns((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(columnKey)) {
                if (newSet.size > 3) { // Ensure at least 3 columns remain visible
                    newSet.delete(columnKey);
                } else {
                    console.warn("Cannot hide more columns.");
                }
            } else {
                newSet.add(columnKey);
            }
            return newSet;
        });
    };

    const handleSelectAllOnPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        paginatedEmployees.forEach(emp => {
            const isSelected = selectedEmployees.includes(emp.wallet);
            if ((isChecked && !isSelected) || (!isChecked && isSelected)) {
                toggleEmployeeSelection(emp.wallet);
            }
        });
    };

    const allPaginatedSelected = useMemo(() => {
        if (paginatedEmployees.length === 0) return false;
        return paginatedEmployees.every(emp => selectedEmployees.includes(emp.wallet));
    }, [paginatedEmployees, selectedEmployees]);

    const isIndeterminate = useMemo(() => {
        const selectedOnPageCount = paginatedEmployees.filter(emp => selectedEmployees.includes(emp.wallet)).length;
        return selectedOnPageCount > 0 && selectedOnPageCount < paginatedEmployees.length;
    }, [paginatedEmployees, selectedEmployees]);

    const handleViewDetails = (employee: Employee) => {
        setSelectedEmployeeDetails(employee);
        setIsDetailsModalOpen(true);
    };

    const handleCloseDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedEmployeeDetails(null);
    };

    const calculateTotalUSD = () => {
        return employees
            .filter(emp => selectedEmployees.includes(emp.wallet))
            .reduce((sum, emp) => sum + parseFloat(emp.salary || '0'), 0);
    };

    const totalUsd = calculateTotalUSD();
    const totalTokens = usdToToken(totalUsd.toString());

    const handleExportCSV = () => {
        if (selectedEmployees.length === 0) {
            setExportNotification('Please select at least one employee to export');
            setTimeout(() => setExportNotification(''), 3000);
            return;
        }
        const selectedEmployeeData = employees.filter(emp => selectedEmployees.includes(emp.wallet));
        const headers = ['Name', 'Designation', 'Wallet Address', 'Salary (USD)', `Amount (${selectedTokenSymbol})`];
        const csvData = selectedEmployeeData.map(emp => [
            emp.name, emp.designation, emp.wallet, parseFloat(emp.salary || '0').toFixed(2), usdToToken(emp.salary || '0')
        ]);
        const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute('href', url);
        link.setAttribute('download', `employee-payroll-${date}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setExportNotification(`Exported ${selectedEmployees.length} employee${selectedEmployees.length !== 1 ? 's' : ''}`);
        setTimeout(() => setExportNotification(''), 3000);
    };

    return (
        <div className={`w-[90vw] xl:w-[75vw] h-full bg-transparent dark:text-white text-black shadow-sm rounded-lg overflow-hidden `}>
            <div className="p-4 border-b border-gray-300 dark:border-gray-700 bg-transparent">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full lg:w-auto lg:flex-grow max-w-md">
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 pl-10 rounded-md border border-gray-400 dark:border-gray-600 bg-white dark:bg-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>

                    <div className="hidden lg:flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <select
                                id="sort-select-desktop"
                                value={sortConfig.key ?? ''}
                                onChange={handleSortKeyChange}
                                className="px-3 py-2 rounded-md border border-gray-400 dark:border-gray-600 bg-white dark:bg-transparent text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                aria-label="Sort by column"
                            >
                                <option value="" disabled>Sort by...</option>
                                {sortableColumns.map(col => (
                                    <option key={col.key} value={col.key}>{col.label}</option>
                                ))}
                            </select>
                            <button
                                onClick={toggleSortDirection}
                                disabled={!sortConfig.key}
                                className="p-2 rounded-md border border-gray-400 dark:border-gray-600 bg-white dark:bg-transparent text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={`Sort direction: ${sortConfig.direction}`}
                                title={`Sort ${sortConfig.direction === 'asc' ? 'Descending' : 'Ascending'}`}
                            >
                                {sortConfig.direction === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                            </button>
                        </div>

                        <div className="relative">
                            <button
                                id="columns-button-desktop"
                                onClick={() => setIsColumnMenuOpen(prev => !prev)}
                                className="px-3 py-2 bg-white dark:bg-transparent border border-gray-400 dark:border-gray-600 rounded-md text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 flex items-center gap-2 text-sm"
                                aria-haspopup="true"
                                aria-expanded={isColumnMenuOpen}
                            >
                                <ArrowUpDown className="w-4 h-4" /> Columns
                            </button>
                            {isColumnMenuOpen && (
                                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setIsColumnMenuOpen(false)}>
                                    <div
                                        ref={columnMenuRef}
                                        onClick={(e) => e.stopPropagation()}
                                        className="relative w-80 p-4 bg-white/80 dark:bg-black/70 backdrop-blur-lg rounded-lg shadow-xl border border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center"
                                    >
                                        <button onClick={() => setIsColumnMenuOpen(false)} className="absolute top-2 right-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white" aria-label="Close column menu"><X className="h-5 w-5" /></button>
                                        <h3 className="text-xl font-semibold mb-3 text-black dark:text-white">Visible Columns</h3>
                                        <div className="space-y-4">
                                            {allPossibleColumns.map((column) => (
                                                <label key={column.key} className="flex items-center px-2 py-1.5 cursor-pointer text-lg text-black dark:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleColumns.has(column.key)}
                                                        onChange={() => toggleColumn(column.key)}
                                                        disabled={visibleColumns.has(column.key) && visibleColumns.size <= 3}
                                                        className={`
                                                                    appearance-none
                                                                    mr-2 h-4 w-4
                                                                    rounded-sm
                                                                    border-2 dark:border-white
                                                                    bg-transparent
                                                                    dark:checked:bg-gray-100
                                                                    dark:checked:border-gray-800 checked:bg-indigo-600
                                                                    transition-colors duration-200
                                                                    disabled:opacity-50
                                                                `}
                                                    />
                                                    {column.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-3 py-2 bg-gray-100 dark:bg-transparent rounded-md border border-gray-400 dark:border-gray-600 flex-shrink-0">
                            <span className="text-indigo-600 dark:text-indigo-300 font-bold text-sm">1 USD = {exchangeRate.toFixed(6)} {selectedTokenSymbol}</span>
                        </div>

                        <button
                            onClick={handleExportCSV}
                            className={`px-3 py-2 bg-white dark:bg-gray-900/40 border border-gray-400 dark:border-gray-600 rounded-md text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 flex items-center gap-2 text-sm
                                       ${selectedEmployees.length === 0 ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            aria-label="Export selected employees"
                            title={selectedEmployees.length === 0 ? "Select employees to export" : `Export ${selectedEmployees.length} selected employee(s)`}
                            disabled={selectedEmployees.length === 0 || isLoading || isLoadingDerived}
                        >
                            <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span>Export</span>
                        </button>

                        <div className="px-3 py-2 bg-gray-100 dark:bg-transparent rounded-md border border-gray-400 dark:border-gray-600 flex-shrink-0">
                            <span className="text-black dark:text-white text-sm">
                                {selectedEmployees.length} / {employees.length}
                            </span>
                        </div>
                    </div>

                    <div className="lg:hidden flex items-center gap-3 w-full justify-end">
                        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-400 dark:border-gray-600 flex-shrink-0">
                            <span className="text-black dark:text-white text-sm">
                                {selectedEmployees.length} / {employees.length}
                            </span>
                        </div>
                        <HeadlessMenu as="div" className="relative inline-block text-left">
                            <div>
                                <HeadlessMenu.Button className="inline-flex justify-center w-full rounded-md border border-gray-400 dark:border-gray-600 shadow-sm px-3 py-2 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500">
                                    <MoreVertical className="h-5 w-5" aria-hidden="true" />
                                    <span className="sr-only">More options</span>
                                </HeadlessMenu.Button>
                            </div>

                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <HeadlessMenu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none z-20">
                                    <div className="py-1">
                                        <div className="px-4 py-2 text-xs uppercase text-gray-500 dark:text-gray-400">Sort</div>
                                        <HeadlessMenu.Item>
                                            {({ active }) => (
                                                <div className="px-4 py-2 flex items-center gap-2">
                                                    <select
                                                        id="sort-select-mobile"
                                                        value={sortConfig.key ?? ''}
                                                        onChange={handleSortKeyChange}
                                                        className={`w-full px-3 py-1.5 rounded-md border border-gray-400 dark:border-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 ${active ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} text-black dark:text-white`}
                                                        aria-label="Sort by column"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <option value="" disabled>Sort by...</option>
                                                        {sortableColumns.map(col => (
                                                            <option key={col.key} value={col.key}>{col.label}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleSortDirection(); }}
                                                        disabled={!sortConfig.key}
                                                        className={`p-1.5 rounded-md border border-gray-400 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 ${active ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} text-black dark:text-white`}
                                                        aria-label={`Sort direction: ${sortConfig.direction}`}
                                                    >
                                                        {sortConfig.direction === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            )}
                                        </HeadlessMenu.Item>
                                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                                        <HeadlessMenu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={() => setIsColumnMenuOpen(true)}
                                                    className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''
                                                        } group flex w-full items-center rounded-md px-4 py-2 text-sm text-gray-900 dark:text-gray-200`}
                                                >
                                                    <ArrowUpDown className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                                                    Columns
                                                </button>
                                            )}
                                        </HeadlessMenu.Item>

                                        <HeadlessMenu.Item disabled={selectedEmployees.length === 0 || isLoading || isLoadingDerived}>
                                            {({ active, disabled }) => (
                                                <button
                                                    onClick={handleExportCSV}
                                                    disabled={disabled}
                                                    className={`${active && !disabled ? 'bg-gray-100 dark:bg-gray-700' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                                                        } group flex w-full items-center rounded-md px-4 py-2 text-sm text-gray-900 dark:text-gray-200`}
                                                >
                                                    <Download className="mr-3 h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                                                    Export Selected
                                                </button>
                                            )}
                                        </HeadlessMenu.Item>

                                        <HeadlessMenu.Item>
                                            {({ active }) => (
                                                <div className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}>
                                                    1 USD = {exchangeRate.toFixed(4)} {selectedTokenSymbol}
                                                </div>
                                            )}
                                        </HeadlessMenu.Item>
                                    </div>
                                </HeadlessMenu.Items>
                            </Transition>
                        </HeadlessMenu>
                    </div>
                </div>
            </div>

            {exportNotification && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="m-2 p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium text-center border border-indigo-300 dark:border-indigo-700">
                    {exportNotification}
                </motion.div>
            )}

            <div className="overflow-x-auto">
                <table className={`w-full min-w-[640px] sm:min-w-[768px] font-sans`}>
                    <thead className="bg-transparent dark:text-white text-black border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-2 sm:px-4 py-3 w-10 sm:w-12">
                                <input
                                    type="checkbox"
                                    checked={allPaginatedSelected}
                                    ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                                    onChange={handleSelectAllOnPage}
                                    disabled={isLoading || isLoadingDerived || paginatedEmployees.length === 0}
                                    className={`
                                        appearance-none
                                        h-4 w-4
                                        rounded-sm
                                        border-2 border-gray-400 dark:border-white
                                        bg-transparent
                                        checked:bg-indigo-600 checked:border-indigo-600
                                        dark:checked:bg-indigo-500 dark:checked:border-indigo-500
                                        transition-colors duration-200
                                        disabled:opacity-50
                                        focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 dark:focus:ring-offset-gray-900
                                    `}
                                    aria-label="Select all employees on this page"
                                />
                            </th>
                            {allPossibleColumns
                                .filter(col => visibleColumns.has(col.key))
                                .map((column) => (
                                    <th
                                        key={column.key}
                                        className={`px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap
                                            ${column.key === 'salary' || column.key === tokenAmountColumnKey ? 'text-right' : 'text-left'}
                                            ${column.key === 'actions' ? 'text-center w-24 sm:w-32' : ''}
                                            ${(column.key === 'email' || column.key === 'company') ? 'hidden md:table-cell' : ''}
                                            ${column.key === 'wallet' ? 'hidden lg:table-cell' : ''}
                                            `}
                                    >
                                        {column.key === 'salary' ? 'Salary (USD)' :
                                            column.key === tokenAmountColumnKey ? `Amount (${selectedTokenSymbol})` :
                                                column.label}
                                    </th>
                                ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-900 bg-transparent">
                        {(isLoading && paginatedEmployees.length === 0) && (
                            <tr><td colSpan={visibleColumns.size + 1} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base">Loading employees...</td></tr>
                        )}
                        {(!isLoading && sortedEmployees.length === 0) && (
                            <tr><td colSpan={visibleColumns.size + 1} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base">No employees added yet.</td></tr>
                        )}
                        {(!isLoading && sortedEmployees.length > 0 && paginatedEmployees.length === 0) && (
                            <tr><td colSpan={visibleColumns.size + 1} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base">No employees match your search/filters.</td></tr>
                        )}
                        {paginatedEmployees.map((employee, index) => (
                            <tr
                                key={employee.wallet || index}
                                className={`hover:bg-gray-100 dark:hover:bg-gray-800/20 transition-colors ${selectedEmployees.includes(employee.wallet) ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}
                            >
                                <td className="px-2 sm:px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedEmployees.includes(employee.wallet)}
                                        onChange={() => toggleEmployeeSelection(employee.wallet)}
                                        disabled={isLoading || isLoadingDerived}
                                        className={`
                                            appearance-none
                                            h-4 w-4
                                            rounded-sm
                                            border-2 border-gray-400 dark:border-white
                                            bg-transparent
                                            checked:bg-indigo-600 checked:border-indigo-600
                                            dark:checked:bg-indigo-500 dark:checked:border-indigo-500
                                            transition-colors duration-200
                                            disabled:opacity-50
                                            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 dark:focus:ring-offset-gray-900
                                        `}
                                        aria-label={`Select employee ${employee.name}`}
                                    />
                                </td>
                                {allPossibleColumns
                                    .filter(col => visibleColumns.has(col.key))
                                    .map((column) => (
                                        <td
                                            key={`${employee.wallet}-${column.key}`}
                                            className={`px-2 sm:px-4 py-3 text-sm sm:text-base text-black dark:text-white whitespace-nowrap align-middle
                                                ${column.key === 'salary' || column.key === tokenAmountColumnKey ? 'text-right font-medium' : 'text-left'}
                                                ${column.key === 'actions' ? 'text-center' : ''}
                                                ${(column.key === 'email' || column.key === 'company') ? 'hidden md:table-cell' : ''}
                                                ${column.key === 'wallet' ? 'hidden lg:table-cell text-xs text-gray-500 dark:text-gray-400' : ''}
                                                ${column.key === tokenAmountColumnKey ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''}
                                                ${column.key === 'name' ? 'group cursor-pointer font-medium' : ''}
                                                `}
                                            title={column.key === 'wallet' ? employee.wallet : undefined}
                                            onClick={column.key === 'name' ? () => handleViewDetails(employee) : undefined}
                                        >
                                            {column.key === 'actions' ? (
                                                <div className="flex justify-center space-x-1 sm:space-x-2">
                                                    <button onClick={() => handleViewDetails(employee)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 rounded disabled:opacity-50" disabled={isLoading || isLoadingDerived} title="View Details"><Eye className="h-4 w-4" /></button>
                                                    {onEditEmployee && <button onClick={() => onEditEmployee(employee)} className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 p-1 rounded disabled:opacity-50" disabled={isLoading || isLoadingDerived} title="Edit employee"><Edit className="h-4 w-4" /></button>}
                                                    <button onClick={() => deleteEmployeeById(employee.wallet)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 rounded disabled:opacity-50" disabled={isLoading || isLoadingDerived} title="Delete employee"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            ) : column.key === 'name' ? (
                                                <div className="flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                                    {employee.name || 'N/A'}
                                                    <Eye className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 dark:text-indigo-400" />
                                                </div>
                                            ) : column.key === 'salary' ? (
                                                `$${parseFloat(employee.salary || '0').toFixed(2)}`
                                            ) : column.key === 'wallet' ? (
                                                `${employee.wallet.substring(0, 6)}...${employee.wallet.substring(employee.wallet.length - 4)}`
                                            ) : column.key === tokenAmountColumnKey ? (
                                                usdToToken(employee.salary || '0')
                                            ) : (
                                                employee[column.key as keyof Employee] ?? 'N/A'
                                            )}
                                        </td>
                                    ))}
                            </tr>
                        ))}
                    </tbody>
                    {selectedEmployees.length > 0 && (
                        <tfoot>
                            <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <td colSpan={
                                    Array.from(visibleColumns).filter(key => key !== 'salary' && key !== tokenAmountColumnKey && key !== 'actions').length + 1
                                }
                                    className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-600 dark:text-gray-300 font-medium text-xs sm:text-sm">
                                    Total ({selectedEmployees.length}):
                                </td>
                                {visibleColumns.has('salary') && (
                                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-sm">
                                        ${totalUsd.toFixed(2)}
                                    </td>
                                )}
                                {visibleColumns.has(tokenAmountColumnKey) && (
                                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-sm">
                                        {totalTokens} {selectedTokenSymbol}
                                    </td>
                                )}
                                {visibleColumns.has('actions') && (
                                    <td className="px-2 sm:px-4 py-2 sm:py-3"></td>
                                )}
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            <div className="px-4 py-3 border-t border-gray-300 dark:border-gray-700 bg-transparent">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <span className="text-sm text-black dark:text-white order-2 md:order-1 text-center md:text-left">
                        Showing{' '}
                        <span className="font-medium">{sortedEmployees.length > 0 ? Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, sortedEmployees.length) : 0}</span>
                        {' '}to{' '}
                        <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, sortedEmployees.length)}</span>
                        {' '}of{' '}
                        <span className="font-medium">{sortedEmployees.length}</span>
                        {' '}entries {searchTerm && '(filtered)'}
                    </span>

                    {totalPages > 1 && (
                        <div className="inline-flex items-center -space-x-px rounded-md shadow-sm order-1 md:order-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1 || isLoading || isLoadingDerived}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-600 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Previous page"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-black dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 bg-white dark:bg-gray-800">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || isLoading || isLoadingDerived}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-600 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Next page"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    )}

                    <motion.div
                        className="w-[80%] sm:w-[60%] md:w-auto order-3 mt-4 md:mt-0"
                        whileHover={{ scale: selectedEmployees.length > 0 && !isLoadingDerived ? 1.02 : 1.0 }}
                        whileTap={{ scale: selectedEmployees.length > 0 && !isLoadingDerived ? 0.98 : 1.0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <button
                            onClick={handleTransaction}
                            disabled={isLoadingDerived || selectedEmployees.length === 0 || isLoading}
                            className={`w-full px-1 py-2 sm:px-6 sm:py-3 rounded-xl font-medium sm:text-base text-sm transition-all flex items-center justify-center gap-3
                      ${isLoadingDerived || selectedEmployees.length === 0 || isLoading
                                    ? 'bg-gray-300 dark:bg-gray-900/50 text-gray-500 dark:text-gray-300 cursor-not-allowed border border-gray-400 dark:border-gray-600'
                                    : 'bg-gradient-to-r from-[#4890e9] to-[#3b82f6] text-white hover:from-[#3b82f6] hover:to-[#2563eb] shadow-lg shadow-[#3b82f6]/20 hover:shadow-[#3b82f6]/30'
                                }`}
                        >
                            <DollarSign className="w-5 h-5" />
                            <span>
                                {isApproving
                                    ? `Approving ${selectedTokenSymbol || selectedToken?.symbol}...`
                                    : isSending || isWritePending || isTxLoading
                                        ? 'Processing...'
                                        : selectedEmployees.length === 0
                                            ? 'Select Employees'
                                            : needsApproval && selectedToken?.address !== 'NATIVE_ADDRESS'
                                                ? `Approve & Send`
                                                : `Pay Selected (${selectedEmployees.length})`}
                            </span>
                        </button>
                    </motion.div>
                </div>
            </div>

            <EmployeeDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={handleCloseDetailsModal}
                employee={selectedEmployeeDetails}
            />
        </div>
    );
};

export default EmployeeTable;