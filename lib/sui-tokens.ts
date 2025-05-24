import { getFullnodeUrl } from '@mysten/sui/client';

// Sui network configurations
export const suiNetworks = {
    mainnet: {
        id: 'mainnet',
        name: 'Sui Mainnet',
        url: getFullnodeUrl('mainnet')
    },
    testnet: {
        id: 'testnet',
        name: 'Sui Testnet',
        url: getFullnodeUrl('testnet')
    },
    devnet: {
        id: 'devnet',
        name: 'Sui Devnet',
        url: getFullnodeUrl('devnet')
    }
};

// Default network
export const defaultNetwork = 'testnet';

// SUI native token address
export const SUI_TYPE = "0x2::sui::SUI";

// Define token types on Sui
export interface SuiToken {
    symbol: string;
    address: string;  // Full coin type string
    decimals: number;
}

// List of commonly used tokens on Sui
export const suiTokens: Record<string, SuiToken[]> = {
    mainnet: [
        {
            symbol: 'SUI',
            address: SUI_TYPE,
            decimals: 9
        },
        {
            symbol: 'USDC',
            address: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::usdc::USDC',
            decimals: 6
        },
        {
            symbol: 'USDT',
            address: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::usdt::USDT',
            decimals: 6
        }
    ],
    testnet: [
        {
            symbol: 'SUI',
            address: SUI_TYPE,
            decimals: 9
        },
        // Add test tokens here
        {
            symbol: 'USDC',
            address: '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC',
            decimals: 6
        },
        {
            symbol: 'USDT',
            address: '0x700de8dea1aac1de7531e9d20fc2568b12d74369f91b7fad3abc1c4f40396e52::usdt::USDT',
            decimals: 6
        }
    ]
};

// Bulk Transfer contract addresses
export const bulkTransferModule = {
    mainnet: '0x777cae1b97c072eae268f19012120b979a28430ea12020bd294571cf94303593',
    testnet: '0xfbd9c32958b04d778001a21c2b512b8688e635120f03b22cf3ff6bada43f477c',
    devnet: '0x'
};

// Helper to get explorer URL
export const getExplorerUrl = (network: string, txDigest: string): string => {
    const baseUrls: Record<string, string> = {
        mainnet: 'https://suiscan.xyz/mainnet/',
        testnet: 'https://suiscan.xyz/testnet/',
        devnet: 'https://suiscan.xyz/devnet/',
    };

    return `${baseUrls[network]}/${txDigest}`;
};