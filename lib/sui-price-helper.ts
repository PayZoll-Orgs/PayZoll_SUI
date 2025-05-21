// Token symbol to Pyth Network price feed ID mapping
const tokenToPythId: { [key: string]: string } = {
    'BTC': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    'ETH': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    'SUI': '0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
    'USDC': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
    'USDT': '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
};

// Keep original mapping for fallback
const tokenToCoinGeckoId: { [key: string]: string } = {
    'SUI': 'sui',
    'BTC': 'bitcoin',
    'USDC': 'usd-coin',
    'USDT': 'tether',
    'WETH': 'weth',
    'ETH': 'ethereum',
};

/**
 * Fetch price from Pyth Network API
 */
async function fetchPriceFromPyth(tokenSymbol: string): Promise<number | null> {
    try {
        const pythId = tokenToPythId[tokenSymbol];
        if (!pythId) {
            console.warn(`No Pyth Network ID mapping found for ${tokenSymbol}`);
            return null;
        }

        const apiUrl = `https://hermes.pyth.network/v2/updates/price/latest?ids%5B%5D=${pythId}`;
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            cache: 'no-store' // Ensure we get fresh data
        });

        if (!response.ok) {
            console.warn(`Pyth Network API response not OK: ${response.status}`);
            return null;
        }

        const data = await response.json();
        if (!data.parsed || !data.parsed.length) {
            console.warn(`No parsed data found for ${tokenSymbol}`);
            return null;
        }

        // Extract price data from the response
        const priceData = data.parsed[0].price;
        if (!priceData) {
            console.warn(`No price data found for ${tokenSymbol}`);
            return null;
        }

        // Pyth returns price with an exponent, so we need to apply it
        // price * 10^expo gives the price in USD
        const price = Number(priceData.price) * Math.pow(10, priceData.expo);
        
        // Calculate exchange rate (USD/Token) = 1 / (Token/USD price)
        const exchangeRate = 1 / price;
        console.log(`Pyth Network rate for ${tokenSymbol}: ${exchangeRate} (1 USD = ${exchangeRate} ${tokenSymbol})`);

        return exchangeRate;
    } catch (error) {
        console.error(`Error fetching price from Pyth Network for ${tokenSymbol}:`, error);
        return null;
    }
}

/**
 * Legacy function for fallback
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
            console.log(`🪙 Using fixed 1:1 rate for stablecoin: ${tokenSymbol}`);
            return 1;
        }

        // Try using Pyth Network API first
        console.log(`🔍 Attempting to fetch ${tokenSymbol} price from Pyth Network...`);
        const pythRate = await fetchPriceFromPyth(tokenSymbol);
        if (pythRate !== null && pythRate > 0) {
            console.log(`✅ USING PYTH NETWORK PRICE for ${tokenSymbol}: ${pythRate}`);
            return pythRate;
        }

        // Try using CoinGecko API as fallback
        console.log(`⚠️ Pyth Network failed, trying CoinGecko as fallback for ${tokenSymbol}...`);
        const coinGeckoRate = await fetchPriceFromCoinGecko(tokenSymbol);
        if (coinGeckoRate !== null && coinGeckoRate > 0) {
            console.log(`✅ USING COINGECKO PRICE for ${tokenSymbol}: ${coinGeckoRate}`);
            return coinGeckoRate;
        }

        // Fallback to hardcoded rates
        console.warn(`❌ ALL API SOURCES FAILED! Using hardcoded fallback rate for ${tokenSymbol}`);

        const fallbackRates: { [key: string]: number } = {
            'SUI': 3.0,       // Example: 1 USD ≈ 3 SUI
            'BTC': 0.00002,   // Example: 1 USD ≈ 0.00002 BTC
            'ETH': 0.0005,    // Example: 1 USD ≈ 0.0005 ETH
        };

        const fallbackRate = fallbackRates[tokenSymbol] || 1.0;
        console.log(`🔄 USING HARDCODED RATE for ${tokenSymbol}: ${fallbackRate}`);
        return fallbackRate; // Ensure non-zero value
    } catch (error) {
        console.error("❌ ERROR in getExchangeRate:", error);
        return 1.0; // Default to 1:1 for safety
    }
}