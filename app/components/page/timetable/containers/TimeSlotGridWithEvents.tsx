// === タイムテーブルメインコンポーネント（リファクタリング版） ===
import React from "react";
import type { EventRow } from "~/api/student";
import { generateTimeSlots } from "~/utils/timetable/timeSlotGenerator";
import { calculateEventLayout } from "~/utils/timetable/eventLayoutCalculator";
import { TIMETABLE_CONFIG } from "~/config/timetableConfig";
import TimeLabelsColumn from "../presenters/timeline/TimeLabelsColumn";
import EventGridContainer from "./EventGridContainer";

const { START_HOUR, DISPLAY_END_HOUR, SLOTS_PER_HOUR } = TIMETABLE_CONFIG;

interface TimeSlotGridWithEventsProps {
    displayEvents: EventRow[];
    studentId: string | null;
    loading: boolean;
    currentTime?: Date; // 現在時刻（オプション）
}

/**
 * タイムテーブル全体のコンテナコンポーネント
 */
export default function TimeSlotGridWithEvents({ displayEvents, studentId, currentTime }: TimeSlotGridWithEventsProps) {
    // タイムスロット生成（SLOTS_PER_HOUR で分割間隔を計算）
    const slotIntervalMinutes = 60 / SLOTS_PER_HOUR;
    const timeSlots = generateTimeSlots(START_HOUR, DISPLAY_END_HOUR, slotIntervalMinutes);

    // イベントレイアウト計算
    const eventLayout = calculateEventLayout(displayEvents);

    return (
        <div className="relative mb-10 h-full w-full rounded-lg px-1">
            {/* タイムスロット背景 */}
            <div className="flex">
                {/* 左側：時間ラベル列 */}
                <TimeLabelsColumn timeSlots={timeSlots} currentTime={currentTime} />

                {/* 右側：イベント表示エリア */}
                <EventGridContainer
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
