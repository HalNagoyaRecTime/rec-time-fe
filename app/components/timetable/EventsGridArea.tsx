// === イベント表示エリアコンポーネント ===
import React from "react";
import type { EventRow } from "~/api/student";
import type { TimeSlot, EventLayout } from "~/types/timetable";
import { TIMETABLE_CONSTANTS } from "~/types/timetable";
import EventCard from "./EventCard";
import { getOptimalWidth, getOptimalLeft } from "~/utils/timetable/eventPositioning";
import CurrentTimeLine from "./CurrentTimeLine";
import PastTimeOverlay from "./PastTimeOverlay";

const { MAX_VISIBLE_EVENTS, START_HOUR, STOP_HOUR, SLOT_HEIGHT_PX, SLOT_INTERVAL_MINUTES } = TIMETABLE_CONSTANTS;

interface EventsGridAreaProps {
    timeSlots: TimeSlot[];
    displayEvents: EventRow[];
    eventLayout: Map<string, EventLayout>;
    studentId: string | null;
    currentTime?: Date;
}

/**
 * 右側のイベント表示エリア（区切り線 + イベントカード）
 */
export default function EventsGridArea({
    timeSlots,
    displayEvents,
    eventLayout,
    studentId,
    currentTime,
}: EventsGridAreaProps) {
    // 参加者チェック
    const isParticipant = (event: EventRow): boolean => {
        if (!studentId) return false;
        return event.f_is_my_entry === true;
    };

    // 1時間あたりの高さを計算（5分スロット × 12 = 1時間）
    const hourHeight = (60 / SLOT_INTERVAL_MINUTES) * SLOT_HEIGHT_PX;

    return (
        <div className="relative flex-1">
            {/* 時間軸の区切り線 */}
            {timeSlots.map((_, index) => {
                const isHourStart = index % 12 === 0; // 5分 × 12 = 1時間
                return (
                    <div key={index} className="relative" style={{ height: "8px" }}>
                        {isHourStart && <div className="absolute top-0 right-0 left-0 h-px bg-[#020F95]/20"></div>}
                    </div>
                );
            })}

            {/* 過去の時間帯の背景（グレーオーバーレイ） */}
            {currentTime && (
                <PastTimeOverlay currentTime={currentTime} hourHeight={hourHeight} startHour={START_HOUR} endHour={STOP_HOUR} />
            )}

            {/* 現在時刻ライン（右側カレンダーエリア） */}
            {currentTime && (
                <div
                    className="absolute top-0 right-0 left-0"
                    style={{ height: `${timeSlots.length * SLOT_HEIGHT_PX}px` }}
                >
                    <CurrentTimeLine
                        currentTime={currentTime}
                        hourHeight={hourHeight}
                        startHour={START_HOUR}
                        endHour={STOP_HOUR}
                    />
                </div>
            )}

            {/* イベント表示エリア */}
            <div className="absolute top-0 right-0 left-0" style={{ height: `${timeSlots.length * SLOT_HEIGHT_PX}px` }}>
                {displayEvents.map((event) => {
                    const participant = isParticipant(event);
                    const layout = eventLayout.get(event.f_event_id);

                    if (!layout) return null;

                    // 表示制限を超えた場合は非表示
                    const isOverLimit = layout.positionIndex >= MAX_VISIBLE_EVENTS;

                    // 最後のスロットに「+N」を表示
                    if (layout.positionIndex === MAX_VISIBLE_EVENTS - 1 && layout.actualColumns > MAX_VISIBLE_EVENTS) {
                        const hiddenCount = layout.actualColumns - MAX_VISIBLE_EVENTS;

                        return (
                            <div
                                key={`${event.f_event_id}-more`}
                                className="absolute cursor-pointer rounded bg-gray-500/80 p-1 text-xs text-white shadow-sm transition-all hover:bg-gray-600"
                                style={{
                                    top: `${layout.top}px`,
                                    height: `${Math.max(layout.height, 12)}px`,
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

                    // 制限を超えたイベントは非表示
                    if (isOverLimit) return null;

                    return (
                        <EventCard key={event.f_event_id} event={event} layout={layout} isParticipant={participant} />
                    );
                })}
            </div>
        </div>
    );
}
