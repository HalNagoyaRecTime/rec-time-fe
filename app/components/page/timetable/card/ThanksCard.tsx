// === 開催当日の最後に表示されるカード ===
import React from "react";
import { useCardFlip } from "~/hooks/useCardFlip";
import { FlipCard } from "~/components/ui/FlipCard";

interface ThanksCardProps {}

/**
 * その日のすべてのイベント終了後に表示される感謝カード
 */
export default function ThanksCard({}: ThanksCardProps) {
    const { rotationDeg, isAnimating, handleCardFlip } = useCardFlip();

    return (
        <FlipCard rotationDeg={rotationDeg} isAnimating={isAnimating} onClick={handleCardFlip}>
            {/* 表面 */}
            <FlipCard.Front className="flex flex-col items-center justify-center gap-4 rounded-md bg-gradient-to-br from-[#FFB400] to-[#FF8C00] px-4 py-8 text-center drop-shadow-2xl hover:from-[#FFC422] hover:to-[#FF9C00] active:scale-[0.98]">
                <div className="text-5xl">🎉</div>
                <div>
                    <h3 className="font-title text-[22px] font-black text-white sm:text-2xl">
                        参加ありがとうございました!
                    </h3>
                    <p className="mt-2 text-sm text-white/95">本日のご参加に心より感謝いたします</p>
                </div>
                <p className="ml-auto text-xs text-white/80 opacity-70">タップでカードをめくる →</p>
            </FlipCard.Front>

            {/* 裏面 */}
            <FlipCard.Back className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-md bg-[#000D91] bg-gradient-to-br px-4 py-8 text-center drop-shadow-2xl">
                <div>
                    <p className="mt-4 text-lg font-bold text-white">本日はお疲れさまでした</p>
                    <p className="mt-2 text-sm text-white/90">今日のために、レク委員一同準備してきました。</p>
                    <p className="mt-2 text-sm text-white/90">楽しんでいただけたなら幸いです！</p>
                </div>
                <p className="text-xs text-white/70">また来年お会いしましょう(≧▽≦)/</p>
                <p className="mt-auto mr-auto text-xs text-white opacity-70">タップで戻す ←</p>
            </FlipCard.Back>
        </FlipCard>
    );
}
