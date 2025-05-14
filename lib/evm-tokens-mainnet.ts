import {
    polygon,
    arbitrum,
    bnb,
    educhain,
    optimism,
    avalanche,
    bnbTestnet,
    polygonAmoy,
    pharos,
} from "./evm-chains-mainnet";

// Export the native address constant
export const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';

export const contractMainnetAddresses = {
    [bnb.id]: '0x2c137aC6Bc804A9F798053347802F489F0025768',
    [arbitrum.id]: '0x2c137aC6Bc804A9F798053347802F489F0025768',
    [educhain.id]: '0x2c137aC6Bc804A9F798053347802F489F0025768',
    [polygon.id]: '0x2c137aC6Bc804A9F798053347802F489F0025768',
    [avalanche.id]: '0xYourContractAddressOnAvalanche',
    [optimism.id]: '0xYourContractAddressOnOptimism',
    [bnbTestnet.id]: '0x9571BcCA765f30FF221dfB976ab530Ba44bd85AE',
    [polygonAmoy.id]: '0xA8Ef467c3242Aa4bb06e807E869137A410aa0D41',
    [pharos.id]:'0x2c137aC6Bc804A9F798053347802F489F0025768',
};

// Token interface with optional priceFeed field
export interface Token {
    symbol: string;
    address: string;
    decimals: number;
    priceFeed?: string;
}

export const tokensPerMainnetChain: { [chainId: number]: Token[] } = {
    [polygon.id]: [
        {
            symbol: 'MATIC',
            address: "0x0000000000000000000000000000000000001010",
            decimals: 18,
            priceFeed: '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0'
        },
        {
            symbol: 'USDT.pos',
            address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
            decimals: 6,
            priceFeed: '0x0A6513e40db6EB1b165753AD52E80663aeA50545'
        },
        {
            symbol: 'USDT',
            address: '0x9417669fBF23357D2774e9D421307bd5eA1006d2',
            decimals: 6,
            priceFeed: '0x0A6513e40db6EB1b165753AD52E80663aeA50545'
        },
        {
            symbol: 'USDC',
            address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
            decimals: 6,
            priceFeed: '0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7'
        },
        {
            symbol: 'USDC.e',
            address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
            decimals: 6,
            priceFeed: '0x5c3890e86f3E7Ed7F5390532De147953580f1605'
        },
    ],
    [polygonAmoy.id]: [
        {
            symbol: 'MATIC',
            address: "0x0000000000000000000000000000000000001010",
            decimals: 18,
            priceFeed: '0x001382149eBa3441043c1c66972b4772963f5D43'
        },
        {
            symbol: 'USDT',
            address: '0x2655783ed6c47Fd312D1204712A804821899E1A3',
            decimals: 6,
            priceFeed: '0x3aC23DcB4eCfcBd24579e1f34542524d0E4eDeA8'
        },
        {
            symbol: 'USDC',
            address: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
            decimals: 6,
            priceFeed: '0x1b8739bB4CdF0089d07097A9Ae5Bd274b29C6F16'
        },
    ],
    [arbitrum.id]: [
        {
            symbol: 'ETH',
            address: NATIVE_ADDRESS,
            decimals: 18,
            priceFeed: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612'
        },
        {
            symbol: 'WETH',
            address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
            decimals: 18,
            priceFeed: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612'
        },
        {
            symbol: 'USDT',
            address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            decimals: 6,
            priceFeed: '0x3f3f5dF88dC9F13eac63DF89EC16ef6e7E25DdE7'
        },
        {
            symbol: 'USDC',
            address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            decimals: 6,
            priceFeed: '0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3'
        },
        {
            symbol: 'USDC.e',
            address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
            decimals: 6,
            priceFeed: '0x88AC7Bca36567525A866138F03a6F6844868E0Bc'
        },
    ],
    [bnb.id]: [
        {
            symbol: 'BNB',
            address: NATIVE_ADDRESS,
            decimals: 18,
            priceFeed: '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE'
        },
        {
            symbol: 'USDT',
            address: '0x55d398326f99059fF775485246999027B3197955',
            decimals: 18,
            priceFeed: '0xB97Ad0E74fa7d920791E90258A6E2085088b4320'
        },
        {
            symbol: 'USDC',
            address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
            decimals: 18,
            priceFeed: '0x51597f405303C4377E36123cBc172b13269EA163'
        },
    ],
    [educhain.id]: [
        { symbol: 'EDU', address: NATIVE_ADDRESS, decimals: 18 },
        { symbol: 'USDT', address: '0x7277Cc818e3F3FfBb169c6Da9CC77Fc2d2a34895', decimals: 6 },
        { symbol: 'USDC', address: '0x836d275563bAb5E93Fd6Ca62a95dB7065Da94342', decimals: 6 },
    ],
    [avalanche.id]: [
        {
            symbol: 'AVAX',
            address: NATIVE_ADDRESS,
            decimals: 18,
            priceFeed: '0x0A77230d17318075983913bC2145DB16C7366156'
        },
        {
            symbol: 'USDC',
            address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
            decimals: 6,
            priceFeed: '0xF096872672F44d6EBA71458D74fe67F9a77a23B9'
        },
        { symbol: 'USDC.e', address: '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664', decimals: 6 },
        {
            symbol: 'USDT',
            address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
            decimals: 6,
            priceFeed: '0xEBE676ee90Fe1112671f19b6B7459bC678B67e8a'
        },
        { symbol: 'USDT.e', address: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118', decimals: 6 },
        { symbol: 'DAI.e', address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', decimals: 18 },
    ],
    [optimism.id]: [
        {
            symbol: 'OP',
            address: "0x4200000000000000000000000000000000000042",
            decimals: 18,
            priceFeed: '0x0D276FC14719f9292D5C1eA2198673d1f4269246'
        },
        {
            symbol: 'ETH',
            address: NATIVE_ADDRESS,
            decimals: 6,
            priceFeed: '0x13e3Ee699D1909E989722E753853AE30b17e08c5'
        },
        {
            symbol: 'USDC',
            address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
            decimals: 6,
            priceFeed: '0x16a9FA2FDa030272Ce99B29CF780dFA30361E0f3'
        },
        {
            symbol: 'USDT',
            address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
            decimals: 6,
            priceFeed: '0xECef79E109e997bCA29c1c0897ec9d7b03647F5E'
        },
    ],
    [bnbTestnet.id]: [
        {
            symbol: "tBNB",
            address: NATIVE_ADDRESS,
            decimals: 18,
            priceFeed: "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526"
        },
        {
            symbol: "USDT",
            address: "0x337610d27c682e347c9cd60bd4b3b107c9d34ddd",
            decimals: 18,
            priceFeed: "0xEca2605f0BCF2BA5966372C99837b1F182d3D620"
        },
        {
            symbol: "USDC",
            address: "0x0a385f86059e0b2a048171d78afd1f38558121f3",
            decimals: 18,
            priceFeed: "0x90c069C4538adAc136E051052E14c1cD799C41B7"
        },
    ],
    [pharos.id]: [
        {
            symbol: "ETH",
            address: NATIVE_ADDRESS,
            decimals: 18,
            priceFeed: ""
        },
        {
            symbol: "ZOLLPTT",
            address: "0xcB6A2D2185C9c01739C9AD9110424146934cfAe7",
            decimals: 18,
            priceFeed: ""
        },
        {
            symbol: "WETH",
            address: "0xc4CebF58836707611439e23996f4FA4165Ea6A28",
            decimals: 18,
            priceFeed: ""
        },
        {
            symbol: "USDC",
            address: "0x2E6D0aA9ca3348870c7cbbC28BF6ea90A3C1fE36",
            decimals: 6,
            priceFeed: ""
        },
    ],
};
