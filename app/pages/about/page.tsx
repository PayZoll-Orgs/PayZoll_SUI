import { cn } from "@/lib/utils";
import {
    Wallet,
    ArrowLeftRight,
    Users,
    Lock,
    Bot,
    ShieldCheck,
    Building,
    Award
} from "lucide-react";

export default function AboutSection() {
    const aboutInfo = {
        title: "PayZoll",
        tagline: "Web3 Native Financial Infrastructure",
        description: "PayZoll is your all-in-one financial umbrella, seamlessly blending decentralized and centralized rails into a single, turnkey ecosystem. From on-chain smart-contract payroll, streaming payments, and trustless P2P transfers, to fiat on-ramps/off-ramps, KYC/AML compliance, and AI-powered automation, PayZoll empowers businesses and individuals with the full spectrum of Web3-native and traditional finance services—secure, scalable, and future-proof."
    };

    const features = [
        {
            title: "Payroll",
            description: "Automated, gas-abstracted disbursements that work on-chain or off-chain, eliminating manual overhead and ensuring employees get paid on time in the token of their choice.",
            icon: <Wallet />,
            status: "Live"
        },
        {
            title: "Streaming Payments",
            description: "Real-time money flows for freelancers, DAOs, and distributed teams—no more batch cycles or waiting periods, just continuous value transfer whenever and wherever it's needed.",
            icon: <ArrowLeftRight />,
            status: "Upcoming"
        },
        {
            title: "Secure P2P Transfers",
            description: "Trust-minimized, recoverable person-to-person transfers with built-in dispute resolution and recovery options, making peer payments reliable and user-friendly.",
            icon: <Users />,
            status: "Live"
        },
        {
            title: "Fiat On/Off-Ramps",
            description: "Seamless integration with banking rails and fiat bridges—move money in and out of crypto with a single click, backed by institutional liquidity and compliance.",
            icon: <Building />,
            status: "Live"
        },
        {
            title: "AI-Powered Agents",
            description: "Smart, on-chain bots that automate recurring workflows—payroll runs, subscription billing, compliance checks—so you can focus on growth, not grunt work.",
            icon: <Bot />,
            status: "Partial"
        },
        {
            title: "zk-KYC & Anonymous Auth",
            description: "Privacy-preserving, zero-knowledge identity and data storage that meets regulatory requirements without exposing sensitive user information.",
            icon: <ShieldCheck />,
            status: "Planned"
        },
        {
            title: "DAO Governance",
            description: "Manage treasury and distribution logic via decentralized autonomous organization, ensuring transparent and community-driven financial controls.",
            icon: <Lock />,
            status: "Upcoming"
        },
        {
            title: "Multi-Chain Support",
            description: "Mainnet Live on BNB Chain, Arbitrum, Polygon, and Aptos, with more chains coming soon to provide maximum flexibility and interoperability.",
            icon: <Award />,
            status: "Live"
        },
    ];

    const achievements = [
        "Winner – ETHIndia Hackathon",
        "Winner – BNB Chain Hackathon Q4",
        "Winner – Stellar Build Hackathon",
        "Selected for EduChain OpenCampus incubation program",
        "Mainnet Live on BNB Chain, Arbitrum, Polygon, and Aptos"
    ];

    return (
        <div className="bg-white dark:bg-neutral-950 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <div className="text-center mb-20">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-neutral-900 dark:text-white">{aboutInfo.title}</h1>
                    <p className="text-xl md:text-2xl mb-6 text-blue-600 dark:text-blue-400">{aboutInfo.tagline}</p>
                    <p className="max-w-3xl mx-auto text-neutral-600 dark:text-neutral-300">{aboutInfo.description}</p>
                </div>

                {/* Vision Section */}
                <div className="mb-20">
                    <h2 className="text-3xl font-bold mb-8 text-center text-neutral-900 dark:text-white">Our Vision</h2>
                    <div className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-xl shadow-sm">
                        <p className="text-lg text-neutral-700 dark:text-neutral-300 mb-6">
                            PayZoll unifies TradFi and DeFi into one Web3-native financial umbrella, offering a seamless experience for both crypto-native projects and traditional enterprises.
                        </p>
                        <p className="text-lg text-neutral-700 dark:text-neutral-300">
                            Our end-to-end vision is to provide every piece of the financial lifecycle—from on-chain asset acquisition all the way through to fiat settlements—in a single, one-click experience that feels as familiar as your favorite payment app.
                        </p>
                    </div>
                </div>

                {/* Features Section */}
                <div className="mb-20">
                    <h2 className="text-3xl font-bold mb-8 text-center text-neutral-900 dark:text-white">Our Core Modules</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10">
                        {features.map((feature, index) => (
                            <Feature key={feature.title} {...feature} index={index} />
                        ))}
                    </div>
                </div>

                {/* Achievements Section */}
                <div className="mb-20">
                    <h2 className="text-3xl font-bold mb-8 text-center text-neutral-900 dark:text-white">Our Achievements</h2>
                    <div className="flex flex-wrap justify-center gap-4">
                        {achievements.map((achievement, i) => (
                            <div
                                key={i}
                                className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium"
                            >
                                {achievement}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Team Section */}
                <div>
                    <h2 className="text-3xl font-bold mb-8 text-center text-neutral-900 dark:text-white">Meet Our Team</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <TeamMember
                            name="Abhinav Pangaria"
                            role="Co-Founder & Lead Engineer"
                            description="Full-stack & blockchain developer with expertise in Solidity, Move, Rust, and MERN stack (Next, React-Native). Leads development of smart contracts and frontend & backend development."
                        />
                        <TeamMember
                            name="Vaibhav Panwar"
                            role="Founder"
                            description="Business development expert with entrepreneurial experience. Previously managed North-East India operations for an e-commerce startup with 100+ team members."
                        />
                        <TeamMember
                            name="Sarthak Bansal"
                            role="Founding Engineer"
                            description="Lead Backend Engineer and P2P Architect with expertise in Solidity, Node.js, MERN stack, auditing and security."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

const Feature = ({
    title,
    description,
    icon,
    index,
    status
}: {
    title: string;
    description: string;
    icon: React.ReactNode;
    index: number;
    status: string;
}) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "Live":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
            case "Upcoming":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
            case "Partial":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
            case "Planned":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
        }
    };

    return (
        <div
            className={cn(
                "flex flex-col lg:border-r py-10 relative group/feature dark:border-neutral-800",
                (index === 0 || index === 4) && "lg:border-l dark:border-neutral-800",
                index < 4 && "lg:border-b dark:border-neutral-800"
            )}
        >
            {index < 4 && (
                <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
            )}
            {index >= 4 && (
                <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
            )}
            <div className="flex items-center justify-between mb-4 relative z-10 px-10">
                <div className="text-neutral-600 dark:text-neutral-400">
                    {icon}
                </div>
                <div className={cn("text-xs px-2 py-1 rounded-full", getStatusColor(status))}>
                    {status}
                </div>
            </div>
            <div className="text-lg font-bold mb-2 relative z-10 px-10">
                <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
                <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
                    {title}
                </span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
                {description}
            </p>
        </div>
    );
};

const TeamMember = ({
    name,
    role,
    description
}: {
    name: string;
    role: string;
    description: string;
}) => {
    return (
        <div className="bg-neutral-50 dark:bg-neutral-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                <span className="text-xl font-bold">{name.charAt(0)}</span>
            </div>
            <h3 className="text-xl font-bold mb-1 text-neutral-800 dark:text-neutral-100">{name}</h3>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3">{role}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">{description}</p>
        </div>
    );
};