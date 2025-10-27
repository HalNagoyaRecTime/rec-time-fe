// === 全予定表示モーダルコンポーネント ===
import React, { useState, useRef, useEffect } from "react";
import type { EventRow } from "~/api/student";
import ScheduleListItem from "~/components/timetable/ScheduleListItem";

interface AllSchedulesModalProps {
    isOpen: boolean;
    events: EventRow[];
    onClose: () => void;
}

/**
 * 全予定を表示するモーダル
 * - スワイプで閉じる機能付き（モバイル）
 * - 背景クリックで閉じる
 * - 参加予定のイベントのみ表示
 */
export default function AllSchedulesModal({ isOpen, events, onClose }: AllSchedulesModalProps) {
    const [translateY, setTranslateY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const currentY = useRef(0);
    const modalRef = useRef<HTMLDivElement>(null);

    // モーダルが開いたときに状態をリセット
    useEffect(() => {
        if (isOpen) {
            setTranslateY(0);
            setIsDragging(false);
        }
    }, [isOpen]);

    // モーダルが開いている間、背景のスクロールを無効化
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // 参加予定のイベントのみをフィルタして開始時刻順にソート
    const myEvents = events
        .filter((event) => event.f_is_my_entry === true)
        .sort((a, b) => {
            const aTime = parseInt(a.f_start_time || "0", 10);
            const bTime = parseInt(b.f_start_time || "0", 10);
            return aTime - bTime;
        });

    // タッチ開始
    const handleTouchStart = (e: React.TouchEvent) => {
        startY.current = e.touches[0].clientY;
        currentY.current = e.touches[0].clientY;
        setIsDragging(true);
    };

    // タッチ移動
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;

        currentY.current = e.touches[0].clientY;
        const diff = currentY.current - startY.current;

        // 下方向にのみドラッグ可能（上方向は無効）
        if (diff > 0) {
            setTranslateY(diff);
        }
    };

    // タッチ終了
    const handleTouchEnd = () => {
        if (!isDragging) return;

        const diff = currentY.current - startY.current;

        // 100px以上下にドラッグしたら閉じる
        if (diff > 100) {
            onClose();
        }

        // 状態をリセット
        setTranslateY(0);
        setIsDragging(false);
    };

    // 背景クリックで閉じる
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="w-full sm:w-[90%] sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] flex flex-col transition-transform"
                style={{
                    transform: `translateY(${translateY}px)`,
                    transition: isDragging ? "none" : "transform 0.3s ease-out",
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* ドラッグハンドル（モバイル用） */}
                <div className="flex justify-center pt-3 pb-2 sm:hidden">
                    <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                </div>

                {/* ヘッダー */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">本日の予定</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="閉じる"
                    >
                        ×
                    </button>
                </div>

                {/* 予定リスト */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {myEvents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <p className="text-lg">本日参加予定のイベントはありません</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {myEvents.map((event) => (
                                <ScheduleListItem key={event.f_event_id} event={event} />
                            ))}
                        </div>
                    )}
                </div>

                {/* フッター（予定数表示） */}
                {myEvents.length > 0 && (
                    <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                        <p className="text-sm text-gray-600 text-center">
                            全 {myEvents.length} 件の予定
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}