import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AuroraBackground } from "../ui/aurora";

interface StatsProps {
    className?: string;
}

const Stats: React.FC<StatsProps> = ({ className }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const wasVisibleRef = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Toggle visibility state based on intersection
                setIsVisible(entry.isIntersecting);

                // Track if it was ever visible (for animation purposes)
                if (entry.isIntersecting) {
                    wasVisibleRef.current = true;
                }
            },
            { threshold: 0.25 } // Trigger when at least 25% is visible
        );

        if (ref.current) observer.observe(ref.current);

        return () => {
            if (ref.current) observer.unobserve(ref.current);
        };
    }, []);

    const stats = [
        {
            title: "Total Visitors",
            value: 3190,
            prefix: "",
            suffix: "+",
            color: "from-blue-400 to-violet-500"
        },
        {
            title: "Total Payroll Volume Processed",
            value: 2600,
            prefix: "$",
            suffix: "",
            color: "from-emerald-400 to-teal-500"
        },
        {
            title: "Total Offramp Processed",
            value: 5000,
            prefix: "$",
            suffix: "+",
            color: "from-amber-400 to-orange-500"
        }
    ];

    return (
        <AuroraBackground className="relative">
            <div
                ref={ref}
                className={cn(
                    "w-full min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950",
                    "flex flex-col items-center justify-center py-16 px-4 md:px-6 transition-colors duration-200",
                    className
                )}
            >
                <div className="text-center mb-16 md:mb-20 max-w-4xl mx-auto">
                    <motion.h2
                        key={`title-${isVisible}`}
                        initial={{ opacity: 0, y: -20 }}
                        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight"
                    >
                        Our Growth in Numbers
                    </motion.h2>
                    <motion.p
                        key={`desc-${isVisible}`}
                        initial={{ opacity: 0 }}
                        animate={isVisible ? { opacity: 0.8 } : { opacity: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
                    >
                        Real-time insights into our platform's performance
                    </motion.p>
                </div>

                {/* Stats container - horizontal on large screens */}
                <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        {stats.map((stat, index) => (
                            <React.Fragment key={stat.title}>
                                {/* Stat item */}
                                <div className="lg:flex-1 lg:mx-4 first:lg:ml-0 last:lg:mr-0">
                                    <StatSection
                                        title={stat.title}
                                        value={stat.value}
                                        prefix={stat.prefix}
                                        suffix={stat.suffix}
                                        delay={index * 0.2}
                                        isVisible={isVisible}
                                        resetKey={wasVisibleRef.current ? isVisible.toString() : "initial"}
                                    />
                                </div>

                                {/* Dividers - horizontal on mobile, vertical on desktop */}
                                {index < stats.length - 1 && (
                                    <>
                                        {/* Mobile divider (horizontal) */}
                                        <motion.div
                                            initial={{ opacity: 0, scaleX: 0 }}
                                            animate={isVisible ? { opacity: 0.6, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
                                            transition={{ duration: 0.6, delay: index * 0.2 + 0.4 }}
                                            className={`h-px w-full my-6 bg-gradient-to-r ${stat.color} transform origin-left lg:hidden`}
                                        />

                                        {/* Desktop divider (vertical) */}
                                        <motion.div
                                            initial={{ opacity: 0, scaleY: 0 }}
                                            animate={isVisible ? { opacity: 0.6, scaleY: 1 } : { opacity: 0, scaleY: 0 }}
                                            transition={{ duration: 0.6, delay: index * 0.2 + 0.4 }}
                                            className={`hidden lg:block w-px h-40 mx-8 bg-gradient-to-b ${stat.color} transform origin-top`}
                                        />
                                    </>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </AuroraBackground>
    );
};

interface StatSectionProps {
    title: string;
    value: number;
    prefix?: string;
    suffix?: string;
    delay?: number;
    isVisible: boolean;
    resetKey: string;
}

const StatSection: React.FC<StatSectionProps> = ({
    title,
    value,
    prefix = "",
    suffix = "",
    delay = 0,
    isVisible,
    resetKey
}) => {
    return (
        <motion.div
            key={`stat-${resetKey}-${delay}`}
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay }}
            className="py-6 md:py-8 lg:py-0 flex flex-col"
        >
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4 lg:mb-6 lg:text-center">
                {title}
            </h3>

            <div className="lg:text-center">
                <AnimatedCounter
                    value={value}
                    prefix={prefix}
                    suffix={suffix}
                    isVisible={isVisible}
                    resetKey={resetKey}
                />
            </div>
        </motion.div>
    );
};

interface AnimatedCounterProps {
    value: number;
    prefix?: string;
    suffix?: string;
    isVisible: boolean;
    resetKey: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
    value,
    prefix = "",
    suffix = "",
    isVisible,
    resetKey
}) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isVisible) {
            setCount(0);
            return;
        }

        const duration = 2000; // animation duration in ms
        const startTime = Date.now();

        const runAnimation = () => {
            const now = Date.now();
            const progress = Math.min(1, (now - startTime) / duration);

            // Easing function for smoother animation
            const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4);
            const easedProgress = easeOutQuart(progress);

            setCount(easedProgress * value);

            if (progress < 1 && isVisible) {
                requestAnimationFrame(runAnimation);
            } else {
                setCount(isVisible ? value : 0);
            }
        };

        const animationId = requestAnimationFrame(runAnimation);

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [isVisible, resetKey, value]);

    const formattedValue = Math.round(count).toLocaleString();

    return (
        <div className="overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={`counter-${resetKey}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white tracking-tight"
                >
                    {prefix}{formattedValue}{suffix}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default Stats;