import React, { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { getLastUpdatedDisplay } from "~/utils/dataFetcher";

export default function header() {
    const location = useLocation();
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // === 最終更新時間を取得 ===
    // === 최종 갱신 시간 취득 ===
    useEffect(() => {
        const updateLastUpdated = () => {
            const lastUpdate = getLastUpdatedDisplay();
            setLastUpdated(lastUpdate);
        };

        // 初回読み込み
        updateLastUpdated();

        // カスタムイベントリスナー：データ更新時に呼ばれる
        const handleDataUpdated = () => {
            updateLastUpdated();
        };

        window.addEventListener("data-updated", handleDataUpdated);

        return () => {
            window.removeEventListener("data-updated", handleDataUpdated);
        };
    }, []);

    // === 時刻フォーマット（HH:MM） ===
    // === 시각 포맷（HH:MM） ===
    const formatTimeOnly = (dateString: string | null): string | null => {
        if (!dateString) return null;
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    };

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
        <header className="top-0 left-0 z-80 flex h-17 w-full shrink-0 items-center bg-blue-950/90 pl-16 drop-shadow-2xl md:pl-18">
            <div className="flex items-end">
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
                <p className="pb-[2px] text-xs whitespace-nowrap text-white/80">
                    <span>最終更新：</span>
                    <span>{formatTimeOnly(lastUpdated) || "未更新"}</span>
                </p>
            </div>
        </header>
    );
}
