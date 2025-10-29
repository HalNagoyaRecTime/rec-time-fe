// === イベントリストアイテムコンポーネント（アコーディオン式） ===
import React, { useState } from "react";
import type { EventRow } from "~/api/student";
import { formatTime } from "~/utils/timetable/nextEventCalculator";
import ZoomableImageModal from "./ZoomableImageModal";
import { getEventMapConfig } from "~/config/eventMapConfig";

interface EventListItemProps {
    event: EventRow;
    isPast?: boolean;
}

/**
 * イベントを小さく表示するリストアイテム
 * - タップするとアコーディオン式に展開・縮小
 */
export default function EventListItem({ event, isPast = false }: EventListItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    // イベントIDから地図設定を取得
    const mapConfig = getEventMapConfig(event.f_event_id);

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
    };

    const handleImageClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // アコーディオンのトグルを防ぐ
        setIsImageModalOpen(true);
    };

    // 外部リンクを開く
    const handleExternalLinkClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // アコーディオンのトグルを防ぐ
        if (mapConfig.externalUrl) {
            window.open(mapConfig.externalUrl, "_blank", "noopener,noreferrer");
        }
    };

    return (
        <div
            className={`w-full cursor-pointer rounded-md bg-gray-600/4 p-3 transition-opacity ${isPast ? "opacity-60" : ""}`}
            onClick={handleToggle}
        >
            <div className={isExpanded ? "flex flex-col gap-3" : "flex"}>
                {/* イベント情報エリア */}
                <div className={isExpanded ? "w-full" : "flex w-full min-w-0 flex-1 flex-col gap-2"}>
                    {/* タイトル */}
                    <div className="relative flex items-center">
                        <div
                            className={`absolute rounded-full bg-blue-950 ${isExpanded ? "h-6 w-1" : "h-4 w-[2px]"}`}
                        ></div>
                        <h4
                            className={`overflow-hidden pl-2 font-bold text-ellipsis whitespace-nowrap text-gray-900 ${
                                isExpanded ? "pb-1 text-2xl" : "pb-[2px] text-sm"
                            }`}
                        >
                            {event.f_event_name || "イベント"}
                        </h4>
                    </div>

                    {/* 集合場所・時間 */}
                    <div className={`pl-2 text-gray-700 ${isExpanded ? "text-sm" : "text-sm"}`}>
                        {event.f_place && (
                            <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                                <span className="font-medium">集合場所：</span>
                                {event.f_place}
                            </p>
                        )}
                        <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                            <span className="font-medium">集合時間：</span>
                            {formatTime(event.f_gather_time)}
                            <span className="ml-2">
                                <span className="font-medium">開始時刻：</span>
                                {formatTime(event.f_start_time)}
                            </span>
                        </p>
                    </div>
                </div>

                {/* 地図画像 */}
                <div
                    className={isExpanded ? "cursor-pointer overflow-hidden rounded-lg" : "w-24 flex-shrink-0"}
                    onClick={handleImageClick}
                >
                    <img
                        src={mapConfig.imageUrl}
                        alt={isExpanded ? "競技場マップ" : "地図"}
                        className={
                            isExpanded
                                ? "h-auto w-full object-cover transition-opacity hover:opacity-80"
                                : "h-20 w-full rounded object-cover transition-opacity hover:opacity-80"
                        }
                    />
                </div>
            </div>

            {/* 外部リンクボタン（展開時かつURLが設定されている場合のみ表示） */}
            {isExpanded && mapConfig.externalUrl && (
                <button
                    onClick={handleExternalLinkClick}
                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
                >
                    {mapConfig.linkLabel || "詳細を見る"}
                </button>
            )}

            {/* 縮小ヒント（展開時のみ） */}
            {isExpanded && <div className="text-center text-xs text-gray-500">タップで縮小 ↑</div>}

            {/* 地図拡大表示モーダル */}
            <ZoomableImageModal
                images={[{ src: mapConfig.imageUrl, title: event.f_event_name || "競技場マップ" }]}
                initialIndex={0}
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
            />
        </div>
    );
}
