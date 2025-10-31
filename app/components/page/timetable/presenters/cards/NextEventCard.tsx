// === 次の予定カードコンポーネント（ルーティング層） ===
import React from "react";
import type { EventRow } from "~/api/student";
import { areAllEventsFinished } from "~/utils/timetable/nextEventCalculator";
import { isTodayAfterEventDate, isTodayEventDate } from "~/utils/notifications";
import LoginPromptCard from "./LoginPromptCard";
import ThanksCard from "./ThanksCard";
import NextDayCard from "./NextDayCard";
import NoEventCard from "../event/NoEventCard";
import ScheduleEventCard from "../../containers/ScheduleEventCard";

interface NextEventCardProps {
    event: EventRow | null;
    isLoggedIn: boolean;
    allEvents?: EventRow[];
    onModalStateChange?: (isOpen: boolean) => void;
}

/**
 * 次の予定カード（ルーティング層）
 * - イベントがある場合: ScheduleEventCard を表示
 * - 参加予定がない場合: NoEventCard を表示
 * - 未登録ユーザー: LoginPromptCard を表示
 * - イベント翌日: NextDayCard を表示
 * - すべてのイベント終了: ThanksCard を表示
 */
export default function NextEventCard({ event, isLoggedIn, allEvents = [], onModalStateChange }: NextEventCardProps) {
    // 未登録ユーザーの場合
    if (!isLoggedIn) {
        return <LoginPromptCard />;
    }

    // イベント翌日の場合（優先度1 - 最優先）
    if (isTodayAfterEventDate()) {
        return <NextDayCard />;
    }

    // すべてのイベントが終了したかどうか
    const allFinished = areAllEventsFinished(allEvents);

    // 参加予定のイベントがない場合
    if (!event) {
        // 出場登録があるイベントが存在するかチェック
        const hasRegisteredEvents = allEvents.some((e) => e.f_is_my_entry === true);

        // すべてのイベントが終了した場合はThanksCardを表示（優先度2）
        // ただし当日のみ表示（翌日以降は表示しない）
        if (allFinished && hasRegisteredEvents && isTodayEventDate()) {
            return <ThanksCard />;
        }

        return <NoEventCard hasRegisteredEvents={hasRegisteredEvents} />;
    }

    // 次の予定イベントがある場合
    return <ScheduleEventCard event={event} allEvents={allEvents} onModalStateChange={onModalStateChange} />;
}
