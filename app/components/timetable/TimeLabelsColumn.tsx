// === 時間ラベル列コンポーネント ===
import React from "react";
import type { TimeSlot } from "~/types/timetable";
import CurrentTimeIndicator from "./CurrentTimeIndicator";
import { TIMETABLE_CONSTANTS } from "~/types/timetable";

const { START_HOUR, SLOT_HEIGHT_PX, SLOT_INTERVAL_MINUTES } = TIMETABLE_CONSTANTS;

interface TimeLabelsColumnProps {
    timeSlots: TimeSlot[];
    currentTime?: Date;
}

/**
 * 左側の時間ラベル列
 */
export default function TimeLabelsColumn({ timeSlots, currentTime }: TimeLabelsColumnProps) {
    // 1時間あたりの高さを計算（5分スロット × 12 = 1時間）
    const hourHeight = (60 / SLOT_INTERVAL_MINUTES) * SLOT_HEIGHT_PX;

    return (
        <div className="relative w-12 flex-shrink-0">
            {timeSlots.map((slot, index) => {
                const isHourStart = index % 12 === 0; // 5分 × 12 = 1時間
                return (
                    <div key={index} className="relative" style={{ height: "8px" }}>
                        {isHourStart && (
                            <div className="absolute -top-[14px] right-2 text-right text-sm font-normal text-[#FFCC5299]/80">
                                {slot.display}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* 現在時刻インジケーター（左側） */}
            {currentTime && (
                <div className="absolute top-0 right-0 left-0" style={{ height: `${timeSlots.length * SLOT_HEIGHT_PX}px` }}>
                    <CurrentTimeIndicator currentTime={currentTime} hourHeight={hourHeight} startHour={START_HOUR} />
                </div>
            )}
        </div>
    );
}