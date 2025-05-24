"use client";

import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NetworkProvider, useNetwork } from '@/context/networkContext';
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

// Inner component that uses the network context
function SuiProviders({ children }: { children: React.ReactNode }) {
    const { currentNetwork, setNetwork } = useNetwork();

    return (
        <SuiClientProvider
            networks={networkConfig}
            network={currentNetwork}
            onNetworkChange={(network) => {
                setNetwork(network as any);
            }}
        >
            <WalletProvider slushWallet={{
                name: 'PayZoll',
            }}>
                {children}
            </WalletProvider>
        </SuiClientProvider>
    );
}

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
                        <SuiProviders>
                            {children}
                        </SuiProviders>
                    </NetworkProvider>
                </QueryClientProvider>
            </AuroraBackground>
        </div>
    );
}