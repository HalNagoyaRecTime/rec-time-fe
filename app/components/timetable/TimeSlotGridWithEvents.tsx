// === タイムテーブルメインコンポーネント（リファクタリング版） ===
import React from "react";
import type { EventRow } from "~/api/student";
import { generateTimeSlots } from "~/utils/timetable/timeSlotGenerator";
import { calculateEventLayout } from "~/utils/timetable/eventLayoutCalculator";
import { TIMETABLE_CONSTANTS } from "~/types/timetable";
import TimeLabelsColumn from "./TimeLabelsColumn";
import EventsGridArea from "./EventsGridArea";

const { START_HOUR, END_HOUR, SLOT_INTERVAL_MINUTES } = TIMETABLE_CONSTANTS;

interface TimeSlotGridWithEventsProps {
    displayEvents: EventRow[];
    studentId: string | null;
    loading: boolean;
    currentTime?: Date; // 現在時刻（オプション）
}

/**
 * タイムテーブル全体のコンテナコンポーネント
 */
export default function TimeSlotGridWithEvents({
    displayEvents,
    studentId,
    currentTime,
}: TimeSlotGridWithEventsProps) {
    // タイムスロット生成
    const timeSlots = generateTimeSlots(START_HOUR, END_HOUR, SLOT_INTERVAL_MINUTES);

    // イベントレイアウト計算
    const eventLayout = calculateEventLayout(displayEvents);

    return (
        <div className="relative h-full w-full rounded-lg bg-blue-950 px-1">
            {/* タイムスロット背景 */}
            <div className="flex">
                {/* 左側：時間ラベル列 */}
                <TimeLabelsColumn timeSlots={timeSlots} />

                {/* 右側：イベント表示エリア */}
                <EventsGridArea
                    timeSlots={timeSlots}
                    displayEvents={displayEvents}
                    eventLayout={eventLayout}
                    studentId={studentId}
                    currentTime={currentTime}
                />
            </div>
        </div>
    );
}
