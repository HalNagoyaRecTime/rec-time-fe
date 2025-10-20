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
            case "/register/student-id":
                return "学籍番号入力";
            case "/register/birthday":
                return "生年月日入力";
            default:
                return "Time Table";
        }
    };

    return (
        // 最大幅を取得するための要素
        <header className="top-0 left-0 z-80 flex h-17 w-full shrink-0 items-center bg-white pl-16 drop-shadow-sm md:pl-18">
            <h1 className=" text-[1.625rem]/7 font-bold mb-1 whitespace-nowrap text-[#111646] tracking-tight">{getPageTitle()}</h1>
        </header>
    );
}
