import React from "react";
import type { EventRow } from "~/api/student";
import { formatTime, getTimeUntilEvent } from "~/utils/timetable/nextEventCalculator";
import { isEventOngoing, isCallingOut } from "~/utils/timetable/eventStatusChecker";

interface EventInfoPresenterProps {
    event: EventRow;
    minutesUntilGather: number;
    minutesUntilStart: number;
}

/**
 * イベント情報を表示するプレゼンテーションコンポーネント
 *
 * 責務：
 * - イベント名、集合時間、開始時間、場所の表示
 * - ステータスバッジの表示（開催中、呼び出し中、次の予定）
 * - 時間情報の表示（残り時間、警告色の適用）
 * - ロジック：なし（すべてpropsから受け取る）
 */
export default function EventInfoPresenter({ event, minutesUntilGather, minutesUntilStart }: EventInfoPresenterProps) {
    const ongoing = isEventOngoing(event);
    const calling = isCallingOut(event);

    return (
        <div className="flex flex-col items-center gap-3 rounded-md bg-[#000D91]/80 px-3 pt-9 pb-7 text-black drop-shadow-2xl hover:bg-[#000D91]/90 active:scale-[0.98]">
            {/* イベント名 */}
            <h3 className="font-title w-full truncate px-2 text-center text-lg font-black text-white">
                {event.f_event_name || "イベント"}
            </h3>

            {/* 情報セクション */}
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
                                    <span
                                        className={`min-w-0 truncate ${minutesUntilGather <= 30 ? "text-red-600" : ""}`}
                                    >
                                        {getTimeUntilEvent(event.f_gather_time)}
                                    </span>
                                )}
                                {calling && <span className="min-w-0 truncate text-orange-500">呼び出し中</span>}
                            </p>
                        )}

                        {/* 開始時間 */}
                        <p className="flex min-w-0 gap-2">
                            <span className="flex-shrink-0">{formatTime(event.f_start_time)}</span>
                            {minutesUntilStart <= 120 && minutesUntilStart >= -5 && (
                                <span className={`min-w-0 truncate ${minutesUntilStart <= 30 ? "text-red-600" : ""}`}>
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
                    <div className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">開催中</div>
                ) : calling ? (
                    <div className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">呼び出し中</div>
                ) : (
                    <div className="text-sm font-black text-white">次の予定</div>
                )}
            </div>

            {/* クリック可能アイコン */}
            <div className="absolute top-3 right-4 text-xs text-white opacity-70">タップで全予定表示 →</div>
        </div>
    );
}
