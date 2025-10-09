// === 時間ラベル列コンポーネント ===
import React from "react";
import type { TimeSlot } from "~/types/timetable";

interface TimeLabelsColumnProps {
    timeSlots: TimeSlot[];
}

/**
 * 左側の時間ラベル列
 */
export default function TimeLabelsColumn({ timeSlots }: TimeLabelsColumnProps) {
    return (
        <div className="w-12 flex-shrink-0">
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
        </div>
    );
}