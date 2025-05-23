"use client";

import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NetworkProvider } from '@/context/networkContext';
import { AuroraBackground } from '@/components/ui/aurora';

// Config options for the networks you want to connect to
const { networkConfig } = createNetworkConfig({
    testnet: { url: getFullnodeUrl('testnet') },
    mainnet: {
        url: 'https://fullnode.mainnet.sui.io:443'
    },
    devnet: { url: getFullnodeUrl('devnet') },
});


const queryClient = new QueryClient();

export default function PaymentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="container">
            <AuroraBackground>
                <QueryClientProvider client={queryClient}>
                    <NetworkProvider>
                        <SuiClientProvider networks={networkConfig} defaultNetwork='mainnet'>
                            <WalletProvider slushWallet={{
                                name: 'PayZoll',
                            }}>
                                {children}
                            </WalletProvider>
                        </SuiClientProvider>
                    </NetworkProvider>
                </QueryClientProvider>
            </AuroraBackground>
        </div>
    );
}