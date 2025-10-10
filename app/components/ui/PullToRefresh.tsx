import React, { useState, useRef, useEffect } from "react";
import { IoArrowDown } from "react-icons/io5";

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
    const touchStateRef = useRef<"none" | "pulling" | "scrolling" | "decided">("none");
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

        // 実際のスクロールコンテナを取得（親のmain要素）
        const getScrollContainer = (): HTMLElement => {
            let parent = container.parentElement;
            while (parent) {
                const overflow = window.getComputedStyle(parent).overflowY;
                if (overflow === "auto" || overflow === "scroll") {
                    return parent;
                }
                parent = parent.parentElement;
            }
            return document.documentElement;
        };

        const scrollContainer = getScrollContainer();

        const handleTouchStart = (e: TouchEvent) => {
            // リフレッシュ中は何もしない
            if (isRefreshingRef.current) return;

            const scrollTop = scrollContainer.scrollTop;
            startYRef.current = e.touches[0].clientY;
            startScrollTopRef.current = scrollTop;

            // スクロール位置が上部（誤差3px以内）の場合のみ初期化
            if (scrollTop <= 3) {
                touchStateRef.current = "none"; // 方向未確定
                pullDistanceRef.current = 0;
                setPullDistance(0);
            } else {
                // 上部でない場合は即座に決定状態に
                touchStateRef.current = "decided";
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            // リフレッシュ中は何もしない
            if (isRefreshingRef.current) return;

            // 既に方向が確定してプルでない場合は何もしない
            if (touchStateRef.current === "decided") return;

            const currentY = e.touches[0].clientY;
            const deltaY = currentY - startYRef.current;
            const currentScrollTop = scrollContainer.scrollTop;

            // 方向が未確定の場合
            if (touchStateRef.current === "none") {
                // スクロール位置が変わった = スクロールが発生
                if (currentScrollTop > startScrollTopRef.current + 3) {
                    touchStateRef.current = "decided";
                    return;
                }

                // 一定距離移動したら方向を確定
                if (Math.abs(deltaY) > DIRECTION_THRESHOLD) {
                    if (deltaY > 0 && startScrollTopRef.current <= 3 && currentScrollTop <= 3) {
                        // 下方向 & まだ上部 = プル動作
                        touchStateRef.current = "pulling";
                        e.preventDefault(); // すぐにpreventDefault
                    } else {
                        // それ以外 = 通常スクロール
                        touchStateRef.current = "decided";
                        return;
                    }
                } else {
                    // まだ方向確定できない
                    return;
                }
            }

            // プル動作確定後
            if (touchStateRef.current === "pulling") {
                e.preventDefault(); // プル中は常にpreventDefault

                // スクロールが発生したらキャンセル
                if (currentScrollTop > 3) {
                    touchStateRef.current = "decided";
                    pullDistanceRef.current = 0;
                    setPullDistance(0);
                    return;
                }

                // 下方向のプルのみ
                if (deltaY > 0) {
                    const resistedDistance = applyResistance(deltaY);
                    pullDistanceRef.current = resistedDistance;
                    setPullDistance(resistedDistance);
                } else {
                    // 上方向に戻したらキャンセル
                    touchStateRef.current = "decided";
                    pullDistanceRef.current = 0;
                    setPullDistance(0);
                }
            }
        };

        const handleTouchEnd = () => {
            // プル動作中でない場合は何もしない
            if (touchStateRef.current !== "pulling") {
                touchStateRef.current = "none";
                pullDistanceRef.current = 0;
                setPullDistance(0);
                return;
            }

            touchStateRef.current = "none";

            // 閾値を超えていたらリフレッシュ
            if (pullDistanceRef.current >= PULL_THRESHOLD && !isRefreshingRef.current) {
                // 振動フィードバック（Androidのみ）
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }

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
            className="relative h-full w-full"
            style={{ overscrollBehavior: "none", WebkitOverflowScrolling: "touch" }}
        >
            {/* コンテンツ全体が下に移動 */}
            <div style={contentStyle}>
                {/* リフレッシュインジケーター */}
                <div
                    className="absolute top-0 right-0 left-0 z-50 -mt-16 flex h-16 flex-col items-center justify-center gap-1"
                    style={indicatorStyle}
                >
                    {isRefreshing ? (
                        <div
                            className="h-6 w-6 animate-spin rounded-full py-1"
                            style={{
                                background:
                                    "conic-gradient(from 0deg, #FFB400 0deg, #FFB400 270deg, #FFD966 270deg, #FFD966 360deg)",
                                WebkitMask:
                                    "radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))",
                                mask: "radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))",
                            }}
                        />
                    ) : pullDistance > 0 ? (
                        // プル中 - 閾値を超えたら180度回転
                        <IoArrowDown
                            className="h-8 w-8 text-[#FFB400] transition-transform duration-300"
                            style={{ transform: pullDistance >= PULL_THRESHOLD ? "rotate(180deg)" : "rotate(0deg)" }}
                        />
                    ) : null}
                </div>

                {children}
            </div>
        </div>
    );
}
