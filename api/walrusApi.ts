import axios from 'axios';
import axiosClient from './axiosClient'; // Import the authenticated axios client

// Configure Walrus API endpoints for testnet
const AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";
const PUBLISHER = "https://publisher.walrus-testnet.walrus.space";

// Enable detailed logging
const ENABLE_LOGS = true;

// Logging helper function
function logWalrus(message: string, data?: any, isError = false) {
    if (!ENABLE_LOGS) return;

    const style = isError
        ? 'background: #f44336; color: white; padding: 2px 5px; border-radius: 2px;'
        : 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 2px;';

    console.log(`%c WALRUS ${isError ? 'ERROR' : 'LOG'} `, style, message);

    if (data) {
        console.log(data);
    }
}

// Audit record structure (minimal data, no PII)
export interface BlockchainAuditRecord {
    recordType: 'invoice' | 'payroll' | 'splitBill' | 'payment';
    recordId: string;
    timestamp: number;
    walletAddresses: string[];  // Array of wallet addresses
    amounts?: number[];          // Corresponding array of amounts
    totalAmount: number;        // Total amount of the transaction
    chain: string;
    status: string;
    transactionHash?: string;
    paymentId?: string;         // For payment records: unique payment ID
    paymentObjectId?: string;   // For payment records: object ID on Sui
    paymentAction?: 'send' | 'claim' | 'reimburse'; // Type of payment action
}

export interface AuditIndex {
    records: {
        blobId: string;
        recordType: string;
        recordId: string;
        timestamp: number;
    }[];
    lastUpdated: number;
}

// Keep an in-memory cache of audit records
// In a production app, this would be stored in a database
let auditIndex: AuditIndex = {
    records: [],
    lastUpdated: Date.now()
};

export const walrusApi = {
    // Store a single audit record on the blockchain
    storeAuditRecord: async (data: BlockchainAuditRecord): Promise<string> => {
        logWalrus(`Storing audit record of type: ${data.recordType}`, {
            recordId: data.recordId,
            walletAddresses: data.walletAddresses,
            totalAmount: data.totalAmount
        });

        try {
            // Convert data to JSON string
            const dataString = JSON.stringify(data);
            logWalrus(`Request payload prepared: ${dataString.substring(0, 100)}...`);

            // Store on blockchain with 10 epochs retention
            logWalrus(`Sending request to ${PUBLISHER}/v1/blobs?epochs=10`);

            const startTime = performance.now();
            const response = await axios({
                method: 'PUT',
                url: `${PUBLISHER}/v1/blobs?epochs=10`,
                data: dataString,
                headers: { 'Content-Type': 'application/json' }
            });
            const duration = Math.round(performance.now() - startTime);

            logWalrus(`Response received in ${duration}ms`, {
                status: response.status,
                statusText: response.statusText
            });

            // Extract blob ID from response
            const blobId = response.data.newlyCreated?.blobObject?.blobId ||
                response.data.alreadyCertified?.blobId;

            if (blobId) {
                logWalrus(`Successfully stored on Walrus with blob ID: ${blobId}`, {
                    rawResponse: response.data
                });
            } else {
                logWalrus('Failed to extract blob ID from response', response.data, true);
                throw new Error('Failed to get blob ID from Walrus response');
            }

            // Update the in-memory audit index
            auditIndex.records.push({
                blobId,
                recordType: data.recordType,
                recordId: data.recordId,
                timestamp: data.timestamp
            });
            auditIndex.lastUpdated = Date.now();

            // Store the updated index on the blockchain
            logWalrus(`Updating audit index with new record. Total records: ${auditIndex.records.length}`);
            await storeAuditIndex();

            return blobId;
        } catch (error: any) {
            logWalrus(`Error storing audit data on Walrus: ${error.message}`, {
                error,
                errorResponse: error.response?.data,
                statusCode: error.response?.status
            }, true);
            throw error;
        }
    },

    // Retrieve an audit record from the blockchain
    getAuditRecord: async (blobId: string): Promise<BlockchainAuditRecord> => {
        logWalrus(`Retrieving audit record with blob ID: ${blobId}`);

        try {
            const startTime = performance.now();
            const response = await axios.get(`${AGGREGATOR}/v1/blobs/${blobId}`);
            const duration = Math.round(performance.now() - startTime);

            logWalrus(`Retrieved audit record in ${duration}ms`, {
                recordType: response.data?.recordType,
                timestamp: response.data?.timestamp ? new Date(response.data.timestamp).toISOString() : 'unknown'
            });

            return response.data;
        } catch (error: any) {
            logWalrus(`Error retrieving audit data from Walrus: ${error.message}`, {
                blobId,
                errorResponse: error.response?.data,
                statusCode: error.response?.status
            }, true);
            throw error;
        }
    },

    // Get all audit records
    getAllAuditRecords: async (): Promise<BlockchainAuditRecord[]> => {
        logWalrus('Fetching all audit records');

        try {
            // First, get the latest index
            const indexBlobId = await getLatestIndexBlobId();

            if (!indexBlobId) {
                logWalrus('No audit index found in storage', null, true);
                return [];
            }

            logWalrus(`Found audit index blob ID: ${indexBlobId}`);

            // Get the index
            const startTime = performance.now();
            const response = await axios.get(`${AGGREGATOR}/v1/blobs/${indexBlobId}`);
            const duration = Math.round(performance.now() - startTime);

            const index = response.data as AuditIndex;

            logWalrus(`Retrieved audit index in ${duration}ms with ${index.records.length} records`, {
                lastUpdated: new Date(index.lastUpdated).toISOString()
            });

            if (index.records.length === 0) {
                logWalrus('Audit index is empty, no records to fetch');
                return [];
            }

            // Fetch all audit records in the index
            logWalrus(`Fetching ${index.records.length} individual audit records...`);

            const auditRecords = await Promise.all(
                index.records.map(record => walrusApi.getAuditRecord(record.blobId))
            );

            logWalrus(`Successfully retrieved ${auditRecords.length} audit records`, {
                recordTypes: auditRecords.map(r => r.recordType),
                totalRecords: auditRecords.length
            });

            return auditRecords;
        } catch (error: any) {
            logWalrus(`Error retrieving all audit records: ${error.message}`, {
                errorDetails: error,
                errorResponse: error.response?.data,
                statusCode: error.response?.status
            }, true);
            return [];
        }
    },

    // Store payment transaction record
    storePaymentRecord: async (
        action: 'send' | 'claim' | 'reimburse',
        paymentId: string,
        paymentObjectId: string,
        fromAddress: string,
        toAddress: string,
        amount: number,
        transactionHash?: string
    ): Promise<string> => {
        logWalrus(`Storing ${action} payment record`, {
            paymentId,
            paymentObjectId,
            fromAddress,
            toAddress,
            amount
        });

        // Create payment-specific audit record
        const auditRecord: BlockchainAuditRecord = {
            recordType: 'payment',
            recordId: `payment-${paymentId}-${action}-${Date.now()}`,
            timestamp: Date.now(),
            walletAddresses: [fromAddress, toAddress],
            totalAmount: amount,
            chain: 'SUI',
            status: action === 'send' ? 'sent' :
                action === 'claim' ? 'claimed' : 'reimbursed',
            transactionHash: transactionHash,
            paymentId: paymentId,
            paymentObjectId: paymentObjectId,
            paymentAction: action
        };

        return walrusApi.storeAuditRecord(auditRecord);
    },

    // Get all payment records
    getPaymentRecords: async (): Promise<BlockchainAuditRecord[]> => {
        const allRecords = await walrusApi.getAllAuditRecords();
        return allRecords.filter(record => record.recordType === 'payment');
    },

    // Recover audit index if localStorage is cleared
    recoverAuditIndex: async (): Promise<string | null> => {
        logWalrus('Attempting to recover audit index...');

        try {
            // Create a new empty index
            const newIndex: AuditIndex = {
                records: [],
                lastUpdated: Date.now()
            };

            // Store the empty index and get its ID
            const response = await axios({
                method: 'PUT',
                url: `${PUBLISHER}/v1/blobs?epochs=20`,
                data: JSON.stringify(newIndex),
                headers: { 'Content-Type': 'application/json' }
            });

            const blobId = response.data.newlyCreated?.blobObject?.blobId ||
                response.data.alreadyCertified?.blobId;

            if (!blobId) {
                throw new Error('Failed to create new audit index');
            }

            // Save the new index blob ID to the database
            try {
                await axiosClient.post('/blobs/audit-index', { blobId });
                logWalrus(`Created and saved new empty audit index with ID: ${blobId} to database`);
            } catch (dbError) {
                logWalrus('Failed to save new audit index to database, falling back to localStorage', dbError, true);

                // Fallback to localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('auditIndexBlobId', blobId);
                    logWalrus(`Created and saved new empty audit index with ID: ${blobId} to localStorage as fallback`);
                }
            }

            // Update in-memory index
            auditIndex = newIndex;

            // Return the new index ID
            return blobId;
        } catch (error) {
            logWalrus('Failed to recover audit index', error, true);
            return null;
        }
    },

    // Add a button to the UI to call this function when the user wants to recover their audit records
    initializeNewAuditIndex: async (): Promise<string | null> => {
        logWalrus('Initializing new audit index');

        try {
            // Create a new empty index
            auditIndex = {
                records: [],
                lastUpdated: Date.now()
            };

            // Store the empty index using the updated storeAuditIndex function
            // which will now save to the database
            const blobId = await storeAuditIndex();
            logWalrus(`Created new audit index with ID: ${blobId}`);

            return blobId;
        } catch (error) {
            logWalrus('Failed to initialize new audit index', error, true);
            return null;
        }
    },

    // Update payment object ID without creating a new record
    updatePaymentObjectId: async (paymentId: string, paymentObjectId: string): Promise<boolean> => {
        logWalrus(`Updating payment object ID for payment ${paymentId}`, { paymentObjectId });

        try {
            // Get all existing payment records
            const allRecords = await walrusApi.getAllAuditRecords();
            const paymentRecords = allRecords.filter(
                record => record.recordType === 'payment' &&
                    record.paymentId === paymentId &&
                    record.paymentAction === 'send'
            );

            if (paymentRecords.length === 0) {
                logWalrus(`No existing payment record found for payment ID: ${paymentId}`, null, true);
                return false;
            }

            // Find the record that needs updating (should be only one with this payment ID)
            const recordToUpdate = paymentRecords[0]; // Take the first one if multiple exist

            // Skip if the object ID is already set
            if (recordToUpdate.paymentObjectId === paymentObjectId) {
                logWalrus(`Payment object ID already set for payment ${paymentId}`, { paymentObjectId });
                return true;
            }

            // Create an updated version of the record with the payment object ID
            const updatedRecord: BlockchainAuditRecord = {
                ...recordToUpdate,
                paymentObjectId: paymentObjectId,
                recordId: `${recordToUpdate.recordId}_updated` // Ensure a unique record ID
            };

            // Store the updated record
            await walrusApi.storeAuditRecord(updatedRecord);
            logWalrus(`Successfully updated payment object ID for payment ${paymentId}`);
            return true;
        } catch (error: any) {
            logWalrus(`Error updating payment object ID: ${error.message}`, error, true);
            return false;
        }
    },
};

// Helper function to get the latest index blob ID
async function getLatestIndexBlobId(): Promise<string | null> {
    // Try to get the blob ID from the backend database first
    try {
        logWalrus('Fetching audit index blob ID from backend database...');
        const response = await axiosClient.get('/blobs/audit-index');

        if (response.data && response.data.blobId) {
            logWalrus(`Retrieved audit index blob ID from database: ${response.data.blobId}`);
            return response.data.blobId;
        }
    } catch (error) {
        logWalrus('Failed to retrieve blob ID from database, falling back to localStorage', error, true);
    }

    // Fallback to localStorage if backend request fails
    if (typeof window !== 'undefined') {
        const storedId = localStorage.getItem('auditIndexBlobId');
        if (storedId) {
            logWalrus(`Retrieved audit index blob ID from localStorage fallback: ${storedId}`);

            // Try to sync the localStorage ID to the backend for future use
            try {
                await axiosClient.post('/blobs/audit-index', { blobId: storedId });
                logWalrus('Successfully synced localStorage blob ID to database');
            } catch (syncError) {
                logWalrus('Failed to sync localStorage blob ID to database', syncError, true);
            }

            return storedId;
        }
    }

    logWalrus('No audit index blob ID found in database or localStorage');
    return null;
}

// Helper function to store the audit index
async function storeAuditIndex(): Promise<string> {
    logWalrus(`Storing updated audit index with ${auditIndex.records.length} records`);

    try {
        // Before creating a new index, try to load any existing index
        const existingIndexId = await getLatestIndexBlobId();

        if (existingIndexId) {
            try {
                // Get the existing index
                logWalrus('Found existing index, loading records from it');
                const response = await axios.get(`${AGGREGATOR}/v1/blobs/${existingIndexId}`);
                const existingIndex = response.data as AuditIndex;

                // Extract the existing records that aren't already in our in-memory index
                if (existingIndex && existingIndex.records) {
                    logWalrus(`Found ${existingIndex.records.length} records in existing index`);

                    // Create a map of current record IDs for efficient lookup
                    const currentRecordIds = new Set(auditIndex.records.map(r => r.blobId));

                    // Add any records from the existing index that aren't already in our in-memory index
                    for (const record of existingIndex.records) {
                        if (!currentRecordIds.has(record.blobId)) {
                            logWalrus(`Adding existing record to in-memory index: ${record.blobId}`);
                            auditIndex.records.push(record);
                        }
                    }

                    logWalrus(`Combined index now has ${auditIndex.records.length} records`);
                }
            } catch (err) {
                logWalrus('Error loading existing index, continuing with current records only', err, true);
                // Continue with the current records only
            }
        }

        // Now store the combined index
        const startTime = performance.now();
        const response = await axios({
            method: 'PUT',
            url: `${PUBLISHER}/v1/blobs?epochs=20`,
            data: JSON.stringify(auditIndex),
            headers: { 'Content-Type': 'application/json' }
        });
        const duration = Math.round(performance.now() - startTime);

        const blobId = response.data.newlyCreated?.blobObject?.blobId ||
            response.data.alreadyCertified?.blobId;

        if (!blobId) {
            logWalrus('Failed to extract blob ID for audit index', response.data, true);
            throw new Error('Failed to get blob ID from Walrus response for audit index');
        }

        logWalrus(`Audit index stored successfully in ${duration}ms with ID: ${blobId}`);

        // Store this blob ID in the database
        try {
            await axiosClient.post('/blobs/audit-index', { blobId });
            logWalrus(`Saved audit index blob ID to database: ${blobId}`);
        } catch (dbError) {
            logWalrus('Failed to save audit index blob ID to database, falling back to localStorage', dbError, true);

            // Fallback to localStorage if the database request fails
            if (typeof window !== 'undefined') {
                localStorage.setItem('auditIndexBlobId', blobId);
                logWalrus(`Saved audit index blob ID to localStorage as fallback: ${blobId}`);
            }
        }

        return blobId;
    } catch (error: any) {
        logWalrus(`Error storing audit index: ${error.message}`, {
            error,
            errorResponse: error.response?.data,
            statusCode: error.response?.status
        }, true);
        throw error;
    }
}