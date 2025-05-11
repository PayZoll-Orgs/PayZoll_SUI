"use client";
import "@/hooks/usePaymentsManager"
import { useState } from 'react';
import { useNetwork } from '@/context/networkContext';
import { suiTokens, SuiToken } from '@/lib/sui-tokens';
import P2PHeader from "@/components/p2p-sui/Header";
import { SecureTransferInterface } from "@/components/p2p-sui/SecureTransferInterface";
import { SplitBillList } from "@/components/p2p-sui/SplitBillList";
import { InvoiceList } from "@/components/p2p-sui/InvoiceList";
import { CreateInvoiceForm } from "@/components/p2p-sui/CreateInvoiceForm";
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Home } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function Page() {
    const { currentNetwork } = useNetwork?.() || { currentNetwork: 'testnet' };
    const currentAccount = useCurrentAccount();
    const [selectedToken, setSelectedToken] = useState<SuiToken | undefined>(
        suiTokens[currentNetwork]?.[0]
    );
    const [splitBillRefresh, setSplitBillRefresh] = useState(0);

    // Handle token changes from the ConnectWallet component
    const handleTokenChange = (token: SuiToken) => {
        setSelectedToken(token);
    };

    return (
        <div className="relative h-screen w-screen dark:text-white text-black p-6 z-10">
            <div className="absolute top-4 left-4">
                <Link href="/">
                    <Home className="text-black dark:hover:text-gray-200 hover:text-gray-800 dark:text-white" size={30} />
                </Link>
            </div>
            <div className="flex flex-col max-w-screen max-h-screen items-center m-10">
                <P2PHeader
                    selectedToken={selectedToken}
                    onTokenChange={handleTokenChange}
                />

                {currentAccount ? (
                    <Tabs defaultValue="transfer" className="min-w-[90%]">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="transfer">Secure Transfer</TabsTrigger>
                            <TabsTrigger value="invoices">My Invoices</TabsTrigger>
                            <TabsTrigger value="splitbills">Split Bills</TabsTrigger>
                            <TabsTrigger value="create-invoice">Create Invoice</TabsTrigger>
                        </TabsList>

                        <TabsContent value="transfer">
                            <SecureTransferInterface selectedToken={selectedToken} />
                        </TabsContent>

                        <TabsContent value="invoices">
                            <InvoiceList selectedToken={selectedToken} />
                        </TabsContent>

                        <TabsContent value="splitbills">
                            <SplitBillList
                                selectedToken={selectedToken}
                                refreshTrigger={splitBillRefresh}
                            />
                        </TabsContent>

                        <TabsContent value="create-invoice">
                            <CreateInvoiceForm />
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="dark:text-white text-black border-2 border-blue-200 p-4 rounded-md">
                        <p>Please connect your wallet to use these features.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Page;