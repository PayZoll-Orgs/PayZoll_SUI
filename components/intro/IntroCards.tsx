"use client";

import { Box, Lock, Search, Settings, Sparkles } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowingEffect";

export function IntroCards() {
    return (
        <ul className="grid grid-cols-1 grid-rows-none gap-1 md:grid-cols-12 md:grid-rows-3 lg:gap-2 2xl:gap-4 max-h-[40rem] xl:grid-rows-2">
            <GridItem
                area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
                icon={<Box className="h-4 w-4 text-neutral-200" />}
                title="Do payments the right way."
                description="Bulk and P2P crypto payments. All in one place."
            />

            <GridItem
                area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
                icon={<Settings className="h-4 w-4 text-neutral-200" />}
                title="Multichain support."
                description="Yes, it's true and soon more to come."
            />

            <GridItem
                area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
                icon={<Lock className="h-4 w-4 text-neutral-200 " />}
                title="You don't need to build trust."
                description="It's all secure encrypted and zero knowledge."
            />

            <GridItem
                area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
                icon={<Sparkles className="h-4 w-4 text-neutral-200" />}
                title="All at once."
                description="Buy, pay, convert, offramp, and more."
            />

            <GridItem
                area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
                icon={<Search className="h-4 w-4 text-neutral-200 " />}
                title="Need Help?"
                description="Trade, prices, orders, and more. Our Ai agents will suport you like never before."
            />
        </ul>
    );
}

interface GridItemProps {
    area: string;
    icon: React.ReactNode;
    title: string;
    description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
    return (
        <li className={`max-h-[12rem] xl:max-h-full list-none ${area}`}>
            <div className="relative h-full rounded-2xl border-3 border-gray-900  p-1 md:rounded-3xl lg:p-3">
                <GlowingEffect
                    spread={50}
                    glow={true}
                    disabled={false}
                    proximity={50}
                    inactiveZone={0.01}
                    borderWidth={5}
                />
                <div className="border-1 border-gray-800 relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl p-6 md:p-6 shadow-[0px_0px_27px_0px_#2D2D2D]">
                    <div className="relative flex flex-1 flex-col justify-between gap-3">
                        <div className="w-fit hidden xl:flex rounded-lg border border-gray-500 p-2">
                            {icon}
                        </div>
                        <div className="space-y-1 2xl:space-y-3">
                            <h3 className="-tracking-4 pt-0.5 font-sans font-semibold text-balance md:text-lg text-white">
                                {title}
                            </h3>
                            <h2 className="font-sans text-sm/[1.125rem] md:text-base/[1.375rem] text-neutral-400 [&_b]:md:font-semibold [&_strong]:md:font-semibold">
                                {description}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
};
