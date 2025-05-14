"use client";

import React, { useEffect, useState, ComponentType, ReactElement } from 'react';

function useFullPageLoader<P extends object>(
    WrappedComponent: ComponentType<P>,
    fallback: ReactElement
): ComponentType<P> {

    return function LoaderWrapper(props: P): ReactElement {
        const [isReady, setIsReady] = useState<boolean>(false);

        useEffect(() => {
            if (document.readyState === 'complete') {
                setIsReady(true);
            } else {
                const handleLoad = () => setIsReady(true);
                window.addEventListener('load', handleLoad);
                return () => window.removeEventListener('load', handleLoad);
            }
        }, []);

        return isReady ? <WrappedComponent {...props} /> : fallback;
    };
}

export default useFullPageLoader;
