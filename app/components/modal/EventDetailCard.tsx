// === イベント詳細カードコンポーネント ===
import React, { useState } from "react";
import type { EventRow } from "~/api/student";
import { formatTime } from "~/utils/timetable/nextEventCalculator";
import ZoomableImageModal from "./ZoomableImageModal";
import { getEventMapConfig } from "~/config/eventMapConfig";

interface EventDetailCardProps {
    event: EventRow;
}

/**
 * イベントの詳細を大きく表示するカード
 * - 次の予定や、タップして開いた詳細表示に使用
 */
export default function EventDetailCard({ event }: EventDetailCardProps) {
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    // イベントIDから地図設定を取得
    const mapConfig = getEventMapConfig(event.f_event_id);

    // 地図画像をタップ
    const handleImageClick = () => {
        setIsImageModalOpen(true);
    };

    // 外部リンクを開く
    const handleExternalLinkClick = () => {
        if (mapConfig.externalUrl) {
            window.open(mapConfig.externalUrl, "_blank", "noopener,noreferrer");
        }
    };

    return (
        <>
            <div className="w-full">
                <div className="flex flex-col gap-3">
                    {/* イベント情報エリア */}
                    <div className="w-full">
                        {/* タイトル */}
                        <div className="relative flex items-center">
                            <div className="absolute h-6 w-1 rounded-full bg-blue-950"></div>
                            <h4 className="overflow-hidden pb-1 pl-2 text-2xl font-bold text-gray-900">
                                {event.f_event_name || "イベント"}
                            </h4>
                        </div>

                        {/* 集合場所・時間 */}
                        <div className="pl-2 text-sm text-gray-700">
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
                    <div className="cursor-pointer overflow-hidden rounded-lg" onClick={handleImageClick}>
                        <img
                            src={mapConfig.imageUrl}
                            alt="競技場マップ"
                            className="h-auto w-full object-cover transition-opacity hover:opacity-80"
                        />
                    </div>

                    {/* 外部リンクボタン（URLが設定されている場合のみ表示） */}
                    {mapConfig.externalUrl && (
                        <button
                            onClick={handleExternalLinkClick}
                            className="w-full cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
                        >
                            {mapConfig.linkLabel || "詳細を見る"}
                        </button>
                    )}
                </div>
            </div>

            {/* 地図拡大表示モーダル */}
            <ZoomableImageModal
                images={[{ src: mapConfig.imageUrl, title: event.f_event_name || "競技場マップ" }]}
                initialIndex={0}
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
            />
        </>
    );
}
