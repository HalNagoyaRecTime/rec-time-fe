// === イベント詳細カードコンポーネント ===
import React, { useState } from "react";
import type { EventRow } from "~/api/student";
import { formatTime } from "~/utils/timetable/nextEventCalculator";
import ZoomableImageModal from "./ZoomableImageModal";
import { getEventMapConfig } from "~/config/eventMapConfig";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";

interface EventDetailCardProps {
    event: EventRow;
    status?: "next" | "ongoing" | "calling" | null; // イベントのステータス
    isOngoing?: boolean; // 開催中
    isCalling?: boolean; // 呼び出し中
}

/**
 * イベントの詳細を大きく表示するカード
 * - 次の予定や、タップして開いた詳細表示に使用
 */
export default function EventDetailCard({ event, isOngoing = false, isCalling = false }: EventDetailCardProps) {
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    // イベントIDから地図設定を取得
    const mapConfig = getEventMapConfig(event.f_event_id);

    // 終了時刻を計算（HHmm形式）
    const calculateEndTime = (
        startTime: string | undefined | null,
        duration: string | undefined | null
    ): string | undefined => {
        if (!startTime || !duration) {
            console.log("[EventDetailCard] 終了時刻計算スキップ - startTime:", startTime, ", duration:", duration);
            return undefined;
        }
        const start = parseInt(startTime, 10);
        const dur = parseInt(duration, 10);
        const startHour = Math.floor(start / 100);
        const startMinute = start % 100;
        const totalMinutes = startHour * 60 + startMinute + dur;
        const endTimeNum = Math.floor(totalMinutes / 60) * 100 + (totalMinutes % 60);
        // endTimeNumを4桁にパディング（例：540 → "0540"）
        const paddedEndTime = endTimeNum.toString().padStart(4, "0");
        const result = formatTime(paddedEndTime);
        console.log("[EventDetailCard] 終了時刻計算:", {
            startTime,
            duration,
            startHour,
            startMinute,
            totalMinutes,
            endTimeNum,
            paddedEndTime,
            result,
        });
        return result;
    };

    const endTime = calculateEndTime(event.f_start_time, event.f_duration);

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
                        <div className="flex flex-col gap-1">
                            <div className="relative flex items-center">
                                <div className="absolute h-6 w-1 rounded-full bg-blue-950"></div>
                                <h4 className="overflow-hidden pb-1 pl-2 text-2xl font-bold text-gray-900">
                                    {event.f_event_name || "イベント"}
                                </h4>
                            </div>
                            {/* 開催中・呼び出し中・次の予定バッジ（タイトル下） */}
                            <div className="flex gap-2 pb-2">
                                {isOngoing && (
                                    <span className="flex-shrink-0 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                                        開催中
                                    </span>
                                )}
                                {isCalling && (
                                    <span className="flex-shrink-0 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                                        呼び出し中
                                    </span>
                                )}
                                {!isOngoing && !isCalling && (
                                    <span className="flex-shrink-0 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                                        次の予定
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 集合場所・時間 */}
                        <div className="pl-2 text-sm text-gray-700">
                            {event.f_place && (
                                <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                                    <span className="font-medium">集合場所：</span>
                                    {event.f_place}
                                </p>
                            )}
                            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                                <span className="font-medium">集合時間：</span>
                                {formatTime(event.f_gather_time || null)}
                                <span className="ml-2">
                                    <span className="font-medium">開始時刻：</span>
                                    {formatTime(event.f_start_time || null)}
                                </span>
                            </span>
                            {endTime && (
                                <span className="ml-2 overflow-hidden text-ellipsis whitespace-nowrap">
                                    <span className="font-medium">終了時刻：</span>
                                    {endTime}
                                </span>
                            )}
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
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
                        >
                            {mapConfig.linkLabel || "競技詳細を確認する"}
                            <FaArrowUpRightFromSquare className="text-xs" />
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
