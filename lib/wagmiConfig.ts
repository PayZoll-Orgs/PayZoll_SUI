import { getDefaultConfig, Chain } from '@rainbow-me/rainbowkit';

const polygon = {
    id: 137,
    name: 'Polygon',
    iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
    iconBackground: 'Black',
    nativeCurrency: { name: 'Polygon', symbol: 'MATIC', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://polygon-rpc.com'] },
    },
    blockExplorers: {
        default: { name: 'Polygonscan', url: 'https://polygonscan.com' },
    },
} as const satisfies Chain;

const polygonAmoy = {
    id: 80002,
    name: 'Polygon Amoy Testnet',
    iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
    iconBackground: 'Black',
    nativeCurrency: { name: 'Polygon', symbol: 'MATIC', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc-amoy.polygon.technology'] },
    },
    blockExplorers: {
        default: { name: 'PolygonScan', url: 'https://amoy.polygonscan.com' },
    },
} as const satisfies Chain;

const arbitrum = {
    id: 42161,
    name: 'Arbitrum',
    iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
    iconBackground: 'Black',
    nativeCurrency: { name: 'Arbitrum', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://arb1.arbitrum.io/rpc'] },
    },
    blockExplorers: {
        default: { name: 'Arbiscan', url: 'https://arbiscan.io' },
    },
} as const satisfies Chain;

const bnb = {
    id: 56,
    name: 'BNB Chain',
    iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
    iconBackground: 'Black',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://binance.llamarpc.com'] },
    },
    blockExplorers: {
        default: { name: 'BscScan', url: 'https://bscscan.com' },
    },
} as const satisfies Chain;

const educhain = {
    id: 41923,
    name: 'Educhain',
    iconUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpjMQ4MGp7aYgKaBR2zwKZ6vmfknjRgVbE1w&s',
    iconBackground: 'Black',
    nativeCurrency: { name: 'Educhain', symbol: 'EDU', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc.edu-chain.raas.gelato.cloud/66a13f09ceab49998f954e7bb71c7c02'] },
    },
    blockExplorers: {
        default: { name: 'Blockscout', url: 'https://educhain.blockscout.com' },
    },
} as const satisfies Chain;

const optimism = {
    id: 10,
    name: 'Optimism',
    iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
    iconBackground: 'Black',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://mainnet.optimism.io'] },
    },
    blockExplorers: {
        default: { name: 'OptimismScan', url: 'https://optimistic.etherscan.io' },
    },
} as const satisfies Chain;

const avalanche = {
    id: 43114,
    name: 'Avalanche',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/en/0/03/Avalanche_logo_without_text.png',
    iconBackground: 'Black',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
    },
    blockExplorers: {
        default: { name: 'SnowTrace', url: 'https://snowtrace.io' },
    },
} as const satisfies Chain;

const bnbTestnet = {
    id: 97,
    name: 'BNB Chain Testnet',
    iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
    iconBackground: 'Black',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545'] },
    },
    blockExplorers: {
        default: { name: 'BscScan Testnet', url: 'https://testnet.bscscan.com' },
    },
} as const satisfies Chain;

const pharos = {
    id: 50002,
    name: 'Pharos Devnet',
    iconUrl: 'https://docs.pharosnetwork.xyz/~gitbook/image?url=https%3A%2F%2F3467509822-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FKKJs3YcSFbFF0lrqt43f%252Fsites%252Fsite_l4IeK%252Ficon%252FkdvxtoO7c6VTNhdjG8PQ%252Fmark.png%3Falt%3Dmedia%26token%3D5ecfa4fd-78d8-4005-a06c-98df5c01ea50&width=32&dpr=4&quality=100&sign=8eb62a33&sv=2',
    iconBackground: 'Black',
    nativeCurrency: { name: 'Pharos', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://devnet.dplabs-internal.com'] },
    },
    blockExplorers: {
        default: { name: 'Pharosscan', url: 'pharosscan.xyz' },
    },
}


const config = getDefaultConfig({
    appName: 'PayZoll',
    projectId: '23c5e43972b3775ee6ed4f74f3e76efb',
    chains: [polygon, arbitrum, avalanche, bnb, educhain, optimism, bnbTestnet, polygonAmoy, pharos],
});


export { config };
