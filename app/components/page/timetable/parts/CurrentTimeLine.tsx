import React from "react";

interface CurrentTimeLineProps {
    currentTime: Date;
    hourHeight: number; // 1時間あたりの高さ（px）
    startHour: number; // グリッドの開始時刻
    endHour?: number; // 停止時刻（デフォルト: 18）
}

/**
 * 現在時刻を示す横棒ライン
 * 右側のカレンダーエリアに表示
 */
export default function CurrentTimeLine({ currentTime, hourHeight, startHour, endHour = 18 }: CurrentTimeLineProps) {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();

    // グリッド上での位置を計算
    let totalMinutesFromStart: number;

    const endHourFloor = Math.floor(endHour);
    const endMinutes = (endHour % 1) * 60;

    if (hours < startHour) {
        // 開始時刻より前 → 開始時刻の位置に固定
        totalMinutesFromStart = 0;
    } else if (hours > endHourFloor || (hours === endHourFloor && minutes >= endMinutes)) {
        // 終了時刻以降 → 終了時刻の位置に固定
        totalMinutesFromStart = (endHourFloor - startHour) * 60 + endMinutes;
    } else {
        // 開始時刻〜終了時刻の間 → 実際の時刻を表示
        totalMinutesFromStart = (hours - startHour) * 60 + minutes;
    }

    const topPosition = (totalMinutesFromStart / 60) * hourHeight;

    return (
        <div className="absolute right-0 left-0 z-50" style={{ top: `${topPosition}px` }}>
            {/* 現在時刻を示す横棒（オレンジ色） */}
            <div className="h-[2px] w-full bg-[#111646]"></div>
        </div>
    );
}
