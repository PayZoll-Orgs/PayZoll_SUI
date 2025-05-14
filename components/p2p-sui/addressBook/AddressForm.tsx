import { useState, useEffect } from 'react';

export default function AddressForm({ initialData = null, onSubmit, onCancel }: {
    initialData?: {
        nickname: string;
        walletAddress: string;
        email?: string;
    } | null;
    onSubmit: (data: { nickname: string; walletAddress: string; email: string }) => void;
    onCancel: () => void;
}) {
    const [nickname, setNickname] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState<{ nickname?: string; walletAddress?: string; email?: string }>({});

    useEffect(() => {
        if (initialData) {
            setNickname(initialData.nickname);
            setWalletAddress(initialData.walletAddress);
            setEmail(initialData.email || '');
        }
    }, [initialData]);

    const validate = () => {
        const newErrors: any = {};
        if (!nickname.trim()) newErrors.nickname = 'Nickname is required';
        if (!walletAddress.trim()) newErrors.walletAddress = 'Wallet address is required';

        // Email validation
        if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Basic SUI wallet validation (starts with 0x followed by 64 hex chars)
        if (walletAddress && !walletAddress.match(/^0x[a-fA-F0-9]{64}$/)) {
            newErrors.walletAddress = 'Invalid SUI wallet address format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        if (validate()) {
            onSubmit({
                nickname,
                walletAddress,
                email
            });
            if (!initialData) {
                setNickname('');
                setWalletAddress('');
                setEmail('');
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="border-b border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-transparent backdrop-blur-md">
            <div className="space-y-4">
                <div>
                    <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nickname
                    </label>
                    <input
                        id="nickname"
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className={`w-full p-2 bg-transparent border-b focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white ${errors.nickname ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                        placeholder="Enter a nickname"
                    />
                    {errors.nickname && <p className="text-red-500 text-xs mt-1">{errors.nickname}</p>}
                </div>

                <div>
                    <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Wallet Address
                    </label>
                    <input
                        id="walletAddress"
                        type="text"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className={`w-full p-2 bg-transparent border-b focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white ${errors.walletAddress ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                        placeholder="0x..."
                    />
                    {errors.walletAddress && <p className="text-red-500 text-xs mt-1">{errors.walletAddress}</p>}
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full p-2 bg-transparent border-b focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                        placeholder="example@domain.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border-b border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100/20 dark:hover:bg-gray-700/20"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white rounded-md shadow-sm"
                >
                    {initialData ? 'Update' : 'Save'}
                </button>
            </div>
        </form>
    );
}