import React from "react";
import { FloatingDock } from "@/components/ui/floatingDock";
import {
    IconHome,
    IconShoppingCart,
    IconCashBanknote,
    IconWallet,
} from "@tabler/icons-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface RampDockProps {
    onShowBuy: () => void;
    onShowSell: () => void;
}

export function RampDock({
    onShowBuy,
    onShowSell,
}: RampDockProps) {
    // Create base items that are always shown
    const baseItems = [
        {
            title: "Home",
            icon: <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
            href: "/",
        },
        {
            title: "Buy",
            icon: <IconShoppingCart className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
            href: "#",
            onClick: onShowBuy,
        },
        {
            title: "Sell",
            icon: <IconCashBanknote className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
            href: "#",
            onClick: onShowSell,
        },
    ];

    // Wallet connection button always at the end
    const connectItem = [
        {
            title: "Wallet",
            icon: (
                <div className="h-full w-full flex items-center justify-center">
                    <ConnectButton.Custom>
                        {({ account, chain, openConnectModal, openAccountModal }) => {
                            return account && chain ? (
                                <div
                                    onClick={openAccountModal}
                                    className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"
                                />
                            ) : (
                                <IconWallet
                                    onClick={openConnectModal}
                                    className="h-full w-full text-neutral-500 dark:text-neutral-300"
                                />
                            );
                        }}
                    </ConnectButton.Custom>
                </div>
            ),
            href: "#",
        }
    ];

    // Combine all items
    const allItems = [...baseItems, ...connectItem];

    return <FloatingDock items={allItems} />;
}