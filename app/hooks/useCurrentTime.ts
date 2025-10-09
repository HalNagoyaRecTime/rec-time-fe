import { useState, useEffect } from "react";

/**
 * 現在時刻を取得・管理するカスタムフック
 * デバッグ用の時刻オフセット機能付き
 */
export function useCurrentTime(debugOffset: number = 0) {
    const [currentTime, setCurrentTime] = useState<Date>(new Date());

    useEffect(() => {
        // 1分ごとに現在時刻を更新
        const timer = setInterval(() => {
            const now = new Date();
            // デバッグオフセットを加算（ミリ秒単位）
            const adjustedTime = new Date(now.getTime() + debugOffset);
            setCurrentTime(adjustedTime);
        }, 60000);

        return () => clearInterval(timer);
    }, [debugOffset]);

    return currentTime;
}
