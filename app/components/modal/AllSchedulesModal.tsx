// === 全予定表示モーダルコンポーネント（白基調デザイン版） ===
import React, { useState, useRef, useEffect, useMemo } from "react";
import type { EventRow } from "~/api/student";
import { sectionizeEvents } from "~/utils/timetable/eventSectionizer";
import { isCallingOut, isEventOngoing } from "~/utils/timetable/eventStatusChecker";
import { useModalGestureControl } from "~/hooks/useModalGestureControl";
import { useCurrentTime } from "~/hooks/useCurrentTime";
import { useModalScrollLock } from "~/hooks/useModalScrollLock";
import { useModalCloseHandler } from "~/hooks/useModalCloseHandler";
import EventDetailCard from "./EventDetailCard";
import EventSection from "./EventSection";

interface AllSchedulesModalProps {
    isOpen: boolean;
    events: EventRow[];
    onClose: () => void;
    onClosing?: () => void;
    isClosing?: boolean;
    cardRotation?: number;
}

/**
 * 全予定を表示するモーダル（白基調デザイン版）
 * - 背景クリックで閉じる
 * - 参加予定のイベントのみ表示
 * - 下からスライドインアニメーション
 * - スクロール上端でスワイプダウンすると閉じる
 */
export default function AllSchedulesModal({ isOpen, events, onClose, onClosing }: AllSchedulesModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

    // ジェスチャーコントロール hook を使用
    const {
        translateY,
        isDragging,
        handleScrollTouchStart,
        handleScrollTouchMove,
        handleScrollTouchEnd,
        createHandlerbarTouchHandlers,
        resetTranslateY,
    } = useModalGestureControl(scrollRef);

    // モーダル閉じる処理 hook を使用
    const { isClosingState, handleClose, handleBackdropClick } = useModalCloseHandler(onClose, onClosing);

    // アコーディオンリセット用のキー
    const [accordionResetKey, setAccordionResetKey] = useState(0);

    // モーダルが開いたときにアニメーション開始
    // また、EventListItem のアコーディオン状態をリセットするキーを更新
    useEffect(() => {
        if (isOpen) {
            // アコーディオンリセットキーを更新して、すべてのEventListItemの展開状態をリセット
            setAccordionResetKey((prev) => prev + 1);
            setTimeout(() => {
                setIsVisible(true);
            }, 50);
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    // モーダルが開いている間、背景のスクロールとpull-to-refreshを無効化
    useModalScrollLock(isOpen);

    // 現在時刻を取得（時刻変更時に依存）
    const currentTime = useCurrentTime();

    // イベント分類（eventSectionizer を使用）
    // モーダルが開く時か時刻が実際に変わった時のみ再計算する
    // currentTime の秒単位の変更は無視（分単位でのみ判定）
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const sections = useMemo(() => sectionizeEvents(events), [events, currentMinutes]);
    const myEvents = useMemo(() => events.filter((event) => event.f_is_my_entry === true), [events]);

    // ハンドルバーのタッチハンドラー
    const handlerbarHandlers = createHandlerbarTouchHandlers(handleClose);

    // スクロール領域のタッチ終了時に、引っ張られたかチェック
    const handleScrollTouchEndWithClose = () => {
        if (translateY > 100) {
            handleClose();
        } else {
            resetTranslateY();
        }
        handleScrollTouchEnd();
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
                    {...handlerbarHandlers}
                >
                    <div className="flex h-full w-full items-center justify-center">
                        {/* ハンドルバー */}
                        <div className="h-1.5 w-12 rounded-full bg-gray-300"></div>
                    </div>
                </div>

                {/* スクロール可能エリア */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto px-4 pt-4 pb-6 sm:px-20"
                    onTouchStart={handleScrollTouchStart}
                    onTouchMove={handleScrollTouchMove}
                    onTouchEnd={handleScrollTouchEndWithClose}
                >
                    <div className="space-y-6">
                        {/* 参加予定イベントなしのメッセージ */}
                        {myEvents.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <p className="text-lg text-gray-600">本日参加予定のイベントはありません</p>
                            </div>
                        )}

                        {/* 大きく表示するイベント（開催中 or 次の予定） */}
                        {sections.highlightedEvents.length > 0 && (
                            <div className="flex flex-col-reverse space-y-4">
                                {sections.highlightedEvents.map((event, index) => {
                                    const isCalling = isCallingOut(event);
                                    const isOngoing = isEventOngoing(event);
                                    // 同じイベントで複数の集合時刻がある場合の重複キー対策
                                    const uniqueKey = `${event.f_event_id}-${event.f_gather_time}-${index}`;

                                    return (
                                        <EventDetailCard
                                            key={uniqueKey}
                                            event={event}
                                            isOngoing={isOngoing}
                                            isCalling={isCalling}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        {/* 参加予定イベント（残りの未来のイベント） */}
                        <EventSection
                            key={`future-${accordionResetKey}`}
                            title="参加予定イベント"
                            events={sections.remainingFutureEvents}
                        />

                        {/* 終了イベント（過去） */}
                        <EventSection
                            key={`past-${accordionResetKey}`}
                            title="終了イベント"
                            events={sections.pastEvents}
                            isPast
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
