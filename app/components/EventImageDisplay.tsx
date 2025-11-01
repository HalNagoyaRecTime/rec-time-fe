// === イベント画像・リンク表示コンポーネント ===

import React, { useState } from "react";
import type { EventRow } from "~/api/student";
import { getEventMapConfig } from "~/config/eventMapConfig";
import ZoomableImageModal from "./modal/ZoomableImageModal";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";

type DisplayModeType = "detail" | "thumbnail";

interface EventImageDisplayProps {
    event: EventRow;
    mode?: DisplayModeType;
    onClick?: () => void;
}

/**
 * イベントの地図画像と外部リンクを表示するコンポーネント
 * detail: 大きく表示、thumbnail: 小さく表示
 */
export default function EventImageDisplay({ event, mode = "detail" }: EventImageDisplayProps) {
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    const mapConfig = getEventMapConfig(event.f_event_id);

    if (mode === "thumbnail") {
        // サムネイル表示：画像のみ小さく表示
        const images = mapConfig ? [{ src: mapConfig.imageUrl, title: event.f_event_name || "イベント" }] : [];

        return (
            <>
                {mapConfig && (
                    <div
                        className="relative h-16 w-24 flex-shrink-0 cursor-pointer overflow-hidden rounded transition-opacity hover:opacity-90"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsImageModalOpen(true);
                        }}
                    >
                        <img
                            src={mapConfig.imageUrl}
                            alt={event.f_event_name || "イベント"}
                            className="h-full w-full object-cover"
                        />
                    </div>
                )}
                <ZoomableImageModal
                    images={images}
                    initialIndex={0}
                    isOpen={isImageModalOpen}
                    onClose={() => setIsImageModalOpen(false)}
                />
            </>
        );
    }

    // 詳細表示：大きく表示 + リンク
    const detailImages = mapConfig ? [{ src: mapConfig.imageUrl, title: event.f_event_name || "イベント" }] : [];

    return (
        <>
            <div className="space-y-3">
                {/* 画像 */}
                {mapConfig && (
                    <div
                        className="relative w-full cursor-pointer overflow-hidden rounded-lg transition-opacity hover:opacity-90"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsImageModalOpen(true);
                        }}
                    >
                        <img
                            src={mapConfig.imageUrl}
                            alt={event.f_event_name || "イベント"}
                            className="h-full w-full object-cover"
                        />
                    </div>
                )}

                {/* 外部リンク */}
                {mapConfig?.externalUrl && (
                    <a
                        href={mapConfig.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-md bg-blue-800 py-1.5 text-sm font-semibold text-white hover:underline"
                    >
                        詳細を確認する
                        <FaArrowUpRightFromSquare className="mt-[1px] h-3 w-3" />
                    </a>
                )}
            </div>

            <ZoomableImageModal
                images={detailImages}
                initialIndex={0}
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
            />
        </>
    );
}
