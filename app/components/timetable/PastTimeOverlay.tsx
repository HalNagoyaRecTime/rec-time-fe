import React from "react";

interface PastTimeOverlayProps {
    currentTime: Date;
    hourHeight: number; // 1時間あたりの高さ（px）
    startHour: number; // グリッドの開始時刻
    endHour?: number; // 停止時刻（デフォルト: 18）
}

/**
 * 過去の時間帯を示すグレーオーバーレイ
 * 右側のカレンダーエリアに表示
 */
export default function PastTimeOverlay({ currentTime, hourHeight, startHour, endHour = 18 }: PastTimeOverlayProps) {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();

    // 過去の時間帯の高さを計算
    let totalMinutesFromStart: number;

    if (hours < startHour) {
        // 開始時刻より前 → オーバーレイなし
        totalMinutesFromStart = 0;
    } else if (hours >= Math.floor(endHour) && minutes >= (endHour % 1) * 60) {
        // 終了時刻以降 → 終了時刻の位置で固定
        totalMinutesFromStart = (Math.floor(endHour) - startHour) * 60 + (endHour % 1) * 60;
    } else {
        // 開始時刻〜終了時刻の間 → 実際の時刻
        totalMinutesFromStart = (hours - startHour) * 60 + minutes;
    }

    const overlayHeight = (totalMinutesFromStart / 60) * hourHeight;

    return (
        <div
            className="absolute top-0 right-0 left-0 z-5 bg-[#020F95]/10"
            style={{
                height: `${overlayHeight}px`,
            }}
        />
    );
}
