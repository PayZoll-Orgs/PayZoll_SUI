"use client";

import { useState, useEffect } from 'react';
import { Info, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

interface ResultMessageProps {
    message: {
        type: string;
        message: string;
    };
    onDismiss?: () => void; // Add callback prop
}

export function ResultMessageDisplay({ message, onDismiss }: ResultMessageProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [dismissedMessage, setDismissedMessage] = useState('');

    useEffect(() => {
        // Only show if there's a message and it's not the one that was dismissed
        if (message.message && message.message !== dismissedMessage) {
            setIsVisible(true);
            setDismissedMessage('');
        }
    }, [message, dismissedMessage]);

    if (!message.message || !isVisible) {
        return null;
    }

    let styles = {
        container: "border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200",
        icon: "text-gray-500 dark:text-gray-400"
    };

    let Icon = Info;

    switch (message.type) {
        case 'success':
            styles.container = "border-green-200 bg-green-50 text-green-800 dark:border-green-800/30 dark:bg-green-900/20 dark:text-green-400";
            styles.icon = "text-green-500 dark:text-green-400";
            Icon = CheckCircle;
            break;
        case 'error':
            styles.container = "border-red-200 bg-red-50 text-red-800 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400";
            styles.icon = "text-red-500 dark:text-red-400";
            Icon = XCircle;
            break;
        case 'info':
            styles.container = "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/30 dark:bg-blue-900/20 dark:text-blue-400";
            styles.icon = "text-blue-500 dark:text-blue-400";
            Icon = Info;
            break;
        case 'warning':
            styles.container = "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800/30 dark:bg-yellow-900/20 dark:text-yellow-400";
            styles.icon = "text-yellow-500 dark:text-yellow-400";
            Icon = AlertTriangle;
            break;
    }

    const handleDismiss = () => {
        setIsVisible(false);
        setDismissedMessage(message.message);

        // Notify parent component to clear the message
        if (onDismiss) {
            onDismiss();
        }
    };

    return (
        <div
            className={`
                flex items-center justify-between px-4 py-3 mb-4 rounded-lg border 
                shadow-sm transition-all duration-300 ease-in-out
                ${styles.container} 
                ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'}
            `}
            role="alert"
        >
            <div className="flex items-center">
                <div className={`flex-shrink-0 mr-3 ${styles.icon}`}>
                    <Icon size={18} />
                </div>
                <div className="flex-1 text-sm font-medium">
                    {message.message}
                </div>
            </div>
            <button
                onClick={handleDismiss}
                className="ml-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
                <X size={16} />
            </button>
        </div>
    );
}