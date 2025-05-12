
// Token symbol to CoinGecko ID mapping
const tokenToCoinGeckoId: { [key: string]: string } = {
    'SUI': 'sui',
    'BTC': 'bitcoin',
    'USDC': 'usd-coin',
    'USDT': 'tether',
    'WETH': 'weth',
    'ETH': 'ethereum',
};

/**
 * Fetch price from CoinGecko API
 */
async function fetchPriceFromCoinGecko(tokenSymbol: string): Promise<number | null> {
    try {
        const coinId = tokenToCoinGeckoId[tokenSymbol];
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

/**
 * Get exchange rate from USD to Token (how many tokens per 1 USD)
 */
export async function getExchangeRate(tokenSymbol: string): Promise<number> {
    try {
        // For stablecoins, immediately return 1:1 without making any API calls
        if (tokenSymbol.includes('USD')) {
            return 1;
        }

        // Try using CoinGecko API
        const coinGeckoRate = await fetchPriceFromCoinGecko(tokenSymbol);
        if (coinGeckoRate !== null && coinGeckoRate > 0) {
            return coinGeckoRate;
        }

        // Fallback to hardcoded rates
        console.warn(`Falling back to hardcoded rates for ${tokenSymbol}`);

        const fallbackRates: { [key: string]: number } = {
            'SUI': 3.0,       // Example: 1 USD ≈ 3 SUI
            'BTC': 0.00002,   // Example: 1 USD ≈ 0.00002 BTC
            'ETH': 0.0005,    // Example: 1 USD ≈ 0.0005 ETH
        };

        return fallbackRates[tokenSymbol] || 1.0; // Ensure non-zero value
    } catch (error) {
        console.error("Error in getExchangeRate:", error);
        return 1.0; // Default to 1:1 for safety
    }
}