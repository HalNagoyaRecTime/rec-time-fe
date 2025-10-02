import React from "react";

interface TimeSlot {
    hour: number;
    minute: number;
    display: string;
    isHourStart: boolean;
}

export default function TimeSlotGrid() {
    // 9:00-20:00の15分刻みタイムスロットを生成
    const generateTimeSlots = (): TimeSlot[] => {
        const slots: TimeSlot[] = [];
        for (let hour = 9; hour <= 20; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                slots.push({
                    hour,
                    minute,
                    display: `${hour}:${minute.toString().padStart(2, "0")}`,
                    isHourStart: minute === 0,
                });
            }
        }
        return slots;
    };

    const timeSlots = generateTimeSlots();
    const SLOT_HEIGHT = 16; // 1スロット = 16px

    return (
        <div className="relative h-full w-full rounded-lg bg-blue-950 px-1">
            <div className="flex">
                {/* 左側：時間ラベル列 */}
                <div className="w-12 flex-shrink-0">
                    {timeSlots.map((slot, index) => (
                        <div key={index} className="relative" style={{ height: `${SLOT_HEIGHT}px` }}>
                            {slot.isHourStart && (
                                <div className="absolute -top-[14px] right-2 text-right text-sm font-normal text-[#FFCC5299]/80">
                                    {slot.display}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* 右側：イベントエリア + 区切り線 */}
                <div className="relative flex-1">
                    {timeSlots.map((slot, index) => {
                        const isHourStart = slot.isHourStart;

                        return (
                            <div key={index} className="relative" style={{ height: `${SLOT_HEIGHT}px` }}>
                                {/* 1時間ごとの区切り線 */}
                                {isHourStart && (
                                    <div className="absolute top-0 right-0 left-0 h-px bg-[#FFB4004D]/60"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
