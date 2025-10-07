// import { get } from "http";
import RecTimeFlame from "../components/ui/recTimeFlame";
import React, { useEffect } from "react";
import { fetchEvents, getLastUpdatedDisplay, getNextMyEvent, getStudentId } from "../common/forFrontEnd";
import clsx from 'clsx'

export default function Timetable() {
    const studentsId = getStudentId();
    const LastUpdatetime = getLastUpdatedDisplay("ja-JP");
    const nextEvent = getNextMyEvent(studentsId);
    // const nextEvent = {// テスト用ダミーデータ
    //     f_event_name: "リレー",
    //     f_start_time: "13:00",
    //     f_gather_time: "12:45",
    //     f_place: "グラウンド"
    // };

    const getEvents = fetchEvents(studentsId);
    // 残り分数計算
    let minutesLeft = null;
    if (nextEvent?.f_gather_time) {
        const now = new Date();
        const [gatherHour, gatherMinute] = String(nextEvent.f_gather_time).split(":").map(Number);
        const gatherDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), gatherHour, gatherMinute);
        const diffMs = gatherDate.getTime() - now.getTime();
        minutesLeft = Math.max(0, Math.floor(diffMs / 60000));
    }

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
                <h3 className="font-title text-lg font-black text-white">{nextEvent ? nextEvent.f_event_name : "次の予定はありません"}</h3>
                <div className="flex w-full flex-1 justify-center">
                    <div className="flex w-7/10 gap-3 pl-3">
                        <div className="min-w-fit font-normal text-[#FFB400]">
                            <p>集合時間</p>
                            <p>集合場所</p>
                        </div>
                        <div className="flex flex-col overflow-hidden text-white">
                            {nextEvent ? (
                                <>
                                    <p className="flex gap-2 truncate">
                                        {nextEvent.f_start_time}
                                        <span className="text-red-500">
                                            {minutesLeft !== null && `（${minutesLeft}分後）`}
                                        </span>
                                    </p>
                                    <p className="truncate">{nextEvent.f_place}</p>
                                </>
                            ) : (
                                <>
                                    <p className="flex gap-2 truncate text-white/50">--:--</p>
                                    <p className="truncate text-white/50">---</p>
                                </>
                            )}
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
                <div>
                {/* イベントブロック */}
                {getEvents.map((event, index) => {
                    const isMyEntry = event.f_is_my_entry;
                    return (
                        <div
                            key={index}
                            className={clsx("absolute left-16 h-7 w-56 rounded", {
                                "bg-yellow-400": isMyEntry,
                                "bg-gray-400": !isMyEntry
                            })}
                            style={{ top: `${6 + index * 40}px` }}
                        >
                            {event.f_event_name}
                            <br />
                            {event.f_start_time} -
                            {/* TODO:Endtime計算 */}
                            {/* {event.f_gather_time} */}
                        </div>
                    );
                })}
                </div>

                {/* 11:45 現在時刻インジケーター */}
                <div className="absolute top-40 left-4 flex items-center">
                    {/* TODO: 赤線が黄色い時刻と同期するように */}
                    <div className="rounded bg-red-500 px-2 py-1 text-xs font-bold text-white">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="ml-2 h-0.5 w-64 bg-red-500"></div>
                </div>
            </div>
        </div>
    </RecTimeFlame>
);}
