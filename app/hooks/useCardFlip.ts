import { useState } from "react";

/**
 * カード回転アニメーション用のカスタムフック
 * NextDayCard や ThanksCard などの3D回転カードで使用
 */
export function useCardFlip() {
    const [rotationDeg, setRotationDeg] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

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

    return {
        rotationDeg,
        isAnimating,
        handleCardFlip,
    };
}