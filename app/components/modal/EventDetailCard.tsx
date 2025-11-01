// === イベント詳細カードコンポーネント ===
import React from "react";
import type { EventRow } from "~/api/student";
import EventStatusBadge from "../EventStatusBadge";
import EventInfoDisplay from "../EventInfoDisplay";
import EventImageDisplay from "../EventImageDisplay";

interface EventDetailCardProps {
    event: EventRow;
    status?: "next" | "ongoing" | "calling" | null;
    isOngoing?: boolean;
    isCalling?: boolean;
}

/**
 * イベントの詳細を大きく表示するカード
 * - 次の予定や、タップして開いた詳細表示に使用
 * - 開催中と呼び出し中は同時に表示可能
 */
export default function EventDetailCard({ event, status, isOngoing, isCalling }: EventDetailCardProps) {
    return (
        <div className="w-full">
            <div className="flex flex-col gap-3">
                {/* イベント情報エリア */}
                <div className="w-full">
                    {/* タイトル */}
                    <div className="flex w-full flex-col gap-1">
                        <div className="relative flex w-full items-center">
                            <div className="absolute h-6 w-1 rounded-full bg-blue-950"></div>
                            <h4 className="min-w-0 flex-1 overflow-hidden pb-1 pl-2 text-2xl font-bold text-ellipsis whitespace-nowrap text-gray-900">
                                {event.f_event_name || "イベント"}
                            </h4>
                        </div>
                        {/* ステータスバッジ（タイトル下） */}
                        <div className="flex gap-2 pb-2">
                            {isOngoing && <EventStatusBadge status="ongoing" variant="large" />}
                            {isCalling && <EventStatusBadge status="calling" variant="large" />}
                            {!isOngoing && !isCalling && status && <EventStatusBadge status={status} variant="large" />}
                        </div>
                    </div>

                    {/* 基本情報表示 */}
                    <div className="">
                        <EventInfoDisplay event={event} showGatherTime={true} showPlace={true} timeFormat="detailed" />
                    </div>
                </div>

                {/* 画像・リンク表示 */}
                <EventImageDisplay event={event} mode="detail" />
            </div>
        </div>
    );
}
