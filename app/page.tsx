"use client"

import React, { useEffect } from 'react'
import useFullPageLoader from '@/hooks/usePageLoader'
import Loader from '@/components/ui/loader'
import Splashscreen from '@/app/pages/SplashScreen';
import { motion, AnimatePresence } from 'framer-motion'
import Home from '@/app/pages/Home'; // Assuming Hero is the component exported from '@/pages/Home'


const LandingPage = () => {
    const [isSplashscreenVisible, setSplashscreenVisible] = React.useState(false);
    const [isFirstLoad, setIsFirstLoad] = React.useState(true);

    useEffect(() => {
        const hasSeenSplash = localStorage.getItem('hasSeenSplash') === 'true';
        if (!hasSeenSplash) {
            setSplashscreenVisible(true);
            localStorage.setItem('hasSeenSplash', 'true');
        } else {
            setSplashscreenVisible(false);
        }
        setIsFirstLoad(false);
    }, []);

    const handleShowSplash = () => {
        setSplashscreenVisible(true);
    };

    if (isFirstLoad) return null;

    return (
        <>
            <AnimatePresence mode="wait">
                {isSplashscreenVisible ? (
                    <motion.div
                        key="splashscreen"
                        initial={{ opacity: 1 }}
                        exit={{
                            opacity: 0,
                            transition: { duration: 0.8, ease: "easeInOut" }
                        }}
                        className="fixed inset-0 z-50 dark:bg-black"
                    >
                        <Splashscreen onFinish={() => {
                            setSplashscreenVisible(false);
                        }} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="home-content"
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: 1,
                            transition: {
                                duration: 0.8,
                                ease: "easeInOut",
                                delay: 0.2
                            }
                        }}
                        className="bg-transparent"
                    >
                        <Home onShowSplash={handleShowSplash} />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

const Landing = useFullPageLoader(LandingPage, <Loader />);

export default Landing;