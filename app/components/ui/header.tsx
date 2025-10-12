import React, { useState } from "react";
import { useLocation } from "react-router";
import { isDebugMode } from "~/utils/logger";
import DebugLogViewer from "~/components/DebugLogViewer";

export default function header() {
    const location = useLocation();
    const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);

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
        <>
            {/* 最大幅を取得するための要素 */}
            {/* 최대폭을 획득하기 위한 요소 */}
            <header className="top-0 left-0 z-80 flex h-17 w-full shrink-0 items-center bg-blue-950/90 pl-16 drop-shadow-2xl md:pl-18">
                <h1
                    className="text-[1.625rem]/7 font-extrabold whitespace-nowrap"
                    style={{
                        backgroundImage: `linear-gradient(90deg, #fec42e, #fce6a0)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}
                >
                    {getPageTitle()}
                </h1>
                
                {/* デバッグモードでのみログビューアボタンを表示 */}
                {/* 디버그 모드에서만 로그 뷰어 버튼을 표시 */}
                {isDebugMode() && (
                    <button
                        onClick={() => setIsLogViewerOpen(true)}
                        className="ml-auto mr-4 p-2 bg-yellow-500 text-black rounded-full hover:bg-yellow-400 transition-colors"
                        title="デバッグログを表示 / 디버그 로그 표시"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </button>
                )}
            </header>
            
            {/* デバッグログビューア */}
            {/* 디버그 로그 뷰어 */}
            <DebugLogViewer
                isOpen={isLogViewerOpen}
                onClose={() => setIsLogViewerOpen(false)}
            />
        </>
    );
}
