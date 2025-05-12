import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence, useTransform, useMotionValue, useSpring } from "framer-motion";
import { MONTSERRAT } from "@/lib/fonts";
import { Users, Landmark, ShieldCheck, Bot, Radio, X, ArrowRight } from "lucide-react";
import { useRouter } from 'next/navigation';

interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose }) => {
    const router = useRouter();
    const modalContentRef = useRef<HTMLDivElement>(null);

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
            description: "Security, Recovery, and Instant Transfers",
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

    // Prevent wheel events from propagating to parent when modal is open
    useEffect(() => {
        if (!isOpen) return;

        const preventWheelPropagation = (e: WheelEvent) => {
            e.stopPropagation();
        };

        const modalContent = modalContentRef.current;
        if (modalContent) {
            modalContent.addEventListener('wheel', preventWheelPropagation);
        }

        // Also prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';

        return () => {
            if (modalContent) {
                modalContent.removeEventListener('wheel', preventWheelPropagation);
            }
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Animation variants
    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/90 backdrop-blur-md"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={overlayVariants}
                    onClick={onClose}
                >
                    <motion.div
                        className="relative w-full lg:max-w-5xl xl:max-w-6xl max-h-[90vh] bg-neutral-950/95 rounded-xl border border-neutral-800 flex flex-col"
                        variants={modalVariants}
                        onClick={(e) => e.stopPropagation()}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        data-carousel-scrollable="true"
                    >
                        {/* Header - Fixed at top */}
                        <div className="px-6 pt-6 pb-4 md:px-8 md:pt-8 md:pb-6 sticky top-0 bg-neutral-950/95 z-10 border-b border-neutral-800/50">
                            {/* Close button */}
                            <button
                                className="absolute top-4 right-4 md:top-6 md:right-6 text-neutral-400 hover:text-neutral-50 transition-colors"
                                onClick={onClose}
                                aria-label="Close modal"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            {/* Modal Header */}
                            <div className="text-center pr-8">
                                <h2 className={`text-2xl md:text-3xl font-bold text-neutral-50 mb-2 ${MONTSERRAT.className}`}>
                                    <span className="text-blue-400">PayZoll</span> Services
                                </h2>
                                <p className="text-neutral-400 max-w-xl mx-auto text-sm">
                                    Enterprise-grade financial solutions for modern businesses
                                </p>
                            </div>
                        </div>

                        {/* Scrollable content area */}
                        <div
                            ref={modalContentRef}
                            className="flex-1 overflow-y-auto px-6 py-4 md:px-8 md:py-6"
                            data-carousel-scrollable="true"
                        >
                            {/* Services Links */}
                            <div className="space-y-1 pb-4">
                                {services.map((service, idx) => (
                                    <ServiceLink
                                        key={`service-${idx}`}
                                        heading={service.name}
                                        subheading={service.description}
                                        icon={service.icon}
                                        onClick={() => {
                                            router.push(service.path);
                                            onClose();
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

interface IconComponentProps {
    className?: string;
}

interface ServiceLinkProps {
    heading: string;
    subheading: string;
    icon: React.ComponentType<IconComponentProps>;
    onClick: () => void;
}

const ServiceLink = ({ heading, subheading, icon: Icon, onClick }: ServiceLinkProps) => {
    const ref = useRef<HTMLDivElement | null>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const top = useTransform(mouseYSpring, [0.5, -0.5], ["40%", "60%"]);
    const left = useTransform(mouseXSpring, [0.5, -0.5], ["65%", "75%"]);
    const rotate = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            initial="initial"
            whileHover="whileHover"
            onClick={onClick}
            className="group relative flex items-center justify-between border-b border-neutral-800 py-5 transition-colors duration-300 hover:border-neutral-700 cursor-pointer overflow-hidden rounded-lg px-4"
        >
            <div className="z-10">
                <motion.span
                    variants={{
                        initial: { x: 0 },
                        whileHover: { x: -8 },
                    }}
                    transition={{
                        type: "spring",
                        staggerChildren: 0.05,
                        delayChildren: 0.1,
                    }}
                    className="relative block text-xl sm:text-2xl md:text-3xl font-bold text-neutral-400 transition-colors duration-300 group-hover:text-neutral-50"
                >
                    {heading.split("").map((l, i) => (
                        <motion.span
                            variants={{
                                initial: { x: 0 },
                                whileHover: { x: 8 },
                            }}
                            transition={{ type: "spring" }}
                            className="inline-block"
                            key={i}
                        >
                            {l}
                        </motion.span>
                    ))}
                </motion.span>
                <span className="relative z-10 mt-1 block text-xs sm:text-sm text-neutral-500 transition-colors duration-300 group-hover:text-neutral-300">
                    {subheading}
                </span>
            </div>

            <motion.div
                style={{
                    top,
                    left,
                    translateX: "-50%",
                    translateY: "-50%",
                    rotate,
                }}
                variants={{
                    initial: { scale: 0 },
                    whileHover: { scale: 1 },
                }}
                transition={{ type: "spring" }}
                className="absolute z-0 flex items-center justify-center h-16 w-16 sm:h-24 sm:w-24 md:h-32 md:w-32 bg-blue-500/10 rounded-full"
            >
                <Icon className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-blue-400" />
            </motion.div>

            <motion.div
                variants={{
                    initial: {
                        x: "25%",
                        opacity: 0,
                    },
                    whileHover: {
                        x: "0%",
                        opacity: 1,
                    },
                }}
                transition={{ type: "spring" }}
                className="relative z-10 p-2"
            >
                <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 md:text-3xl text-blue-400" />
            </motion.div>
        </motion.div>
    );
};

export default ServiceModal;