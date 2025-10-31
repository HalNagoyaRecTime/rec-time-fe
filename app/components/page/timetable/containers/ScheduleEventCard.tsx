import React from "react";
import type { EventRow } from "~/api/student";
import { getCurrentTime } from "~/utils/currentTimeManager";
import AllSchedulesModal from "~/components/modal/AllSchedulesModal";
import { FlipCard } from "~/components/ui/FlipCard";
import { useScheduleEventCardAnimation } from "~/hooks/useScheduleEventCardAnimation";
import EventInfoPresenter from "../presenters/event/EventInfoPresenter";

interface ScheduleEventCardProps {
    event: EventRow;
    allEvents: EventRow[];
    onModalStateChange?: (isOpen: boolean) => void;
}

/**
 * 次の予定イベント表示カード
 *
 * 責務：
 * - アニメーション・モーダル管理
 * - 時間計算
 * - FlipCard コンポーネントの制御
 * - EventInfoPresenter の表示
 */
export default function ScheduleEventCard({
    event,
    allEvents,
    onModalStateChange,
}: ScheduleEventCardProps) {
    const { showModal, rotationDeg, isAnimating, handleOpenModal, handleModalClosing, handleCloseModal } =
        useScheduleEventCardAnimation(onModalStateChange);

    // 集合時刻までの残り時間を計算（分単位）
    const getMinutesUntilGatherTime = (): number => {
        if (!event.f_gather_time) return Infinity;
        const now = getCurrentTime();
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
        const now = getCurrentTime();
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
                <FlipCard.Front>
                    <EventInfoPresenter
                        event={event}
                        minutesUntilGather={minutesUntilGather}
                        minutesUntilStart={minutesUntilStart}
                    />
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
