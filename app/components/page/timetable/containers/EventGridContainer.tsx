import React, { useMemo } from "react";
import type { EventRow } from "~/api/student";
import type { TimeSlot, EventLayout } from "~/types/timetable";
import { TIMETABLE_CONFIG } from "~/config/timetableConfig";
import EventGridRenderer from "../presenters/grid/EventGridRenderer";

const { MAX_VISIBLE_EVENTS } = TIMETABLE_CONFIG;

interface EventGridContainerProps {
    timeSlots: TimeSlot[];
    displayEvents: EventRow[];
    eventLayout: Map<string, EventLayout>;
    studentId: string | null;
    currentTime?: Date;
    onEventClick?: (event: EventRow) => void;
}

/**
 * イベントグリッドロジック用のコンテナコンポーネント
 *
 * 責務：
 * - 参加者判定ロジック
 * - レイアウト検証
 * - イベント配列の整形
 * - 表示制限判定
 * - EventGridRenderer への データ変換・提供
 */
export default function EventGridContainer({
    timeSlots,
    displayEvents,
    eventLayout,
    studentId,
    currentTime,
    onEventClick,
}: EventGridContainerProps) {
    // 参加者チェック
    const isParticipant = (event: EventRow): boolean => {
        if (!studentId) return false;
        return event.f_is_my_entry === true;
    };

    // イベント配列を整形（レイアウト検証と表示判定を含む）
    const formattedEvents = useMemo(() => {
        return displayEvents
            .map((event) => {
                const layout = eventLayout.get(event.f_event_id);

                if (!layout) {
                    console.warn(
                        `[EventGridContainer] イベント ${event.f_event_name} (${event.f_event_id}) - レイアウト無し (開始時間: ${event.f_start_time})`
                    );
                    return null;
                }

                // 表示制限を超えた場合は非表示
                const isOverLimit = layout.positionIndex >= MAX_VISIBLE_EVENTS;
                if (isOverLimit) {
                    return null;
                }

                return {
                    event,
                    layout,
                    isParticipant: isParticipant(event),
                };
            })
            .filter((item) => item !== null) as Array<{
            event: EventRow;
            layout: EventLayout;
            isParticipant: boolean;
        }>;
    }, [displayEvents, eventLayout, studentId]);

    // オーバーフロー件数を計算
    const overflowCount = useMemo(() => {
        if (!displayEvents.length) return 0;

        const lastEvent = displayEvents[displayEvents.length - 1];
        const layout = eventLayout.get(lastEvent.f_event_id);

        if (!layout || layout.actualColumns <= MAX_VISIBLE_EVENTS) {
            return 0;
        }

        return layout.actualColumns - MAX_VISIBLE_EVENTS;
    }, [displayEvents, eventLayout]);

    return (
        <EventGridRenderer
            timeSlots={timeSlots}
            displayEvents={formattedEvents}
            overflowCount={overflowCount}
            currentTime={currentTime}
            onEventClick={onEventClick}
        />
    );
}
