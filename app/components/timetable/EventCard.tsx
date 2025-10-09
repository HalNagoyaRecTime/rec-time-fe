// === イベントカードコンポーネント ===
import React from "react";
import type { EventRow } from "~/api/student";
import type { EventLayout } from "~/types/timetable";
import { formatTime, formatTimeRange } from "~/utils/timetable/timeFormatter";
import { getOptimalWidth, getOptimalLeft } from "~/utils/timetable/eventPositioning";

interface EventCardProps {
    event: EventRow;
    layout: EventLayout;
    isParticipant: boolean;
}

/**
 * イベント1件を表示するカード
 */
export default function EventCard({ event, layout, isParticipant }: EventCardProps) {
    const width = getOptimalWidth(layout.actualColumns);
    const left = getOptimalLeft(layout.positionIndex, layout.actualColumns);

    // デバッグログ
    console.log(`[EventCard] ${event.f_event_name}:`, {
        eventId: event.f_event_id,
        startTime: event.f_start_time,
        duration: event.f_duration,
        actualColumns: layout.actualColumns,
        positionIndex: layout.positionIndex,
        width,
        left,
        top: layout.top,
        height: layout.height,
    });

    // 継続時間（実際の分数）
    const durationMinutes = parseInt(event.f_duration || "0", 10);

    // 高さに応じたレイアウト判定
    const isCompact = layout.height < 40; // 40px未満は縮小表示
    const isVeryCompact = layout.height < 24; // 24px未満は最小表示

    // tooltip用の継続時間フォーマット
    const formatActualDuration = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) {
            return `${hours}時間${mins}分`;
        } else if (hours > 0) {
            return `${hours}時間`;
        } else {
            return `${mins}分`;
        }
    };

    return (
        <div
            className={`absolute flex cursor-pointer items-center rounded px-2 text-xs shadow-sm transition-all hover:shadow-md ${
                isCompact ? "py-0.5" : "py-2"
            } ${
                isParticipant
                    ? "bg-[#FFB400] text-blue-950 hover:bg-[#FFC940]"
                    : "bg-white text-blue-950 hover:bg-gray-50"
            }`}
            style={{
                top: `${layout.top}px`,
                height: `${Math.max(layout.height, 12)}px`,
                left: left,
                width: width,
                zIndex: 10,
            }}
            title={`${event.f_event_name || "イベント"} - ${formatTime(event.f_start_time)} (${formatActualDuration(durationMinutes)}) ${isParticipant ? "(参加予定)" : ""}`}
        >
            {/* 高さに余裕がある場合のみ縦線を表示 */}
            <div className={`mr-2 h-full w-1 rounded-full ${isParticipant ? "bg-white" : "bg-blue-950"}`}></div>

            <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                {/* イベント名と時間範囲 */}
                <div
                    className="truncate font-semibold"
                    style={{ fontSize: isVeryCompact ? "9px" : "10px", lineHeight: isVeryCompact ? "10px" : "12px" }}
                >
                    {event.f_event_name}
                    {isVeryCompact && (
                        <span className="ml-1 font-medium opacity-70" style={{ fontSize: "8px" }}>
                            {formatTimeRange(event.f_start_time, event.f_duration)}
                        </span>
                    )}
                </div>

                {/* 時間範囲 - 高さに余裕がある場合は別行で表示 */}
                {!isVeryCompact && (
                    <div className="truncate font-medium opacity-80" style={{ fontSize: "9px", lineHeight: "10px" }}>
                        {formatTimeRange(event.f_start_time, event.f_duration)}
                    </div>
                )}

                {/*/!* 参加予定バッジ - 高さに余裕がある場合のみ表示 *!/*/}
                {/*{isParticipant && !isCompact && (*/}
                {/*    <div className="font-bold" style={{ fontSize: "8px" }}>*/}
                {/*        ✓ 参加予定*/}
                {/*    </div>*/}
                {/*)}*/}
            </div>
        </div>
    );
}
