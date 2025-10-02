import React, { useState, useRef, useEffect } from "react";

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
    // 描画用のstate（最小限）
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 即座に参照・更新できるref
    const pullDistanceRef = useRef(0);
    const isRefreshingRef = useRef(false);
    const touchStateRef = useRef<'none' | 'pulling' | 'scrolling' | 'decided'>('none');
    const startYRef = useRef(0);
    const startScrollTopRef = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const PULL_THRESHOLD = 70;
    const MAX_PULL = 200;
    const DIRECTION_THRESHOLD = 10; // 方向確定までの移動距離

    // 引っ張るほど抵抗が増える関数
    const applyResistance = (distance: number): number => {
        const resistance = 0.8;
        return MAX_PULL * (1 - Math.exp(-distance / (MAX_PULL * resistance)));
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleTouchStart = (e: TouchEvent) => {
            // リフレッシュ中は何もしない
            if (isRefreshingRef.current) return;

            const scrollTop = container.scrollTop;

            // スクロール位置が上部（誤差3px以内）の場合のみ初期化
            if (scrollTop <= 3) {
                startYRef.current = e.touches[0].clientY;
                startScrollTopRef.current = scrollTop;
                touchStateRef.current = 'none'; // 方向未確定
                pullDistanceRef.current = 0;
                setPullDistance(0);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            // リフレッシュ中は何もしない
            if (isRefreshingRef.current) return;

            // 既に方向が確定してプルでない場合は何もしない
            if (touchStateRef.current === 'decided') return;

            const currentY = e.touches[0].clientY;
            const deltaY = currentY - startYRef.current;
            const currentScrollTop = container.scrollTop;

            // 方向が未確定の場合
            if (touchStateRef.current === 'none') {
                // スクロール位置が変わった = スクロールが発生
                if (currentScrollTop > startScrollTopRef.current + 3) {
                    touchStateRef.current = 'decided';
                    return;
                }

                // 一定距離移動したら方向を確定
                if (Math.abs(deltaY) > DIRECTION_THRESHOLD) {
                    if (deltaY > 0 && currentScrollTop <= 3) {
                        // 下方向 & まだ上部 = プル動作
                        touchStateRef.current = 'pulling';
                    } else {
                        // それ以外 = 通常スクロール
                        touchStateRef.current = 'decided';
                        return;
                    }
                } else {
                    // まだ方向確定できない
                    return;
                }
            }

            // プル動作確定後
            if (touchStateRef.current === 'pulling') {
                // スクロールが発生したらキャンセル
                if (currentScrollTop > 3) {
                    touchStateRef.current = 'decided';
                    pullDistanceRef.current = 0;
                    setPullDistance(0);
                    return;
                }

                // 下方向のプルのみ
                if (deltaY > 0) {
                    e.preventDefault();
                    const resistedDistance = applyResistance(deltaY);
                    pullDistanceRef.current = resistedDistance;
                    setPullDistance(resistedDistance);
                } else {
                    // 上方向に戻したらキャンセル
                    touchStateRef.current = 'decided';
                    pullDistanceRef.current = 0;
                    setPullDistance(0);
                }
            }
        };

        const handleTouchEnd = () => {
            // プル動作中でない場合は何もしない
            if (touchStateRef.current !== 'pulling') {
                touchStateRef.current = 'none';
                pullDistanceRef.current = 0;
                setPullDistance(0);
                return;
            }

            touchStateRef.current = 'none';

            // 閾値を超えていたらリフレッシュ
            if (pullDistanceRef.current >= PULL_THRESHOLD && !isRefreshingRef.current) {
                isRefreshingRef.current = true;
                setIsRefreshing(true);
                pullDistanceRef.current = PULL_THRESHOLD;
                setPullDistance(PULL_THRESHOLD);

                onRefresh().finally(() => {
                    isRefreshingRef.current = false;
                    setIsRefreshing(false);
                    pullDistanceRef.current = 0;
                    setPullDistance(0);
                });
            } else {
                // 閾値未満ならリセット
                pullDistanceRef.current = 0;
                setPullDistance(0);
            }
        };

        container.addEventListener("touchstart", handleTouchStart, { passive: true });
        container.addEventListener("touchmove", handleTouchMove, { passive: false });
        container.addEventListener("touchend", handleTouchEnd);
        container.addEventListener("touchcancel", handleTouchEnd); // タッチキャンセル時も処理

        return () => {
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchmove", handleTouchMove);
            container.removeEventListener("touchend", handleTouchEnd);
            container.removeEventListener("touchcancel", handleTouchEnd);
        };
    }, []); // 依存配列を空にして1度だけ登録

    const contentStyle = {
        marginTop: `${pullDistance}px`,
        transition: isRefreshing || pullDistance === 0 ? "margin-top 0.3s" : "none",
    };

    const indicatorStyle = {
        opacity: Math.min(pullDistance / PULL_THRESHOLD, 1),
        transition: isRefreshing || pullDistance === 0 ? "opacity 0.3s" : "none",
    };

    return (
        <div
            ref={containerRef}
            className="relative h-full w-full overflow-y-auto"
            style={{ overscrollBehavior: 'none', WebkitOverflowScrolling: 'touch' }}
        >
            {/* コンテンツ全体が下に移動 */}
            <div style={contentStyle}>
                {/* リフレッシュインジケーター */}
                <div
                    className="absolute top-0 right-0 left-0 z-50 -mt-16 flex h-16 items-center justify-center"
                    style={indicatorStyle}
                >
                    <div className={`${isRefreshing ? "animate-spin" : ""}`}>
                        <svg className="h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    </div>
                </div>

                {children}
            </div>
        </div>
    );
}
