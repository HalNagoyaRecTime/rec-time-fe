import React from "react";

interface RecTimeFlameProps {
    children: React.ReactNode;
}

export default function RecTimeFlame({ children }: RecTimeFlameProps) {
    return (
        <div className="flex w-full flex-col items-center pt-5">
            <div className="max-w-200 min-w-90 px-8">{children}</div>
        </div>
    );
}
