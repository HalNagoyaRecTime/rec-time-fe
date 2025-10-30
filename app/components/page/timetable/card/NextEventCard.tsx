// === 次の予定カードコンポーネント ===
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import type { EventRow } from "~/api/student";
import {
    formatTime,
    getTimeUntilEvent,
    isGatherTimePassed,
    isEventOngoing,
    areAllEventsFinished,
} from "~/utils/timetable/nextEventCalculator";
import { isTodayAfterEventDate } from "~/utils/notifications";

// 呼び出し中（集合時刻が過ぎたがイベント終了に達していない）を判定する関数
const isCallingOut = (event: EventRow | null): boolean => {
    if (!event || !event.f_gather_time || !event.f_start_time || !event.f_duration) return false;

    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
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
import AllSchedulesModal from "~/components/modal/AllSchedulesModal";
import ThanksCard from "~/components/page/timetable/card/ThanksCard";
import NextDayCard from "~/components/page/timetable/card/NextDayCard";

interface NextEventCardProps {
    event: EventRow | null;
    isLoggedIn: boolean;
    allEvents?: EventRow[];
    onModalStateChange?: (isOpen: boolean) => void;
}

// Animation state machine: idle -> opening -> open -> closing -> idle
type AnimationState = "idle" | "opening" | "open" | "closing";

/**
 * 次の予定を表示するカード
 * - イベントがある場合: イベント情報を表示
 * - 参加予定がない場合: 「参加予定のイベントはありません」を表示
 * - 未登録ユーザー: 「ログインしてください」を表示
 */
export default function NextEventCard({ event, isLoggedIn, allEvents = [], onModalStateChange }: NextEventCardProps) {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [rotationDeg, setRotationDeg] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationState, setAnimationState] = useState<AnimationState>("idle");

    // Refs to manage timeouts and cleanup
    const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const recoveryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cleanup effect: Clear timeouts on unmount to prevent memory leaks and state inconsistencies
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

    // Recovery mechanism: If animation is stuck for too long, reset to prevent broken UI state
    useEffect(() => {
        if (animationState !== "idle") {
            // Clear any existing recovery timeout
            if (recoveryTimeoutRef.current) {
                clearTimeout(recoveryTimeoutRef.current);
            }

            // Set a 2-second timeout to recover from stuck animation state
            recoveryTimeoutRef.current = setTimeout(() => {
                console.warn(
                    "[NextEventCard] Animation recovery triggered - State was stuck in",
                    animationState
                );
                setIsAnimating(false);
                setAnimationState("idle");
                setShowModal(false);
                setRotationDeg((prev) => prev % 360);
            }, 2000);
        }
    }, [animationState]);

    // 登録ページへ遷移
    const handleNavigateToRegister = () => {
        navigate("/register/student-id");
    };

    // Robust modal opening with state machine and validation
    const handleOpenModal = () => {
        // Guard: Prevent multiple simultaneous animations
        if (isAnimating || animationState !== "idle") {
            console.warn("[NextEventCard] Opening prevented - Animation already in progress:", animationState);
            return;
        }

        console.log("[NextEventCard] Opening modal - Starting animation");
        setIsAnimating(true);
        setAnimationState("opening");

        // Rotate card immediately
        setRotationDeg((prev) => prev + 180);

        // Show modal at 200ms (after rotation starts but before it completes)
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }
        animationTimeoutRef.current = setTimeout(() => {
            console.log("[NextEventCard] Modal showing");
            setShowModal(true);
            onModalStateChange?.(true);
            setAnimationState("open");
        }, 200);

        // Complete animation and reset at 600ms
        setTimeout(() => {
            console.log("[NextEventCard] Opening animation complete");
            setIsAnimating(false);
            // Reset rotation modulo 360 to prevent very large rotation values
            setRotationDeg((prev) => prev % 360);
            // Clear timeout ref
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
                animationTimeoutRef.current = null;
            }
        }, 600);
    };

    // Robust modal closing animation with state validation
    const handleModalClosing = () => {
        // Guard: Only allow closing if modal is actually open
        if (isAnimating || animationState !== "open") {
            console.warn("[NextEventCard] Closing prevented - Invalid animation state:", animationState);
            return;
        }

        console.log("[NextEventCard] Closing modal - Starting reverse animation");
        setIsAnimating(true);
        setAnimationState("closing");

        // Rotate card back 180 degrees
        setRotationDeg((prev) => prev + 180);

        // Complete animation at 600ms
        setTimeout(() => {
            console.log("[NextEventCard] Closing animation complete");
            setIsAnimating(false);
            // Reset rotation modulo 360
            setRotationDeg((prev) => prev % 360);
            // Clear timeout ref
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
                animationTimeoutRef.current = null;
            }
        }, 600);
    };

    // Final modal close after animation completes
    const handleCloseModal = () => {
        console.log("[NextEventCard] Modal fully closed");
        setShowModal(false);
        setAnimationState("idle");
        onModalStateChange?.(false);
    };

    // 未登録ユーザーの場合
    if (!isLoggedIn) {
        return (
            <div
                className="relative mt-4 mb-9 flex cursor-pointer flex-col items-center gap-3 rounded-md bg-[#000D91]/80 px-3 py-14 text-black shadow-2xl"
                onClick={handleNavigateToRegister}
            >
                <h3 className="font-title text-lg font-black text-white">ログインしてください。</h3>
            </div>
        );
    }

    // イベント翌日の場合はNextDayCardを表示（優先度1 - 最優先）
    if (isTodayAfterEventDate()) {
        return <NextDayCard onModalStateChange={onModalStateChange} />;
    }

    // すべてのイベントが終了したかどうか
    const allFinished = areAllEventsFinished(allEvents);

    // 参加予定のイベントがない場合
    if (!event) {
        // 出場登録があるイベントが存在するかチェック
        const hasRegisteredEvents = allEvents.some((e) => e.f_is_my_entry === true);

        // すべてのイベントが終了した場合はThanksCardを表示（優先度2）
        if (allFinished && hasRegisteredEvents) {
            return <ThanksCard onModalStateChange={onModalStateChange} />;
        }

        // 出場登録がない場合のメッセージ
        const noRegistrationMessage = "出場登録がされていません";
        const noRegistrationSubMessage = "出場データが入力されるまでお待ちください";

        // イベント終了時のメッセージ
        const noTodayEventMessage = "本日の参加予定イベントはありません";

        return (
            <>
                <div className="mt-4 mb-9" style={{ perspective: "1000px" }}>
                    <div
                        className="relative cursor-pointer"
                        onClick={isAnimating ? undefined : handleOpenModal}
                        style={{
                            transformStyle: "preserve-3d",
                            transition: isAnimating ? "transform 0.6s ease-in-out" : "none",
                            transform: `rotateY(${rotationDeg}deg)`,
                        }}
                    >
                        {/* 表面 */}
                        <div
                            className="flex flex-col items-center gap-3 rounded-md bg-[#000D91]/80 px-3 py-16 text-black shadow-2xl hover:bg-[#000D91]/90 active:scale-[0.98]"
                            style={{
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                            }}
                        >
                            <h3 className="font-title text-lg font-black text-white">
                                {hasRegisteredEvents ? noTodayEventMessage : noRegistrationMessage}
                            </h3>
                            {!hasRegisteredEvents && (
                                <p className="text-sm text-white/80">{noRegistrationSubMessage}</p>
                            )}
                            <div className="mt-2 text-xs text-white opacity-70">タップで全予定表示 →</div>
                        </div>

                        {/* 裏面 */}
                        <div
                            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-md bg-[#910000]/80 px-3 py-16 text-black shadow-2xl"
                            style={{
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                transform: "rotateY(180deg)",
                            }}
                        ></div>
                    </div>
                </div>

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

    // 集合時間が過ぎたかどうか
    const gatherTimePassed = isGatherTimePassed(event.f_gather_time);

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

    // 次の予定イベントがある場合
    return (
        <>
            <div className="mt-4 mb-9" style={{ perspective: "1000px" }}>
                <div
                    className="relative cursor-pointer"
                    onClick={isAnimating ? undefined : handleOpenModal}
                    style={{
                        transformStyle: "preserve-3d",
                        transition: isAnimating ? "transform 0.6s ease-in-out" : "none",
                        transform: `rotateY(${rotationDeg}deg)`,
                    }}
                >
                    {/* 表面 */}
                    <div
                        className="flex flex-col items-center gap-3 rounded-md bg-[#000D91]/80 px-3 pt-9 pb-7 text-black drop-shadow-2xl hover:bg-[#000D91]/90 active:scale-[0.98]"
                        style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                        }}
                    >
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
                                            {!calling && !ongoing && minutesUntilGather <= 120 && minutesUntilGather > 0 && (
                                                <span className={`min-w-0 truncate ${minutesUntilGather <= 30 ? "text-red-600" : ""}`}>
                                                    {getTimeUntilEvent(event.f_gather_time)}
                                                </span>
                                            )}
                                            {calling && (
                                                <span className="min-w-0 truncate text-orange-500">呼び出し中</span>
                                            )}
                                        </p>
                                    )}

                                    {/* 開始時間 */}
                                    <p className="flex min-w-0 gap-2">
                                        <span className="flex-shrink-0">{formatTime(event.f_start_time)}</span>
                                        {minutesUntilStart <= 120 && minutesUntilStart >= -5 && (
                                            <span className={`min-w-0 truncate ${minutesUntilStart <= 30 ? "text-red-600" : ""}`}>
                                                {minutesUntilStart >= -5 && minutesUntilStart <= 0 ? "まもなく" : getTimeUntilEvent(event.f_start_time, event.f_gather_time)}
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
                        <div className="absolute top-3 right-4 text-xs text-white opacity-70">タップで全予定表示 →</div>
                    </div>

                    {/* 裏面 */}
                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-md bg-[#000D91] px-3 py-7 text-black drop-shadow-2xl"
                        style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                        }}
                    ></div>
                </div>
            </div>

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
