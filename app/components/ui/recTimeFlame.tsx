import React from "react";

interface RecTimeFlameProps {
    children: React.ReactNode;
}

export default function RecTimeFlame({ children }: RecTimeFlameProps) {
    return (
        <div className="flame rerative flex w-full flex-1 flex-col items-center">
            <div className="h-full w-full px-6 py-4 sm:max-w-115 sm:px-8">{children}</div>
        </div>
    );
}
