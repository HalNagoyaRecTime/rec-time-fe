import React from "react";

interface HamburgerMenuBtnProps {
    onClick: () => void;
    isOpen: boolean;
}

export default function HamburgerMenuBtn({ onClick, isOpen }: HamburgerMenuBtnProps) {
    return (
        <button
            onClick={onClick}
            className="absolute top-4 left-4 !z-99 flex h-10 w-10 cursor-pointer flex-col items-center justify-center gap-1 p-2"
        >
            <div
                className={`h-1 w-6 rounded-full transition-all duration-300 ${isOpen ? "translate-y-[8px] rotate-45" : ""}`}
                style={{
                    backgroundImage: `linear-gradient(90deg, #fec42e, #fce6a0)`,
                    // WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    // backgroundClip: "text",
                }}
            />
            <div
                className={`h-1 w-6 rounded-full bg-white transition-all duration-300 ${isOpen ? "opacity-0" : ""}`}
                style={{
                    backgroundImage: `linear-gradient(90deg, #fec42e, #fce6a0)`,
                    // WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    // backgroundClip: "text",
                }}
            />
            <div
                className={`h-1 w-6 rounded-full bg-white transition-all duration-300 ${isOpen ? "-translate-y-[8px] -rotate-45" : ""}`}
                style={{
                    backgroundImage: `linear-gradient(90deg, #fec42e, #fce6a0)`,
                    // WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    // backgroundClip: "text",
                }}
            />
        </button>
    );
}
