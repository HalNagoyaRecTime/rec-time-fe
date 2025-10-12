import React from "react";

interface CurrentTimeLineProps {
    currentTime: Date;
    hourHeight: number; // 1時間あたりの高さ（px）
    startHour: number; // グリッドの開始時刻
    endHour?: number; // グリッドの終了時刻（デフォルト: 18）
}

/**
 * 現在時刻を示す横棒ライン
 * 右側のカレンダーエリアに表示
 */
export default function CurrentTimeLine({ currentTime, hourHeight, startHour, endHour = 18 }: CurrentTimeLineProps) {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();

    // グリッド上での位置を計算（9:00〜18:00の範囲に制限）
    let totalMinutesFromStart: number;

    if (hours < startHour) {
        // 0:00〜8:59 → 9:00の位置に固定
        totalMinutesFromStart = 0;
    } else if (hours >= endHour) {
        // 18:00以降 → 18:00の位置に固定
        totalMinutesFromStart = (endHour - startHour) * 60;
    } else {
        // 9:00〜17:59 → 実際の時刻を表示
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
