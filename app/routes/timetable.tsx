import RecTimeFlame from "~/components/ui/recTimeFlame";
import PullToRefresh from "~/components/ui/PullToRefresh";
import TimeSlotGridWithEvents from "~/components/timetable/TimeSlotGridWithEvents";
import StudentInfoBar from "~/components/timetable/StudentInfoBar";
import NextEventCard from "~/components/timetable/NextEventCard";
import NotificationWarning from "~/components/ui/NotificationWarning";
import React, { useState, useEffect, useRef } from "react";
import { downloadAndSaveEvents, getStudentId, getLastUpdatedDisplay } from "~/utils/dataFetcher";
import { loadEventsFromStorage } from "~/utils/loadEventsFromStorage";
import type { EventRow } from "~/api/student";
import { getNextParticipatingEvent } from "~/utils/timetable/nextEventCalculator";
import { useCurrentTime } from "~/hooks/useCurrentTime";
import { scheduleAllNotifications, getNotificationSetting } from "~/utils/notifications";
import type { Message } from "~/types/timetable";
import { FaBell } from "react-icons/fa";

export default function Timetable() {
    const [events, setEvents] = useState<EventRow[]>([]);
    const [studentId, setStudentId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<Message>({ type: null, content: "" });
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [showNotificationWarning, setShowNotificationWarning] = useState(false);
    const hasFetchedRef = useRef(false);

    // === 現在時刻 ===
    const currentTime = useCurrentTime();

    // === データ更新ハンドラー（スワイプでも再利用可能） ===
    const handleDataUpdate = async () => {
        setIsLoading(true);
        setMessage({ type: null, content: "" });
        const result = await downloadAndSaveEvents();

        if (result.success) {
            console.log(`[Timetable] 성공 - 이벤트 ${result.events.length}개 로드`);
            setEvents(result.events);
            setMessage({ type: null, content: "" });
        } else {
            console.error("[Timetable] データ更新失敗");
            setMessage({ type: "error", content: "データ更新失敗" });
        }
        setIsLoading(false);
    };

    // === 最終更新時間を取得 ===
    useEffect(() => {
        const updateLastUpdated = () => {
            const lastUpdate = getLastUpdatedDisplay();
            setLastUpdated(lastUpdate);
        };

        // 初回読み込み
        updateLastUpdated();

        // カスタムイベントリスナー：データ更新時に呼ばれる
        const handleDataUpdated = () => {
            updateLastUpdated();
        };

        window.addEventListener("data-updated", handleDataUpdated);

        return () => {
            window.removeEventListener("data-updated", handleDataUpdated);
        };
    }, []);

    // === 初期化：学籍番号とイベントデータを取得 ===
    useEffect(() => {
        const id = getStudentId();
        setStudentId(id);

        // URLパラメータから登録状態を確認
        const params = new URLSearchParams(window.location.search);
        const registered = params.get("registered");

        if (registered === "true") {
            setMessage({ type: "success", content: "登録しました" });
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

    // === イベントデータが更新されたら通知をスケジュール ===
    useEffect(() => {
        if (events.length > 0) {
            scheduleAllNotifications(events);

            // 通知が有効で、注意喚起を表示するフラグがある場合
            const shouldShowWarning = localStorage.getItem("notification:should_show_warning");
            const notificationEnabled = getNotificationSetting();

            if (notificationEnabled && shouldShowWarning === "true") {
                setShowNotificationWarning(true);
                // フラグをクリア
                localStorage.removeItem("notification:should_show_warning");
            }
        }
    }, [events]);

    // === 次の予定を取得 ===
    const nextEvent = getNextParticipatingEvent(events);

    // === Pull to Refresh ハンドラー ===
    const handleRefresh = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await handleDataUpdate();
    };

    // === 時刻フォーマット（HH:MM） ===
    const formatTimeOnly = (dateString: string | null): string | null => {
        if (!dateString) return null;
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <RecTimeFlame>
            <PullToRefresh onRefresh={handleRefresh}>
                <div className="flex h-full flex-col">
                    <StudentInfoBar
                        studentId={studentId}
                        onUpdate={handleDataUpdate}
                        isLoading={isLoading}
                        message={message}
                    />

                    {/* 次の予定カード */}
                    <NextEventCard event={nextEvent} isLoggedIn={!!studentId} />

                    <TimeSlotGridWithEvents
                        displayEvents={events}
                        studentId={studentId}
                        loading={isLoading}
                        currentTime={currentTime}
                    />

                    {/* 最終更新時間 */}
                    <div className="text-center text-xs text-[#020F95]/50">
                        <span>最終更新：</span>
                        <span>{formatTimeOnly(lastUpdated) || "未更新"}</span>
                    </div>

                    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
                        <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
                            <div className="mb-3 flex items-center gap-2">
                                <FaBell className="h-5 w-5 text-[#000D91]" />
                                <h3 className="text-base font-bold text-[#000D91]">プッシュ通知について</h3>
                            </div>

                            <div className="mb-4 space-y-3">
                                <p className="text-sm leading-relaxed text-gray-700">
                                    プッシュ通知を受け取るには、アプリを<br/>
                                    <span className="font-bold text-[#000D91]">「ホーム画面に追加」</span>して
                                    <span className="font-bold text-[#000D91]">「起動した状態」</span>にしてください。
                                </p>

                                <div className="space-y-1.5 rounded-lg bg-gray-50 p-3 text-sm">
                                    <p className="flex items-center gap-2">
                                        <span className="text-green-600">✓</span>
                                        <span className="text-black">アプリをバックグラウンド状態にしても<span className="text-green-600 font-bold">OK</span></span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span className="text-green-600">✓</span>
                                        <span className="text-black">スリープ状態でも<span className="text-green-600 font-bold">OK</span></span>
                                    </p>
                                    <p className="flex items-center gap-1">
                                        <span className="text-red-500">×</span>
                                        <span className=" text-black ">アプリを閉じるのは<span className="text-red-500 font-bold">NG</span></span>
                                    </p>
                                </div>

                                <div className="rounded-lg bg-orange-50 p-3">
                                    <p className="mb-1 text-xs font-bold text-orange-600">
                                        ※ホーム画面に追加する方法（PWA）
                                    </p>
                                    <p className="text-xs leading-relaxed text-gray-700">
                                        ブラウザの「メニュー」から「ホーム画面に追加」することで、通知機能やオフライン起動が使えます。
                                    </p>
                                </div>
                            </div>

                            <button
                                className="cursor-pointer w-full rounded-lg bg-[#000D91] py-2.5 text-sm font-semibold text-white transition-colors active:bg-[#000D91]/90"
                            >
                                確認した
                            </button>
                        </div>
                    </div>
                </div>
            </PullToRefresh>

            {/* 通知に関する注意喚起モーダル */}
            <NotificationWarning
                isVisible={showNotificationWarning}
                onDismiss={() => setShowNotificationWarning(false)}
            />
        </RecTimeFlame>
    );
}
