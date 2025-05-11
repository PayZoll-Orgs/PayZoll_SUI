"use client";

import React, { useState, useEffect } from "react";
import PaymentsHeader from "@/components/payroll/PaymentHeader";
import ConfigurePayModal from "@/components/payroll/ConfigurePayModal";
import PaymentDashboard from "@/components/payroll/PaymentDashboard";
import AddEmployeeModal from "@/components/payroll/AddEmployeeModal";
import BulkUploadModal from "@/components/payroll/BulkUploadModal";
import { Employee, PayrollData } from "@/lib/interfaces";
import { employerApi } from "@/api/employerApi";
import { payrollApi } from "@/api/payrollApi";
import { toast } from "react-hot-toast";
import { parseUnits } from 'ethers';
import { contractMainnetAddresses as transferContract } from '@/lib/evm-tokens-mainnet';
import { allMainnetChains as chains, NATIVE_ADDRESS } from '@/lib/evm-chains-mainnet';
import { tokensPerMainnetChain as tokens } from '@/lib/evm-tokens-mainnet';
import transferAbi from '@/lib/Transfer.json';
import { erc20Abi } from 'viem';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConfig } from 'wagmi';
import { waitForTransactionReceipt } from "@wagmi/core";
import { useReadContract } from "wagmi";
import useFullPageLoader from "@/hooks/usePageLoader";
import Loader from "@/components/ui/loader";
import { Home } from "lucide-react";
import Link from "next/link";
import { ethers } from 'ethers';

const PaymentsPage: React.FC = () => {
  // Original state
  const [showConfigurePayModal, setShowConfigurePayModal] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState("");
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
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [approvalTxHash, setApprovalTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [showPaymentStatus, setShowPaymentStatus] = useState(false);
  const [selectedChain, setSelectedChain] = useState(chains[0]);
  const [selectedToken, setSelectedToken] = useState(tokens[chains[0].id][0]);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

  // Get transfer contract address for current chain
  const getTransferContract = () => {
    return transferContract[selectedChain.id];
  };
  // Wallet and transaction hooks
  const { address, isConnected, chainId } = useAccount();
  const config = useConfig();
  const { writeContractAsync, isPending: isWritePending, data: wagmiTxHash } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess, isError: isTxError } =
    useWaitForTransactionReceipt({ hash: wagmiTxHash });

  // State for Pharos chain transaction hash
  const [pharosTxHash, setPharosTxHash] = useState<`0x${string}` | undefined>(undefined);


  useEffect(() => {
    if (wagmiTxHash) {
      setTxHash(wagmiTxHash as `0x${string}`);
    } else if (pharosTxHash) {
      setTxHash(pharosTxHash);
    }

  }, [wagmiTxHash, pharosTxHash]);

  // Derived loading state
  const isLoadingDerived = isApproving || isSending || isWritePending || isTxLoading;

  // Ethers-based allowance state
  const [ethersAllowance, setEthersAllowance] = useState<bigint | undefined>(undefined);

  // Wagmi allowance hook
  const { data: wagmiAllowance, refetch: refetchWagmiAllowance } = useReadContract({
    address: selectedToken?.address !== NATIVE_ADDRESS
      ? (selectedToken?.address as `0x${string}`)
      : undefined,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [
      address as `0x${string}`,
      getTransferContract() as `0x${string}`
    ],
    chainId: selectedChain?.id,
    query: {
      enabled: isConnected &&
        !!selectedToken &&
        !!address &&
        selectedToken?.address !== NATIVE_ADDRESS &&
        !!getTransferContract() &&
        selectedChain?.id !== 50002 // Disable for Pharos chain
    }
  });

  // Combined allowance value
  const allowance = selectedChain?.id === 50002 ? ethersAllowance : wagmiAllowance;

  // Override refetchAllowance to work with both methods
  const refetchAllowance = async () => {
    if (selectedChain?.id === 50002) {
      // For Pharos, manually trigger the ethers effect logic
      if (
        isConnected &&
        selectedToken?.address !== NATIVE_ADDRESS &&
        address &&
        window.ethereum
      ) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const tokenContract = new ethers.Contract(
            selectedToken.address,
            erc20Abi,
            provider
          );

          const allowanceResult = await tokenContract.allowance(
            address,
            getTransferContract()
          );

          setEthersAllowance(BigInt(allowanceResult.toString()));
        } catch (error) {
          console.error("Error fetching allowance with ethers:", error);
        }
      }
    } else {
      // For other chains, use the wagmi refetch
      refetchWagmiAllowance();
    }
  };

  useEffect(() => {
    fetchEmployees();

    // Fetch company name
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

    fetchCompanyInfo();
  }, []);

  // Effect to update chain based on connected wallet
  useEffect(() => {
    if (chainId) {
      const chain = chains.find(c => c.id === chainId);
      if (chain) {
        setSelectedChain(chain);

        if (tokens[chain.id]?.length > 0) {
          const matchedToken = selectedTokenSymbol
            ? tokens[chain.id].find(token => token.symbol === selectedTokenSymbol)
            : undefined;
          setSelectedToken(matchedToken || tokens[chain.id][0]);
        }
      }
    }
  }, [chainId, selectedTokenSymbol]);

  // Handle token symbol changes
  useEffect(() => {
    if (selectedTokenSymbol && selectedChain) {
      const chainTokens = tokens[selectedChain.id] || [];
      const matchedToken = chainTokens.find(token => token.symbol === selectedTokenSymbol);

      if (matchedToken) {
        setSelectedToken(matchedToken);
      }
    }
  }, [selectedTokenSymbol, selectedChain]);


  // Monitor Pharos transactions and handle success
  useEffect(() => {
    if (selectedChain?.id === 50002 && txHash && !isSending) {
      // Create a function to check transaction status
      const checkEthersTxStatus = async () => {
        try {
          if (!window.ethereum) return;

          const provider = new ethers.BrowserProvider(window.ethereum);
          const receipt = await provider.getTransactionReceipt(txHash);

          if (receipt && receipt.status === 1) {
            // Transaction confirmed successful
            const employeesPaidCount = selectedEmployees.length;

            // Reset form data after success
            setTimeout(() => {
              setSelectedEmployees([]);

              setTimeout(() => {
                setShowPaymentStatus(false);
                setApprovalTxHash(undefined);
                setTxError('');
                setPharosTxHash(undefined);
              }, 5000);
            }, 2000);

            // Stop checking
            return;
          } else if (receipt && receipt.status === 0) {
            // Transaction failed
            setTxError("Transaction reverted on blockchain");
            setIsSending(false);
            return;
          }

          // If still pending, check again
          setTimeout(checkEthersTxStatus, 3000);
        } catch (error) {
          console.error("Error checking Pharos transaction:", error);
        }
      };

      checkEthersTxStatus();
    }
  }, [selectedChain?.id, txHash, isSending, selectedEmployees.length]);

  // Effect to clear txError after 6 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (txError) {
      timer = setTimeout(() => {
        setTxError(''); // Clear the error
      }, 6000); // 6 seconds
    }
    // Cleanup function to clear the timeout if the component unmounts
    // or if txError changes before the timeout finishes
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [txError]); // Re-run this effect whenever txError changes

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await employerApi.getAllEmployees();
      if (response.status == "success") {
        setEmployees(response.employees || []);
      } else {
        // Handle potential API error responses even if status is not "success"
        throw new Error(response.message || "Failed to fetch employees due to API error.");
      }
    } catch (error: any) {
      console.error("Failed to fetch employees:", error);
      const message = error?.response?.data?.message || error?.message || "An unknown error occurred";
      toast.error(`Failed to load employees: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };


  // Convert USD salary to token amount
  const usdToToken = (usdAmount: string) => {
    return (parseFloat(usdAmount) * exchangeRate).toFixed(6);
  };

  // Calculate total amount needed for selected employees
  const calculateTotalAmount = () => {
    return employees
      .filter(emp => selectedEmployees.includes(emp.wallet))
      .reduce((sum, emp) => sum + parseFloat(emp.salary), 0);
  };

  // Get recipients and amounts for selected employees
  const getRecipientsAndAmounts = () => {
    const selectedEmployeeData = employees.filter(emp => selectedEmployees.includes(emp.wallet));

    return {
      recipients: selectedEmployeeData.map(emp => emp.wallet as `0x${string}`),
      amounts: selectedEmployeeData.map(emp => {
        const tokenAmount = usdToToken(emp.salary);
        return parseUnits(tokenAmount, selectedToken.decimals);
      })
    };
  };

  // Get block explorer URL based on chain
  const getExplorerUrl = (txHash: `0x${string}` | undefined): string => {
    const explorer = selectedChain.blockExplorers?.default?.url;
    if (!explorer) return '#';
    return `${explorer}/tx/${txHash}`;
  };

  // Handle employee selection
  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  // Effect to fetch allowance with ethers when on Pharos chain
  useEffect(() => {
    const checkEthersAllowance = async () => {
      if (
        selectedChain?.id === 50002 &&
        isConnected &&
        selectedToken?.address !== NATIVE_ADDRESS &&
        address &&
        window.ethereum
      ) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const tokenContract = new ethers.Contract(
            selectedToken.address,
            erc20Abi,
            provider
          );

          const allowanceResult = await tokenContract.allowance(
            address,
            getTransferContract()
          );

          setEthersAllowance(BigInt(allowanceResult.toString()));
        } catch (error) {
          console.error("Error fetching allowance with ethers:", error);
          setEthersAllowance(undefined);
        }
      }
    };

    checkEthersAllowance();
  }, [selectedChain?.id, address, selectedToken, isConnected, getTransferContract]);

  useEffect(() => {
    if (
      selectedToken?.address !== NATIVE_ADDRESS &&
      allowance !== undefined &&
      selectedEmployees.length > 0
    ) {
      try {
        const totalAmount = calculateTotalAmount();
        const parsedAmount = parseUnits(usdToToken(totalAmount.toString()), selectedToken.decimals);
        setNeedsApproval(allowance < parsedAmount);
      } catch (e) {
        // Invalid amount format, ignore
      }
    } else {
      setNeedsApproval(false);
    }
  }, [allowance, selectedEmployees, selectedToken]);

  // Force refetch allowance when token changes
  useEffect(() => {
    if (isConnected && selectedToken && address && selectedToken?.address !== NATIVE_ADDRESS) {
      refetchAllowance();
    }
  }, [selectedToken?.address, selectedChain?.id, refetchAllowance, isConnected, address, selectedToken]);

  // Check if all employees are selected
  const allEmployeesSelected = selectedEmployees.length === employees.length;

  // Toggle all employees selection
  const toggleAllEmployees = () => {
    if (allEmployeesSelected) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.wallet));
    }
  };

  // Helper function to send transaction after approval
  const sendTransactionAfterApproval = async (
    transferContractAddress: string,
    recipients: `0x${string}`[],
    amounts: bigint[],
    totalAmount: bigint
  ) => {
    setIsSending(true);
    console.log('Sending final transaction...');

    try {
      // For native token transfers
      if (selectedToken.address === NATIVE_ADDRESS) {
        console.log('Sending native token transfer');
        const finalTxHash = await writeContractAsync({
          address: transferContractAddress as `0x${string}`,
          abi: transferAbi.abi,
          functionName: 'bulkTransfer',
          args: [
            NATIVE_ADDRESS, // Native token
            recipients,
            amounts
          ],
          value: totalAmount,
          gas: BigInt(400000),
          chainId: selectedChain.id
        });

        // Set the state and log immediately with the correct hash
        setTxHash(finalTxHash);
        await logPayrollTransaction(finalTxHash);
      } else {
        // For ERC20 token transfers
        console.log('Sending ERC20 token transfer');
        const finalTxHash = await writeContractAsync({
          address: transferContractAddress as `0x${string}`,
          abi: transferAbi.abi,
          functionName: 'bulkTransfer',
          args: [
            selectedToken.address as `0x${string}`,
            recipients,
            amounts
          ],
          gas: BigInt(400000),
          chainId: selectedChain.id
        });

        // Set the state and log immediately with the correct hash
        setTxHash(finalTxHash);
        await logPayrollTransaction(finalTxHash);
      }
      console.log('Transaction sent successfully');
    } catch (error) {
      console.error('Error in sendTransactionAfterApproval:', error);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  // Log payroll transaction to backend
  const logPayrollTransaction = async (transactionHash: `0x${string}`) => {
    console.log('Logging payroll transaction with hash:', transactionHash);

    if (!transactionHash) {
      console.error("Missing transaction hash");
      return;
    }

    if (!companyName) {
      console.error("Missing company name");
      return;
    }

    try {
      const selectedEmployeeData = employees.filter(emp => selectedEmployees.includes(emp.wallet));
      const totalUsdAmount = selectedEmployeeData.reduce(
        (sum, emp) => sum + parseFloat(emp.salary), 0
      ).toFixed(2);

      const employeePayments = selectedEmployeeData.map(emp => ({
        wallet: emp.wallet,
        amount: emp.salary
      }));

      const payrollData: PayrollData = {
        company: companyName,
        employees: employeePayments,
        totalAmount: totalUsdAmount,
        tokenSymbol: selectedToken.symbol,
        transactionHash: transactionHash,
        chain: selectedChain.name
      };

      const response = await payrollApi.addPayroll(payrollData);

      if (response.status === "success") {
        toast.success("Payroll record saved successfully");
        setTxHash(undefined);
        setPharosTxHash(undefined);
        setApprovalTxHash(undefined);

      } else {
        toast.error("Failed to save payroll record");
      }
    } catch (error) {
      console.error("Error logging payroll transaction:", error);
      toast.error("Failed to save payroll record");
    }
  };

  // Main transaction handling function
  const handleTransaction = async () => {
    setTxError(''); // Clear previous errors immediately on new attempt
    setShowPaymentStatus(true);

    if (selectedEmployees.length === 0) {
      setTxError('Please select at least one employee to pay');
      return;
    }

    try {
      const transferContractAddress = getTransferContract();

      if (!transferContractAddress) {
        setTxError('No transfer contract available for this network');
        return;
      }

      const { recipients, amounts } = getRecipientsAndAmounts();
      const totalAmount = amounts.reduce((sum, amount) => sum + amount, BigInt(0));

      // For Pharos chain (ID 50002), use ethers.js instead of wagmi
      if (selectedChain?.id === 50002) {
        try {
          // Get provider from window.ethereum
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();

          // For ERC20 tokens that need approval on Pharos
          if (selectedToken.address !== NATIVE_ADDRESS && needsApproval) {
            setIsApproving(true);

            // Create contract instance for the token
            const tokenContract = new ethers.Contract(
              selectedToken.address,
              erc20Abi,
              signer
            );

            // Send approval transaction
            try {
              const approvalTx = await tokenContract.approve(
                transferContractAddress,
                totalAmount,
                { gasLimit: 400000 }
              );
              setApprovalTxHash(approvalTx.hash as `0x${string}`);

              // Wait for approval transaction to be mined
              const approvalReceipt = await provider.waitForTransaction(approvalTx.hash);

              if (approvalReceipt?.status !== 1) {
                throw new Error('Approval transaction failed');
              }

              setIsApproving(false);
              await refetchAllowance();
            } catch (error: any) {
              setIsApproving(false);
              setTxError(error.message || 'Approval failed');
              return;
            }
          }

          // Create contract instance for transfer contract
          const contract = new ethers.Contract(
            transferContractAddress,
            transferAbi.abi,
            signer
          );

          setIsSending(true);

          try {
            // Execute the transaction based on token type
            const tx = selectedToken.address === NATIVE_ADDRESS
              ? await contract.bulkTransfer(
                NATIVE_ADDRESS,
                recipients,
                amounts,
                { value: totalAmount, gasLimit: 400000 }
              )
              : await contract.bulkTransfer(
                selectedToken.address as `0x${string}`,
                recipients,
                amounts,
                { gasLimit: 400000 }
              );

            // Set the transaction hash and log immediately with the correct hash
            const txHash = tx.hash as `0x${string}`;
            setPharosTxHash(txHash);
            setTxHash(txHash);
            await logPayrollTransaction(txHash);
          } catch (error: any) {
            console.error('Ethers transaction error:', error);
            setTxError(error.message || 'Transaction failed');
          } finally {
            setIsSending(false);
          }
        } catch (error: any) {
          console.error('Ethers setup error:', error);
          setIsSending(false);
          setTxError(error.message || 'Transaction failed');
        }
      } else {
        // Original wagmi implementation for other chains
        // For ERC20 tokens that need approval
        if (selectedToken.address !== NATIVE_ADDRESS && needsApproval) {
          setIsApproving(true);

          try {
            const approvalHash = await writeContractAsync({
              address: selectedToken.address as `0x${string}`,
              abi: erc20Abi,
              functionName: 'approve',
              args: [transferContractAddress as `0x${string}`, totalAmount],
              chainId: selectedChain.id,
              gas: BigInt(400000)
            });

            setApprovalTxHash(approvalHash);

            const approvalReceipt = await waitForTransactionReceipt(config, {
              chainId: selectedChain.id,
              hash: approvalHash
            });

            if (approvalReceipt.status !== 'success') {
              throw new Error('Approval transaction failed');
            }

            setIsApproving(false);
            await sendTransactionAfterApproval(transferContractAddress, recipients, amounts, totalAmount);

            // Log transaction after it's complete (for non-Pharos)
            await logPayrollTransaction(approvalHash);
          } catch (error: any) {
            setIsApproving(false);
            setTxError(error.message || 'Approval failed');
            return;
          }
        } else {
          await sendTransactionAfterApproval(transferContractAddress, recipients, amounts, totalAmount);

          // Log transaction after it's complete (for non-Pharos)
          await logPayrollTransaction(txHash as `0x${string}`);
        }
      }
    } catch (error: any) {
      setIsSending(false);
      setTxError(error.message || 'Transaction failed');
    }
  };

  // Handler functions
  const handleAddEmployeeClick = () => {
    setSelectedEmployee(null);
    setShowAddModal(true);
  };

  const handleBulkUploadClick = () => {
    setShowBulkUploadModal(true);
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

  // Handle exchange rate updates from the modal
  const handleExchangeRateUpdate = (rate: number, tokenSymbol: string) => {
    setExchangeRate(rate);
    setSelectedTokenSymbol(tokenSymbol);
  };

  const hasTransactionActivity = isLoadingDerived || isTxSuccess || isTxError || !!txError || !!approvalTxHash || !!txHash;

  return (
    <div className="relative h-screen w-screen dark:text-white text-black p-6 z-10">
      <div className="absolute top-4 left-4">
        <Link href="/">
          <Home className="text-black dark:hover:text-gray-200 hover:text-gray-800 dark:text-white" size={30} />
        </Link>
      </div>
      <div className="flex flex-col max-w-screen max-h-screen items-center m-10">
        <PaymentsHeader
          onConfigurePayments={() => setShowConfigurePayModal(true)}
          onAddEmployee={handleAddEmployeeClick}
          onBulkUpload={handleBulkUploadClick} />

        <PaymentDashboard
          exchangeRate={exchangeRate}
          selectedTokenSymbol={selectedTokenSymbol}
          employees={employees}
          isConnected={isConnected}
          selectedEmployees={selectedEmployees}
          toggleEmployeeSelection={toggleEmployeeSelection}
          toggleAllEmployees={toggleAllEmployees}
          allEmployeesSelected={allEmployeesSelected}
          handleTransaction={handleTransaction}
          usdToToken={usdToToken}
          isLoadingDerived={isLoadingDerived}
          needsApproval={needsApproval}
          isApproving={isApproving}
          isSending={isSending}
          isWritePending={isWritePending}
          isTxLoading={isTxLoading}
          isTxSuccess={isTxSuccess}
          isTxError={isTxError}
          txHash={txHash}
          txError={txError}
          approvalTxHash={approvalTxHash}
          showPaymentStatus={showPaymentStatus}
          hasTransactionActivity={hasTransactionActivity}
          getExplorerUrl={getExplorerUrl}
          selectedToken={selectedToken}
          handleAddEmployeeClick={handleAddEmployeeClick}
          handleEditEmployee={handleEditEmployee}
          deleteEmployeeById={(wallet: string) => {
            setWalletToDelete(wallet);
            setIsDeleteDialogOpen(true);
          }}
          selectedChain={selectedChain}
          handleAutoClose={() => {
            setShowPaymentStatus(false);
            setApprovalTxHash(undefined);
            setTxError('');
            setPharosTxHash(undefined);
            setTxHash(undefined);
            setSelectedEmployees([]);
          }}
        />

        <ConfigurePayModal
          isOpen={showConfigurePayModal}
          onClose={() => setShowConfigurePayModal(false)}
          onExchangeRateUpdate={handleExchangeRateUpdate}
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
    </div>
  );
};

const PaymentPage = useFullPageLoader(
  PaymentsPage, <Loader />
);

export default PaymentPage;