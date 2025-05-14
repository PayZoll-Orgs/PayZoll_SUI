import { ethers } from 'ethers';
import { tokensPerMainnetChain as tokens } from '@/lib/evm-tokens-mainnet';

// Chainlink Price Feed ABI (minimal version with just what we need)
export const chainlinkAggregatorABI = [
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "description",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint80",
                "name": "_roundId",
                "type": "uint80"
            }
        ],
        "name": "getRoundData",
        "outputs": [
            {
                "internalType": "uint80",
                "name": "roundId",
                "type": "uint80"
            },
            {
                "internalType": "int256",
                "name": "answer",
                "type": "int256"
            },
            {
                "internalType": "uint256",
                "name": "startedAt",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "updatedAt",
                "type": "uint256"
            },
            {
                "internalType": "uint80",
                "name": "answeredInRound",
                "type": "uint80"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "latestRoundData",
        "outputs": [
            {
                "internalType": "uint80",
                "name": "roundId",
                "type": "uint80"
            },
            {
                "internalType": "int256",
                "name": "answer",
                "type": "int256"
            },
            {
                "internalType": "uint256",
                "name": "startedAt",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "updatedAt",
                "type": "uint256"
            },
            {
                "internalType": "uint80",
                "name": "answeredInRound",
                "type": "uint80"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "version",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Token symbol to CoinGecko ID mapping
const tokenToCoingeckoId: { [key: string]: string } = {
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'tBNB': 'binancecoin', // Use same ID for testnet
    'MATIC': 'matic-network',
    'AVAX': 'avalanche-2',
    'USDT': 'tether',
    'USDC': 'usd-coin',
    'USDC.e': 'usd-coin',
    'USDT.e': 'tether',
    'DAI': 'dai',
    'DAI.e': 'dai',
    'WETH': 'weth',
    'WBTC': 'wrapped-bitcoin',
    'EDU': 'edu-coin',
};

// Function to fetch price from CoinGecko API
async function fetchPriceFromCoinGecko(tokenSymbol: string): Promise<number | null> {
    try {
        const coinId = tokenToCoingeckoId[tokenSymbol];
        if (!coinId) {
            console.warn(`No CoinGecko ID mapping found for ${tokenSymbol}`);
            return null;
        }

        const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            cache: 'no-store' // Ensure we get fresh data
        });

        if (!response.ok) {
            console.warn(`CoinGecko API response not OK: ${response.status}`);
            return null;
        }

        const data = await response.json();
        if (!data[coinId] || !data[coinId].usd) {
            console.warn(`No price data found for ${tokenSymbol} (${coinId})`);
            return null;
        }

        // Calculate exchange rate (USD/Token) = 1 / (Token/USD price)
        const exchangeRate = 1 / data[coinId].usd;
        console.log(`CoinGecko rate for ${tokenSymbol}: ${exchangeRate} (1 USD = ${exchangeRate} ${tokenSymbol})`);

        return exchangeRate;
    } catch (error) {
        console.error(`Error fetching price from CoinGecko for ${tokenSymbol}:`, error);
        return null;
    }
}

// Get exchange rate from USD to Token (inverse of price feed)
export async function getExchangeRate(
    provider: ethers.JsonRpcProvider,
    tokenSymbol: string,
    chainId: number
): Promise<number> {
    try {
        // For stablecoins, immediately return 1:1 without making any API calls
        if (tokenSymbol.includes('USD')) {
            return 1;
        }

        // First attempt: Try using Chainlink price feed
        try {
            // Find the specific token and its price feed for this specific chain
            const availableTokens = tokens[chainId] || [];
            const token = availableTokens.find(t => t.symbol === tokenSymbol);
            const priceFeed = token?.priceFeed;

            if (!token) {
                throw new Error(`Token ${tokenSymbol} not found on chain ${chainId}`);
            }

            if (!priceFeed) {
                throw new Error(`No price feed found for ${tokenSymbol} on chain ${chainId}`);
            }

            // Create a contract instance for the price feed
            const aggregator = new ethers.Contract(
                priceFeed,
                chainlinkAggregatorABI,
                provider
            );

            // Get the latest round data and decimals
            const [roundData, decimals] = await Promise.all([
                aggregator.latestRoundData(),
                aggregator.decimals()
            ]);

            // Calculate exchange rate: 1 USD = 1/price tokens
            // Price feeds give Token/USD price, we need USD/Token rate
            const price = Number(roundData.answer) / 10 ** Number(decimals);
            const exchangeRate = 1 / price;

            if (Number.isFinite(exchangeRate) && exchangeRate > 0) {
                console.log(`Using Chainlink price feed for ${tokenSymbol}: ${exchangeRate}`);
                return exchangeRate;
            }

            throw new Error(`Invalid exchange rate from Chainlink: ${exchangeRate}`);
        } catch (chainlinkError) {
            console.warn(`Chainlink error for ${tokenSymbol}:`, chainlinkError);
            // Continue to fallback methods
        }

        // Second attempt: Try using CoinGecko API
        const coingeckoRate = await fetchPriceFromCoinGecko(tokenSymbol);
        if (coingeckoRate !== null && coingeckoRate > 0) {
            return coingeckoRate;
        }

        // Third attempt: Use hardcoded fallbacks
        console.warn(`Falling back to hardcoded rates for ${tokenSymbol}`);

        // For other tokens, return reasonable fallback based on symbol
        const fallbackRates: { [key: string]: number } = {
            'ETH': 0.001,    // 1 USD ≈ 0.0005 ETH
            'BNB': 0.001,     // 1 USD ≈ 0.003 BNB
            'tBNB': 0.001,    // Testnet BNB same as BNB
            'MATIC': 0.001,     // 1 USD ≈ 0.8 MATIC
            'AVAX': 0.001,     // 1 USD ≈ 0.04 AVAX
            'EDU': 0.001,       // 1 USD ≈ 1.5 EDU (example)
            'ZOLLPTT': 1
        };

        return fallbackRates[tokenSymbol] || (0.001); // Ensure non-zero value
    } catch (error) {
        console.error("Error in getExchangeRate:", error);

        // Final fallback for critical errors
        if (tokenSymbol.includes('USD')) {
            return 1;
        }

        const emergencyFallbackRates: { [key: string]: number } = {
            'ETH': 0.001,    // 1 USD ≈ 0.0005 ETH
            'BNB': 0.001,     // 1 USD ≈ 0.003 BNB
            'tBNB': 0.001,    // Testnet BNB same as BNB
            'MATIC': 0.001,     // 1 USD ≈ 0.8 MATIC
            'AVAX': 0.001,     // 1 USD ≈ 0.04 AVAX
            'EDU': 0.001,       // 1 USD ≈ 1.5 EDU (example)
            'ZOLLPTT': 1
        };

        return emergencyFallbackRates[tokenSymbol] || 0.001;
    }
}
