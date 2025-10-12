import React from "react";

interface PastTimeOverlayProps {
    currentTime: Date;
    hourHeight: number; // 1時間あたりの高さ（px）
    startHour: number; // グリッドの開始時刻
}

/**
 * 過去の時間帯を示すグレーオーバーレイ
 * 右側のカレンダーエリアに表示
 */
export default function PastTimeOverlay({ currentTime, hourHeight, startHour }: PastTimeOverlayProps) {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();

    // 過去の時間帯の高さを計算
    const totalMinutesFromStart = (hours - startHour) * 60 + minutes;
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
