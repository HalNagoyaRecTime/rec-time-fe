// === イベント翌日に表示されるカード ===
import React from "react";
import { useCardFlip } from "~/hooks/useCardFlip";
import { FlipCard } from "~/components/ui/FlipCard";

interface NextDayCardProps {}

/**
 * イベント開催日の翌日に表示される隠し要素カード
 */
export default function NextDayCard({}: NextDayCardProps) {
    const { rotationDeg, isAnimating, handleCardFlip } = useCardFlip();

    return (
        <FlipCard rotationDeg={rotationDeg} isAnimating={isAnimating} onClick={handleCardFlip}>
            {/* 表面 - シンプル */}
            <FlipCard.Front className="flex flex-col items-center justify-center gap-2 rounded-md bg-[#000D91] px-6 pt-14 text-center drop-shadow-2xl hover:bg-[#000D91]/90 active:scale-[0.98]">
                <p className="font-title text-lg font-black text-white">本日の参加予定イベントはありません</p>
                <p className="mt-6 mb-4 ml-auto text-xs text-white/70">タップで何かある →</p>
            </FlipCard.Front>

            {/* 裏面 - メッセージ */}
            <FlipCard.Back className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-md bg-[#000D91] px-4 pt-10 text-center drop-shadow-2xl">
                <p className="text-sm font-bold text-white">よく見つけたね！</p>
                <p className="text-xs text-white/80">翌日だよ。見つけてくれてありがとう ((+_+))</p>
                <p className="text-xs text-white/70">本当に最後だよーまた来年！</p>
                <p className="mt-3 mr-auto mb-5 text-xs text-white/70">← タップで戻る</p>
            </FlipCard.Back>
        </FlipCard>
    );
}
