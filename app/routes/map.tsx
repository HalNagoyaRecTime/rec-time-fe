import React from "react";
import RecTimeFlame from "../components/recTimeFlame";
import map1 from "/images/map1.jpg";
import map2 from "/images/map2.jpg";
import map3 from "/images/map3.jpg";

export default function map() {
    return (
        <RecTimeFlame>
            <div className="flex max-w-150 flex-col items-center gap-6">
                <h3 className="text-base text-[#FFB400]">各クラス集合場所</h3>
                <button className="mb-4 overflow-hidden rounded-xs">
                    <img src={map1} alt="" />
                </button>

                <h3 className="text-base text-[#FFB400]">施設案内マップ</h3>
                <button className="overflow-hidden rounded-xs">
                    <img src={map2} alt="" />
                </button>
                <button className="overflow-hidden rounded-xs">
                    <img src={map3} alt="" />
                </button>
            </div>
        </RecTimeFlame>
    );
}
