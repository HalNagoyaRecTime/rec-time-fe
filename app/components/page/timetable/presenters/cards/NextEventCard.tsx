// === 次の予定カードコンポーネント（ルーティング層） ===
import React from "react";
import type { EventRow } from "~/api/student";
import { areAllEventsFinished } from "~/utils/timetable/eventStatusChecker";
import { isTodayAfterEventDate, isTodayEventDate } from "~/utils/notifications";
import { useScheduleEventCardAnimation } from "~/hooks/useScheduleEventCardAnimation";
import { FlipCard } from "~/components/ui/FlipCard";
import LoginPromptCard from "./LoginPromptCard";
import ThanksCard from "./ThanksCard";
import NextDayCard from "./NextDayCard";
import ScheduleEventCard from "../../containers/ScheduleEventCard";
import AllSchedulesModal from "~/components/modal/AllSchedulesModal";

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

        // NoEventCard の場合も useScheduleEventCardAnimation を使用
        // これにより ScheduleEventCard と同じアニメーション動作を実現
        const { showModal, rotationDeg, isAnimating, handleOpenModal, handleModalClosing, handleCloseModal } =
            useScheduleEventCardAnimation(onModalStateChange);

        // 参加予定イベントがない場合のモーダル開き制御
        const handleCardClick = hasRegisteredEvents ? handleOpenModal : () => {};

        return (
            <>
                <FlipCard rotationDeg={rotationDeg} isAnimating={isAnimating} onClick={handleCardClick}>
                    {/* 表面 */}
                    <FlipCard.Front className="flex flex-col items-center gap-3 rounded-md bg-[#000D91]/80 px-3 py-16 text-black shadow-2xl hover:bg-[#000D91]/90 active:scale-[0.98]">
                        <h3 className="font-title text-lg font-black text-white [@media(max-height:680px)]:text-base">
                            {hasRegisteredEvents ? "本日の参加予定イベントはありません" : "出場登録がされていません"}
                        </h3>
                        {!hasRegisteredEvents && <p className="text-sm text-white/80">出場データが入力されるまでお待ちください</p>}
                    </FlipCard.Front>

                    {/* 裏面 */}
                    <FlipCard.Back className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-md bg-[#000D91] px-3 py-16 text-black shadow-2xl" />
                </FlipCard>

                {/* 全予定表示モーダル */}
                {hasRegisteredEvents && (
                    <AllSchedulesModal
                        isOpen={showModal}
                        events={allEvents}
                        onClose={handleCloseModal}
                        onClosing={handleModalClosing}
                    />
                )}
            </>
        );
    }

    // 次の予定イベントがある場合
    return <ScheduleEventCard event={event} allEvents={allEvents} onModalStateChange={onModalStateChange} />;
}
