import React from "react";
import { motion } from "framer-motion";
import { MONTSERRAT } from "@/lib/fonts";

export const RevealLinks = () => {
    return (
        <section className="grid place-content-center h-full xl:gap-8 gap-4 px-8 xl:py-24 py-12 dark:text-white text-black">
            <FlipLink href="https://x.com/i/flow/login?redirect_after_login=%2FPayZoll">Twitter</FlipLink>
            <FlipLink href="https://www.linkedin.com/company/payzoll/">Linkedin</FlipLink>
            <FlipLink href="https://www.instagram.com/_payzoll_/?igsh=c3UyODlqMXg2dnJr">Instagram</FlipLink>
            <FlipLink href="https://github.com/PayZoll-Orgs">Github</FlipLink>
            <FlipLink href="https://t.me/+HgwcGg7vPVc5MWI1">Telegram</FlipLink>
            <FlipLink href="tech@payzoll.in">Email</FlipLink>
        </section>
    );
};

const DURATION = 0.25;
const STAGGER = 0.025;

const FlipLink = ({ children, href }: { children: string; href: string }) => {
    return (
        <motion.a
            initial="initial"
            whileHover="hovered"
            href={href}
            className={`relative block overflow-hidden whitespace-nowrap font-black uppercase text-4xl md:text-6xl lg:text-6xl xl:text-7xl ${MONTSERRAT.className}`}
            style={{
                lineHeight: 0.75,
            }}
        >
            <div>
                {children.split("").map((l, i) => (
                    <motion.span
                        variants={{
                            initial: {
                                y: 0,
                            },
                            hovered: {
                                y: "-100%",
                            },
                        }}
                        transition={{
                            duration: DURATION,
                            ease: "easeInOut",
                            delay: STAGGER * i,
                        }}
                        className="inline-block"
                        key={i}
                    >
                        {l}
                    </motion.span>
                ))}
            </div>
            <div className="absolute inset-0">
                {children.split("").map((l, i) => (
                    <motion.span
                        variants={{
                            initial: {
                                y: "100%",
                            },
                            hovered: {
                                y: 0,
                            },
                        }}
                        transition={{
                            duration: DURATION,
                            ease: "easeInOut",
                            delay: STAGGER * i,
                        }}
                        className="inline-block"
                        key={i}
                    >
                        {l}
                    </motion.span>
                ))}
            </div>
        </motion.a>
    );
};