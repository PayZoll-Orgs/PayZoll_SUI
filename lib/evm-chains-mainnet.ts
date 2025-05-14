import { defineChain } from 'viem'
export const NATIVE_ADDRESS = `0x0000000000000000000000000000000000000000`

export const polygon = defineChain({
    id: 137,
    name: 'Polygon',
    nativeCurrency: { decimals: 18, name: 'MATIC', symbol: 'MATIC' },
    rpcUrls: {
        default: { http: ['https://polygon-rpc.com'] },
    },
    blockExplorers: {
        default: { name: 'Polygonscan', url: 'https://polygonscan.com' },
    },
})

export const polygonAmoy = defineChain({
    id: 80002,
    name: 'Polygon Amoy Testnet',
    nativeCurrency: { decimals: 18, name: 'MATIC', symbol: 'MATIC' },
    rpcUrls: {
        default: { http: ['https://rpc-amoy.polygon.technology'] },
    },
    blockExplorers: {
        default: { name: 'Polygonscan', url: 'https://amoy.polygonscan.com/' },
    },
})
export const arbitrum = defineChain({
    id: 42161,
    name: 'Arbitrum One',
    nativeCurrency: { decimals: 18, name: 'ETH', symbol: 'ETH' },
    rpcUrls: {
        default: { http: ['https://arb1.arbitrum.io/rpc'] },
    },
    blockExplorers: {
        default: { name: 'Arbiscan', url: 'https://arbiscan.io' },
    },
})

export const bnb = defineChain({
    id: 56,
    name: 'BNB Chain',
    nativeCurrency: { decimals: 18, name: 'BNB', symbol: 'BNB' },
    rpcUrls: {
        default: { http: ['https://binance.llamarpc.com'] },
    },
    blockExplorers: {
        default: { name: 'BscScan', url: 'https://bscscan.com' },
    },
})

export const educhain = defineChain({
    id: 41923,
    name: 'Educhain',
    nativeCurrency: { decimals: 18, name: 'EDU', symbol: 'EDU' },
    rpcUrls: {
        default: { http: ['https://rpc.edu-chain.raas.gelato.cloud/66a13f09ceab49998f954e7bb71c7c02'] },
    },
    blockExplorers: {
        default: { name: 'Blockscout', url: 'https://educhain.blockscout.com' },
    },
})

export const avalanche = defineChain({
    id: 43114,
    name: 'Avalanche',
    nativeCurrency: { decimals: 18, name: 'AVAX', symbol: 'AVAX' },
    rpcUrls: {
        default: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
    },
    blockExplorers: {
        default: { name: 'Snowtrace', url: 'https://snowtrace.io' },
    },
})


export const optimism = defineChain({
    id: 10,
    name: 'Optimism',
    nativeCurrency: { decimals: 18, name: 'OPTIMISM', symbol: 'OP' },
    rpcUrls: {
        default: {
            http: ['https://10.rpc.thirdweb.com']
        },
    },
    blockExplorers: {
        default: { name: 'OptimismScan', url: 'https://optimistic.etherscan.io' },
    },
})


export const bnbTestnet = defineChain({
    id: 97,
    name: 'BNB Chain Testnet',

    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545'] },
    },
    blockExplorers: {
        default: { name: 'BscScan Testnet', url: 'https://testnet.bscscan.com' },
    },
})

export const pharos = defineChain({
    id: 50002,
    name: 'Pharos Devnet',
    nativeCurrency: { name: 'Pharos', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://devnet.dplabs-internal.com'] },
    },
    blockExplorers: {
        default: { name: 'Pharosscan', url: 'https://pharosscan.xyz' },
    },
})



export const allMainnetChains = [
    polygon,
    polygonAmoy,
    arbitrum,
    bnb,
    educhain,
    optimism,
    avalanche,
    bnbTestnet,
    pharos
]