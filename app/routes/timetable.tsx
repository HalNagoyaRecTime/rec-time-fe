import RecTimeFlame from "~/components/ui/recTimeFlame";
import PullToRefresh from "~/components/ui/PullToRefresh";
import TimeSlotGridWithEvents from "~/components/page/timetable/containers/TimeSlotGridWithEvents";
import StudentInfoBar from "~/components/page/timetable/StudentInfoBar";
import NextEventCard from "~/components/page/timetable/presenters/cards/NextEventCard";
import NotificationWarningModal from "~/components/modal/NotificationWarningModal";
import EventDetailModal from "~/components/modal/EventDetailModal";
import React, { useState, useEffect } from "react";
import { getLastUpdatedDisplay, getStudentId } from "~/utils/dataFetcher";
import { loadEventsFromStorage } from "~/utils/loadEventsFromStorage";
import type { EventRow } from "~/api/student";
import { getNextParticipatingEvent } from "~/utils/timetable/nextEventCalculator";
import { useCurrentTime } from "~/hooks/useCurrentTime";
import { scheduleAllNotifications, getNotificationSetting } from "~/utils/notifications";
import type { Message } from "~/types/timetable";
import type { Route } from "./+types/timetable";

export const meta: Route.MetaFunction = () => {
    return [{ title: "TimeTable - recTime" }];
};

export default function Timetable() {
    const [events, setEvents] = useState<EventRow[]>([]);
    const [studentId, setStudentId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<Message>({ type: null, content: "" });
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [showNotificationWarning, setShowNotificationWarning] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEventForDetail, setSelectedEventForDetail] = useState<EventRow | null>(null);
    const [isEventDetailModalOpen, setIsEventDetailModalOpen] = useState(false);

    // === 現在時刻 ===
    const currentTime = useCurrentTime();

    // === データ更新ハンドラー（スワイプ・ボタン操作） ===
    // useAppStateSync が既にイベント取得を含むので、手動トリガーのみ実装
    const handleDataUpdate = async () => {
        console.log('[Timetable] ユーザーによる手動更新');
        setIsLoading(true);
        setMessage({ type: null, content: "" });

        try {
            // 統合同期関数を呼び出す（useAppStateSyncが チェック + イベント取得を実行）
            await (window as any).__appSync?.();
            // イベント取得結果は data-updated カスタムイベント経由で timetable に通知される
        } catch (error) {
            console.error("[Timetable] 同期エラー:", error);
            setMessage({ type: "error", content: "更新エラー" });
        } finally {
            setIsLoading(false);
        }
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

            // イベントデータを再読み込み
            const id = getStudentId();
            const updatedEvents = loadEventsFromStorage(id);
            setEvents(updatedEvents);
            console.log("[Timetable] data-updated イベント受信 - イベント再読み込み: " + updatedEvents.length + "件");
        };

        window.addEventListener("data-updated", handleDataUpdated);

        return () => {
            window.removeEventListener("data-updated", handleDataUpdated);
        };
    }, []);

    // === 初期化：学籍番号とイベントデータを読み込む ===
    // (注：アプリ初期化時のデータ取得はroot.tsxで実行済み)
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

        // LocalStorageからイベントデータを読み込む（root.tsxで既に取得・保存済み）
        const storedEvents = loadEventsFromStorage(id);
        setEvents(storedEvents);

        console.log("[Timetable] 初期化完了: LocalStorageから" + storedEvents.length + "件のイベントを読み込み");
    }, []);

    // === イベントデータが更新されたら通知をスケジュール ===
    useEffect(() => {
        if (events.length > 0) {
            // 이벤트 데이터가 변경될 때마다 알림 재스케줄
            console.log(`[Timetable] 이벤트 ${events.length}개 로드 - 알림 재스케줄`);
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

    // ポーリングはroot.tsxのuseAppStateSyncで対応済み（定期チェック5分）

    // === 次の予定を取得 ===
    const nextEvent = getNextParticipatingEvent(events);

    // === Pull to Refresh ハンドラー ===
    const handleRefresh = async () => {
        // Pull to Refresh時は常にサーバーから取得（ユーザー操作による明示的な更新）
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // フル取得してから件数を記録
        await handleDataUpdate();
    };

    // === イベント詳細モーダルを開く ===
    const handleOpenEventDetail = (event: EventRow) => {
        setSelectedEventForDetail(event);
        setIsEventDetailModalOpen(true);
        setIsModalOpen(true);
    };

    // === イベント詳細モーダルを閉じる ===
    const handleCloseEventDetail = () => {
        setIsEventDetailModalOpen(false);
        setIsModalOpen(false);
        setSelectedEventForDetail(null);
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
            <PullToRefresh onRefresh={handleRefresh} isDisabled={isModalOpen}>
                <div className="flex h-full flex-col">
                    <StudentInfoBar
                        studentId={studentId}
                        onUpdate={handleDataUpdate}
                        isLoading={isLoading}
                        message={message}
                    />

                    {/* 次の予定カード */}
                    <NextEventCard
                        event={nextEvent}
                        isLoggedIn={!!studentId}
                        allEvents={events}
                        onModalStateChange={setIsModalOpen}
                    />

                    <TimeSlotGridWithEvents
                        displayEvents={events}
                        studentId={studentId}
                        loading={isLoading}
                        currentTime={currentTime}
                        onEventClick={handleOpenEventDetail}
                    />

                    {/* 最終更新時間 */}
                    <div className="text-center text-xs text-[#020F95]/50">
                        <span>最終更新：</span>
                        <span>{formatTimeOnly(lastUpdated) || "未更新"}</span>
                    </div>
                </div>
            </PullToRefresh>

            {/* 通知に関する注意喚起モーダル */}
            <NotificationWarningModal
                isVisible={showNotificationWarning}
                onDismiss={() => setShowNotificationWarning(false)}
            />

            {/* イベント詳細モーダル */}
            <EventDetailModal
                isOpen={isEventDetailModalOpen}
                event={selectedEventForDetail}
                onClose={handleCloseEventDetail}
                onClosing={() => setIsModalOpen(false)}
            />
        </RecTimeFlame>
    );
}
