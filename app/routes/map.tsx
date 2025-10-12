import React, { useState } from "react";
import RecTimeFlame from "../components/ui/recTimeFlame";
import ZoomableImageModal from "../components/modal/ZoomableImageModal";
import map1 from "/images/map-class-area.jpg";
import map2 from "/images/map-1f.jpg";
import map3 from "/images/map-2f.jpg";

export default function Map() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentImages, setCurrentImages] = useState<{ src: string; title: string }[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const classMap = [{ src: map1, title: "各クラス集合場所" }];
    const facilityMaps = [
        { src: map2, title: "施設案内マップ 1F" },
        { src: map3, title: "施設案内マップ 2F" },
    ];

    const openClassMap = () => {
        setCurrentImages(classMap);
        setCurrentIndex(0);
        setIsOpen(true);
    };

    const openFacilityMap = (index: number) => {
        setCurrentImages(facilityMaps);
        setCurrentIndex(index);
        setIsOpen(true);
    };

    return (
        <RecTimeFlame>
            <div className="flex max-w-150 flex-col items-center gap-6 pb-8">
                <h3 className="mb-2 text-lg font-bold text-black">各クラス集合場所</h3>
                <button
                    onClick={openClassMap}
                    className="mb-4 cursor-pointer overflow-hidden rounded-md border-1 border-gray-200 shadow-lg"
                >
                    <img src={map1} alt="各クラス集合場所" className="w-full" />
                </button>

                <h3 className="mb-2 text-lg font-bold text-black">施設案内マップ</h3>
                <button
                    onClick={() => openFacilityMap(0)}
                    className="mb-4 cursor-pointer overflow-hidden rounded-md border-1 border-gray-200 shadow-lg"
                >
                    <img src={map2} alt="施設案内マップ 1F" className="w-full" />
                </button>
                <button
                    onClick={() => openFacilityMap(1)}
                    className="cursor-pointer overflow-hidden rounded-md border-1 border-gray-200 shadow-lg"
                >
                    <img src={map3} alt="施設案内マップ 2F" className="w-full" />
                </button>

                <ZoomableImageModal
                    images={currentImages}
                    initialIndex={currentIndex}
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                />
            </div>
        </RecTimeFlame>
    );
}
