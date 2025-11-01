// === イベントステータスバッジコンポーネント ===

import React from "react";

type StatusType = "ongoing" | "calling" | "next" | null;
type VariantType = "large" | "small";

interface EventStatusBadgeProps {
    status: StatusType;
    variant?: VariantType;
}

/**
 * イベントのステータスをバッジ表示するコンポーネント
 * - 「開催中」（赤）
 * - 「呼び出し中」（オレンジ）
 * - 「次の予定」（テキストのみ）
 * - null（非表示）
 */
export default function EventStatusBadge({ status, variant = "large" }: EventStatusBadgeProps) {
    if (!status) {
        return null;
    }

    if (variant === "large") {
        switch (status) {
            case "ongoing":
                return <div className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">開催中</div>;
            case "calling":
                return (
                    <div className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">呼び出し中</div>
                );
            case "next":
                return <div className="text-sm font-black text-black">次の予定</div>;
            default:
                return null;
        }
    }

    // small variant
    switch (status) {
        case "ongoing":
            return <div className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">開催中</div>;
        case "calling":
            return (
                <div className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">呼び出し中</div>
            );
        case "next":
            return <div className="text-xs font-bold text-black">次の予定</div>;
        default:
            return null;
    }
}
