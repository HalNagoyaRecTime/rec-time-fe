import { get } from "http";
import RecTimeFlame from "../components/ui/recTimeFlame";
import React from "react";
import { getLastUpdatedDisplay, getNextMyEvent, getStudentId } from "~/common/forFrontEnd";

export default function Timetable() {
    const studentsId = getStudentId();
    const LastUpdatetime = getLastUpdatedDisplay("ja-JP");
    const nextEvent = getNextMyEvent(studentsId);
    return (
        <RecTimeFlame>
            <div className="flex h-full flex-col">
                <div className="flex w-full flex-col items-end">
                    <p className="text-xs text-white/70">
                        最終更新：<span>{LastUpdatetime}</span>
                    </p>
                    <p className="text-sm text-white/70">
                        学籍番号：<span>{studentsId}</span>
                    </p>
                </div>

                <div className="relative mt-4 mb-5 flex flex-col items-center gap-3 rounded-md bg-blue-500 px-3 py-7 text-black">
                    <h3 className="font-title text-lg font-black text-white">{nextEvent?.f_event_name}</h3>
                    <div className="flex w-full flex-1 justify-center">
                        {/*Todo:横幅が大きくなった時に文字をどう表示するか*/}
                        <div className="flex w-7/10 gap-3 pl-3">
                            <div className="min-w-fit font-normal text-[#FFB400]">
                                <p>集合時間</p>
                                <p>集合場所</p>
                            </div>
                            <div className="flex flex-col overflow-hidden text-white">
                                <p className="flex gap-2 truncate">
                                    {/* TODO:gather_time計算？ */}
                                    {nextEvent?.f_start_time}<span>{nextEvent?.f_gather_time}</span>
                                </p>
                                <p className="truncate">{nextEvent?.f_place}</p>
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

                <div className="relative h-200 w-full rounded-lg bg-blue-950">
                    {/* 時間軸の線 */}
                    <div className="absolute top-4 right-4 bottom-4 left-12">
                        {/* 横線 */}
                        <div className="absolute top-2 right-0 left-4 h-px bg-gray-600"></div>
                        <div className="absolute top-16 right-0 left-4 h-px bg-gray-600"></div>
                        <div className="absolute top-30 right-0 left-4 h-px bg-gray-600"></div>
                        <div className="absolute top-44 right-0 left-4 h-px bg-gray-600"></div>
                        <div className="absolute top-59 right-0 left-4 h-px bg-gray-600"></div>
                        <div className="absolute top-72 right-0 left-4 h-px bg-gray-600"></div>
                        <div className="absolute top-86 right-0 left-4 h-px bg-gray-600"></div>
                        <div className="absolute top-100 right-0 left-4 h-px bg-gray-600"></div>
                        <div className="absolute top-114 right-0 left-4 h-px bg-gray-600"></div>
                        <div className="absolute top-128 right-0 left-4 h-px bg-gray-600"></div>
                        <div className="absolute top-142 right-0 left-4 h-px bg-gray-600"></div>
                        <div className="absolute top-156 right-0 left-4 h-px bg-gray-600"></div>
                    </div>

                    {/* 時間ラベル */}
                    <div className="absolute top-4 left-4 text-sm font-bold text-yellow-300">9:00</div>
                    <div className="absolute top-18 left-4 text-sm font-bold text-yellow-300">10:00</div>
                    <div className="absolute top-32 left-4 text-sm font-bold text-yellow-300">11:00</div>
                    <div className="absolute top-46 left-4 text-sm font-bold text-yellow-300">12:00</div>
                    <div className="absolute top-60 left-4 text-sm font-bold text-yellow-300">13:00</div>
                    <div className="absolute top-74 left-4 text-sm font-bold text-yellow-300">14:00</div>
                    <div className="absolute top-88 left-4 text-sm font-bold text-yellow-300">15:00</div>
                    <div className="absolute top-102 left-4 text-sm font-bold text-yellow-300">16:00</div>
                    <div className="absolute top-116 left-4 text-sm font-bold text-yellow-300">17:00</div>
                    <div className="absolute top-130 left-4 text-sm font-bold text-yellow-300">18:00</div>
                    <div className="absolute top-144 left-4 text-sm font-bold text-yellow-300">19:00</div>
                    <div className="absolute top-158 left-4 text-sm font-bold text-yellow-300">20:00</div>

                    {/* イベントブロック */}
                    
                    <div className="absolute top-6 left-16 h-7 w-56 rounded bg-yellow-400 px-2 py-1 text-xs font-bold text-black">
                        朝会
                        <br />
                        9:00-9:30
                    </div>


                    {/* 11:45 現在時刻インジケーター */}
                    <div className="absolute top-40 left-4 flex items-center">
                        <div className="rounded bg-red-500 px-2 py-1 text-xs font-bold text-white">11:45</div>
                        <div className="ml-2 h-0.5 w-64 bg-red-500"></div>
                    </div>
                </div>
            </div>
        </RecTimeFlame>
    );
}
