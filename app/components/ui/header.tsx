import React from "react";
import { useLocation } from "react-router";

export default function header() {
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
        <header className="top-0 left-0 z-80 flex h-18 w-full items-center drop-shadow-2xl bg-blue-950/90 pl-16 md:pl-18 shrink-0">
            <div className=" flex items-end">
                <h1
                    className="mr-7 text-[1.625rem]/7 font-extrabold whitespace-nowrap"
                    style={{
                        backgroundImage: `linear-gradient(90deg, #fec42e, #fce6a0)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}
                >
                    {getPageTitle()}
                </h1>
                <p className="text-xs text-white/80 pb-[2px]">
                    <span>最終更新：</span>
                    <span>12:20</span>
                </p>
            </div>
        </header>
    );
}
