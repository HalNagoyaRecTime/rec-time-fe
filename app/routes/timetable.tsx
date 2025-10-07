import RecTimeFlame from "../components/ui/recTimeFlame";
import PullToRefresh from "../components/ui/PullToRefresh";
import TimeSlotGridWithEvents from "../components/timetable/TimeSlotGridWithEvents";
import StudentInfoBar from "../components/timetable/StudentInfoBar";
import React, { useState, useEffect, useRef } from "react";
import { downloadAndSaveEvents, getStudentId } from "../utils/dataFetcher";
import { loadEventsFromStorage } from "../utils/loadEventsFromStorage";
import type { EventRow } from "../api/student";

export default function Timetable() {
    const [events, setEvents] = useState<EventRow[]>([]);
    const [studentId, setStudentId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const hasFetchedRef = useRef(false);

    // === データ更新ハンドラー（スワイプでも再利用可能） ===
    // === 데이터 갱신 핸들러（스와이프로도 재사용 가능） ===
    const handleDataUpdate = async () => {
        setIsLoading(true);
        const result = await downloadAndSaveEvents();

        if (result.success) {
            setEvents(result.events);
        } else {
            console.error("[Timetable] データ更新失敗");
        }
        setIsLoading(false);
    };

    // === 初期化：学籍番号とイベントデータを取得 ===
    // === 초기화: 학번과 이벤트 데이터 취득 ===
    useEffect(() => {
        const id = getStudentId();
        setStudentId(id);

        // LocalStorageからイベントデータを読み込む
        const storedEvents = loadEventsFromStorage(id);
        setEvents(storedEvents);

        // LocalStorageが空の場合、初回のみAPIからデータを取得
        if (storedEvents.length === 0 && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            handleDataUpdate();
        }
    }, []);

    const handleRefresh = async () => {
        // モックデータ更新処理（0.5秒）
        await new Promise((resolve) => setTimeout(resolve, 500));
    };

    return (
        // <PullToRefresh onRefresh={handleRefresh}>
            <RecTimeFlame>
                <div className="flex h-full flex-col">
                    <StudentInfoBar studentId={studentId} onUpdate={handleDataUpdate} isLoading={isLoading} />

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

                    <TimeSlotGridWithEvents displayEvents={events} studentId={studentId} loading={isLoading} />
                </div>
            </RecTimeFlame>
        // </PullToRefresh>
    );
}
