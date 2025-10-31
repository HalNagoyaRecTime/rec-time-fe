import React from "react";
import type { EventRow } from "~/api/student";
import type { EventLayout } from "~/types/timetable";
import { TIMETABLE_CONFIG } from "~/config/timetableConfig";
import { getOptimalWidth, getOptimalLeft } from "~/utils/timetable/eventPositioning";

const { SLOT_HEIGHT_PX } = TIMETABLE_CONFIG;

interface OverflowEventIndicatorProps {
    event: EventRow;
    layout: EventLayout;
    hiddenCount: number;
}

/**
 * オーバーフロー時の「+N」表示インジケーター
 *
 * 責務：
 * - 非表示イベント件数の表示のみ
 * - ロジックなし
 */
export default function OverflowEventIndicator({
    event,
    layout,
    hiddenCount,
}: OverflowEventIndicatorProps) {
    return (
        <div
            key={`${event.f_event_id}-more`}
            className="absolute cursor-pointer rounded bg-gray-500/80 p-1 text-xs text-white shadow-sm transition-all hover:bg-gray-600"
            style={{
                top: `${layout.top}px`,
                height: `${Math.max(layout.height, Math.ceil(SLOT_HEIGHT_PX * 1.5))}px`,
                left: getOptimalLeft(layout.positionIndex, layout.actualColumns),
                width: getOptimalWidth(layout.actualColumns),
                zIndex: 11,
            }}
            title={`他${hiddenCount + 1}件のイベントがあります`}
        >
            <div className="flex h-full items-center justify-center font-bold">
                +{hiddenCount + 1}
            </div>
        </div>
    );
}
