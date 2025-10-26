import React from "react";

interface HamburgerMenuBtnProps {
    onClick: () => void;
    isOpen: boolean;
}

export default function HamburgerMenuBtn({ onClick, isOpen }: HamburgerMenuBtnProps) {
    return (
        <button
            onClick={onClick}
            className="absolute top-0 !z-99 flex h-17 w-17 cursor-pointer items-center justify-center"
        >
            <div className="flex flex-col gap-1">
                <div
                    className={`h-1 w-6 rounded-full transition-all duration-300 ${isOpen ? "translate-y-[8px] rotate-45 bg-white" : "bg-[#111646]"}`}
                />
                <div
                    className={`h-1 w-6 rounded-full transition-all duration-300 ${isOpen ? "opacity-0" : "bg-[#111646]"}`}
                />
                <div
                    className={`h-1 w-6 rounded-full transition-all duration-300 ${isOpen ? "-translate-y-[8px] -rotate-45 bg-white" : "bg-[#111646]"}`}
                />
            </div>
        </button>
    );
}
