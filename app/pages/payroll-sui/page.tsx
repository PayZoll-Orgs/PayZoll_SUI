"use client";

import React, { useState, useEffect } from "react";
import { Employee } from "@/lib/interfaces";
import { employerApi } from "@/api/employerApi";
import { payrollApi } from "@/api/payrollApi";
import { toast } from "react-hot-toast";
import {
    useCurrentAccount,
    useSignAndExecuteTransaction,
    useSuiClient
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useNetwork } from '@/context/networkContext';
import { suiTokens, bulkTransferModule } from '@/lib/sui-tokens';
import { getExchangeRate } from '@/lib/sui-price-helper';
import Link from "next/link"
import { Home } from "lucide-react";
import { SuiToken } from "@/lib/sui-tokens";

import PaymentsHeader from "@/components/payroll-sui/PaymentHeader";
import EmployeeTable from "@/components/payroll-sui/EmployeeTable";
import AddEmployeeModal from "@/components/payroll-sui/AddEmployeeModal";
import BulkUploadModal from "@/components/payroll-sui/BulkUploadModal";

const PayrollSUI: React.FC = () => {
    // Core state
    const [selectedCoin, setSelectedCoin] = useState(suiTokens["mainnet"][0]);

    // Sui-specific transaction state
    const [txDetails, setTxDetails] = useState<{
        totalTokenSent: string;
        gasFee: string;
        effectiveTotalCost: string;
    } | null>(null);
    const [coinBalance, setCoinBalance] = useState<{ [key: string]: string }>({});
    const [exchangeRate, setExchangeRate] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [walletToDelete, setWalletToDelete] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState<string>('');

    // Lifted state from PaymentDashboard
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [txError, setTxError] = useState('');
    const [isSending, setIsSending] = useState(false);

    const [txHash, setTxHash] = useState<string>();

    // Sui hooks
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    // Add network context
    const { currentNetwork } = useNetwork();

    // Add state to store tokens for current network
    const [availableTokens, setAvailableTokens] = useState(suiTokens[currentNetwork] || []);

    // Update the bulkTransfer address to be dynamic
    const [bulkTransferAddress, setBulkTransferAddress] = useState(bulkTransferModule[currentNetwork]);

    console.log("Current Network:", currentNetwork);
    console.log("Available Tokens:", availableTokens);
    console.log("Bulk Transfer Address:", bulkTransferAddress);
    console.log("Selected Coin:", selectedCoin);
    console.log("Coin Balance:", coinBalance);
    console.log("Exchange Rate:", exchangeRate);


    useEffect(() => {
        fetchEmployees();
        fetchCompanyInfo();
    }, []);

    // Update useEffect to handle network changes
    useEffect(() => {
        // Update tokens when network changes
        setAvailableTokens(suiTokens[currentNetwork] || []);
        setBulkTransferAddress(bulkTransferModule[currentNetwork]);

        // Also update the selected coin to the first available on this network
        if (suiTokens[currentNetwork] && suiTokens[currentNetwork].length > 0) {
            setSelectedCoin(suiTokens[currentNetwork][0]);
        }

        // Fetch exchange rate for the selected coin's symbol
        if (selectedCoin) {
            fetchExchangeRate(selectedCoin.symbol);
        }

        // Fetch balances for the new network
        if (currentAccount) {
            fetchCoinBalances();
        }
    }, [currentNetwork]);

    // Add a function to fetch exchange rate
    const fetchExchangeRate = async (symbol: string) => {
        try {
            const rate = await getExchangeRate(symbol);
            setExchangeRate(rate);
        } catch (error) {
            console.error("Error fetching exchange rate:", error);
        }
    };

    // Fetch wallet balances when account or selected coin changes
    useEffect(() => {
        if (currentAccount) {
            fetchCoinBalances();
        }
    }, [currentAccount, selectedCoin]);

    const fetchCoinBalances = async () => {
        if (!currentAccount) return;

        try {
            const balances: { [key: string]: string } = {};

            // Get balances for each coin type on current network
            for (const coin of availableTokens) {
                const coinData = await suiClient.getBalance({
                    owner: currentAccount.address,
                    coinType: coin.address,
                });

                const balance = coinData ?
                    (Number(coinData.totalBalance) / Math.pow(10, coin.decimals)).toFixed(6) :
                    "0.000000";

                balances[coin.symbol] = balance;
            }

            setCoinBalance(balances);
        } catch (error) {
            console.error("Error fetching balances:", error);
        }
    };

    const fetchCompanyInfo = async () => {
        try {
            const userInfo = localStorage.getItem('user');
            if (userInfo) {
                const { company } = JSON.parse(userInfo);
                setCompanyName(company);
            }
        } catch (error) {
            console.error("Failed to fetch company info:", error);
        }
    };

    const fetchEmployees = async () => {
        try {
            setIsLoading(true);
            const response = await employerApi.getAllEmployees();
            if (response.status === "success") {
                setEmployees(response.employees || []);
            } else {
                throw new Error(response.message || "Failed to fetch employees");
            }
        } catch (error: any) {
            console.error("Failed to fetch employees:", error);
            toast.error(`Failed to load employees: ${error.message || "Unknown error"}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Convert USD salary to token amount
    const usdToToken = (usdAmount: string) => {
        // Ensure we're handling the conversion precisely
        const usd = parseFloat(usdAmount || '0');
        const tokenAmount = usd * exchangeRate;

        // Use appropriate decimal places based on token
        return tokenAmount.toFixed(selectedCoin.decimals);
    };

    // Handle employee selection
    const toggleEmployeeSelection = (employeeId: string) => {
        setSelectedEmployees(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    // Get transaction details from the chain
    const getTransactionDetails = async (digest: string, retryCount = 0, maxRetries = 5) => {
        try {
            // Get transaction details from chain
            const txDetails = await suiClient.getTransactionBlock({
                digest,
                options: { showEffects: true, showInput: true }
            });

            // Extract gas used and convert to SUI
            const gasUsed = txDetails.effects?.gasUsed;
            const gasFee = gasUsed ?
                (parseInt(gasUsed.computationCost) +
                    parseInt(gasUsed.storageCost) -
                    parseInt(gasUsed.storageRebate)) / 1_000_000_000 : 0;

            // Calculate total token sent
            const selectedEmployeeData = employees.filter(emp => selectedEmployees.includes(emp.wallet));
            const totalTokenAmount = selectedEmployeeData.reduce(
                (sum, emp) => sum + parseFloat(usdToToken(emp.salary)), 0
            );

            // Set transaction details
            const details = {
                totalTokenSent: totalTokenAmount.toFixed(6),
                gasFee: gasFee.toFixed(6),
                effectiveTotalCost: selectedCoin.symbol === "SUI" ?
                    (totalTokenAmount + gasFee).toFixed(6) :
                    `${totalTokenAmount.toFixed(6)} ${selectedCoin.symbol} + ${gasFee.toFixed(6)} SUI`
            };

            setTxDetails(details);
            return details;
        } catch (error) {
            console.error(`Error getting transaction details (attempt ${retryCount + 1}/${maxRetries}):`, error);

            // If we haven't exceeded max retries, try again with exponential backoff
            if (retryCount < maxRetries) {
                const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s, 8s, 16s
                console.log(`Retrying in ${delay / 1000} seconds...`);

                return new Promise(resolve => {
                    setTimeout(async () => {
                        const result = await getTransactionDetails(digest, retryCount + 1, maxRetries);
                        resolve(result);
                    }, delay);
                });
            }

            // If we've exhausted retries, return a properly typed fallback object
            const selectedEmployeeData = employees.filter(emp => selectedEmployees.includes(emp.wallet));
            const totalTokenAmount = selectedEmployeeData.reduce(
                (sum, emp) => sum + parseFloat(usdToToken(emp.salary)), 0
            );

            const fallbackDetails = {
                totalTokenSent: totalTokenAmount.toFixed(6),
                gasFee: "pending",
                effectiveTotalCost: selectedCoin.symbol === "SUI" ?
                    `≈${totalTokenAmount.toFixed(6)} (gas fee pending)` :
                    `≈${totalTokenAmount.toFixed(6)} ${selectedCoin.symbol} + gas fee (pending)`
            };

            setTxDetails(fallbackDetails);
            return fallbackDetails;
        }
    };

    // Execute bulk payment transaction
    const handleTransaction = async () => {
        setTxError('');

        if (!currentAccount) {
            toast.error('Please connect your wallet first');
            return;
        }

        if (selectedEmployees.length === 0) {
            toast.error('Please select at least one employee to pay');
            return;
        }

        try {
            setIsSending(true);

            // Get selected employees data
            const selectedEmployeeData = employees.filter(emp => selectedEmployees.includes(emp.wallet));

            // Calculate total payment amount in token (converted from USD)
            const totalUsdAmount = selectedEmployeeData.reduce(
                (sum, emp) => sum + parseFloat(emp.salary), 0
            );
            

            const totalTokenAmount = totalUsdAmount * exchangeRate;

            console.log(`Total payment: ${totalUsdAmount} USD = ${totalTokenAmount} ${selectedCoin.symbol}`);

            // Check if we have enough balance
            const availableBalance = parseFloat(coinBalance[selectedCoin.symbol] || "0");
            if (availableBalance < totalTokenAmount) {
                throw new Error(`Insufficient ${selectedCoin.symbol} balance. Available: ${availableBalance.toFixed(6)}, Required: ${totalTokenAmount.toFixed(6)}`);
            }

            // Prepare recipient addresses and amounts
            const recipients = selectedEmployeeData.map(emp => emp.wallet);
            const amounts = selectedEmployeeData.map(emp => {
                // Convert USD salary to token amount
                const usdAmount = parseFloat(emp.salary || '0');
                const tokenAmount = usdAmount * exchangeRate;

                // Calculate amount in smallest unit with proper decimal precision
                // For example: 0.01 USDC (with 6 decimals) should be 10000 units
                const amountInSmallestUnit = Math.floor(tokenAmount * Math.pow(10, selectedCoin.decimals));

                console.log(`Employee: ${emp.name}, USD: ${usdAmount}, Token: ${tokenAmount.toFixed(6)} ${selectedCoin.symbol}, Smallest units: ${amountInSmallestUnit}`);

                return amountInSmallestUnit;
            });

            // Calculate total amount in smallest units
            const totalAmountInSmallestUnit = amounts.reduce((a, b) => a + b, 0);

            // Set gas budget - adjust based on number of recipients
            const baseGasBudget = 10000000; // 10M gas units base
            const perRecipientGas = 1000000; // 1M per recipient
            const estimatedGasBudget = baseGasBudget + (recipients.length * perRecipientGas);

            // Initialize transaction
            const tx = new Transaction();
            tx.setGasBudget(estimatedGasBudget);

            if (selectedCoin.symbol === "SUI") {
                // FOR SUI: Split the gas coin for payment
                const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(totalAmountInSmallestUnit)]);

                tx.moveCall({
                    target: `${bulkTransferAddress}::bulktransfer::bulk_transfer`,
                    arguments: [
                        paymentCoin, // Use the split coin, not tx.gas
                        tx.pure.vector('address', recipients),
                        tx.pure.vector('u64', amounts),
                    ],
                    typeArguments: [selectedCoin.address],
                });
            } else {
                // FOR OTHER COINS: Fetch coin objects and find one with sufficient balance
                const { data: coins } = await suiClient.getCoins({
                    owner: currentAccount.address,
                    coinType: selectedCoin.address,
                });

                if (!coins || coins.length === 0) {
                    throw new Error(`No ${selectedCoin.symbol} coins found in wallet`);
                }

                // Find a coin with enough balance or coins we can merge
                let paymentCoinObj = coins.find(coin =>
                    BigInt(coin.balance) >= BigInt(totalAmountInSmallestUnit)
                );

                if (!paymentCoinObj) {
                    throw new Error(`No single ${selectedCoin.symbol} coin with sufficient balance. Consider merging your coins first.`);
                }

                tx.moveCall({
                    target: `${bulkTransferAddress}::bulktransfer::bulk_transfer`,
                    arguments: [
                        tx.object(paymentCoinObj.coinObjectId),
                        tx.pure.vector('address', recipients),
                        tx.pure.vector('u64', amounts),
                    ],
                    typeArguments: [selectedCoin.address],
                });
            }

            // Execute the transaction
            signAndExecuteTransaction(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        console.log('Transaction result:', result);

                        if (result && result.effects)
                            console.log('Transaction effects:', result.effects);

                        if (result && result.digest) {
                            setTxHash(result.digest);

                            // Log payroll transaction to backend
                            const employeePayments = selectedEmployeeData.map(emp => ({
                                wallet: emp.wallet,
                                amount: emp.salary
                            }));

                            const payrollData = {
                                company: companyName,
                                employees: employeePayments,
                                totalAmount: totalUsdAmount.toFixed(2),
                                tokenSymbol: selectedCoin.symbol,
                                chain: "Sui",
                                transactionHash: result.digest
                            };

                            // Log the transaction data
                            console.log('Payroll transaction data:', payrollData);

                            await payrollApi.addPayroll(payrollData);
                            toast.success("Payment completed successfully");
                            setSelectedEmployees([]);

                            // Refresh balances after transaction
                            fetchCoinBalances();
                        }
                    },
                    onError: (error) => {
                        console.error('Transaction error:', error);
                        setTxError(error.message || 'Transaction failed');
                        toast.error(error.message || 'Transaction failed');
                    }
                }
            );
        } catch (error: any) {
            console.error('Transaction error:', error);
            setTxError(error.message || 'Transaction failed');
            toast.error(error.message || 'Transaction failed');
        } finally {
            setIsSending(false);
        }
    };

    const confirmDeleteEmployee = async () => {
        if (!walletToDelete) return;

        try {
            await employerApi.deleteEmployee(walletToDelete);
            setEmployees((prevEmployees) => prevEmployees.filter((employee) => employee.wallet !== walletToDelete));
            toast.success("Employee deleted successfully");
        } catch (error: any) {
            console.error("Failed to delete employee:", error);
            const message = error?.response?.data?.message || error?.message || "An unknown error occurred";
            toast.error(`Failed to delete employee: ${message}`);
        } finally {
            setIsDeleteDialogOpen(false);
            setWalletToDelete(null);
        }
    };

    const handleEditEmployee = (employee: Employee) => {
        setSelectedEmployee(employee);
        setShowAddModal(true);
    };

    const handleAddEmployee = async (employee: Employee) => {
        try {
            const response = await employerApi.addEmployee(employee);
            if (response.status === "success") {
                const newEmployee = response.message; // Assuming message contains the new employee data on success
                setEmployees((prevEmployees) => [...prevEmployees, newEmployee]);
                setShowAddModal(false);
                fetchEmployees(); // Refetch to ensure consistency, though adding locally might suffice
                toast.success("Employee added successfully");
            } else {
                throw new Error(response.message || "Failed to add employee due to API error.");
            }
        } catch (error: any) {
            console.error("Failed to add employee:", error);
            const message = error?.response?.data?.message || error?.message || "An unknown error occurred";
            toast.error(`Failed to add employee: ${message}`);
            // Optionally keep the modal open on failure
            // setShowAddModal(true);
        }
    };

    const handleUpdateEmployee = async (wallet: string, updatedData: Partial<Employee>) => {
        try {
            const response = await employerApi.updateEmployee(wallet, updatedData);
            if (response.status === "success") {
                const updatedEmployee = response.data; // Assuming data contains the updated employee
                setEmployees((prevEmployees) =>
                    prevEmployees.map((emp) =>
                        emp.wallet === wallet ? { ...emp, ...updatedEmployee } : emp // Ensure full update locally
                    )
                );
                setShowAddModal(false);
                setSelectedEmployee(null);
                toast.success("Employee updated successfully");
                // Consider refetching if local update isn't reliable
                fetchEmployees();
            } else {
                throw new Error(response.message || "Failed to update employee due to API error.");
            }
        } catch (error: any) {
            console.error("Failed to update employee:", error);
            const message = error?.response?.data?.message || error?.message || "An unknown error occurred";
            toast.error(`Failed to update employee: ${message}`);
            // Optionally keep the modal open on failure
            // setShowAddModal(true);
        }
    };

    const handleAddEmployeeClick = () => {
        setSelectedEmployee(null);
        setShowAddModal(true);
    };

    const handleBulkUploadClick = () => {
        setShowBulkUploadModal(true);
    };

    // Handle token selection
    const handleTokenChange = (token: SuiToken) => {
        setSelectedCoin(token);

        // Update exchange rate when token changes
        fetchExchangeRate(token.symbol);

        // Toast notification for token change
        toast.success(`Selected token changed to ${token.symbol}`);
    };

    return (
        <div className="relative h-screen w-screen dark:text-white text-black p-6 z-10">
            <div className="absolute top-4 left-4">
                <Link href="/">
                    <Home className="text-black dark:hover:text-gray-200 hover:text-gray-800 dark:text-white" size={30} />
                </Link>
            </div>
            <div className="flex flex-col max-w-screen max-h-screen items-center m-10">
                <PaymentsHeader
                    onAddEmployee={handleAddEmployeeClick}
                    onBulkUpload={handleBulkUploadClick}
                    selectedToken={selectedCoin}
                    onTokenChange={handleTokenChange}
                />

                <EmployeeTable
                    employees={employees}
                    selectedEmployees={selectedEmployees}
                    toggleEmployeeSelection={toggleEmployeeSelection}
                    usdToToken={usdToToken}
                    exchangeRate={exchangeRate}
                    deleteEmployeeById={(wallet: string) => {
                        setWalletToDelete(wallet);
                        setIsDeleteDialogOpen(true);
                    }}
                    onEditEmployee={handleEditEmployee}
                    handleTransaction={handleTransaction}
                    isLoading={isLoading}
                    selectedToken={selectedCoin}
                />

                <AddEmployeeModal
                    isOpen={showAddModal}
                    onClose={() => {
                        setShowAddModal(false);
                        setSelectedEmployee(null);
                    }}
                    onAddEmployee={handleAddEmployee}
                    onUpdateEmployee={handleUpdateEmployee}
                    editEmployee={selectedEmployee}
                    onUploadSuccess={() => {
                        fetchEmployees();
                        setShowBulkUploadModal(false);
                    }}
                />

                <BulkUploadModal
                    isOpen={showBulkUploadModal}
                    onClose={() => setShowBulkUploadModal(false)}
                    onUploadSuccess={() => {
                        fetchEmployees();
                        setShowBulkUploadModal(false);
                    }}
                />
            </div>
            {/* Delete Confirmation Dialog */}
            {isDeleteDialogOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto dark:bg-black dark:text-white text-black backdrop-blur-sm flex items-center justify-center">
                    <div className="dark:bg-[#1A1F2E] rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border border-gray-700 animate-fade-in">
                        <h3 className="text-xl font-medium dark:text-white mb-4">Confirm Deletion</h3>
                        <p className="dark:text-gray-300 mb-6">
                            Are you sure you want to delete this employee? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setIsDeleteDialogOpen(false);
                                    setWalletToDelete(null);
                                }}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteEmployee}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white transition-colors duration-200"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollSUI;