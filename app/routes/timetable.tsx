import RecTimeFlame from "~/components/ui/recTimeFlame";
import TimeSlotGridWithEvents from "~/components/timetable/TimeSlotGridWithEvents";
import StudentInfoBar from "~/components/timetable/StudentInfoBar";
import NextEventCard from "~/components/timetable/NextEventCard";
import React, { useState, useEffect, useRef } from "react";
import { downloadAndSaveEvents, getStudentId } from "~/utils/dataFetcher";
import { loadEventsFromStorage } from "~/utils/loadEventsFromStorage";
import type { EventRow } from "~/api/student";
import { getNextParticipatingEvent } from "~/utils/timetable/nextEventCalculator";

export default function Timetable() {
    const [events, setEvents] = useState<EventRow[]>([]);
    const [studentId, setStudentId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const hasFetchedRef = useRef(false);

    // === データ更新ハンドラー（スワイプでも再利用可能） ===
    const handleDataUpdate = async () => {
        setIsLoading(true);
        setErrorMessage("");
        const result = await downloadAndSaveEvents();

        if (result.success) {
            setEvents(result.events);
            setErrorMessage("");
        } else {
            console.error("[Timetable] データ更新失敗");
            setErrorMessage("データ更新失敗");
        }
        setIsLoading(false);
    };

    // === 初期化：学籍番号とイベントデータを取得 ===
    useEffect(() => {
        const id = getStudentId();
        setStudentId(id);

        // LocalStorageからイベントデータを読み込む
        const storedEvents = loadEventsFromStorage(id);
        setEvents(storedEvents);

        // LocalStorageが空の場合、初回のみAPIからデータを取得
        if (storedEvents.length === 0 && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            void handleDataUpdate();
        }
    }, []);

    // === 次の予定を取得 ===
    const nextEvent = getNextParticipatingEvent(events);

    return (
        <RecTimeFlame>
            <div className="flex h-full flex-col">
                <StudentInfoBar studentId={studentId} onUpdate={handleDataUpdate} isLoading={isLoading} />

                {/* 次の予定カード */}
                <NextEventCard event={nextEvent} isLoggedIn={!!studentId} />

                <TimeSlotGridWithEvents displayEvents={events} studentId={studentId} loading={isLoading} />
            </div>
        </RecTimeFlame>
    );
}
