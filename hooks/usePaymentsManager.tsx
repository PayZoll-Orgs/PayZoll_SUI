"use client"

import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { toast } from 'react-hot-toast';
import {
    useCurrentAccount,
    useSignAndExecuteTransaction,
    useSuiClient
} from '@mysten/dapp-kit';
import { useNetwork } from '@/context/networkContext';
import { SuiToken } from '@/lib/sui-tokens';
import { walrusApi } from '@/api/walrusApi'; // Import the walrusApi

// Constants for the contract - make these network-aware
const CONTRACT_ADDRESSES = {
    devnet: '0x5a9a6c0db570d796c0369cefc05a184fcd24541afa8986e392e6890a3472832d',
    testnet: '0x5a9a6c0db570d796c0369cefc05a184fcd24541afa8986e392e6890a3472832d',
    mainnet: '0xe48836adecb638703f5444b2d26fefb729c967c9455334867c3f25a6edc7e610'
};

const MODULE_NAME = 'securetransfer';

export function usePaymentsManager(selectedToken: SuiToken | undefined) {
    // Modern Sui hooks replacing useWalletKit
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    // Network context to determine which contract address to use
    const { currentNetwork } = useNetwork?.() || { currentNetwork: 'testnet' };

    // Get the correct contract address based on network
    const PACKAGE_ID = CONTRACT_ADDRESSES[currentNetwork] || CONTRACT_ADDRESSES.testnet;

    const [coinObjects, setCoinObjects] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [resultMessage, setResultMessage] = useState({ type: '', message: '' });

    const fetchUserCoins = useCallback(async () => {
        if (!currentAccount) return;

        try {
            // Use the selected token's address to fetch the correct coin type
            const coinType = selectedToken?.address || '0x2::sui::SUI';

            const coins = await suiClient.getCoins({
                owner: currentAccount.address,
                coinType: coinType
            });
            setCoinObjects(coins.data);
        } catch (error) {
            console.error('Error fetching coins:', error);
            toast.error(`Failed to fetch your ${selectedToken?.symbol || 'SUI'} coins`);
        }
    }, [currentAccount, selectedToken, suiClient]);

    // Execute payment action (claim or reimburse)
    const executePaymentAction = async (paymentObjectId: string, action: 'claim' | 'reimburse') => {
        if (!paymentObjectId) {
            setResultMessage({
                type: 'error',
                message: 'Please enter a payment object ID'
            });
            return;
        }

        // Check if we know this payment isn't actionable
        const payment = payments.find(p => p.parsedJson.payment_object_id === paymentObjectId);
        if (payment && payment.parsedJson.statusInfo?.status !== 'SENT') {
            setResultMessage({
                type: 'error',
                message: `This payment cannot be ${action}ed because it has status: ${payment.parsedJson.statusInfo?.status}`
            });
            toast.error(`Payment is not in a ${action}able state`);
            return;
        }

        setIsLoading(true);
        setResultMessage({ type: 'info', message: 'Preparing transaction...' });

        try {
            const tx = new Transaction();
            tx.setGasBudget(5000000); // 5M gas units

            // Call the contract's function based on action type
            tx.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::${action}`,
                arguments: [tx.object(paymentObjectId)],
            });

            // Execute the transaction
            signAndExecuteTransaction(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        // Transaction was sent, but we need to verify its status
                        setResultMessage({ type: 'info', message: 'Transaction sent. Checking status...' });

                        try {
                            // Wait for transaction to be processed
                            await new Promise(resolve => setTimeout(resolve, 2000));

                            // Get the transaction status
                            const txBlock = await suiClient.getTransactionBlock({
                                digest: result.digest,
                                options: { showEffects: true }
                            });

                            const isSuccess = txBlock.effects?.status?.status === 'success';

                            if (isSuccess) {
                                const actionPastTense = action === 'claim' ? 'claimed' : 'reimbursed';
                                setResultMessage({
                                    type: 'success',
                                    message: `Payment ${actionPastTense}! Transaction digest: ${result.digest}`
                                });
                                toast.success(`Payment ${actionPastTense} successfully!`);
                                
                                // Find the payment details in our existing payments array
                                const payment = payments.find(p => p.parsedJson.payment_object_id === paymentObjectId);
                                
                                if (payment) {
                                    // Store the payment action record in Walrus
                                    try {
                                        await walrusApi.storePaymentRecord(
                                            action,
                                            payment.parsedJson.payment_id || 'unknown',
                                            paymentObjectId,
                                            payment.parsedJson.from,
                                            payment.parsedJson.to,
                                            Number(payment.parsedJson.amount) / 1_000_000_000, // Convert MIST to SUI
                                            result.digest
                                        );
                                        console.log(`Payment ${action} record stored in blockchain`);
                                    } catch (walrusError) {
                                        console.error(`Failed to store payment ${action} record:`, walrusError);
                                    }
                                }

                                // Refresh data
                                fetchPayments();
                                fetchUserCoins();
                            } else {
                                const errorMsg = txBlock.effects?.status?.error || 'Transaction execution failed';
                                const actionNoun = action === 'claim' ? 'Claim' : 'Reimbursement';
                                setResultMessage({
                                    type: 'error',
                                    message: `${actionNoun} failed: ${errorMsg}`
                                });
                                toast.error(`Failed to ${action} payment: ${errorMsg}`);
                            }
                        } catch (statusError:any) {
                            console.error('Error checking transaction status:', statusError);
                            setResultMessage({
                                type: 'error',
                                message: `Unable to verify transaction status: ${statusError.message}`
                            });
                        } finally {
                            setIsLoading(false);
                        }
                    },
                    onError: (error) => {
                        console.error('Transaction submission failed:', error);
                        setResultMessage({
                            type: 'error',
                            message: `Failed to submit transaction: ${error.message}`
                        });
                        toast.error(`Transaction error: ${error.message}`);
                        setIsLoading(false);
                    }
                }
            );
        } catch (error:any) {
            console.error('Transaction preparation failed:', error);
            setResultMessage({
                type: 'error',
                message: `Failed to prepare transaction: ${error.message}`
            });
            toast.error(`Error: ${error.message}`);
            setIsLoading(false);
        }
    };

    const fetchPayments = useCallback(async () => {
        if (!currentAccount) return;

        try {
            setIsLoading(true);

            // Create a map to track payment statuses
            const paymentStatusMap = new Map();

            // Fetch sent payments
            const sentEvents = await suiClient.queryEvents({
                query: {
                    MoveEventType: `${PACKAGE_ID}::${MODULE_NAME}::PaymentSent`
                },
                limit: 50
            });

            // Fetch claimed payments
            const claimedEvents = await suiClient.queryEvents({
                query: {
                    MoveEventType: `${PACKAGE_ID}::${MODULE_NAME}::PaymentClaimed`
                },
                limit: 50
            });

            // Fetch reimbursed payments
            const reimbursedEvents = await suiClient.queryEvents({
                query: {
                    MoveEventType: `${PACKAGE_ID}::${MODULE_NAME}::PaymentReimbursed`
                },
                limit: 50
            });

            // Process all payment events and update their statuses
            claimedEvents.data.forEach(event => {
                const fields:any = event.parsedJson;
                paymentStatusMap.set(fields.payment_object_id, {
                    status: 'CLAIMED',
                    timestamp: new Date(event.timestampMs ?? Date.now()).toLocaleString(),
                    by: fields.by
                });
            });

            reimbursedEvents.data.forEach(event => {
                const fields:any = event.parsedJson;
                paymentStatusMap.set(fields.payment_object_id, {
                    status: 'REIMBURSED',
                    timestamp: new Date(event.timestampMs ?? Date.now()).toLocaleString(),
                    by: fields.by
                });
            });

            // Filter payments relevant to current user (sent to or from)
            const userPayments = sentEvents.data
                .filter(event => {
                    const fields:any = event.parsedJson;
                    return fields.from === currentAccount.address || fields.to === currentAccount.address;
                })
                .map(event => {
                    const fields:any = event.parsedJson;
                    const paymentStatus = paymentStatusMap.get(fields.payment_object_id) || {
                        status: 'SENT',
                        timestamp: new Date(event.timestampMs ?? Date.now()).toLocaleString()
                    };

                    // Try to update the payment record in Walrus if this is a new payment
                    if (fields.payment_id && fields.payment_object_id) {
                        const paymentKey = `payment_sent_${fields.payment_id}`;
                        
                        // Load recorded payments from localStorage
                        const existingPayments = localStorage.getItem('walrus_recorded_payments') || '{}';
                        const recordedPayments = JSON.parse(existingPayments);
                        
                        // Check if we've already recorded this payment but need to update its object ID
                        if (recordedPayments[paymentKey] && !recordedPayments[`${paymentKey}_with_object_id`]) {
                            try {
                                // Try to update payment object ID in Walrus
                                walrusApi.updatePaymentObjectId(
                                    fields.payment_id,
                                    fields.payment_object_id
                                );
                                
                                // Mark this payment as fully recorded with object ID
                                recordedPayments[`${paymentKey}_with_object_id`] = true;
                                localStorage.setItem('walrus_recorded_payments', JSON.stringify(recordedPayments));
                            } catch (error) {
                                console.warn('Failed to update payment object ID in blockchain:', error);
                            }
                        }
                    }

                    return {
                        ...event,
                        parsedJson: {
                            ...fields,
                            statusInfo: paymentStatus
                        }
                    };
                });

            setPayments(userPayments);
        } catch (error) {
            console.error('Error fetching payments:', error);
            toast.error('Failed to fetch payment history');
        } finally {
            setIsLoading(false);
        }
    }, [currentAccount, suiClient, PACKAGE_ID]);

    const sendPayment = async (paymentId: string, payeeAddress: string, amount: string) => {
        setIsLoading(true);
        setResultMessage({ type: '', message: '' });

        if (!paymentId || !payeeAddress || !amount) {
            setResultMessage({
                type: 'error',
                message: 'Please fill all required fields'
            });
            setIsLoading(false);
            return;
        }

        // Validate amount
        const amountValue = parseFloat(amount);
        if (isNaN(amountValue) || amountValue <= 0) {
            setResultMessage({
                type: 'error',
                message: 'Please enter a valid amount greater than zero'
            });
            setIsLoading(false);
            return;
        }

        // Convert amount to MIST (1 SUI = 10^9 MIST)
        const amountInMist = Math.floor(amountValue * 1_000_000_000);

        // Find the coin with the largest balance
        if (coinObjects.length === 0) {
            setResultMessage({
                type: 'error',
                message: 'No coins found in wallet'
            });
            setIsLoading(false);
            return;
        }

        // Sort coins by balance (descending) and take the largest one
        const sortedCoins = [...coinObjects].sort((a, b) =>
            Number(b.balance) - Number(a.balance)
        );
        const largestCoin = sortedCoins[0];

        // Check if the largest coin has sufficient balance
        if (Number(largestCoin.balance) < amountInMist) {
            setResultMessage({
                type: 'error',
                message: `Insufficient balance. Needed: ${amountValue} SUI, Available: ${Number(largestCoin.balance) / 1_000_000_000} SUI`
            });
            setIsLoading(false);
            return;
        }

        try {
            // Create a new transaction
            const tx = new Transaction();

            // Set gas budget (automatically uses largest coin for gas)
            tx.setGasBudget(10000000);

            // Convert payment ID to bytes
            const paymentIdBytes = Array.from(new TextEncoder().encode(paymentId));

            // Convert amount to BigInt for the transaction
            const amountInMistBigInt = BigInt(amountInMist);

            // Split the largest coin to get exact payment amount
            const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMistBigInt)]);

            // Call the contract's send_to function with the split coin
            tx.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::send_to`,
                arguments: [
                    tx.pure.vector('u8', paymentIdBytes),
                    tx.pure.address(payeeAddress),
                    paymentCoin
                ],
            });

            // Execute the transaction
            signAndExecuteTransaction(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        setResultMessage({ type: 'info', message: 'Transaction sent. Checking status...' });

                        try {
                            // Wait briefly for transaction to be processed
                            await new Promise(resolve => setTimeout(resolve, 2000));

                            // Get transaction status
                            const txBlock = await suiClient.getTransactionBlock({
                                digest: result.digest,
                                options: { showEffects: true }
                            });

                            const isSuccess = txBlock.effects?.status?.status === 'success';

                            if (isSuccess) {
                                setResultMessage({
                                    type: 'success',
                                    message: `Payment sent! Transaction digest: ${result.digest}`
                                });
                                toast.success('Payment sent successfully!');

                                // Store the payment record in Walrus blockchain storage
                                try {
                                    const paymentKey = `payment_sent_${paymentId}`;
                                    
                                    // Store payment key in localStorage to track which payments we've already recorded
                                    const existingPayments = localStorage.getItem('walrus_recorded_payments') || '{}';
                                    const recordedPayments = JSON.parse(existingPayments);
                                    
                                    // Only store if we haven't already recorded this payment
                                    if (!recordedPayments[paymentKey]) {
                                        await walrusApi.storePaymentRecord(
                                            'send',
                                            paymentId,
                                            '', // Will be updated later
                                            currentAccount?.address || '',
                                            payeeAddress,
                                            parseFloat(amount),
                                            result.digest
                                        );
                                        console.log('Payment record stored in blockchain');
                                        
                                        // Mark this payment as recorded
                                        recordedPayments[paymentKey] = true;
                                        localStorage.setItem('walrus_recorded_payments', JSON.stringify(recordedPayments));
                                    } else {
                                        console.log('Payment already recorded in blockchain, skipping duplicate');
                                    }
                                } catch (walrusError) {
                                    console.error('Failed to store payment record:', walrusError);
                                }

                                // Refresh data
                                fetchPayments();
                                fetchUserCoins();
                            } else {
                                const errorMsg = txBlock.effects?.status?.error || 'Transaction execution failed';
                                setResultMessage({
                                    type: 'error',
                                    message: `Payment failed: ${errorMsg}`
                                });
                                toast.error(`Failed to send payment: ${errorMsg}`);
                            }
                        } catch (statusError:any) {
                            console.error('Error checking transaction status:', statusError);
                            setResultMessage({
                                type: 'error',
                                message: `Unable to verify payment status: ${statusError.message}`
                            });
                        } finally {
                            setIsLoading(false);
                        }
                    },
                    onError: (error) => {
                        console.error('Send payment failed:', error);
                        setResultMessage({
                            type: 'error',
                            message: `Send payment failed: ${error.message}`
                        });
                        toast.error(`Failed to send payment: ${error.message}`);
                        setIsLoading(false);
                    }
                }
            );
        } catch (error:any) {
            console.error('Transaction preparation failed:', error);
            setResultMessage({
                type: 'error',
                message: `Failed to prepare transaction: ${error.message}`
            });
            toast.error(`Error: ${error.message}`);
            setIsLoading(false);
        }
    };

    // Track processed payments to avoid duplicates
    const [previouslyProcessedPayments] = useState(new Set<string>());

    useEffect(() => {
        if (currentAccount) {
            fetchUserCoins();
            fetchPayments();
        }
    }, [currentAccount, currentNetwork, selectedToken, fetchUserCoins, fetchPayments]);

    return {
        currentAccount,
        coinObjects,
        payments,
        isLoading,
        resultMessage,
        setResultMessage,
        sendPayment,
        executePaymentAction,
        fetchPayments,
        fetchUserCoins,
    };
}