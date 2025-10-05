import React from "react";

interface RecTimeFlameProps {
    children: React.ReactNode;
}

export default function RecTimeFlame({ children }: RecTimeFlameProps) {
    return (
        <div className="flame flex w-full flex-1 flex-col items-center">
            <div className="w-full px-6 h-full sm:max-w-115 sm:px-8 pt-2">
                {children}
            </div>
        </div>
    );
}
