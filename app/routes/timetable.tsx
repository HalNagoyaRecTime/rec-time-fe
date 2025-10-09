import RecTimeFlame from "~/components/ui/recTimeFlame";
import PullToRefresh from "~/components/ui/PullToRefresh";
import TimeSlotGridWithEvents from "~/components/timetable/TimeSlotGridWithEvents";
import StudentInfoBar from "~/components/timetable/StudentInfoBar";
import NextEventCard from "~/components/timetable/NextEventCard";
import React, { useState, useEffect, useRef } from "react";
import { downloadAndSaveEvents, getStudentId } from "~/utils/dataFetcher";
import { loadEventsFromStorage } from "~/utils/loadEventsFromStorage";
import type { EventRow } from "~/api/student";
import { getNextParticipatingEvent } from "~/utils/timetable/nextEventCalculator";
import { useCurrentTime } from "~/hooks/useCurrentTime";
// === デバッグ用（本番環境では削除3/1） ===
import DebugTimePicker from "~/components/timetable/DebugTimePicker";
import LoadMockDataButton from "~/components/debug/LoadMockDataButton";
// ====

export default function Timetable() {
    const [events, setEvents] = useState<EventRow[]>([]);
    const [studentId, setStudentId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showRegisteredMessage, setShowRegisteredMessage] = useState(false);
    const hasFetchedRef = useRef(false);

    // === デバッグ用（本番環境では削除3/2） ===
    const [debugOffset, setDebugOffset] = useState(0);
    const [showTimeIndicator, setShowTimeIndicator] = useState(false);
    const currentTime = useCurrentTime(debugOffset);
    // ===================
    // ↓置き換える
    // const currentTime = useCurrentTime(0);
    // ===================

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

        // URLパラメータから登録状態を確認
        const params = new URLSearchParams(window.location.search);
        const registered = params.get("registered");

        if (registered === "true") {
            setShowRegisteredMessage(true);
            // URLパラメータをクリア
            window.history.replaceState({}, "", window.location.pathname);
            // メッセージは遷移するまで表示し続ける（setTimeoutを削除）
        }

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

    // === Pull to Refresh ハンドラー ===
    const handleRefresh = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await handleDataUpdate();
    };

    return (
        <RecTimeFlame>
            <PullToRefresh onRefresh={handleRefresh}>
                <div className="flex h-full flex-col">
                    {/* ネットワークエラー表示 */}
                    {errorMessage && (
                        <div className="w-fit rounded-md bg-red-600 px-2 py-2 text-sm text-white">{errorMessage}</div>
                    )}

                    <StudentInfoBar
                        studentId={studentId}
                        onUpdate={handleDataUpdate}
                        isLoading={isLoading}
                        showRegisteredMessage={showRegisteredMessage}
                    />

                    {/* 次の予定カード */}
                    <NextEventCard event={nextEvent} isLoggedIn={!!studentId} />

                    <TimeSlotGridWithEvents
                        displayEvents={events}
                        studentId={studentId}
                        loading={isLoading}
                        currentTime={showTimeIndicator ? currentTime : undefined}
                    />
                </div>

                {/* デバック用 */}
                <DebugTimePicker
                    debugOffset={debugOffset}
                    setDebugOffset={setDebugOffset}
                    showTimeIndicator={showTimeIndicator}
                    setShowTimeIndicator={setShowTimeIndicator}
                />
                <LoadMockDataButton />
            </PullToRefresh>
        </RecTimeFlame>
    );
}
