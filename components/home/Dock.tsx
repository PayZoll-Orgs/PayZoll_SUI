import React from "react";
import { FloatingDock } from "@/components/ui/floatingDock";
import {
    IconHome,
    IconListCheck,
    IconMail,
    IconUser,
    IconMoodWink, // Changed icon for Splash
    IconReportAnalytics
} from "@tabler/icons-react";

export function Dock({
    activeSection = 0,
    onSectionChange,
    onShowSplash // Accept the new prop
}: {
    activeSection?: number,
    onSectionChange: (index: number) => void,
    onShowSplash?: () => void // Make it optional if Hero might not always pass it
}) {
    // Combined navigation items
    const navItems = [
        // Section links (internal navigation)
        {
            title: "Intro",
            icon: <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
            href: "#intro", // Keep href for semantic meaning, onClick overrides
            type: "section",
            sectionIndex: 0
        },
        {
            title: "Features",
            icon: <IconListCheck className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
            href: "#features",
            type: "section",
            sectionIndex: 1
        },
        {
            title: "Analytics",
            icon: <IconReportAnalytics className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
            href: "#data",
            type: "section",
            sectionIndex: 2
        },
        {
            title: "Contact",
            icon: <IconMail className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
            href: "#footer",
            type: "section",
            sectionIndex: 3
        },
        // Splash screen trigger
        {
            title: "Splash",
            icon: <IconMoodWink className="h-full w-full text-neutral-500 dark:text-neutral-300" />, // Changed icon
            href: "#", // Dummy href, onClick handles action
            onClick: onShowSplash, // Use the passed handler
            type: "action" // Changed type for clarity
        },
        // External page links (keep as before)
        {
            title: "About",
            icon: <IconUser className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
            href: "/pages/about", // Assuming these are actual routes
            type: "link"
        },
    ];

    // Transform the items for the FloatingDock component
    const dockItems = navItems.map(item => ({
        title: item.title,
        icon: item.icon,
        href: item.href || "#", // Provide a default href if missing
        // Assign onClick based on type
        onClick: item.type === "section"
            ? () => onSectionChange(item.sectionIndex!)
            : item.onClick // Use existing onClick for 'action' or 'link' types if provided
    }));

    // Calculate active index based on the current scrollable section
    const getActiveIndex = () => {
        // Find the index within the *full* navItems array that corresponds
        // to the currently active *scrollable section*.
        const activeItemIndex = navItems.findIndex(item =>
            item.type === "section" && item.sectionIndex === activeSection
        );
        // Return the found index, or -1 (or undefined) if no section is active (shouldn't happen with default 0)
        return activeItemIndex !== -1 ? activeItemIndex : undefined;
    };


    return (
        // Removed wrapping div, let the parent component handle positioning
        <FloatingDock
            items={dockItems}
            activeIndex={getActiveIndex()}
        // Add classNames if needed for positioning/styling the dock itself
        // desktopClassName="fixed bottom-4 left-1/2 -translate-x-1/2 z-30"
        // mobileClassName="fixed bottom-4 right-4 z-30" // Example mobile positioning
        />
    );
}