// === セクションフレームコンポーネント ===
import React from "react";

interface SectionFrameProps {
    title: string;
    children: React.ReactNode;
}

/**
 * セクションのフレーム（タイトル + コンテンツ）
 * - 左側に青いボーダーのあるタイトル
 * - 子要素をコンテンツエリアに表示
 */
export default function SectionFrame({ title, children }: SectionFrameProps) {
    return (
        <div className="flex w-full flex-col gap-2">
            <div className="flex w-full flex-col gap-1 pb-3">
                <h3 className="text-sm font-bold text-gray-800">{title}</h3>
                <div className="h-[2px] w-full rounded-full bg-gray-400"></div>
            </div>
            {children}
        </div>
    );
}
