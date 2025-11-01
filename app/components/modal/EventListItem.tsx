// === イベントリストアイテムコンポーネント（アコーディオン式） ===
import React from "react";
import type { EventRow } from "~/api/student";
import { useAccordion } from "~/hooks/useAccordion";
import EventDetailCard from "./EventDetailCard";
import EventInfoDisplay from "../EventInfoDisplay";
import EventImageDisplay from "../EventImageDisplay";

interface EventListItemProps {
    event: EventRow;
    isPast?: boolean;
}

/**
 * イベントを小さく表示するリストアイテム
 * - タップするとアコーディオン式に展開・縮小
 * - 展開時は EventDetailCard を使用
 */
export default function EventListItem({ event, isPast = false }: EventListItemProps) {
    const { isExpanded, toggle } = useAccordion(false);

    // 展開時は詳細カード表示
    if (isExpanded) {
        return (
            <div
                className={`w-full cursor-pointer rounded-md bg-gray-600/4 p-3 transition-opacity ${
                    isPast ? "opacity-60" : ""
                }`}
                onClick={toggle}
            >
                <EventDetailCard event={event} status={null} />
                <div className="mt-1 text-center text-xs text-gray-500">タップで縮小 ↑</div>
            </div>
        );
    }

    // 縮小時は基本情報のみ表示
    return (
        <div
            className={`w-full cursor-pointer rounded-md bg-gray-600/4 p-3 transition-opacity ${
                isPast ? "opacity-60" : ""
            }`}
            onClick={toggle}
        >
            <div className="flex gap-3">
                {/* イベント情報エリア */}
                <div className="flex w-full min-w-0 flex-1 flex-col gap-2">
                    {/* タイトル */}
                    <div className="relative flex items-center">
                        <div className="absolute h-4 w-[2px] rounded-full bg-blue-950"></div>
                        <h4 className="overflow-hidden pb-[2px] pl-2 text-sm font-bold text-ellipsis whitespace-nowrap text-gray-900">
                            {event.f_event_name || "イベント"}
                        </h4>
                    </div>

                    {/* 集合場所・時間（コンパクト） */}
                    <div className="pl-2">
                        <EventInfoDisplay event={event} showGatherTime={true} showPlace={true} timeFormat="compact" />
                    </div>
                </div>

                {/* サムネイル画像 */}
                <div className="flex-shrink-0">
                    <EventImageDisplay event={event} mode="thumbnail" />
                </div>
            </div>
        </div>
    );
}
