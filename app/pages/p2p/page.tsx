"use client"
import React, { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWriteContract } from 'wagmi'
import { Wallet, Send, Download, X, Home, Copy, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { parseEther } from 'viem'
import { ethers } from 'ethers'
import { toast } from 'react-toastify'
import { contractABI } from '@/lib/p2p/abi'
import { CardSpotlight } from '@/components/ui/cardSpotlight'

// Contract config
const CONTRACT_ADDRESS = '0x12222cFEBD32d6FE926D3525C4d0de9BCEEAf802' as const

// Interface for modal props
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface P2PTransaction {
  id: string;
  paymentId: string;
  action: 'send' | 'receive';
  address: string;
  amount: number;
  createdAt: string;
  status: 'pending' | 'completed' | 'reimbursed';
}

type AccountPayment = {
	id: `0x${string}`;
	payer: `0x${string}`;
	payee: `0x${string}`;
	value: bigint;
	createdAt: bigint;
	status: number;
}; // [id,payer, payee, value, createdAt, status]

// Update the OrderListHeader component
const OrderListHeader = () => (
  <div className="grid grid-cols-7 gap-6 px-6 py-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-transparent backdrop-blur-sm">
    <div className="text-sm font-semibold text-gray-600 dark:text-gray-300"></div>
    <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Address</div>
    <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Amount</div>
    <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Payment ID</div>
    <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Created At</div>
    <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Status</div>
    <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</div>
  </div>
);

export default function Page() {
	
  // States
  const [isSendVisible, setSendVisible] = useState(false)
  const [isClaimVisible, setClaimVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [transactions, setTransactions] = useState<P2PTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [username, setUsername] = useState<string>("")
  const [isUsernameModalVisible, setUsernameModalVisible] = useState(false)
  
  // Wallet connection
  const { address, isConnected } = useAccount()

  const { writeContractAsync } = useWriteContract()

  // Keep fetchPayments as the main data fetching method
  const fetchPayments = async (address: string) => {
    try {
      if (!window.ethereum) {
        throw new Error('No ethereum provider found')
      }
  
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI,
        provider
      )
  
      // Get payments from contract
      let payments
      try {
        payments = await contract.getAccountPayments(address)
        console.log('Raw payments from ethers:', payments)
      } catch (error) {
        console.error('Error getting account payments:', error)
        return []
      }
  
      // Map through the payments with error handling for each payment
      const formattedPayments = payments.map((payment: any) => {
        try {
          return {
            id: payment.id.toString(), // Use the ID from the payment struct
            paymentId: payment.id, // Store the bytes32 ID for reimburse function
            action: payment.payer.toLowerCase() === address.toLowerCase() ? 'send' as const : 'receive' as const,
            address: payment.payer.toLowerCase() === address.toLowerCase() ? payment.payee : payment.payer,
            amount: Number(ethers.formatEther(payment.value.toString())),
            createdAt: new Date(Number(payment.createdAt) * 1000).toISOString(),
            status: ['pending', 'completed', 'reimbursed'][Number(payment.status)] as 'pending' | 'completed' | 'reimbursed'
          }
        } catch (error) {
          console.error('Error processing payment:', error)
          return null
        }
      })
  
      // Filter out any null values and return
      const validPayments = formattedPayments.filter(Boolean)
      console.log('Formatted payments:', validPayments)
      return validPayments.reverse()
    } catch (error) {
      console.error('Error in fetchPayments:', error)
      toast.error('Failed to fetch payments')
      return []
    }
  }

  // Add function to fetch username
  const fetchUsername = async (address: string) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI,
        provider
      )
      
      const nickname = await contract.getNicknameByAddress(address)
      console.log('Fetched nickname:', nickname)
      setUsername(nickname)
    } catch (error) {
      console.error('Error fetching nickname:', error)
      setUsername("")
    }
  }

  // Modify the useEffect to only use fetchPayments
  useEffect(() => {
    const getPayments = async () => {
      if (!address) return
      
      console.log('Fetching payments for:', address)
      const payments = await fetchPayments(address)
      await fetchUsername(address)
      console.log('Fetched payments:', payments)
      setTransactions(payments)
    }

    getPayments()
  }, [address, refreshTrigger])

  // Add useEffect to fetch username on mount and address change
  useEffect(() => {
    if (address) {
      fetchUsername(address)
      fetchPayments(address)
    }
  }, [address])

  // Handle sending payment
  const handleSend = async (recipient: string, value: string) => {
    try {
      setIsLoading(true)
      // Generate a random bytes32 value
      const randomBytes = new Uint8Array(32)
      crypto.getRandomValues(randomBytes)
      const bytesPaymentId = '0x' + Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      
      // Check if recipient is an address or username
      const isAddress = recipient.startsWith('0x') && recipient.length === 42
      
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractABI,
        functionName: isAddress ? 'transferToAddress' : 'transferToNickname',
        args: [
          bytesPaymentId as `0x${string}`,
          isAddress ? recipient as `0x${string}` : recipient
        ],
        value: parseEther(value),
        gas: BigInt(400000)
      })
      
      setSendVisible(false)
      setRefreshTrigger(prev => prev + 1)
      toast.success('Payment sent successfully')
    } catch (error) {
      console.error(error)
      toast.error('Transaction failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle claiming payment 
  const handleClaim = async (input: string) => {
    try {
      setIsLoading(true)

      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractABI,
        functionName: 'claimPayments',
        args: [input],
        gas: BigInt(400000) // Add gas limit
      })

      setClaimVisible(false)
      setRefreshTrigger(prev => prev + 1) // Trigger refresh
      toast.success('Payment claimed successfully')
    } catch (error) {
      console.error(error)
      toast.error('Claim failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Add a new handleReimburse function
  const handleReimburse = async (paymentId: string) => {
    try {
      setIsLoading(true)
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractABI,
        functionName: 'reimbursePayment',
        args: [paymentId as `0x${string}`],
        gas: BigInt(400000)
      })
      setRefreshTrigger(prev => prev + 1)
      toast.success('Payment reimbursed successfully')
    } catch (error) {
      console.error(error)
      toast.error('Reimbursement failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Add function to handle username creation
  const handleCreateUsername = async (nickname: string) => {
    try {
      setIsLoading(true)
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractABI,
        functionName: 'createNickname',
        args: [nickname],
        gas: BigInt(400000)
      })
      setUsernameModalVisible(false)
      toast.success('Username created successfully')
      // Refresh username
      if (address) await fetchUsername(address)
      
    } catch (error) {
      console.error(error)
      toast.error('Failed to create username')
    } finally {
      setIsLoading(false)
    }
  }

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Send Modal Component
  const SendModal: React.FC<ModalProps & {
    onSubmit: (recipient: string, amount: string) => Promise<void>,
    isLoading: boolean
  }> = ({ isOpen, onClose, onSubmit, isLoading }) => {
    const [recipient, setRecipient] = useState('')
    const [amount, setAmount] = useState('')
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onSubmit(recipient, amount)
    }
  
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md mx-4 my-8"
            >
              <CardSpotlight className="overflow-hidden">
				<div className="relative">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Send Payment</h3>
                  <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Network</label>
                    <input 
                      type="text" 
                      value="Pharos Network" 
                      disabled 
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Wallet</label>
                    <input type="text" value={address} disabled className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipient Address or Username</label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white py-2 px-4 rounded-md font-medium transition-colors"
                  >
                    {isLoading ? 'Sending...' : 'Send'}
                  </button>
                </form>
				</div>
              </CardSpotlight>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    )
  }

  // Claim Modal Component
  const ClaimModal: React.FC<ModalProps & {
    onSubmit: (input: string) => Promise<void>,
    isLoading: boolean
  }> = ({ isOpen, onClose, onSubmit, isLoading }) => {
    const [input, setInput] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onSubmit(input)
    }

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md mx-4 my-8"
            >
              <CardSpotlight className="overflow-hidden">
				<div className="relative">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Claim Payment</h3>
                  <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Network</label>
                    <input 
                      type="text" 
                      value="Pharos Network" 
                      disabled 
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Wallet</label>
                    <input type="text" value={address} disabled className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sender Address, Username, or Transfer ID</label>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white py-2 px-4 rounded-md font-medium transition-colors"
                  >
                    {isLoading ? 'Claiming...' : 'Claim'}
                  </button>
                </form>
				</div>
              </CardSpotlight>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    )
  }

  // Username Modal Component
  const UsernameModal: React.FC<ModalProps & {
    onSubmit: (username: string) => Promise<void>,
    isLoading: boolean
  }> = ({ isOpen, onClose, onSubmit, isLoading }) => {
    const [input, setInput] = useState('')
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onSubmit(input)
    }
  
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md mx-4"
            >
              <CardSpotlight className="overflow-hidden">
                <div className="relative">
				<div className=""></div>
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create Username</h3>
                  <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="Enter your username"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white py-2 px-4 rounded-md font-medium transition-colors"
                  >
                    {isLoading ? 'Creating...' : 'Create Username'}
                  </button>
                </form>
                </div>
              </CardSpotlight>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    )
  }

  // Render loading state during hydration
  if (!isMounted) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="animate-pulse rounded-full h-16 w-16 bg-gray-200 dark:bg-gray-800"></div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-screen dark:text-white text-black p-6 z-10">
      {/* Home button */}
      <div className="absolute top-4 left-4">
        <Link href="/">
          <Home className="text-black dark:hover:text-gray-200 hover:text-gray-800 dark:text-white" size={30} />
        </Link>
      </div>

      {isConnected ? (
        <div className="flex flex-col max-w-screen max-h-screen items-center m-10">
          {/* Header Section */}
          <div className="w-full max-w-7xl mb-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-black dark:text-white">PayZoll Secure Pay</h1>
              <div className="flex items-center space-x-4">
                {username ? (
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    @{username}
                  </span>
                ) : (
                  <button
                    onClick={() => setUsernameModalVisible(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Create Username
                  </button>
                )}
              </div>
            </div>
            
            {/* Action Buttons Row */}
            <div className="flex justify-between items-center mb-6">
              {/* Left side - Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setSendVisible(true)}
                  className="px-6 py-3 bg-blue-600 dark:bg-gray-700 hover:bg-green-500 dark:hover:bg-green-500 text-white rounded-lg font-medium transition-colors flex items-center"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Send
                </button>
                <button
                  onClick={() => setClaimVisible(true)}
                  className="px-6 py-3 bg-blue-600 dark:bg-gray-700 hover:bg-green-500 dark:hover:bg-green-500 text-white rounded-lg font-medium transition-colors flex items-center"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Claim
                </button>
              </div>

              {/* Right side - Refresh Button */}
              <button
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Refresh Transactions"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Transaction History Section */}
          <div className="w-full max-w-7xl flex-1 overflow-hidden mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Transaction History</h2>
            </div>
            <div className="bg-transparent rounded-xl overflow-hidden">
              <OrderListHeader />
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactions?.length > 0 ? (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="grid grid-cols-7 gap-6 px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center">
                        {tx.action === 'send' ? (
                          <Send className="h-4 w-4 text-red-500 mr-2" />
                        ) : (
                          <Download className="h-4 w-4 text-green-500 mr-2" />
                        )}
                        <span className="text-gray-900 dark:text-gray-100 text-lg">
                          {tx.action === 'send' ? 'Sent' : 'Received'}
                        </span>
                      </div>
                      <div className="text-gray-900 dark:text-gray-100 text-lg">
                        {tx.address.substring(0, 6)}...{tx.address.substring(tx.address.length - 4)}
                      </div>
                      <div className="text-gray-900 dark:text-gray-100 text-lg">
                        {tx.amount} ETH
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-900 dark:text-gray-100 text-lg">
                          {tx.paymentId ? 
                            `${tx.paymentId.substring(0, 6)}...${tx.paymentId.substring(tx.paymentId.length - 4)}` : 
                            'N/A'
                          }
                        </span>
                        {tx.paymentId && (
                          <button
                            onClick={() => navigator.clipboard.writeText(tx.paymentId)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            <Copy className="h-4 w-4 text-gray-500" />
                          </button>
                        )}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-lg">
                        {new Date(tx.createdAt).toLocaleString()}
                      </div>
                      <div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          tx.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </span>
                      </div>
                      <div>
                        {tx.status === 'pending' && tx.action === 'send' && (
                          <button
                            onClick={() => handleReimburse(tx.paymentId)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                            disabled={isLoading}
                          >
                            Reimburse
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-lg">
                    No transactions found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-screen h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col relative items-center text-center space-y-6"
          >
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Wallet className="w-8 h-8 text-blue-600 dark:text-blue-300" />
            </div>

            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-black dark:text-white">
                Connect Your Wallet
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base max-w-sm mx-auto">
                Connect your wallet to access payment features and manage your tokens.
              </p>
            </div>

            <div className="w-full mx-auto pt-2 items-center flex justify-center">
              <ConnectButton />
            </div>
          </motion.div>
        </div>
      )}

      {/* Modals */}
      <SendModal isOpen={isSendVisible} onClose={() => setSendVisible(false)} onSubmit={handleSend} isLoading={isLoading} />
      <ClaimModal isOpen={isClaimVisible} onClose={() => setClaimVisible(false)} onSubmit={handleClaim} isLoading={isLoading} />
      <UsernameModal 
        isOpen={isUsernameModalVisible} 
        onClose={() => setUsernameModalVisible(false)} 
        onSubmit={handleCreateUsername}
        isLoading={isLoading}
      />
    </div>
  )
}
