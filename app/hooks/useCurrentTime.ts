import { useState, useEffect } from "react";
import { getCurrentTime } from "~/utils/currentTimeManager";

/**
 * 現在時刻を取得・管理するカスタムフック
 * currentTimeManager から時刻を取得し、コンポーネント再レンダリングをトリガーする
 * デバッグ用の時刻操作機能に対応（time-changedイベントで即座に反映）
 */
export function useCurrentTime(debugOffset: number = 0) {
    const [currentTime, setCurrentTime] = useState<Date>(() => {
        const time = getCurrentTime();
        return new Date(time.getTime() + debugOffset);
    });

    useEffect(() => {
        // 初回とdebugOffset変更時に即座に更新
        const time = getCurrentTime();
        const adjustedTime = new Date(time.getTime() + debugOffset);
        setCurrentTime(adjustedTime);

        // デバッグ時：setTime() で発火される time-changed イベントをリッスン
        const handleTimeChanged = (event: Event) => {
            if (event instanceof CustomEvent) {
                const time = event.detail?.time || getCurrentTime();
                const adjustedTime = new Date(time.getTime() + debugOffset);
                setCurrentTime(adjustedTime);
                console.log("[useCurrentTime] イベントから時刻更新:", adjustedTime);
            }
        };

        window.addEventListener('time-changed', handleTimeChanged);

        // 通常動作時：1分ごとに更新（パフォーマンスを優先）
        const timer = setInterval(() => {
            const time = getCurrentTime();
            const adjustedTime = new Date(time.getTime() + debugOffset);
            setCurrentTime(adjustedTime);
        }, 60000); // 60秒ごと

        return () => {
            clearInterval(timer);
            window.removeEventListener('time-changed', handleTimeChanged);
        };
    }, [debugOffset]);

    return currentTime;
}
