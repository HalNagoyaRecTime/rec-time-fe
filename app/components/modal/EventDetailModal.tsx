// === イベント詳細モーダルコンポーネント ===
import React, { useState, useRef, useEffect, useMemo } from "react";
import type { EventRow } from "~/api/student";
import { isCallingOut } from "~/utils/timetable/eventStatusChecker";
import { useModalGestureControl } from "~/hooks/useModalGestureControl";
import { useCurrentTime } from "~/hooks/useCurrentTime";
import { useModalScrollLock } from "~/hooks/useModalScrollLock";
import { useModalCloseHandler } from "~/hooks/useModalCloseHandler";
import EventDetailCard from "./EventDetailCard";

interface EventDetailModalProps {
    isOpen: boolean;
    event: EventRow | null;
    onClose: () => void;
    onClosing?: () => void;
}

/**
 * イベント詳細を表示するモーダル
 * - 背景クリックで閉じる
 * - 下からスライドインアニメーション
 * - スクロール上端でスワイプダウンすると閉じる
 * - AllSchedulesModal と同じジェスチャーコントロールを使用
 */
export default function EventDetailModal({ isOpen, event, onClose, onClosing }: EventDetailModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

    // 現在時刻を取得（時刻変更時に依存）
    const currentTime = useCurrentTime();

    // ジェスチャーコントロール hook を使用
    const {
        translateY,
        isDragging,
        handleScrollTouchStart,
        handleScrollTouchMove,
        handleScrollTouchEnd,
        createHandlerbarTouchHandlers,
        resetTranslateY,
    } = useModalGestureControl(scrollRef, isOpen);

    // モーダル閉じる処理 hook を使用
    const { isClosingState, handleClose, handleBackdropClick } = useModalCloseHandler(onClose, onClosing);

    // モーダルが開いたときにアニメーション開始
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                setIsVisible(true);
            }, 50);
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    // モーダルが開いている間、背景のスクロールとpull-to-refreshを無効化
    useModalScrollLock(isOpen);

    // 分単位の時刻のみを使用（秒単位の変更は無視）
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    // ステータスを判定（時刻が実際に変わった時のみ再計算）
    const isCalling = useMemo(() => {
        if (!event) return false;
        return isCallingOut(event);
    }, [event, currentMinutes]);
    const status = useMemo(() => (isCalling ? ("calling" as const) : null), [isCalling]);

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

    if (!isOpen || !event) return null;

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
                    className="flex-1 overflow-y-auto px-4 pt-6 pb-6 sm:px-20"
                    onTouchStart={handleScrollTouchStart}
                    onTouchMove={handleScrollTouchMove}
                    onTouchEnd={handleScrollTouchEndWithClose}
                >
                    {/* イベント詳細カードを表示 */}
                    <EventDetailCard event={event} status={status} isCalling={isCalling} />
                </div>
            </div>
        </div>
    );
}
