import RecTimeFlame from "../components/ui/recTimeFlame";
import PullToRefresh from "../components/ui/PullToRefresh";
import TimeSlotGrid from "../components/timetable/TimeSlotGrid";
import React from "react";

export default function Timetable() {
    const handleRefresh = async () => {
        // モックデータ更新処理（0.5秒）
        await new Promise((resolve) => setTimeout(resolve, 500));
    };

    return (
        // <PullToRefresh onRefresh={handleRefresh}>
            <RecTimeFlame>
                <div className="flex h-full flex-col pt-2">
                    <div className="flex w-full items-center justify-end gap-6 pb-5">
                        <p className="text-sm text-white/70">
                            学籍番号：<span>13579</span>
                        </p>
                        <button className="h-auto w-9 cursor-pointer px-2">
                            <img src="/icons/app-icon/close.png" alt="" />
                        </button>
                    </div>

                    <div className="relative mt-4 mb-9 flex flex-col items-center gap-3 rounded-md bg-blue-500 px-3 py-7 text-black">
                        <h3 className="font-title text-lg font-black text-white">四天王ドッジボール</h3>
                        <div className="flex w-full flex-1 justify-center">
                            {/*Todo:横幅が大きくなった時に文字をどう表示するか*/}
                            <div className="flex w-7/10 gap-3 pl-3">
                                <div className="min-w-fit font-normal text-[#FFB400]">
                                    <p>集合時間</p>
                                    <p>集合時間</p>
                                </div>
                                <div className="flex flex-col overflow-hidden text-white">
                                    <p className="flex gap-2 truncate">
                                        11:30<span>30分後</span>
                                    </p>
                                    <p className="truncate">招集場所A</p>
                                </div>
                            </div>
                        </div>
                        <div
                            className="absolute -top-3 flex h-[25px] w-[60px] items-center justify-center bg-amber-500 text-sm font-black text-blue-950"
                            style={{ backgroundImage: "linear-gradient(133deg, #ffb402, #fbedbb)" }}
                        >
                            次の予定
                        </div>
                    </div>

                    <TimeSlotGrid />
                </div>
            </RecTimeFlame>
        // </PullToRefresh>
    );
}
