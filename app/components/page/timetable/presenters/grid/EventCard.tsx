// === イベントカードコンポーネント ===
import React from "react";
import type { EventRow } from "~/api/student";
import type { EventLayout } from "~/types/timetable";
import { TIMETABLE_CONFIG } from "~/config/timetableConfig";
import { formatTime, formatTimeRange } from "~/utils/timetable/timeFormatter";
import { getOptimalWidth, getOptimalLeft } from "~/utils/timetable/eventPositioning";

const { SLOT_HEIGHT_PX, COMPACT_THRESHOLD_PX, VERY_COMPACT_THRESHOLD_PX } = TIMETABLE_CONFIG;

interface EventCardProps {
    event: EventRow;
    layout: EventLayout;
    isParticipant: boolean;
    onClick?: () => void;
}

/**
 * イベント1件を表示するカード
 */
export default function EventCard({ event, layout, isParticipant, onClick }: EventCardProps) {
    const width = getOptimalWidth(layout.actualColumns);
    const left = getOptimalLeft(layout.positionIndex, layout.actualColumns);

    // 継続時間（実際の分数）
    const durationMinutes = parseInt(event.f_duration || "0", 10);

    // 高さに応じたレイアウト判定
    const isCompact = layout.height < COMPACT_THRESHOLD_PX;
    const isVeryCompact = layout.height < VERY_COMPACT_THRESHOLD_PX;

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
                    ? "bg-[#F0B208]/80 text-[#111646] hover:bg-[#F0B208]/60"
                    : "bg-[#000D91]/80 text-white hover:bg-[#000D91]/60"
            }`}
            style={{
                top: `${layout.top}px`,
                height: `${Math.max(layout.height, Math.ceil(SLOT_HEIGHT_PX * 1.5))}px`,
                left: left,
                width: width,
                zIndex: 10,
            }}
            title={`${event.f_event_name || "イベント"} - ${formatTime(event.f_start_time)} (${formatActualDuration(durationMinutes)}) ${isParticipant ? "(参加予定)" : ""}`}
            onClick={onClick}
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
            </div>
        </div>
    );
}
