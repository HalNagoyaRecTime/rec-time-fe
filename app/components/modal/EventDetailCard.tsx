// === イベント詳細カードコンポーネント ===
import React, { useState } from "react";
import type { EventRow } from "~/api/student";
import { formatTime } from "~/utils/timetable/nextEventCalculator";
import ZoomableImageModal from "./ZoomableImageModal";

interface EventDetailCardProps {
    event: EventRow;
}

/**
 * イベントの詳細を大きく表示するカード
 * - 次の予定や、タップして開いた詳細表示に使用
 */
export default function EventDetailCard({ event }: EventDetailCardProps) {
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    // ハードコードされた地図画像URL（仮）
    const MAP_IMAGE_URL = "https://placehold.co/600x400/1e3a8a/fbbf24?text=競技場マップ";

    // 地図画像をタップ
    const handleImageClick = () => {
        setIsImageModalOpen(true);
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
                            src={MAP_IMAGE_URL}
                            alt="競技場マップ"
                            className="h-auto w-full object-cover transition-opacity hover:opacity-80"
                        />
                    </div>
                </div>
            </div>

            {/* 地図拡大表示モーダル */}
            <ZoomableImageModal
                images={[{ src: MAP_IMAGE_URL, title: event.f_event_name || "競技場マップ" }]}
                initialIndex={0}
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
            />
        </>
    );
}
