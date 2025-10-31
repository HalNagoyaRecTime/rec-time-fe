import React, { useState, useRef, useEffect } from "react";
import type { EventRow } from "~/api/student";
import {
    formatTime,
    getTimeUntilEvent,
    isEventOngoing,
    isCallingOut,
} from "~/utils/timetable/nextEventCalculator";
import AllSchedulesModal from "~/components/modal/AllSchedulesModal";
import { FlipCard } from "~/components/ui/FlipCard";

interface ScheduleEventCardProps {
    event: EventRow;
    allEvents: EventRow[];
    onModalStateChange?: (isOpen: boolean) => void;
}

// アニメーションステートマシン：idle → opening → open → closing → idle
type AnimationState = "idle" | "opening" | "open" | "closing";

/**
 * 次の予定イベント表示カード
 * イベント情報を表示し、クリックで全予定モーダルを開く
 */
export default function ScheduleEventCard({
    event,
    allEvents,
    onModalStateChange,
}: ScheduleEventCardProps) {
    const [showModal, setShowModal] = useState(false);
    const [rotationDeg, setRotationDeg] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationState, setAnimationState] = useState<AnimationState>("idle");

    // タイムアウトとクリーンアップを管理するRef
    const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const recoveryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // クリーンアップ効果：アンマウント時にタイムアウトをクリアしてメモリリークと状態不一致を防ぐ
    useEffect(() => {
        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
            if (recoveryTimeoutRef.current) {
                clearTimeout(recoveryTimeoutRef.current);
            }
        };
    }, []);

    // リカバリ機構：アニメーションが長時間スタックしている場合、UIの壊れた状態を防ぐためにリセット
    useEffect(() => {
        if (animationState !== "idle") {
            // 既存のリカバリタイムアウトをクリア
            if (recoveryTimeoutRef.current) {
                clearTimeout(recoveryTimeoutRef.current);
            }

            // スタックしたアニメーション状態から復帰するために2秒のタイムアウトを設定
            recoveryTimeoutRef.current = setTimeout(() => {
                console.warn(
                    "[ScheduleEventCard] Animation recovery triggered - State was stuck in",
                    animationState
                );
                setIsAnimating(false);
                setAnimationState("idle");
                setShowModal(false);
                setRotationDeg((prev) => prev % 360);
            }, 2000);
        }
    }, [animationState]);

    // ステートマシンとバリデーションを使用した堅牢なモーダルオープン
    const handleOpenModal = () => {
        // ガード：複数の同時アニメーションを防止
        if (isAnimating || animationState !== "idle") {
            console.warn(
                "[ScheduleEventCard] Opening prevented - Animation already in progress:",
                animationState
            );
            return;
        }

        console.log("[ScheduleEventCard] Opening modal - Starting animation");
        setIsAnimating(true);
        setAnimationState("opening");

        // カードを直ぐに回転
        setRotationDeg((prev) => prev + 180);

        // 200msでモーダルを表示（回転開始後だが完了前）
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }
        animationTimeoutRef.current = setTimeout(() => {
            console.log("[ScheduleEventCard] Modal showing");
            setShowModal(true);
            onModalStateChange?.(true);
            setAnimationState("open");
        }, 200);

        // 600msでアニメーション完了とリセット
        setTimeout(() => {
            console.log("[ScheduleEventCard] Opening animation complete");
            setIsAnimating(false);
            // 360で余りを取ってリセットして、非常に大きい回転値を防止
            setRotationDeg((prev) => prev % 360);
            // タイムアウトRefをクリア
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
                animationTimeoutRef.current = null;
            }
        }, 600);
    };

    // ステート検証による堅牢なモーダルクローズアニメーション
    const handleModalClosing = () => {
        // ガード：モーダルが実際に開いている場合のみクローズを許可
        if (isAnimating || animationState !== "open") {
            console.warn(
                "[ScheduleEventCard] Closing prevented - Invalid animation state:",
                animationState
            );
            return;
        }

        console.log("[ScheduleEventCard] Closing modal - Starting reverse animation");
        setIsAnimating(true);
        setAnimationState("closing");

        // カードを180度戻す
        setRotationDeg((prev) => prev + 180);

        // 600msでアニメーション完了
        setTimeout(() => {
            console.log("[ScheduleEventCard] Closing animation complete");
            setIsAnimating(false);
            // 360で余りを取ってリセット
            setRotationDeg((prev) => prev % 360);
            // タイムアウトRefをクリア
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
                animationTimeoutRef.current = null;
            }
        }, 600);
    };

    // アニメーション完了後の最終的なモーダルクローズ
    const handleCloseModal = () => {
        console.log("[ScheduleEventCard] Modal fully closed");
        setShowModal(false);
        setAnimationState("idle");
        onModalStateChange?.(false);
    };

    // 開催中かどうか
    const ongoing = isEventOngoing(event);

    // 呼び出し中かどうか
    const calling = isCallingOut(event);

    // 集合時刻までの残り時間を計算（分単位）
    const getMinutesUntilGatherTime = (): number => {
        if (!event.f_gather_time) return Infinity;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const gatherHour = parseInt(event.f_gather_time.substring(0, 2), 10);
        const gatherMinute = parseInt(event.f_gather_time.substring(2, 4), 10);
        const gatherMinutes = gatherHour * 60 + gatherMinute;
        return gatherMinutes - currentMinutes;
    };
    const minutesUntilGather = getMinutesUntilGatherTime();

    // 開始時刻までの残り時間を計算（分単位）
    const getMinutesUntilStartTime = (): number => {
        if (!event.f_start_time) return Infinity;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startHour = parseInt(event.f_start_time.substring(0, 2), 10);
        const startMinute = parseInt(event.f_start_time.substring(2, 4), 10);
        const startMinutes = startHour * 60 + startMinute;
        return startMinutes - currentMinutes;
    };
    const minutesUntilStart = getMinutesUntilStartTime();

    return (
        <>
            <FlipCard rotationDeg={rotationDeg} isAnimating={isAnimating} onClick={handleOpenModal}>
                {/* 表面 */}
                <FlipCard.Front className="flex flex-col items-center gap-3 rounded-md bg-[#000D91]/80 px-3 pt-9 pb-7 text-black drop-shadow-2xl hover:bg-[#000D91]/90 active:scale-[0.98]">
                    <h3 className="font-title w-full truncate px-2 text-center text-lg font-black text-white">
                        {event.f_event_name || "イベント"}
                    </h3>
                    <div className="flex w-full justify-center">
                        <div className="flex max-w-full min-w-0 gap-3">
                            {/* 左側：ラベル列 */}
                            <div className="flex-shrink-0 font-normal text-[#FFB400]">
                                {event.f_gather_time && <p>集合時間</p>}
                                <p>開始時間</p>
                                {event.f_place && <p>集合場所</p>}
                            </div>

                            {/* 右側：データ列 */}
                            <div className="flex min-w-0 flex-col text-white">
                                {/* 集合時間 */}
                                {event.f_gather_time && (
                                    <p className="flex min-w-0 gap-2">
                                        <span className="flex-shrink-0">{formatTime(event.f_gather_time)}</span>
                                        {!calling &&
                                            !ongoing &&
                                            minutesUntilGather <= 120 &&
                                            minutesUntilGather > 0 && (
                                                <span
                                                    className={`min-w-0 truncate ${
                                                        minutesUntilGather <= 30 ? "text-red-600" : ""
                                                    }`}
                                                >
                                                    {getTimeUntilEvent(event.f_gather_time)}
                                                </span>
                                            )}
                                        {calling && (
                                            <span className="min-w-0 truncate text-orange-500">
                                                呼び出し中
                                            </span>
                                        )}
                                    </p>
                                )}

                                {/* 開始時間 */}
                                <p className="flex min-w-0 gap-2">
                                    <span className="flex-shrink-0">{formatTime(event.f_start_time)}</span>
                                    {minutesUntilStart <= 120 && minutesUntilStart >= -5 && (
                                        <span
                                            className={`min-w-0 truncate ${
                                                minutesUntilStart <= 30 ? "text-red-600" : ""
                                            }`}
                                        >
                                            {minutesUntilStart >= -5 && minutesUntilStart <= 0
                                                ? "まもなく"
                                                : getTimeUntilEvent(event.f_start_time, event.f_gather_time)}
                                        </span>
                                    )}
                                </p>

                                {/* 場所 */}
                                {event.f_place && <p className="min-w-0 truncate">{event.f_place}</p>}
                            </div>
                        </div>
                    </div>

                    {/* ステータスバッジ */}
                    <div className="absolute top-3 left-4">
                        {ongoing ? (
                            <div className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                                開催中
                            </div>
                        ) : calling ? (
                            <div className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                                呼び出し中
                            </div>
                        ) : (
                            <div className="text-sm font-black text-white">次の予定</div>
                        )}
                    </div>

                    {/* クリック可能アイコン */}
                    <div className="absolute top-3 right-4 text-xs text-white opacity-70">
                        タップで全予定表示 →
                    </div>
                </FlipCard.Front>

                {/* 裏面 */}
                <FlipCard.Back className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-md bg-[#000D91] px-3 py-7 text-black drop-shadow-2xl" />
            </FlipCard>

            {/* 全予定表示モーダル */}
            <AllSchedulesModal
                isOpen={showModal}
                events={allEvents}
                onClose={handleCloseModal}
                onClosing={handleModalClosing}
                isClosing={false}
                cardRotation={rotationDeg}
            />
        </>
    );
}