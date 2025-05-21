import axios from 'axios';

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
    recordType: 'invoice' | 'payroll' | 'splitBill';
    recordId: string;
    timestamp: number;
    walletAddresses: string[];  // Array of wallet addresses
    amounts?: number[];          // Corresponding array of amounts
    totalAmount: number;        // Total amount of the transaction
    chain: string;
    status: string;
    transactionHash?: string;
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
    }
};

// Helper function to store the audit index
async function storeAuditIndex(): Promise<string> {
    logWalrus(`Storing updated audit index with ${auditIndex.records.length} records`);
    
    try {
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

        // Store this blob ID somewhere retrievable (e.g., localStorage in browser)
        if (typeof window !== 'undefined') {
            localStorage.setItem('auditIndexBlobId', blobId);
            logWalrus(`Saved audit index blob ID to localStorage: ${blobId}`);
        } else {
            logWalrus(`Running in non-browser environment, couldn't save to localStorage`);
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

// Helper function to get the latest index blob ID
async function getLatestIndexBlobId(): Promise<string | null> {
    // In a real app, this would be stored in a database or config
    // For this example, we'll use localStorage
    if (typeof window !== 'undefined') {
        const storedId = localStorage.getItem('auditIndexBlobId');
        logWalrus(`Retrieved audit index blob ID from localStorage: ${storedId || 'not found'}`);
        return storedId;
    }
    
    logWalrus('Running in non-browser environment, no localStorage access');
    return null;
}