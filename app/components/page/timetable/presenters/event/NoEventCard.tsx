import React from "react";
import { FlipCard } from "~/components/ui/FlipCard";

interface NoEventCardProps {
    hasRegisteredEvents: boolean;
    onCardClick?: () => void;
    rotationDeg?: number;
    isAnimating?: boolean;
}

/**
 * イベント参加予定がない場合のカード
 * - 出場登録がない場合
 * - すべてのイベントが終了した場合（翌日以外）
 *
 * 親コンポーネント(NextEventCard)からアニメーション状態を受け取り、
 * 統一された回転アニメーションを実行する
 */
export default function NoEventCard({
    hasRegisteredEvents,
    onCardClick,
    rotationDeg = 0,
    isAnimating = false
}: NoEventCardProps) {
    // 出場登録がない場合のメッセージ
    const noRegistrationMessage = "出場登録がされていません";
    const noRegistrationSubMessage = "出場データが入力されるまでお待ちください";

    // イベント終了時のメッセージ
    const noTodayEventMessage = "本日の参加予定イベントはありません";

    const handleClick = () => {
        // 参加予定イベントがある場合はモーダルを開く
        if (hasRegisteredEvents) {
            onCardClick?.();
        }
    };

    return (
        <FlipCard rotationDeg={rotationDeg} isAnimating={isAnimating} onClick={handleClick}>
            {/* 表面 */}
            <FlipCard.Front className="flex flex-col items-center gap-3 rounded-md bg-[#000D91]/80 px-3 py-16 text-black shadow-2xl hover:bg-[#000D91]/90 active:scale-[0.98]">
                <h3 className="font-title text-lg font-black text-white [@media(max-height:680px)]:text-base">
                    {hasRegisteredEvents ? noTodayEventMessage : noRegistrationMessage}
                </h3>
                {!hasRegisteredEvents && <p className="text-sm text-white/80">{noRegistrationSubMessage}</p>}
            </FlipCard.Front>

            {/* 裏面 */}
            <FlipCard.Back className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-md bg-[#000D91] px-3 py-16 text-black shadow-2xl" />
        </FlipCard>
    );
}
