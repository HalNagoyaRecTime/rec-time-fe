import React from "react";

interface FlipCardProps {
    rotationDeg: number;
    isAnimating: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

interface FlipCardFrontProps {
    children: React.ReactNode;
    className?: string;
}

interface FlipCardBackProps {
    children?: React.ReactNode;
    className?: string;
}

/**
 * 3D回転カードコンポーネント
 * NextDayCard、ThanksCard、NextEventCard などで使用
 */
export function FlipCard({ rotationDeg, isAnimating, onClick, children }: FlipCardProps) {
    return (
        <div className="mt-4 mb-9" style={{ perspective: "1000px" }}>
            <div
                className="relative cursor-pointer"
                onClick={isAnimating ? undefined : onClick}
                style={{
                    transformStyle: "preserve-3d",
                    transition: isAnimating ? "transform 0.6s ease-in-out" : "none",
                    transform: `rotateY(${rotationDeg}deg)`,
                }}
            >
                {children}
            </div>
        </div>
    );
}

/**
 * FlipCard の表面
 */
FlipCard.Front = function FlipCardFront({ children, className = "" }: FlipCardFrontProps) {
    return (
        <div
            className={className}
            style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
            }}
        >
            {children}
        </div>
    );
};

/**
 * FlipCard の裏面
 */
FlipCard.Back = function FlipCardBack({ children = undefined, className = "" }: FlipCardBackProps) {
    return (
        <div
            className={className}
            style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
            }}
        >
            {children}
        </div>
    );
};