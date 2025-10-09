// === 次の予定カードコンポーネント ===
import React from "react";
import { useNavigate } from "react-router";
import type { EventRow } from "~/api/student";
import { formatTime, getTimeUntilEvent, isGatherTimePassed } from "~/utils/timetable/nextEventCalculator";

interface NextEventCardProps {
    event: EventRow | null;
    isLoggedIn: boolean;
}

/**
 * 次の予定を表示するカード
 * - イベントがある場合: イベント情報を表示
 * - 参加予定がない場合: 「参加予定のイベントはありません」を表示
 * - 未登録ユーザー: 「ログインしてください」を表示
 */
export default function NextEventCard({ event, isLoggedIn }: NextEventCardProps) {
    const navigate = useNavigate();

    // 登録ページへ遷移
    const handleNavigateToRegister = () => {
        navigate("/register/student-id");
    };

    // 未登録ユーザーの場合
    if (!isLoggedIn) {
        return (
            <div
                className="relative mt-4 mb-9 flex cursor-pointer flex-col items-center gap-3 rounded-md bg-blue-500 px-3 py-14 text-black"
                onClick={handleNavigateToRegister}
            >
                <h3 className="font-title text-lg font-black text-white">ログインしてください。</h3>
            </div>
        );
    }

    // 参加予定のイベントがない場合
    if (!event) {
        return (
            <div className="relative mt-4 mb-9 flex flex-col items-center gap-3 rounded-md bg-blue-500 px-3 py-14 text-black">
                <h3 className="font-title text-lg font-black text-white">本日参加予定のイベントはありません</h3>
            </div>
        );
    }

    // 集合時間が過ぎたかどうか
    const gatherTimePassed = isGatherTimePassed(event.f_gather_time);

    // 次の予定イベントがある場合
    return (
        <div className="relative mt-4 mb-9 flex flex-col items-center gap-3 rounded-md bg-blue-500 px-3 py-7 text-black">
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
                                <span className="min-w-0 truncate">{getTimeUntilEvent(event.f_gather_time)}</span>
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
            <div
                className="absolute -top-3 flex h-[25px] w-[60px] items-center justify-center bg-amber-500 text-sm font-black text-blue-950"
                style={{ backgroundImage: "linear-gradient(133deg, #ffb402, #fbedbb)" }}
            >
                次の予定
            </div>
        </div>
    );
}
