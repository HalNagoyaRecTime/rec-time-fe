// === イベント翌日カード ===
import React, { useState } from "react";

interface NextDayCardProps {
    onModalStateChange?: (isOpen: boolean) => void;
}

/**
 * イベント開催日の翌日に表示される隠し要素カード
 */
export default function NextDayCard({ onModalStateChange }: NextDayCardProps) {
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
                {/* 表面 - シンプル */}
                <div
                    className="flex flex-col items-center justify-center gap-2 rounded-md bg-[#000D91] px-6 pt-14 text-center drop-shadow-2xl hover:bg-[#000D91]/90 active:scale-[0.98]"
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                    }}
                >
                    <p className="font-title text-lg font-black text-white">本日の参加予定イベントはありません</p>
                    <p className="mt-6 mb-4 ml-auto text-xs text-white/70">タップで何かある →</p>
                </div>

                {/* 裏面 - メッセージ */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-md bg-[#000D91] px-4 pt-10 text-center drop-shadow-2xl"
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                    }}
                >
                    <p className="text-sm font-bold text-white">よく見つけたね！</p>
                    <p className="text-xs text-white/80">翌日だよ。見つけてくれてありがとう ((+_+))</p>
                    <p className="text-xs text-white/70">本当に最後だよーまた来年！</p>
                    <p className="mt-3 mr-auto mb-5 text-xs text-white/70">← タップで戻る</p>
                </div>
            </div>
        </div>
    );
}
