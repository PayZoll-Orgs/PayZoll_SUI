import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Truncates an Ethereum address to show a specific number of characters at the beginning and end
 * @param address The full address to truncate
 * @param startChars Number of characters to show at the start
 * @param endChars Number of characters to show at the end
 * @returns The truncated address with ellipsis
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
    if (!address) return '';
    if (address.length <= startChars + endChars) return address;

    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

