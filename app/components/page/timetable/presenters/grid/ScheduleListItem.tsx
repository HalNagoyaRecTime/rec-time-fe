// === 予定リストアイテムコンポーネント ===
import React from "react";
import type { EventRow } from "~/api/student";
import { formatTime, getTimeUntilEvent } from "~/utils/timetable/nextEventCalculator";
import { isGatherTimePassed } from "~/utils/timetable/eventStatusChecker";
import { useCurrentTime } from "~/hooks/useCurrentTime";

interface ScheduleListItemProps {
    event: EventRow;
}

/**
 * 個別の予定アイテムを表示するコンポーネント
 * カウントダウン表示機能付き
 */
export default function ScheduleListItem({ event }: ScheduleListItemProps) {
    // リアルタイムでカウントダウンを更新するため現在時刻を取得
    useCurrentTime();

    const gatherTimePassed = isGatherTimePassed(event.f_gather_time);
    const timeUntilStart = getTimeUntilEvent(event.f_start_time, event.f_gather_time);

    return (
        <div className="rounded-lg bg-gray-50 p-4 shadow-sm hover:bg-gray-100 transition-colors">
            {/* イベント名 */}
            <h3 className="font-bold text-base text-gray-800 mb-2 truncate">
                {event.f_event_name || "イベント"}
            </h3>

            <div className="space-y-1 text-sm">
                {/* 集合時間 */}
                {event.f_gather_time && !gatherTimePassed && (
                    <div className="flex justify-between items-center">
                        <span className="text-[#FFB400] font-medium">集合時間</span>
                        <div className="flex gap-2 items-center">
                            <span className="text-gray-700 font-medium">
                                {formatTime(event.f_gather_time)}
                            </span>
                            <span className="text-red-600 font-semibold text-xs">
                                {getTimeUntilEvent(event.f_gather_time)}
                            </span>
                        </div>
                    </div>
                )}

                {/* 開始時間 */}
                <div className="flex justify-between items-center">
                    <span className="text-[#FFB400] font-medium">開始時間</span>
                    <div className="flex gap-2 items-center">
                        <span className="text-gray-700 font-medium">
                            {formatTime(event.f_start_time)}
                        </span>
                        <span className={`font-semibold text-xs ${
                            timeUntilStart === "開催中!" ? "text-green-600" : "text-gray-600"
                        }`}>
                            {timeUntilStart}
                        </span>
                    </div>
                </div>

                {/* 集合場所 */}
                {event.f_place && (
                    <div className="flex justify-between items-center">
                        <span className="text-[#FFB400] font-medium">集合場所</span>
                        <span className="text-gray-700 truncate max-w-[60%] text-right">
                            {event.f_place}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}