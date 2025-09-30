import React from "react";

interface RecTimeFlameProps {
    children: React.ReactNode;
}

export default function RecTimeFlame({ children }: RecTimeFlameProps) {
    return (
        <div className="flame flex w-full flex-col items-center">
            <div className="w-full max-w-screen px-8 sm:max-w-115">{children}</div>
        </div>
    );
}
