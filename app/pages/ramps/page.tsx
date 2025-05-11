"use client"
import React, { useState, useEffect } from 'react'
import { RampDock } from '@/components/ramps/RampDock'
import BuyModal from '@/components/ramps/Buy'
import SellModal from '@/components/ramps/Sell'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { Wallet, Receipt, ArrowDownToLine, ArrowUpFromLine, ExternalLink, Eye, X, Home, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { rampApi } from '@/api/rampApi'
import { backendDomain } from '@/lib/network'
import { allMainnetChains } from '@/lib/evm-chains-mainnet'
import Link from 'next/link'

// Define interfaces for order types
interface BaseOrder {
  orderId: string;
  amountToken: number;
  amountFiat: number;
  exchangeRate: number;
  fiatType: string;
  chain: string;
  status: string;
  createdAt: string;
  notes?: string;
  transactionHash?: string;
}

interface BuyOrder extends BaseOrder {
  tokenBought: string;
  paymentReceiptPath?: string;
}

interface SellOrder extends BaseOrder {
  tokenSold: string;
  paymentMethod: string;
  paymentQrPath?: string;
  paymentProofPath?: string;
}

// Define props for ImageModal
interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  orderId: string;
  imagePath: string;
}

// Update the buy/sell modal prop interfaces
interface BuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => Promise<void>;  // Remove optional ?
}

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => Promise<void>;  // Remove optional ?
}

export default function Page() {
  // Modal states
  const [isBuyVisible, setIsBuyVisible] = useState(false)  // Changed from true to false
  const [isSellVisible, setIsSellVisible] = useState(false)

  // Order states with proper typing
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([])
  const [sellOrders, setSellOrders] = useState<SellOrder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [pageIndex, setPageIndex] = useState(1)

  // Tab state
  const [activeTab, setActiveTab] = useState('buy')

  // Modal states for receipt/QR viewing
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [proofModalOpen, setProofModalOpen] = useState(false)
  const [modalImagePath, setModalImagePath] = useState('')
  const [modalTitle, setModalTitle] = useState('')
  const [modalOrderId, setModalOrderId] = useState('')

  // Add mounting state to handle hydration safely
  const [isMounted, setIsMounted] = useState(false)

  // Wallet connection state
  const { address, isConnected } = useAccount()

  // Set mounted state after hydration and fetch orders if connected
  useEffect(() => {
    setIsMounted(true)
    if (isConnected && address) {
      fetchUserOrders()
    }
  }, [isConnected, address])

  // Fetch user's orders
  const fetchUserOrders = async () => {
    if (!address) return

    setIsLoading(true)
    try {
      // Fetch buy orders
      const buyResponse = await rampApi.getUserBuyOrders(address, pageIndex)
      setBuyOrders(buyResponse.data || [])

      // Fetch sell orders
      const sellResponse = await rampApi.getUserSellOrders(address, pageIndex)
      setSellOrders(sellResponse.data || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Modal handlers
  const onShowBuy = () => {
    setIsBuyVisible(true)
    setIsSellVisible(false)
  }

  const onShowSell = () => {
    setIsSellVisible(true)
    setIsBuyVisible(false)
  }

  // Open modal for viewing images with proper typing
  const openImageModal = (imagePath: string, title: string, orderId: string, type: 'receipt' | 'qr' | 'proof') => {
    // If the path doesn't start with http or https, prefix it with backendDomain
    const fullImagePath = imagePath.startsWith('http') ? imagePath : `${backendDomain}${imagePath}`

    setModalImagePath(fullImagePath)
    setModalTitle(title)
    setModalOrderId(orderId)

    if (type === 'receipt') {
      setReceiptModalOpen(true)
    } else if (type === 'qr') {
      setQrModalOpen(true)
    } else if (type === 'proof') {
      setProofModalOpen(true)
    }
  }

  // Format date nicely
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-50 dark:bg-green-900/20'
      case 'pending': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'processing': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
      case 'failed': return 'text-red-500 bg-red-50 dark:bg-red-900/20'
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  // Add helper function to get block explorer URL for a transaction
  const getExplorerUrl = (chain: string, hash?: string) => {
    // Find the chain configuration from our list
    const chainConfig = allMainnetChains.find(c =>
      c.name.toLowerCase() === chain.toLowerCase()
    );

    if (chainConfig && chainConfig.blockExplorers?.default) {
      return `${chainConfig.blockExplorers.default.url}/tx/${hash}`;
    }

    // Fallback to Etherscan if chain not found
    return `https://etherscan.io/tx/${hash}`;
  }

  // Render a placeholder during server rendering and initial hydration
  if (!isMounted) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="animate-pulse rounded-full h-16 w-16 bg-gray-200 dark:bg-gray-800"></div>
      </div>
    )
  }

  // Modal component for images with fixed image display
  const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, title, orderId, imagePath }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="text-sm text-gray-500">Order ID: {orderId}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="mt-2 overflow-hidden rounded-md border border-gray-200 dark:border-gray-800">
              {/* Fix the image display by directly using the imagePath */}
              <img
                src={imagePath}
                alt={title}
                className="max-w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Update the OrderListHeader component
  const OrderListHeader = () => (
    <div className="grid grid-cols-7 gap-6 px-6 py-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Order ID</div>
      <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Amount Token</div>
      <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Amount Fiat</div>
      <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Exchange Rate</div>
      <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Chain</div>
      <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Status</div>
      <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</div>
    </div>
  );

  // Component for Buy Orders List
  const BuyOrdersList = () => (
    <div className="space-y-2">
      <OrderListHeader />
      {isLoading ? (
        <div className="flex justify-center p-10">
          <div className="animate-pulse rounded-full h-10 w-10 bg-gray-200 dark:bg-gray-800"></div>
        </div>
      ) : buyOrders.length === 0 ? (
        <div className="text-center p-10 text-gray-500">
          No buy orders found
        </div>
      ) : (
        buyOrders.map((order) => (
          <div key={order.orderId} className="grid grid-cols-7 gap-6 px-6 py-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{order.orderId}</div>
            <div className="text-lg font-medium">{order.amountToken} {order.tokenBought}</div>
            <div className="text-lg font-medium">{order.amountFiat} {order.fiatType}</div>
            <div className="text-lg font-medium">1 {order.tokenBought} = {order.exchangeRate} {order.fiatType}</div>
            <div>
              <p className="text-lg font-medium">
                {allMainnetChains.find(c => c.name.toLowerCase() === order.chain.toLowerCase())?.name || order.chain}
              </p>
              <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
            </div>
            <div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                {order.status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-end space-x-2 flex-col gap-2">
              {order.paymentReceiptPath && (
                <button
                  onClick={() => openImageModal(order.paymentReceiptPath || '', 'Payment Receipt', order.orderId, 'receipt')}
                  className="w-full py-1.5 px-3 text-sm border border-gray-300 rounded-md hover:bg-purple-500 dark:border-gray-700 dark:hover:bg-purple-500 flex items-center justify-center"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  View Receipt
                </button>
              )}
              {order.transactionHash && (
                <a
                  href={getExplorerUrl(order.chain, order.transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 px-3 text-sm border border-gray-300 rounded-md hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-700 flex items-center justify-center text-blue-500 hover:text-blue-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Hash
                </a>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  // Component for Sell Orders List
  const SellOrdersList = () => (
    <div className="space-y-2">
      <OrderListHeader />
      {isLoading ? (
        <div className="flex justify-center p-10">
          <div className="animate-pulse rounded-full h-10 w-10 bg-gray-200 dark:bg-gray-800"></div>
        </div>
      ) : sellOrders.length === 0 ? (
        <div className="text-center p-10 text-gray-500">
          No sell orders found
        </div>
      ) : (
        sellOrders.map((order) => (
          <div key={order.orderId} className="grid grid-cols-7 gap-6 px-6 py-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{order.orderId}</div>
            <div className="text-lg font-medium">{order.amountToken} {order.tokenSold}</div>
            <div className="text-lg font-medium">{order.amountFiat} {order.fiatType}</div>
            <div className="text-lg font-medium">1 {order.tokenSold} = {order.exchangeRate} {order.fiatType}</div>
            <div>
              <p className="text-lg font-medium">
                {allMainnetChains.find(c => c.name.toLowerCase() === order.chain.toLowerCase())?.name || order.chain}
              </p>
              <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
            </div>
            <div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                {order.status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-end space-x-2 flex-col gap-2">
              {order.paymentQrPath && (
                <button
                  onClick={() => openImageModal(order.paymentQrPath || '', 'Payment QR Code', order.orderId, 'qr')}
                  className="w-full py-1.5 px-3 text-sm border border-gray-300 rounded-md hover:bg-purple-500 dark:border-gray-700 dark:hover:bg-purple-500 flex items-center justify-center"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View QR
                </button>
              )}
              {order.paymentProofPath && (
                <button
                  onClick={() => openImageModal(order.paymentProofPath || '', 'Payment Proof', order.orderId, 'proof')}
                  className="w-full py-1.5 px-3 text-sm border border-gray-300 rounded-md hover:bg-purple-500 dark:border-gray-700 dark:hover:bg-purple-500 flex items-center justify-center"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  View Proof
                </button>
              )}
              {order.transactionHash && (
                <a
                  href={getExplorerUrl(order.chain, order.transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 px-3 text-sm border border-gray-300 rounded-md hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-700 flex items-center justify-center text-blue-500 hover:text-blue-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Hash
                </a>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

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
          <div className="w-full max-w-7xl mb-8"> {/* Changed from max-w-4xl */}
            <h1 className="text-2xl font-bold text-black dark:text-white mb-6">PayZoll Ramp</h1>
            
            {/* Action Buttons Row */}
            <div className="flex justify-between items-center mb-6">
              {/* Left side - Tabs */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('buy')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'buy'
                      ? 'bg-white dark:bg-gray-700 shadow-sm text-black dark:text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Buy Orders
                </button>
                <button
                  onClick={() => setActiveTab('sell')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'sell'
                      ? 'bg-white dark:bg-gray-700 shadow-sm text-black dark:text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Sell Orders
                </button>
              </div>

              {/* Right side - Create Order and Refresh Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchUserOrders}
                  className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Refresh Orders"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
                <button
                  onClick={() => activeTab === 'buy' ? setIsBuyVisible(true) : setIsSellVisible(true)}
                  className="px-4 py-2 bg-blue-600 dark:bg-gray-700 hover:bg-green-500 dark:hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Create {activeTab === 'buy' ? 'Buy' : 'Sell'} Order
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="w-full max-w-7xl flex-1 overflow-hidden"> {/* Changed from max-w-6xl */}
            <div className="bg-transparent rounded-xl overflow-hidden"> {/* Removed background color */}
              {activeTab === 'buy' && <BuyOrdersList />}
              {activeTab === 'sell' && <SellOrdersList />}
            </div>
          </div>

          {/* RampDock at bottom */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
            <RampDock
              onShowBuy={onShowBuy}
              onShowSell={onShowSell}
            />
          </div>
        </div>
      ) : (
        // Not connected state remains the same
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

      {/* Modals remain the same */}
      <ImageModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Payment Receipt"
        orderId={modalOrderId}
        imagePath={modalImagePath}
      />
      <ImageModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Payment QR Code"
        orderId={modalOrderId}
        imagePath={modalImagePath}
      />
      <ImageModal
        isOpen={proofModalOpen}
        onClose={() => setProofModalOpen(false)}
        title="Payment Proof"
        orderId={modalOrderId}
        imagePath={modalImagePath}
      />

      {/* Modals - Only render when mounted and conditions are met */}
      {isMounted && (
        <div className='text-black dark:text-white relative'>
          {isBuyVisible && (
            <BuyModal 
              isOpen={isBuyVisible && isConnected} 
              onClose={() => setIsBuyVisible(false)}
              onComplete={fetchUserOrders}
            />
          )}
          {isSellVisible && (
            <SellModal 
              isOpen={isSellVisible && isConnected} 
              onClose={() => setIsSellVisible(false)}
              onComplete={fetchUserOrders}
            />
          )}
        </div>
      )}
    </div>
  )
}
