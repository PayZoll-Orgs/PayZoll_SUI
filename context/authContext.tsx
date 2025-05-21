"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { authApi } from '@/api';
// import { LoginFormData, RegisterFormData } from '@/lib/interfaces';
// Import react-icons
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiClock, FiUserPlus, FiSlash, FiLock } from 'react-icons/fi';

// Update interfaces to include authMode
interface LoginFormData {
    email: string;
    password: string;
    authMode?: string;
}

interface RegisterFormData {
    email: string;
    password: string;
    confirmPassword: string;
    company: string;
    authMode?: string;
}

// Example structure for a custom toast component
const CustomToast = ({ t, icon, title, message, borderColor }: { t: any, icon: ReactNode, title: string, message: string, borderColor: string }) => (
    <div
        className={`${t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white dark:bg-black dark:text-white text-black shadow-lg rounded-lg pointer-events-auto flex border-l-4 ${borderColor}`}
    >
        <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                    {/* Icon is now passed directly */}
                    {icon}
                </div>
                <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {title}
                    </p>
                    <p className="mt-1 text-sm text-gray-800 dark:text-gray-400">
                        {message}
                    </p>
                </div>
            </div>
        </div>
    </div>
);


// User interface
interface User {
    email: string,
    isAdmin: boolean,
    company: string,
}

// JWT token interface
interface DecodedToken {
    exp: number;
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isAdmin: boolean | undefined;
    logout: () => void;
    login: (credentials: LoginFormData) => Promise<{ success: boolean; error?: string }>;
    register: (data: RegisterFormData) => Promise<{ success: boolean; error?: string }>;
}

// Routes configuration
const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/pages/services', '/pages/auth', '/pages/ramps', '/pages/admin', '/pages/p2p', '/pages/about', '/pages/payroll', '/pages/streaming', '/pages/audit'];
const ADMIN_ROUTES = ['/pages/payroll-sui', '/pages/p2p-sui'];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [tokenExpiryTime, setTokenExpiryTime] = useState<number | null>(null);
    const [initialCheckComplete, setInitialCheckComplete] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    // Parse JWT token
    const parseToken = (token: string): DecodedToken | null => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64).split('').map(c => {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join('')
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Error parsing token:', e);
            return null;
        }
    };

    // Check token expiration
    const isTokenExpired = (expiryTime: number): boolean => {
        if (!expiryTime) return true;
        const currentTime = Date.now() / 1000;
        return currentTime > expiryTime;
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
        setTokenExpiryTime(null);
        router.replace('/');
    };

    // Modified login function with mode handling
    const login = async (credentials: LoginFormData): Promise<{ success: boolean; error?: string }> => {
        try {
            setIsLoading(true);
            const response = await authApi.login(credentials);

            if (response?.token) {
                const decodedToken = parseToken(response.token);
                if (decodedToken) {
                    setTokenExpiryTime(decodedToken.exp);
                    localStorage.setItem('authToken', response.token);
                    // Store auth mode if present
                    if (credentials.authMode) {
                        localStorage.setItem('authMode', credentials.authMode);
                    }
                } else {
                    throw new Error("Invalid token structure received");
                }
            } else {
                throw new Error("No authentication token received");
            }

            if (response?.safeUser) {
                setUser(response.safeUser);
                localStorage.setItem('user', JSON.stringify(response.safeUser));

                toast.custom((t) => (
                    <CustomToast
                        t={t}
                        icon={<FiCheckCircle className="h-6 w-6 text-green-500" />}
                        title="Login Successful"
                        message={`Welcome back, ${response.safeUser.email}!`}
                        borderColor="border-green-500"
                    />
                ));

                // Redirect based on mode
                if (credentials.authMode === 'payroll') {
                    router.push("/pages/payroll-sui");
                } else if (credentials.authMode === 'p2p') {
                    router.push("/pages/p2p-sui");
                } else if (response.safeUser.isAdmin) {
                    router.push("/pages/payroll-sui");
                } else {
                    router.push("/pages/employee");
                }

                return { success: true };
            } else {
                throw new Error("Invalid user data received");
            }
        } catch (error: any) {
            // Error handling remains the same
            console.error("Login error:", error);
            const errorMessage = error.response?.data?.message || "Failed to login. Please try again.";
            toast.custom((t) => (
                <CustomToast
                    t={t}
                    icon={<FiXCircle className="h-6 w-6 text-red-500" />}
                    title="Login Failed"
                    message={errorMessage}
                    borderColor="border-red-500"
                />
            ));
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    // Modified register function with mode handling
    const register = async (data: RegisterFormData): Promise<{ success: boolean; error?: string }> => {
        try {
            setIsLoading(true);
            await authApi.register(data);

            toast.custom((t) => (
                <CustomToast
                    t={t}
                    icon={<FiUserPlus className="h-6 w-6 text-green-500" />}
                    title="Registration Successful"
                    message="Account created. Logging you in..."
                    borderColor="border-green-500"
                />
            ), { duration: 2000 });

            // Pass the mode to login
            return await login({
                email: data.email,
                password: data.password,
                authMode: data.authMode
            });
        } catch (error: any) {
            // Error handling remains the same
            console.error("Registration error:", error);
            const errorMessage = error.response?.data?.message || "Failed to register. Please try again.";
            toast.custom((t) => (
                <CustomToast
                    t={t}
                    icon={<FiXCircle className="h-6 w-6 text-red-500" />}
                    title="Registration Failed"
                    message={errorMessage}
                    borderColor="border-red-500"
                />
            ));
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    // Set up token expiry monitoring
    useEffect(() => {
        if (!tokenExpiryTime) return;

        const currentTime = Date.now() / 1000;
        const timeUntilExpiry = tokenExpiryTime - currentTime;

        let warningTimer: NodeJS.Timeout | null = null;
        let logoutTimer: NodeJS.Timeout | null = null;

        // Show warning 5 minutes before expiry
        if (timeUntilExpiry > 5 * 60) {
            warningTimer = setTimeout(() => {
                // Custom Warning Toast
                toast.custom((t) => (
                    <CustomToast
                        t={t}
                        // Use react-icons component
                        icon={<FiAlertTriangle className="h-6 w-6 text-yellow-500" />}
                        title="Session Warning"
                        message="Your session will expire in 5 minutes."
                        borderColor="border-yellow-500" // Amber/Yellow border
                    />
                ), { duration: 10000 }); // Longer duration for warning
            }, (timeUntilExpiry - 5 * 60) * 1000);

            // Set up auto logout when token expires
            logoutTimer = setTimeout(() => {
                logout();
                // Custom Error Toast for expiry
                toast.custom((t) => (
                    <CustomToast
                        t={t}
                        // Use react-icons component
                        icon={<FiClock className="h-6 w-6 text-red-500" />}
                        title="Session Expired"
                        message="Your session has ended. Please login again."
                        borderColor="border-red-500"
                    />
                ));
            }, timeUntilExpiry * 1000);
        } else if (timeUntilExpiry > 0) {
            // Less than 5 minutes left but still valid
            logoutTimer = setTimeout(() => {
                logout();
                // Custom Error Toast for expiry
                toast.custom((t) => (
                    <CustomToast
                        t={t}
                        // Use react-icons component
                        icon={<FiClock className="h-6 w-6 text-red-500" />}
                        title="Session Expired"
                        message="Your session has ended. Please login again."
                        borderColor="border-red-500"
                    />
                ));
            }, timeUntilExpiry * 1000);
        } else {
            // Already expired (only show toast if user was likely logged in)
            if (user) {
                logout();
                // Custom Error Toast for expiry
                toast.custom((t) => (
                    <CustomToast
                        t={t}
                        // Use react-icons component
                        icon={<FiClock className="h-6 w-6 text-red-500" />}
                        title="Session Expired"
                        message="Your session has ended. Please login again."
                        borderColor="border-red-500"
                    />
                ));
            }
        }

        return () => {
            if (warningTimer) clearTimeout(warningTimer);
            if (logoutTimer) clearTimeout(logoutTimer);
        };
    }, [tokenExpiryTime, user]); // Added user dependency

    // Check authentication status
    const checkAuthStatus = async () => {
        const token = localStorage.getItem('authToken');
        const userJson = localStorage.getItem('user');

        if (!token || !userJson) {
            setUser(null);

            // Only redirect from protected routes
            if (!PUBLIC_ROUTES.includes(pathname || '') && pathname !== '/') {
                router.replace('/');
            }

            setIsLoading(false);
            setInitialCheckComplete(true);
            return false;
        }

        try {
            // Parse and validate token
            const decodedToken = parseToken(token);
            if (!decodedToken || isTokenExpired(decodedToken.exp)) {
                throw new Error("Token expired");
            }

            // Store expiry time for monitoring
            setTokenExpiryTime(decodedToken.exp);

            const userData = JSON.parse(userJson) as User;
            setUser(userData);

            // Check admin routes access
            if (ADMIN_ROUTES.some(route => pathname?.startsWith(route)) && !userData.isAdmin) {
                // Custom Error Toast for permissions
                toast.custom((t) => (
                    <CustomToast
                        t={t}
                        // Use react-icons component
                        icon={<FiSlash className="h-6 w-6 text-red-500" />}
                        title="Access Denied"
                        message="You don't have permission to access this page."
                        borderColor="border-red-500"
                    />
                ));
                router.replace('/');
                setIsLoading(false);
                setInitialCheckComplete(true);
                return false;
            }

            setIsLoading(false);
            setInitialCheckComplete(true);
            return true;
        } catch (e) {
            // Token invalid or expired
            // Custom Error Toast for expiry/invalid token
            toast.custom((t) => (
                <CustomToast
                    t={t}
                    // Use react-icons component
                    icon={<FiClock className="h-6 w-6 text-red-500" />}
                    title="Session Expired"
                    message="Your session is invalid or has ended. Please login again."
                    borderColor="border-red-500"
                />
            ));
            logout();
            setIsLoading(false);
            setInitialCheckComplete(true);
            return false;
        }
    };

    // Initial auth check on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    // Check auth on route changes, but ONLY after initial check
    useEffect(() => {
        if (initialCheckComplete) {
            // Don't set loading to true on route changes
            const token = localStorage.getItem('authToken');
            const userJson = localStorage.getItem('user');

            if (!token || !userJson) {
                if (!PUBLIC_ROUTES.includes(pathname || '') && pathname !== '/') {
                    router.replace('/');
                }
                return;
            }

            // Check admin routes access
            if (user && ADMIN_ROUTES.some(route => pathname?.startsWith(route)) && !user.isAdmin) {
                // Custom Error Toast for permissions
                toast.custom((t) => (
                    <CustomToast
                        t={t}
                        // Use react-icons component
                        icon={<FiSlash className="h-6 w-6 text-red-500" />}
                        title="Access Denied"
                        message="You don't have permission to access this page."
                        borderColor="border-red-500"
                    />
                ));
                router.replace('/');
            }
        }
    }, [pathname, initialCheckComplete, user]);

    // Ping server every 60 seconds
    useEffect(() => {
        const pingServer = async () => {
            try {
                const response = await authApi.ping();
                if (response) {
                    console.log("Ping successful:", response);
                } else {
                    console.log("Ping failed");
                }
            } catch (error) {
                console.log("Ping error:", error);
            }
        };

        // Call ping immediately and then every 45 seconds
        const intervalId = setInterval(pingServer, 45000);

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                isAdmin: user?.isAdmin,
                logout,
                login,
                register
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Protected Route Component with loading indicator
export const ProtectedRoute = ({
    route,
    children,
    requireAdmin = false
}: {
    route: string;
    children: ReactNode;
    requireAdmin?: boolean;
}) => {
    const { user, isLoading, isAdmin } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Don't render until we know authentication status
        if (!isLoading) {
            if (!user) {
                router.replace('/pages/auth');
                return;
            }

            if (requireAdmin && !user.isAdmin) {
                // Custom Error Toast for admin requirement
                toast.custom((t) => (
                    <CustomToast
                        t={t}
                        // Use react-icons component
                        icon={<FiLock className="h-6 w-6 text-red-500" />}
                        title="Admin Required"
                        message="You need administrator privileges for this area."
                        borderColor="border-red-500"
                    />
                ));
                router.replace('/');
                return;
            }

            setIsAuthorized(true);
        } else {
            // If loading, don't redirect yet, wait for auth check
            // router.push(`/${route}`) // This line might cause unnecessary navigation while loading
        }
    }, [user, isLoading, requireAdmin, isAdmin, router, route]); // Added route to dependency array

    // Show loading indicator while checking auth status
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen min-w-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Show nothing if not authorized (will redirect via useEffect)
    if (!isAuthorized) {
        return null;
    }

    return <>{children}</>;
};