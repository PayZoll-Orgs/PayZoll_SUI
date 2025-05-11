"use client";
import React from "react";
import { motion } from "framer-motion";
import { MONTSERRAT } from "@/lib/fonts";
import { Users, Landmark, ShieldCheck, Bot, Radio, Home } from "lucide-react";
import { useRouter } from 'next/navigation';
import { WavyBackground } from "@/components/ui/wavyBackground";
import useFullPageLoader from "@/hooks/usePageLoader";
import Loader from "@/components/ui/loader";
import { CardSpotlight } from "@/components/ui/cardSpotlight";

const ServicesPage = () => {
    const router = useRouter();

    // Define services with icons, paths and descriptions
    const services = [
        {
            name: "Global Payroll",
            description: "Seamless payroll for your global team",
            icon: Users,
            path: "/pages/auth?mode=payroll"
        },
        {
            name: "Fiat On/Off Ramps",
            description: "Convert between crypto and traditional currencies",
            icon: Landmark,
            path: "/pages/ramps"
        },
        {
            name: "P2P.new",
            description: "Send money directly, securely, and instantly",
            icon: ShieldCheck,
            path: "/pages/auth?mode=p2p"
        },
        {
            name: "AI Assistants",
            description: "Smart financial assistance powered by AI",
            icon: Bot,
            path: "/pages/ai"
        },
        {
            name: "Payment Streaming",
            description: "Continuous payment flows in real-time",
            icon: Radio,
            path: "/pages/streaming"
        }
    ];

    const handleRedirect = (servicePath: string) => {
        router.push(servicePath);
    };

    // Simplified animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.2,
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 50,
                damping: 15
            }
        }
    };

    return (
        <WavyBackground
            backgroundFill="black"
            speed="fast"
            waveOpacity={0.3}
            blur={10}
        >
            <div className="w-full h-screen flex flex-col overflow-y-auto">
                {/* Close button */}
                <motion.button
                    className="fixed top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-white transition-colors z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => { router.replace("/") }}
                    aria-label="Return home"
                >
                    <Home className="h-5 w-5 sm:h-6 sm:w-6" />
                </motion.button>

                <div className="w-full max-w-5xl mx-auto flex items-center justify-center flex-col m-auto">
                    {/* Header */}
                    <motion.div
                        className="text-center mb-8 sm:mb-10 md:mb-12"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <h2 className={`text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-2 sm:mb-3 ${MONTSERRAT.className}`}>
                            <span className="text-blue-400">PayZoll</span> Services
                        </h2>
                        <p className="text-gray-300 max-w-xl mx-auto text-xs sm:text-sm md:text-base px-4">
                            Enterprise-grade financial solutions for modern businesses
                        </p>
                    </motion.div>

                    {/* Services Grid */}
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {services.map((service, idx) => (
                            <CardSpotlight key={`service-${idx}`} className="bg-black/50 dark:bg-black/60 rounded-2xl">
                                <motion.div
                                    key={`service-${idx}`}
                                    variants={itemVariants}
                                    className="flex flex-col relative "
                                    onClick={() => handleRedirect(service.path)}
                                >
                                    <div className="cursor-pointer">
                                        <div className="mb-3 sm:mb-4 text-blue-400 flex items-center justify-center">
                                            <service.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        <h3 className="text-white sm:font-bold text-lg sm:text-lg md:test-xl  mb-1 sm:mb-2 text-center ">
                                            {service.name}
                                        </h3>
                                        <p className="text-gray-100 text-xs sm:text-sm md:text-md lg:text-lg sm:font-medium mt-auto">
                                            {service.description}
                                        </p>
                                    </div>
                                </motion.div>
                            </CardSpotlight>
                        ))}
                    </motion.div>
                </div>
            </div>
        </WavyBackground>
    );
}

const Services = useFullPageLoader(ServicesPage, <Loader />);
export default Services;