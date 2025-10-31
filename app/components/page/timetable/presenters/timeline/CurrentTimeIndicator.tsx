import React from "react";

interface CurrentTimeIndicatorProps {
    currentTime: Date;
    hourHeight: number; // 1時間あたりの高さ（px）
    startHour: number; // グリッドの開始時刻
    endHour?: number; // 停止時刻（デフォルト: 18）
}

/**
 * 現在時刻インジケーター
 * 左側の時間ラベル列に表示
 */
export default function CurrentTimeIndicator({
    currentTime,
    hourHeight,
    startHour,
    endHour = 18,
}: CurrentTimeIndicatorProps) {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();

    // グリッド上での位置を計算
    let totalMinutesFromStart: number;
    let displayHours: number;
    let displayMinutes: number;

    const endHourFloor = Math.floor(endHour);
    const endMinutes = (endHour % 1) * 60;

    if (hours < startHour) {
        // 開始時刻より前 → 開始時刻の位置に表示
        totalMinutesFromStart = 0;
        displayHours = startHour;
        displayMinutes = 0;
    } else if (hours > endHourFloor || (hours === endHourFloor && minutes >= endMinutes)) {
        // 終了時刻以降 → 終了時刻の位置に固定
        totalMinutesFromStart = (endHourFloor - startHour) * 60 + endMinutes;
        displayHours = endHourFloor;
        displayMinutes = endMinutes;
    } else {
        // 開始時刻〜終了時刻の間 → 実際の時刻を表示
        totalMinutesFromStart = (hours - startHour) * 60 + minutes;
        displayHours = hours;
        displayMinutes = minutes;
    }

    // 現在時刻（H:MM形式）- 固定された時刻を表示
    const currentTimeStr = `${displayHours}:${displayMinutes.toString().padStart(2, "0")}`;

    const topPosition = (totalMinutesFromStart / 60) * hourHeight - 9;

    return (
        <div className="absolute left-0 z-60 w-full" style={{ top: `${topPosition}px` }}>
            {/* 現在時刻表示部分（左側） */}
            <div className="flex h-[18px] w-full items-center justify-end rounded-r-full bg-[#111646] pr-1">
                <p className="text-sm font-medium text-white/90">{currentTimeStr}</p>
            </div>
        </div>
    );
}
