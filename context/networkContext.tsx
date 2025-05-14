"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { suiNetworks, defaultNetwork } from '@/lib/sui-tokens';

export type SuiNetwork = 'mainnet' | 'testnet';

type NetworkContextType = {
    currentNetwork: SuiNetwork;
    setNetwork: (network: SuiNetwork) => void;
};

const NetworkContext = createContext<NetworkContextType>({
    currentNetwork: defaultNetwork as SuiNetwork,
    setNetwork: () => { },
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentNetwork, setCurrentNetwork] = useState<SuiNetwork>(defaultNetwork as SuiNetwork);

    // Initialize from localStorage if available
    useEffect(() => {
        const savedNetwork = localStorage.getItem('payzoll-network');
        if (savedNetwork && Object.keys(suiNetworks).includes(savedNetwork)) {
            setCurrentNetwork(savedNetwork as SuiNetwork);
        }
    }, []);

    const setNetwork = (network: SuiNetwork) => {
        setCurrentNetwork(network);
        localStorage.setItem('payzoll-network', network);
    };

    return (
        <NetworkContext.Provider value={{ currentNetwork, setNetwork }}>
            {children}
        </NetworkContext.Provider>
    );
};

export const useNetwork = () => useContext(NetworkContext);