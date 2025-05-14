'use client';

import React from 'react';

const Loader: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen min-w-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-3 border-b-2 border-blue-500"></div>
        </div>
    );
};

export default Loader;
