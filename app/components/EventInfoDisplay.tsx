// === イベント基本情報表示コンポーネント ===

import React from "react";
import type { EventRow } from "~/api/student";
import { formatTime } from "~/utils/timetable/nextEventCalculator";
import { useEventEndTime } from "~/hooks/useEventEndTime";

type TimeFormatType = "detailed" | "compact";

interface EventInfoDisplayProps {
    event: EventRow;
    showGatherTime?: boolean;
    showPlace?: boolean;
    timeFormat?: TimeFormatType;
}

/**
 * イベントの基本情報（名前、時間、場所）を表示するコンポーネント
 * 詳細表示/コンパクト表示の両モードに対応
 */
export default function EventInfoDisplay({
    event,
    showGatherTime = true,
    showPlace = true,
    timeFormat = "detailed",
}: EventInfoDisplayProps) {
    const { endTimeString } = useEventEndTime(event.f_start_time, event.f_duration);

    if (timeFormat === "compact") {
        // コンパクト表示：最小限の情報
        return (
            // <div className="space-y-1 text-sm">
            //     {/* 時間情報（1行） */}
            //     <div className="text-xs text-gray-600">
            //         {formatTime(event.f_start_time)}
            //         {endTimeString && ` ～ ${formatTime(endTimeString)}`}
            //     </div>
            // </div>
            <div className="flex flex-col gap-1">
                {/* 集合時間 */}
                {showGatherTime && event.f_gather_time && (
                    <div className="text-xs">
                        <span className="font-medium text-black">集合時間：</span>
                        <span className="text-gray-700">{formatTime(event.f_gather_time)}</span>
                    </div>
                )}
                <div className="text-xs">
                    <span className="font-medium text-black">開催時間：</span>
                    <span className="text-gray-700">
                        {formatTime(event.f_start_time)}
                        {endTimeString && ` ～ ${formatTime(endTimeString)}`}
                    </span>
                </div>
            </div>
        );
    }

    // 詳細表示
    return (
        <div className="flex w-full flex-col gap-1 text-sm">
            {/* 場所 */}
            {showPlace && event.f_place && (
                <div className="flex w-full min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    <span className="font-medium text-black">集合場所：</span>
                    <span className="max-w-[60%] truncate text-right text-gray-700">{event.f_place}</span>
                </div>
            )}
            <div className="flex">
                {/* 集合時間 */}
                {showGatherTime && event.f_gather_time && (
                    <div className="">
                        <span className="font-medium text-black">集合時間：</span>
                        <span className="text-gray-700">{formatTime(event.f_gather_time)}</span>
                    </div>
                )}
                <div className="ml-3">
                    <span className="font-medium text-black">開催時間：</span>
                    <span className="text-gray-700">
                        {formatTime(event.f_start_time)}
                        {endTimeString && ` ～ ${formatTime(endTimeString)}`}
                    </span>
                </div>
            </div>
        </div>
    );
}
