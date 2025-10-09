import React, { useState } from "react";
import RecTimeFlame from "../components/ui/recTimeFlame";
import ZoomableImageModal from "../components/modal/ZoomableImageModal";
import map1 from "/images/map-class-area.jpg";
import map2 from "/images/map-1f.jpg";
import map3 from "/images/map-2f.jpg";

export default function Map() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const maps = [
        { src: map1, title: "各クラス集合場所" },
        { src: map2, title: "施設案内マップ 1F" },
        { src: map3, title: "施設案内マップ 2F" },
    ];

    const openModal = (index: number) => {
        setCurrentIndex(index);
        setIsOpen(true);
    };

    return (
        <RecTimeFlame>
            <div className="flex max-w-150 flex-col items-center gap-6 pb-8">
                <h3 className="mb-2 text-base text-[#FFB400]">{maps[0].title}</h3>
                <button onClick={() => openModal(0)} className="mb-4 overflow-hidden rounded-xs">
                    <img src={map1} alt={maps[0].title} className="w-full" />
                </button>

                <h3 className="mb-2 text-base text-[#FFB400]">施設案内マップ</h3>
                <button onClick={() => openModal(1)} className="mb-4 overflow-hidden rounded-xs">
                    <img src={map2} alt={maps[1].title} className="w-full" />
                </button>
                <button onClick={() => openModal(2)} className="overflow-hidden rounded-xs">
                    <img src={map3} alt={maps[2].title} className="w-full" />
                </button>

                <ZoomableImageModal
                    images={maps}
                    initialIndex={currentIndex}
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                />
            </div>
        </RecTimeFlame>
    );
}
