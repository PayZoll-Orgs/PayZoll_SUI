"use client";
import { use, useEffect } from "react";

// app/not-found.tsx
export default function NotFound() {
    return (
        <div className="flex h-screen flex-col items-center justify-center dark:bg-black dark:text-white text-black">
            <div className="max-w-3xl">
                <p className="text-4xl font-bold">Oops!<br /> The service you are looking for is upcoming. Thank You for yout patience.</p>
            </div>
        </div>
    );
}
