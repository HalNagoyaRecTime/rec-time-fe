import React from "react";

interface RecTimeFlameProps {
    children: React.ReactNode;
}

export default function RecTimeFlame({ children }: RecTimeFlameProps) {
    return (
        <div className="flame rerative flex w-full flex-1 flex-col items-center">
            <div className="h-full w-full px-6 pt-4 pb-6 sm:max-w-115 sm:px-8 [@media(max-height:680px)]:pt-1 [@media(max-height:680px)]:pb-0">
                {children}
            </div>
        </div>
    );
}
