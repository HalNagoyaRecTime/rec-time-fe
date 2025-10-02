import React from "react";
import { useLocation } from "react-router";

interface HeaderProps {
    onMenuOpen: () => void;
}

export default function header({ onMenuOpen }: HeaderProps) {
    const location = useLocation();

    const getPageTitle = () => {
        switch (location.pathname) {
            case "/timetable":
                return "Time Table";
            case "/map":
                return "マップ";
            case "/settings":
                return "設定";
            default:
                return "Time Table";
        }
    };

    return (
        // 最大幅を取得するための要素
        <header className="sticky flex h-14 w-full items-center gap-5 bg-blue-800 px-6">
            <button onClick={onMenuOpen} className="h-10 w-10 cursor-pointer p-2 text-white">
                <img src="/icons/app-icon/hamburger-menu.png" alt="" />
            </button>
            <div className="mb-1">
                <p
                    className="text-2xl font-extrabold whitespace-nowrap"
                    style={{
                        backgroundImage: `linear-gradient(90deg, #fec42e, #fce6a0)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}
                >
                    {getPageTitle()}
                </p>
            </div>
        </header>
    );
}
