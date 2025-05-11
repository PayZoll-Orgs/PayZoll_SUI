"use client";
import React from 'react';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';
import { ProtectedRoute } from '@/context/authContext';
import { config } from '@/lib/wagmiConfig';
import { AuroraBackground } from '@/components/ui/aurora';


const queryClient = new QueryClient();

export default function PaymentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="container">
            <AuroraBackground>
                <ProtectedRoute requireAdmin={true} route="pages/payroll">
                    <WagmiProvider config={config}>
                        <QueryClientProvider client={queryClient}>
                            <RainbowKitProvider theme={darkTheme()}>
                                {children}
                            </RainbowKitProvider>
                        </QueryClientProvider>
                    </WagmiProvider>
                </ProtectedRoute>
            </AuroraBackground>
        </div>
    );
}
