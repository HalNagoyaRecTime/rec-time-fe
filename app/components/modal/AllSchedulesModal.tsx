// === 全予定表示モーダルコンポーネント（白基調デザイン版） ===
import React, { useState, useRef, useEffect } from "react";
import type { EventRow } from "~/api/student";
import { getCurrentTime } from "~/utils/currentTimeManager";
import EventDetailCard from "./EventDetailCard";
import EventSection from "./EventSection";

interface AllSchedulesModalProps {
    isOpen: boolean;
    events: EventRow[];
    onClose: () => void;
    onClosing?: () => void; // 閉じるアニメーション開始時のコールバック
    isClosing?: boolean;
    cardRotation?: number;
}

/**
 * 全予定を表示するモーダル（白基調デザイン）
 * - 背景クリックで閉じる
 * - 参加予定のイベントのみ表示
 * - 下からスライドインアニメーション
 * - スクロール上端でスワイプダウンすると閉じる
 */
export default function AllSchedulesModal({ isOpen, events, onClose, onClosing }: AllSchedulesModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [translateY, setTranslateY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isClosingState, setIsClosingState] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const startScrollTop = useRef(0);

    // モーダルが開いたときにアニメーション開始
    useEffect(() => {
        if (isOpen) {
            setIsClosingState(false);
            setTimeout(() => {
                setIsVisible(true);
            }, 50);
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    // モーダルが開いている間、背景のスクロールとpull-to-refreshを無効化
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            document.body.style.overscrollBehavior = "none";
            // iOS Safari用
            document.documentElement.style.overflow = "hidden";
            document.documentElement.style.overscrollBehavior = "none";

            // クリーンアップ関数
            return () => {
                document.body.style.overflow = "";
                document.body.style.overscrollBehavior = "";
                document.documentElement.style.overflow = "";
                document.documentElement.style.overscrollBehavior = "";
            };
        }
    }, [isOpen]);

    // 参加予定のイベントをフィルタ
    const myEvents = events.filter((event) => event.f_is_my_entry === true);

    // 現在時刻（HHmm形式に変換）
    const now = getCurrentTime();
    const currentTime = now.getHours() * 100 + now.getMinutes();

    console.log("[AllSchedulesModal] 現在時刻:", currentTime, `(${now.getHours()}:${now.getMinutes()})`);
    console.log("[AllSchedulesModal] 参加予定イベント数:", myEvents.length);

    // 開催中のイベントを判定する関数
    const isEventOngoing = (event: EventRow): boolean => {
        if (!event.f_start_time || !event.f_duration) return false;
        const startTime = parseInt(event.f_start_time, 10);
        const duration = parseInt(event.f_duration, 10);

        // 終了時刻を計算（HHmm形式）
        const startHour = Math.floor(startTime / 100);
        const startMinute = startTime % 100;
        const totalMinutes = startHour * 60 + startMinute + duration;
        const endTime = Math.floor(totalMinutes / 60) * 100 + (totalMinutes % 60);

        return currentTime >= startTime && currentTime < endTime;
    };

    // 呼び出し中（集合時刻が過ぎたがイベント終了に達していない）を判定する関数
    const isCallingOut = (event: EventRow): boolean => {
        if (!event.f_gather_time || !event.f_start_time || !event.f_duration) return false;

        const gatherTime = parseInt(event.f_gather_time, 10);
        const startTime = parseInt(event.f_start_time, 10);
        const duration = parseInt(event.f_duration, 10);

        // 終了時刻を計算（HHmm形式）
        const startHour = Math.floor(startTime / 100);
        const startMinute = startTime % 100;
        const totalMinutes = startHour * 60 + startMinute + duration;
        const endTime = Math.floor(totalMinutes / 60) * 100 + (totalMinutes % 60);

        // 集合時刻が過ぎて、イベント終了時刻に達していない場合
        return currentTime >= gatherTime && currentTime < endTime;
    };

    // すべてのイベントを時刻順にソート
    const sortedEvents = [...myEvents].sort((a, b) => {
        const aTime = parseInt(a.f_start_time || "0", 10);
        const bTime = parseInt(b.f_start_time || "0", 10);
        return aTime - bTime;
    });

    // 開催中のイベント
    const ongoingEvents = sortedEvents.filter((e) => isEventOngoing(e));

    // 未来のイベント（まだ開始していないイベント）
    const futureEvents = sortedEvents.filter((e) => {
        const startTime = parseInt(e.f_start_time || "0", 10);
        return startTime > currentTime;
    });

    // 上部に大きく表示するイベントを決定
    // 1. 開催中のイベントが複数ある場合 → 全て大きく表示
    // 2. 開催中が1つ + 未来のイベントで時刻が重複 → 重複分を大きく表示
    // 3. 開催中がない場合 → 次の1つ（または同時刻の複数）を大きく表示
    const highlightedEvents: EventRow[] = [];
    const remainingFutureEvents: EventRow[] = [];

    if (ongoingEvents.length > 0) {
        // 開催中イベントが存在する場合
        const lastOngoingTime = parseInt(ongoingEvents[ongoingEvents.length - 1].f_start_time || "0", 10);

        // 開催中イベントを全て追加
        highlightedEvents.push(...ongoingEvents);

        // 未来のイベントで、開催中と同時刻のものも大きく表示
        futureEvents.forEach((event) => {
            const startTime = parseInt(event.f_start_time || "0", 10);
            if (startTime === lastOngoingTime) {
                highlightedEvents.push(event);
            } else {
                remainingFutureEvents.push(event);
            }
        });
    } else if (futureEvents.length > 0) {
        // 開催中がない場合、次のイベントの時刻を取得
        const nextEventTime = parseInt(futureEvents[0].f_start_time || "0", 10);

        // 同時刻のイベントを全て大きく表示
        futureEvents.forEach((event) => {
            const startTime = parseInt(event.f_start_time || "0", 10);
            if (startTime === nextEventTime) {
                highlightedEvents.push(event);
            } else {
                remainingFutureEvents.push(event);
            }
        });
    }

    // 終了したイベント（開始時刻が現在以前で、開催中でもないもの）
    const pastEvents = sortedEvents.filter((e) => {
        const startTime = parseInt(e.f_start_time || "0", 10);
        return startTime <= currentTime && !isEventOngoing(e);
    });

    console.log("[AllSchedulesModal] 大きく表示:", highlightedEvents.length);
    console.log("[AllSchedulesModal] 残りの未来:", remainingFutureEvents.length);
    console.log("[AllSchedulesModal] 終了:", pastEvents.length);

    // スクロール可能領域でのタッチ開始
    const handleScrollTouchStart = (e: React.TouchEvent) => {
        if (!scrollRef.current) return;

        startY.current = e.touches[0].clientY;
        startScrollTop.current = scrollRef.current.scrollTop;
        setIsDragging(true);
    };

    // スクロール可能領域でのタッチ移動
    const handleScrollTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || !scrollRef.current) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;
        const scrollTop = scrollRef.current.scrollTop;

        // スクロール位置が上端（0）で、かつ下方向にドラッグしている場合のみモーダルを動かす
        if (scrollTop === 0 && diff > 0) {
            setTranslateY(diff);
            e.preventDefault(); // 背景へのスクロール防止
        } else {
            // それ以外は通常のスクロールを許可
            setTranslateY(0);
        }
    };

    // スクロール可能領域でのタッチ終了
    const handleScrollTouchEnd = () => {
        if (!isDragging) return;

        // 100px以上引っ張ったら閉じる
        if (translateY > 100) {
            handleClose();
        } else {
            setTranslateY(0);
        }

        setIsDragging(false);
    };

    // 閉じるアニメーション付きの処理
    const handleClose = () => {
        setIsClosingState(true);
        // 閉じるアニメーション開始を即座に通知
        onClosing?.();
        setTimeout(() => {
            onClose();
            setIsClosingState(false);
        }, 300);
    };

    // 背景クリックで閉じる
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-99 flex items-end justify-center bg-black/70 backdrop-blur-sm"
            onClick={handleBackdropClick}
            style={{
                opacity: isClosingState ? 0 : isVisible ? 1 : 0,
                transition: "opacity 0.3s ease-out",
                overscrollBehavior: "none",
                touchAction: "none",
            }}
        >
            <div
                ref={modalRef}
                className="flex h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:h-[95vh] sm:max-w-200"
                style={{
                    transform: isClosingState
                        ? "translateY(100vh)"
                        : isDragging
                          ? `translateY(${translateY}px)`
                          : isVisible
                            ? "translateY(0)"
                            : "translateY(100%)",
                    transition: isClosingState
                        ? "transform 0.3s ease-out"
                        : isDragging
                          ? "none"
                          : "transform 0.5s ease-out",
                    opacity: isVisible ? 1 : 0,
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
            >
                {/* つかめる部分 */}
                <div
                    className="relative flex h-10 cursor-grab flex-col items-center shadow-lg active:cursor-grabbing"
                    onTouchStart={(e) => {
                        e.stopPropagation();
                        startY.current = e.touches[0].clientY;
                        setIsDragging(true);
                    }}
                    onTouchMove={(e) => {
                        if (!isDragging) return;
                        e.stopPropagation();
                        const currentY = e.touches[0].clientY;
                        const diff = currentY - startY.current;
                        if (diff > 0) {
                            setTranslateY(diff);
                        }
                    }}
                    onTouchEnd={(e) => {
                        e.stopPropagation();
                        if (translateY > 100) {
                            handleClose();
                        } else {
                            setTranslateY(0);
                        }
                        setIsDragging(false);
                    }}
                >
                    <div className="flex h-full w-full items-center justify-center">
                        {/* ハンドルバー */}
                        <div className="h-1.5 w-12 rounded-full bg-gray-300"></div>
                    </div>
                </div>

                {/* スクロール可能エリア */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto px-4 pt-6 pb-6 sm:px-20"
                    onTouchStart={handleScrollTouchStart}
                    onTouchMove={handleScrollTouchMove}
                    onTouchEnd={handleScrollTouchEnd}
                >
                    {myEvents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <p className="text-lg text-gray-600">本日参加予定のイベントはありません</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* 大きく表示するイベント（開催中 or 次の予定） */}
                            {highlightedEvents.length > 0 && (
                                <div className="space-y-4">
                                    {highlightedEvents.map((event, index) => {
                                        // ステータスを決定
                                        const isOngoing = ongoingEvents.some((e) => e.f_event_id === event.f_event_id);
                                        const isCalling = isCallingOut(event);
                                        const isNext =
                                            !isOngoing && !isCalling && index === 0 && ongoingEvents.length === 0;
                                        const status = isOngoing
                                            ? "ongoing"
                                            : isCalling
                                              ? "calling"
                                              : isNext
                                                ? "next"
                                                : null;

                                        return (
                                            <EventDetailCard
                                                key={event.f_event_id}
                                                event={event}
                                                status={status}
                                                isOngoing={isOngoing}
                                                isCalling={isCalling}
                                            />
                                        );
                                    })}
                                </div>
                            )}

                            {/* 参加予定イベント（残りの未来のイベント） */}
                            <EventSection title="参加予定イベント" events={remainingFutureEvents} />

                            {/* 終了イベント（過去） */}
                            <EventSection title="終了イベント" events={pastEvents} isPast />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
