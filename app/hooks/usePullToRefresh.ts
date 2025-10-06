// app/hooks/usePullToRefresh.ts
import { useCallback, useEffect, useRef, useState } from "react";

type Opts = { threshold?: number; onRefresh: () => Promise<void> | void };

export function usePullToRefresh({ threshold = 60, onRefresh }: Opts) {
    const startY = useRef<number | null>(null);
    const pulling = useRef(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const onTouchStart = useCallback(
        (e: TouchEvent) => {
            if (window.scrollY > 0 || isRefreshing) return;
            startY.current = e.touches[0].clientY;
            pulling.current = true;
            setPullDistance(0);
        },
        [isRefreshing]
    );

    const onTouchMove = useCallback(
        (e: TouchEvent) => {
            if (!pulling.current || startY.current === null || isRefreshing) return;
            const dy = e.touches[0].clientY - startY.current;
            if (dy > 0 && window.scrollY === 0) {
                e.preventDefault();
                const damped = Math.min(dy * 0.5, threshold * 2);
                setPullDistance(damped);
            }
        },
        [isRefreshing, threshold]
    );

    const onTouchEnd = useCallback(async () => {
        if (!pulling.current || isRefreshing) return;
        pulling.current = false;

        if (pullDistance >= threshold) {
            try {
                console.log("🔄 [스크롤 갱신] handleDownload 실행됨 / データ更新を開始します");
                setIsRefreshing(true);
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
        startY.current = null;
    }, [onRefresh, pullDistance, threshold, isRefreshing]);

    useEffect(() => {
        const el = document;
        el.addEventListener("touchstart", onTouchStart, { passive: false });
        el.addEventListener("touchmove", onTouchMove, { passive: false });
        el.addEventListener("touchend", onTouchEnd, { passive: false });
        return () => {
            el.removeEventListener("touchstart", onTouchStart as any);
            el.removeEventListener("touchmove", onTouchMove as any);
            el.removeEventListener("touchend", onTouchEnd as any);
        };
    }, [onTouchStart, onTouchMove, onTouchEnd]);

    return { pullDistance, isRefreshing };
}
