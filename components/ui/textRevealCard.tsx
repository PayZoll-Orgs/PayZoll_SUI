"use client";
import React, { useEffect, useRef, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MONTSERRAT } from "@/lib/fonts";

export const TextRevealCard = ({
    text,
    revealText,
    className = "",
    startDelay = 600, // Faster initial delay
    intermediateDelay = 1000, // Time each text is shown
    onFinish,
}: {
    text: string;
    revealText: string[];
    className?: string;
    startDelay?: number;
    intermediateDelay?: number;
    onFinish: () => void;
}) => {
    const [isShowingReveal, setIsShowingReveal] = useState(false);
    const [isRevealStarted, setIsRevealStarted] = useState(false); // Keep to fade out base text
    const [currentTextIndex, setCurrentTextIndex] = useState(-1);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const isFinalReveal = currentTextIndex === revealText.length - 1;

    // Animation effect - Simplified to cycle through texts
    useEffect(() => {
        let animationTimer: NodeJS.Timeout;
        let nextTextTimer: NodeJS.Timeout | null = null;

        // Function to show text at a given index
        const showText = (textIndex: number) => {
            setCurrentTextIndex(textIndex);
            setIsShowingReveal(true);
            if (!isRevealStarted) setIsRevealStarted(true); // Trigger fade out of base text

            // If not the last text, schedule the next one
            if (textIndex < revealText.length - 1) {
                nextTextTimer = setTimeout(() => {
                    setIsShowingReveal(false); // Hide current text briefly
                    // Short delay before showing the next text
                    setTimeout(() => {
                        showText(textIndex + 1);
                    }, 50); // Small gap between texts
                }, intermediateDelay); // How long each text stays visible
            } else {
                // Last text is shown, trigger onFinish after the delay
                nextTextTimer = setTimeout(() => {
                    onFinish();
                }, intermediateDelay + 1500); // Add extra time for the last text visibility
            }
        };

        // Start the animation sequence
        animationTimer = setTimeout(() => {
            if (revealText.length > 0) {
                showText(0); // Start with the first text
            } else {
                // If no reveal text, just finish after a delay
                setTimeout(onFinish, startDelay + intermediateDelay);
            }
        }, startDelay);

        // Cleanup function
        return () => {
            clearTimeout(animationTimer);
            if (nextTextTimer) {
                clearTimeout(nextTextTimer);
            }
        };

    }, [
        startDelay,
        revealText.length,
        intermediateDelay,
        onFinish
    ]);

    const currentRevealText = currentTextIndex >= 0 ? revealText[currentTextIndex] : "";

    return (
        <div
            ref={cardRef}
            className={`w-full rounded-lg p-4 md:p-6 lg:p-8 relative overflow-hidden ${className}`}
        >
            <div className="h-auto relative flex text-center items-center justify-center overflow-hidden p-1">
                <AnimatePresence>
                    {/* AnimatePresence still useful for fade in/out */}
                    {isShowingReveal && (
                        <motion.div
                            key={`reveal-${currentTextIndex}`}
                            style={{
                                width: "100%",
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }} // Simple fade transition
                            className="absolute z-20" // Removed will-change
                        >
                            {/* Using h1 directly */}
                            <h1
                                style={isFinalReveal ? {
                                    fontSize: "clamp(4rem, 15vw, 14rem)",
                                    letterSpacing: "-0.02em",
                                    lineHeight: "0.9",
                                } : {
                                    fontSize: "clamp(3rem, 8vw, 8rem)",
                                    letterSpacing: "-0.02em",
                                    lineHeight: "0.9",
                                }}
                                // Applying text colors based on final/intermediate state
                                className={isFinalReveal ?
                                    `py-6 lg:py-10 bg-gradient-to-br dark:from-indigo-500 dark:to-purple-400 from-indigo-400 to-purple-300 text-transparent bg-clip-text ${MONTSERRAT.className} font-black dark:text-shadow-3d transform hover:scale-105 transition-transform duration-300` : // Final text with 3D effect
                                    `py-6 lg:py-10 font-bold tracking-tight text-neutral-700 dark:text-neutral-300 ${MONTSERRAT.className}` // Intermediate text color
                                }
                            >
                                {currentRevealText}
                            </h1>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* REMOVED the typewriter cursor motion.div */}

                <motion.div
                    className="overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,white,transparent)]"
                    animate={{
                        opacity: isRevealStarted ? 0.1 : 1, // Fade out base text when reveal starts
                    }}
                    transition={{
                        opacity: { duration: 0.3, ease: "easeInOut" }
                    }}
                >
                    {/* Using h1 directly */}
                    <h1
                        style={{
                            fontSize: "clamp(2.5rem, 6vw, 6rem)",
                            letterSpacing: "-0.02em",
                            lineHeight: "0.9",
                        }}
                        // Added dark mode color for the base text
                        className={`py-6 lg:py-10 font-extrabold tracking-tight text-neutral-600 dark:text-neutral-400`}
                    >
                        {text}
                    </h1>
                    <MemoizedStars />
                </motion.div>
            </div>
        </div>
    );
};

// Stars component remains the same
const Stars = () => {
    const randomMove = () => Math.random() * 4 - 2;
    const randomOpacity = () => Math.random();
    const random = () => Math.random();
    return (
        <div className="absolute inset-0">
            {[...Array(180)].map((_, i) => (
                <motion.span
                    key={`star-${i}`}
                    animate={{
                        top: `calc(${random() * 100}% + ${randomMove()}px)`,
                        left: `calc(${random() * 100}% + ${randomMove()}px)`,
                        opacity: randomOpacity(),
                        scale: [1, 1.2, 0],
                    }}
                    transition={{
                        duration: random() * 10 + 20,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{
                        position: "absolute",
                        top: `${random() * 100}%`,
                        left: `${random() * 100}%`,
                        width: `2px`,
                        height: `2px`,
                        backgroundColor: "white", // Stars remain white
                        borderRadius: "50%",
                        zIndex: 1,
                    }}
                    className="inline-block"
                ></motion.span>
            ))}
        </div>
    );
};

export const MemoizedStars = memo(Stars);