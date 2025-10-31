// === 時間ラベル列コンポーネント ===
import React from "react";
import type { TimeSlot } from "~/types/timetable";
import CurrentTimeIndicator from "./CurrentTimeIndicator";
import { TIMETABLE_CONFIG } from "~/config/timetableConfig";

const { START_HOUR, STOP_HOUR, SLOT_HEIGHT_PX, SLOTS_PER_HOUR } = TIMETABLE_CONFIG;

interface TimeLabelsColumnProps {
    timeSlots: TimeSlot[];
    currentTime?: Date;
}

/**
 * 左側の時間ラベル列
 */
export default function TimeLabelsColumn({ timeSlots, currentTime }: TimeLabelsColumnProps) {
    // 1時間あたりの高さを計算（SLOTS_PER_HOUR × SLOT_HEIGHT_PX）
    const hourHeight = SLOTS_PER_HOUR * SLOT_HEIGHT_PX;

    return (
        <div className="relative w-12 flex-shrink-0">
            {timeSlots.map((slot, index) => {
                const isHourStart = index % SLOTS_PER_HOUR === 0; // SLOTS_PER_HOUR分割で1時間
                return (
                    <div key={index} className="relative" style={{ height: `${SLOT_HEIGHT_PX}px` }}>
                        {isHourStart && (
                            <div className="absolute -top-[14px] right-2 text-right text-sm font-normal text-[#020F95]/50">
                                {slot.display}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* 現在時刻インジケーター（左側） */}
            {currentTime && (
                <div
                    className="absolute top-0 right-0 left-0"
                    style={{ height: `${timeSlots.length * SLOT_HEIGHT_PX}px` }}
                >
                    <CurrentTimeIndicator
                        currentTime={currentTime}
                        hourHeight={hourHeight}
                        startHour={START_HOUR}
                        endHour={STOP_HOUR}
                    />
                </div>
            )}
        </div>
    );
}
