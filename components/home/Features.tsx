"use client";

import React from "react";
import dynamic from "next/dynamic";
import Loader from "@/components/ui/loader";

import { FlipWords } from "@/components/ui/flipWords";
import { MONTSERRAT } from "@/lib/fonts";
import useFullPageLoader from "@/hooks/usePageLoader";
import { AuroraBackground } from "../ui/aurora";

const Carousel = dynamic(() => import("@/components/ui/cardsCarousel").then(mod => mod.Carousel), {
    ssr: false,
    loading: () => <Loader />
});

const Card = dynamic(() => import("@/components/ui/cardsCarousel").then(mod => mod.Card), {
    ssr: false,
    loading: () => <Loader />
});

const PayrollContent = () => {
    return (
        <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-4 md:p-6 lg:p-8 xl:p-14 rounded-3xl mb-4">
            <div className="text-neutral-600 dark:text-neutral-400 text-sm md:text-base lg:text-lg font-sans max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto">
                <p className="mb-3">
                    <span className="font-bold text-neutral-700 dark:text-neutral-200">
                        Our flagship payroll system is now live for select pilot users.
                    </span>
                </p>
                <p className="mb-3">
                    Pay your entire team — anywhere in the world — in one click. Send stablecoins or tokens, and track everything transparently on-chain without spreadsheets or middlemen.
                </p>
                <p className="mb-3">
                    Perfect for DAOs, Web3 teams, and remote workforces.
                </p>
                <p className="font-bold text-neutral-700 dark:text-neutral-200 mb-2">KEY FEATURES:</p>
                <ul className="list-none pl-2 mb-3">
                    <li>✅ Bulk global payouts in one click</li>
                    <li>✅ Supports stablecoins & custom tokens</li>
                    <li>✅ Multi-chain support (Ethereum, Base, Polygon, Arbitrum, BNB Chain, Aptos, Solana)</li>
                    <li>✅ Gas-optimized smart contracts</li>
                    <li>✅ Transparent on-chain proof of payment</li>
                </ul>
                <p className="mb-3">Already powering real teams on-chain.</p>
                <p>Want early access? <span className="underline text-indigo-500 cursor-pointer">Join the waitlist</span></p>
            </div>
        </div>
    );
};

const FiatRampsContent = () => {
    return (
        <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-4 md:p-6 lg:p-8 xl:p-14 rounded-3xl mb-4">
            <div className="text-neutral-600 dark:text-neutral-400 text-sm md:text-base lg:text-lg font-sans max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto">
                <p className="mb-3">
                    <span className="font-bold text-neutral-700 dark:text-neutral-200">
                        This one's brewing behind the scenes.
                    </span>
                </p>
                <p className="mb-3">
                    Onramps and Offramps, baked right into PayZoll.
                </p>
                <p className="mb-3">
                    No juggling wallets, no shady exchanges — just smooth INR↔crypto conversion when you need it.
                </p>
                <p className="mb-3">
                    No friction — just flows.
                </p>
                <p>Coming soon. Stay tuned.</p>
            </div>
        </div>
    );
};

const SecurePaymentsContent = () => {
    return (
        <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-4 md:p-6 lg:p-8 xl:p-14 rounded-3xl mb-4">
            <div className="text-neutral-600 dark:text-neutral-400 text-sm md:text-base lg:text-lg font-sans max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto">
                <p className="mb-3">
                    <span className="font-bold text-neutral-700 dark:text-neutral-200">
                        Mistyped address? No panic.
                    </span>
                </p>
                <p className="mb-3">
                    PayZoll's upcoming secure P2P transfer feature introduces smart recovery mechanisms to help undo accidental sends. Whether it's a typo or a misfire, your crypto stays safe until confirmed.
                </p>
                <p className="mb-3">
                    No regrets — just reversibility.
                </p>
                <p>In the works. Stay safe.</p>
            </div>
        </div>
    );
};

const StreamingContent = () => {
    return (
        <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-4 md:p-6 lg:p-8 xl:p-14 rounded-3xl mb-4">
            <div className="text-neutral-600 dark:text-neutral-400 text-sm md:text-base lg:text-lg font-sans max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto">
                <p className="mb-3">
                    <span className="font-bold text-neutral-700 dark:text-neutral-200">
                        PayZoll is building real-time crypto streaming.
                    </span>
                </p>
                <p className="mb-3">
                    Automate recurring payments and power subscriptions — from salaries to services — all on-chain, all on autopilot.
                </p>
                <p className="mb-3">
                    Whether it's paying contributors or managing SaaS billing, everything flows seamlessly without manual triggers.
                </p>
                <p className="mb-3">
                    Continuous. Composable. Built for the future of finance.
                </p>
                <p>Expected soon.</p>
            </div>
        </div>
    );
};

const AIFinanceContent = () => {
    return (
        <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-4 md:p-6 lg:p-8 xl:p-14 rounded-3xl mb-4">
            <div className="text-neutral-600 dark:text-neutral-400 text-sm md:text-base lg:text-lg font-sans max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto">
                <p className="mb-3">
                    <span className="font-bold text-neutral-700 dark:text-neutral-200">
                        This one's cooking in the lab.
                    </span>
                </p>
                <p className="mb-3">
                    AI agents that'll help you optimize off-ramps, automate portfolio moves, and act as your 24/7 financial sidekick.
                </p>
                <p className="mb-3">
                    No buzzwords — just useful automation.
                </p>
                <p>In R&D. Stay tuned.</p>
            </div>
        </div>
    );
};

const data = [
    {
        category: "Payroll (Pilot Live)",
        title: "Web3-native payroll. Live on-chain",
        src: "./Payroll.png",
        content: <PayrollContent />,
    },
    {
        category: "Fiat Ramps (Pilot Live)",
        title: "Crypto↔️Fiat Conversions. All in one tap",
        src: "./Fiat_Ramps.png",
        content: <FiatRampsContent />,
    },
    {
        category: "Secure Payments (Pilot Live)",
        title: "Send crypto worry-free. Recover if wrong",
        src: "./P2P.png",
        content: <SecurePaymentsContent />,
    },
    {
        category: "AI Finance Agents (In Development)",
        title: "Let AI manage your crypto like a pro",
        src: "./AI_Assistants.png",
        content: <AIFinanceContent />,
    },
    {
        category: "Streaming (In Development)",
        title: "Programmable crypto payments",
        src: "./Streaming.png",
        content: <StreamingContent />,
    },
];

function FeaturesPage() {
    const cards = data.map((card, index) => (
        // Pass layout prop for smoother animation if desired
        <Card key={card.src} card={card} index={index} layout />
    ));

    return (
        // Adjust width, use min-height instead of fixed height percentage
        <AuroraBackground className="relative dark:bg-black bg-white">
            <div className="relative h-screen w-screen p-10 flex items-center justify-center mt-2">
                <div className="grid grid-rows-1 place-content-center">
                    <div className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl mx-auto font-semibold xl:font-bold text-neutral-600 dark:text-neutral-400 text-center flex flex-col sm:flex-row">
                        <span className={`bg-gradient-to-br mr-2 dark:from-indigo-500 dark:to-purple-400 from-indigo-400 to-purple-300 text-transparent bg-clip-text ${MONTSERRAT.className}`}>PayZoll</span>
                        offers
                        <FlipWords words={["Security", "Seamlessness", "Fast Transfers", "Global Payments", "Multi-Chain Support", "Off-Ramps", "Stable Token Marketplace", "AI Finance Agents"]} className={` ${MONTSERRAT.className} text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl`} />
                    </div>
                    <div className="max-w-7xl overflow-x-scroll">
                        <Carousel items={cards} />
                    </div>
                </div>
            </div>
        </AuroraBackground>
    );
}

const Features = useFullPageLoader(FeaturesPage, <Loader />);
export default Features;