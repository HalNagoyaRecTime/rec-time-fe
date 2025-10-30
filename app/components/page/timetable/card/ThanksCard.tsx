// === 参加ありがとうございますカード ===
import React, { useState } from "react";
import { useNavigate } from "react-router";

interface ThanksCardProps {
    onModalStateChange?: (isOpen: boolean) => void;
}

/**
 * その日のすべてのイベント終了後に表示される感謝カード
 */
export default function ThanksCard({ onModalStateChange }: ThanksCardProps) {
    const navigate = useNavigate();
    const [rotationDeg, setRotationDeg] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // カード回転アニメーション
    const handleCardFlip = () => {
        if (isAnimating) return;

        setIsAnimating(true);
        // 現在の角度から+180度回転
        setRotationDeg((prev) => prev + 180);

        // 回転完了後
        setTimeout(() => {
            setIsAnimating(false);
            // 360度を超えたら0度にリセット（見た目は変わらない）
            setRotationDeg((prev) => prev % 360);
        }, 600);
    };

    return (
        <div className="mt-4 mb-9" style={{ perspective: "1000px" }}>
            <div
                className="relative cursor-pointer"
                onClick={isAnimating ? undefined : handleCardFlip}
                style={{
                    transformStyle: "preserve-3d",
                    transition: isAnimating ? "transform 0.6s ease-in-out" : "none",
                    transform: `rotateY(${rotationDeg}deg)`,
                }}
            >
                {/* 表面 */}
                <div
                    className="flex flex-col items-center justify-center gap-4 rounded-md bg-gradient-to-br from-[#FFB400] to-[#FF8C00] px-4 py-8 text-center drop-shadow-2xl hover:from-[#FFC422] hover:to-[#FF9C00] active:scale-[0.98]"
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                    }}
                >
                    <div className="text-5xl">🎉</div>
                    <div>
                        <h3 className="font-title text-[22px] font-black text-white sm:text-2xl">
                            参加ありがとうございました!
                        </h3>
                        <p className="mt-2 text-sm text-white/95">本日のご参加に心より感謝いたします</p>
                    </div>
                    <p className="ml-auto text-xs text-white/80 opacity-70">タップでカードをめくる →</p>
                </div>

                {/* 裏面 */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-md bg-[#000D91] bg-gradient-to-br px-4 py-8 text-center drop-shadow-2xl"
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                    }}
                >
                    <div>
                        <p className="mt-4 text-lg font-bold text-white">本日はお疲れさまでした</p>
                        <p className="mt-2 text-sm text-white/90">今日のために、レク委員一同準備してきました。</p>
                        <p className="mt-2 text-sm text-white/90">楽しんでいただけたなら幸いです！</p>
                    </div>
                    <p className="text-xs text-white/70">また来年お会いしましょう(≧▽≦)/</p>
                    <p className="mt-auto mr-auto text-xs text-white opacity-70">タップで戻す ←</p>
                </div>
            </div>
        </div>
    );
}
