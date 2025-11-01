import React from "react";
import type { EventRow } from "~/api/student";
import type { TimeSlot, EventLayout } from "~/types/timetable";
import { TIMETABLE_CONFIG } from "~/config/timetableConfig";
import EventCard from "./EventCard";
import OverflowEventIndicator from "./OverflowEventIndicator";
import CurrentTimeLine from "../timeline/CurrentTimeLine";
import PastTimeOverlay from "../timeline/PastTimeOverlay";

const { MAX_VISIBLE_EVENTS, START_HOUR, STOP_HOUR, SLOT_HEIGHT_PX, SLOTS_PER_HOUR } = TIMETABLE_CONFIG;

interface EventGridRendererProps {
    timeSlots: TimeSlot[];
    displayEvents: Array<{
        event: EventRow;
        layout: EventLayout;
        isParticipant: boolean;
    }>;
    overflowCount: number;
    currentTime?: Date;
    onEventClick?: (event: EventRow) => void;
}

/**
 * イベントグリッドの描画専用コンポーネント
 *
 * 責務：
 * - 区切り線の描画
 * - 過去時間背景の表示
 * - 現在時刻ラインの表示
 * - イベントカードのレンダリング
 * - 「+N」カウント表示
 *
 * ロジックなし：すべてpropsから受け取る
 */
export default function EventGridRenderer({ timeSlots, displayEvents, currentTime, onEventClick }: EventGridRendererProps) {
    const hourHeight = SLOTS_PER_HOUR * SLOT_HEIGHT_PX;

    return (
        <div className="relative flex-1">
            {/* 時間軸の区切り線 */}
            {timeSlots.map((_, index) => {
                const isHourStart = index % SLOTS_PER_HOUR === 0;
                return (
                    <div key={index} className="relative" style={{ height: `${SLOT_HEIGHT_PX}px` }}>
                        {isHourStart && <div className="absolute top-0 right-0 left-0 h-px bg-[#020F95]/20"></div>}
                    </div>
                );
            })}

            {/* 過去の時間帯の背景（グレーオーバーレイ） */}
            {currentTime && (
                <PastTimeOverlay
                    currentTime={currentTime}
                    hourHeight={hourHeight}
                    startHour={START_HOUR}
                    endHour={STOP_HOUR}
                />
            )}

            {/* 現在時刻ライン */}
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

            {/* 同時刻にイベントが複数ある場合のイベント表示エリア */}
            <div className="absolute top-0 right-0 left-0" style={{ height: `${timeSlots.length * SLOT_HEIGHT_PX}px` }}>
                {displayEvents.map(({ event, layout, isParticipant }) => {
                    const isLastVisible =
                        layout.positionIndex === MAX_VISIBLE_EVENTS - 1 && layout.actualColumns > MAX_VISIBLE_EVENTS;

                    // 「+N」表示
                    if (isLastVisible) {
                        const hiddenCount = layout.actualColumns - MAX_VISIBLE_EVENTS;
                        return (
                            <OverflowEventIndicator
                                key={`${event.f_event_id}-more`}
                                event={event}
                                layout={layout}
                                hiddenCount={hiddenCount}
                            />
                        );
                    }

                    return (
                        <EventCard
                            key={event.f_event_id}
                            event={event}
                            layout={layout}
                            isParticipant={isParticipant}
                            onClick={() => onEventClick?.(event)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
