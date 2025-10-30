// === 次の予定カードコンポーネント ===
import React, { useState } from "react";
import { useNavigate } from "react-router";
import type { EventRow } from "~/api/student";
import { formatTime, getTimeUntilEvent, isGatherTimePassed } from "~/utils/timetable/nextEventCalculator";
import AllSchedulesModal from "~/components/modal/AllSchedulesModal";

interface NextEventCardProps {
    event: EventRow | null;
    isLoggedIn: boolean;
    allEvents?: EventRow[];
    onModalStateChange?: (isOpen: boolean) => void;
}

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

    // 登録ページへ遷移
    const handleNavigateToRegister = () => {
        navigate("/register/student-id");
    };

    // カード回転アニメーション + モーダル表示
    const handleOpenModal = () => {
        if (isAnimating) return;

        setIsAnimating(true);
        // 現在の角度から+180度回転
        setRotationDeg((prev) => prev + 180);

        // 回転開始200ms後にモーダル表示
        setTimeout(() => {
            setShowModal(true);
            onModalStateChange?.(true);
        }, 200);

        // 回転完了後
        setTimeout(() => {
            setIsAnimating(false);
            // 360度を超えたら0度にリセット（見た目は変わらない）
            setRotationDeg((prev) => prev % 360);
        }, 600);
    };

    // モーダルが閉じ始める時にカードを回転開始
    const handleModalClosing = () => {
        if (isAnimating) return;

        setIsAnimating(true);
        // 現在の角度から+180度回転（元に戻る）
        setRotationDeg((prev) => prev + 180);

        // 回転完了後
        setTimeout(() => {
            setIsAnimating(false);
            // 360度を超えたら0度にリセット（見た目は変わらない）
            setRotationDeg((prev) => prev % 360);
        }, 600);
    };

    // モーダルが完全に閉じた後の処理
    const handleCloseModal = () => {
        setShowModal(false);
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

    // 参加予定のイベントがない場合
    if (!event) {
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
                                本日参加予定のイベントはありません
                            </h3>
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
                        >
                            <h3 className="font-title text-lg font-black text-white">裏面です</h3>
                        </div>
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
                        className="flex flex-col items-center gap-3 rounded-md bg-[#000D91]/80 px-3 py-7 text-black drop-shadow-2xl hover:bg-[#000D91]/90 active:scale-[0.98]"
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
                                    {event.f_gather_time && !gatherTimePassed && <p>集合時間</p>}
                                    <p>開始時間</p>
                                    {event.f_place && <p>集合場所</p>}
                                </div>

                                {/* 右側：データ列 */}
                                <div className="flex min-w-0 flex-col text-white">
                                    {/* 集合時間 */}
                                    {event.f_gather_time && !gatherTimePassed && (
                                        <p className="flex min-w-0 gap-2">
                                            <span className="flex-shrink-0">{formatTime(event.f_gather_time)}</span>
                                            <span className="min-w-0 truncate text-red-600">
                                                {getTimeUntilEvent(event.f_gather_time)}
                                            </span>
                                        </p>
                                    )}

                                    {/* 開始時間 */}
                                    <p className="flex min-w-0 gap-2">
                                        <span className="flex-shrink-0">{formatTime(event.f_start_time)}</span>
                                        <span className="min-w-0 truncate">
                                            {getTimeUntilEvent(event.f_start_time, event.f_gather_time)}
                                        </span>
                                    </p>

                                    {/* 場所 */}
                                    {event.f_place && <p className="min-w-0 truncate">{event.f_place}</p>}
                                </div>
                            </div>
                        </div>

                        {/* 「次の予定」バッジ */}
                        <div className="absolute top-3 left-4 text-sm font-black text-white">次の予定</div>

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
                    >
                        <h3 className="font-title text-lg font-black text-white">裏面です</h3>
                    </div>
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
