import { useEffect, useRef, useState } from "react";
import { Welcome } from "../welcome/welcome";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { getLastUpdatedDisplay } from "../common/forFrontEnd";

// ✅ 상태 타입 정의 / 状態タイプ定義
type Status = "idle" | "no-id" | "loading" | "ok" | "error";

const API_BASE = "/api";

// ✅ 학생 및 이벤트 데이터 타입 / 学生・イベントデータ型
type EventRow = {
    f_event_id: string;
    f_event_name: string | null;
    f_start_time: string | null;
    f_duration: string | null;
    f_place: string | null;
    f_gather_time: string | null;
    f_summary: string | null;
    f_is_my_entry?: boolean;
};

// ✅ 로컬 스토리지 키 정의 / ローカルストレージのキー定義
const LS_KEY_ID = "student:id";
const LS_KEY_EVENTS = (id: string) => `events:list:${id}`;
const LS_KEY_ENTRIES = (id: string) => `entries:list:${id}`;
const LS_KEY_LAST_UPDATED = "student:payload:lastUpdated";

// ✅ 유틸 함수 / ユーティリティ関数
function getStudentId(): string | null {
    return localStorage.getItem(LS_KEY_ID);
}
function setStudentId(id: string) {
    localStorage.setItem(LS_KEY_ID, id);
}

// ✅ 알림 요청 / 通知の権限リクエスト
function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
        Notification.requestPermission();
    }
}

// ✅ 알림 표시 / 通知を表示する関数
function showEventNotification(event: EventRow) {
    if (Notification.permission !== "granted") return;
    const title = `🚨 アラーム: ${event.f_event_name ?? "イベント"}`;
    const body = `📢 出場イベント: ${event.f_place ?? "場所未定"}（集合: ${event.f_gather_time ?? "未定"}）`;
    new Notification(title, { body });
}

// ✅ 알람 예약 (5초 후) / 通知を5秒後に予約
function scheduleNotification(event: EventRow) {
    const diff = 5 * 1000;
    setTimeout(() => showEventNotification(event), diff);
    console.log(`[⏰ 通知予約] ${event.f_event_name} → 5秒後に通知予定`);
}

// ✅ 백엔드 호출 / API呼び出し
async function fetchByGakuseki(id: string): Promise<{ events: EventRow[]; isFromCache: boolean }> {
    const res = await fetch(`${API_BASE}/entries/alarm/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`API失敗: ${res.status}`);

    const isFromCache = res.headers.get("X-Cache-Source") === "service-worker";
    const data = await res.json();

    const events: EventRow[] = Array.isArray(data)
        ? data.map((ev: any) => ({
              f_event_id: String(ev.f_event_id ?? ""),
              f_event_name: ev.f_event_name ?? null,
              f_start_time: typeof ev.f_start_time === "string" ? ev.f_start_time : null,
              f_duration: ev.f_duration ? String(ev.f_duration) : null,
              f_place: ev.f_place ?? null,
              f_gather_time: typeof ev.f_gather_time === "string" ? ev.f_gather_time : null,
              f_summary: ev.f_summary ?? null,
              f_is_my_entry: Boolean(ev.f_is_my_entry ?? false),
          }))
        : [];

    return { events, isFromCache };
}

// ✅ 메인 컴포넌트 / メインコンポーネント
export default function Home() {
    const [status, setStatus] = useState<Status>("idle");
    const [inputId, setInputId] = useState("");
    const [studentId, setStudentIdState] = useState<string | null>(null);
    const [events, setEvents] = useState<EventRow[]>([]);
    const [myEntries, setMyEntries] = useState<EventRow[]>([]);
    const [lastRun, setLastRun] = useState<number | null>(null);

    // ✅ 자동동기화 타이머 ref / 自動同期タイマー
    const autoSyncRef = useRef<number | null>(null);

    // ✅ 데이터 다운로드 및 저장 / データ取得・保存・通知登録
    async function handleDownload(mode: string = "manual"): Promise<boolean> {
        const id = getStudentId();
        if (!id) {
            setStatus("no-id");
            return false;
        }
        setStatus("loading");

        try {
            const { events: fetchedEvents, isFromCache } = await fetchByGakuseki(id);
            localStorage.setItem(LS_KEY_EVENTS(id), JSON.stringify(fetchedEvents));

            const entries = fetchedEvents.filter((e) => e.f_is_my_entry);
            localStorage.setItem(LS_KEY_ENTRIES(id), JSON.stringify(entries));
            setMyEntries(entries);

            if (!isFromCache) {
                const now = new Date();
                localStorage.setItem(LS_KEY_LAST_UPDATED, now.toISOString());
                setLastRun(now.getTime());
            }

            setEvents(fetchedEvents);
            if (entries.length > 0) scheduleNotification(entries[0]);

            console.log(`📡 [${mode}] handleDownload 実行完了`);
            setStatus(isFromCache ? "error" : "ok");
            return true;
        } catch (e) {
            console.error(e);
            setStatus("error");
            return false;
        }
    }

    // ✅ pull to refresh / スワイプリロード
    const { isRefreshing } = usePullToRefresh({
        onRefresh: async () => {
            console.log("🔄 [スクロール更新] データ再取得を実行");
            await handleDownload("pull");
        },
    });

    // ✅ 학번 저장 → 상태에 반영 / 学籍番号を保存して状態更新
    useEffect(() => {
        const id = getStudentId();
        setStudentIdState(id);
    }, [status]);

    // ✅ 알람 권한 요청 및 캐시 데이터 불러오기 / 通知権限のリクエストとキャッシュからの読込
    useEffect(() => {
        requestNotificationPermission();
        const id = getStudentId();
        if (id) {
            const cached = localStorage.getItem(LS_KEY_ENTRIES(id));
            if (cached) {
                try {
                    setMyEntries(JSON.parse(cached) as EventRow[]);
                } catch (e) {
                    console.error("キャッシュされたエントリの読み込み失敗:", e);
                }
            }
        }
    }, [studentId]);

    // ✅ 마지막 갱신 시간 표시 / 最終更新時間を表示
    useEffect(() => {
        const iso = localStorage.getItem(LS_KEY_LAST_UPDATED);
        if (iso) {
            const t = Date.parse(iso);
            if (!Number.isNaN(t)) setLastRun(t);
        }
    }, []);

    // ✅ 자동 동기화 설정 함수 / 自動同期設定関数
    const toggleAutoSync = (enabled: boolean) => {
        if (enabled) {
            localStorage.setItem("sync:alarm:auto", "1");
            console.log("✅ [自動同期] 手動で有効化");
            if (autoSyncRef.current) clearInterval(autoSyncRef.current);
            autoSyncRef.current = window.setInterval(
                () => {
                    console.log("🔄 [自動同期] 5分経過 → データ再取得");
                    handleDownload("auto");
                },
                5 * 60 * 1000
            );
        } else {
            localStorage.removeItem("sync:alarm:auto");
            console.log("❌ [自動同期] 手動で無効化");
            if (autoSyncRef.current) clearInterval(autoSyncRef.current);
            autoSyncRef.current = null;
        }
    };

    // ✅ 학번 저장 버튼 처리 / 学籍番号の保存処理
    async function handleSaveId() {
        const id = inputId.trim();
        if (!/^\d+$/.test(id)) {
            alert("学籍番号（数字）を入力してください");
            return;
        }
        setStudentId(id);
        setStudentIdState(id);
        setStatus("idle");

        // ✅ 저장 후 자동 다운로드 실행
        await handleDownload("manual");
    }

    // ✅ 렌더링 / 表示レンダリング
    return (
        <div className="space-y-4 p-4">
            <Welcome />

            {!studentId && (
                <div className="space-y-2">
                    <div className="font-semibold">学籍番号を入力してください</div>
                    <input
                        className="rounded border px-2 py-1"
                        placeholder="例）50416"
                        value={inputId}
                        onChange={(e) => setInputId(e.target.value)}
                    />
                    <button className="rounded border px-3 py-1" onClick={handleSaveId}>
                        保存
                    </button>
                </div>
            )}

            {studentId && (
                <div className="space-y-3">
                    <div>
                        学籍番号: <b>{studentId}</b>
                    </div>

                    <label>
                        <input
                            type="checkbox"
                            defaultChecked={localStorage.getItem("sync:alarm:auto") === "1"}
                            onChange={(e) => toggleAutoSync(e.target.checked)}
                        />
                        通知と自動同期する（5分ごと）
                    </label>

                    <button
                        className="rounded border px-3 py-2"
                        onClick={() => handleDownload("manual")}
                        disabled={status === "loading"}
                    >
                        {status === "loading" ? "ダウンロード中…" : "イベントデータ取得 & 通知予約"}
                    </button>

                    <div className="text-xs opacity-70">
                        最終更新:{" "}
                        {getLastUpdatedDisplay("ja-JP") ?? (lastRun ? new Date(lastRun).toLocaleString() : "—")}
                    </div>
                </div>
            )}

            {isRefreshing && <div className="mt-2 text-center text-sm text-blue-600">🔄 データ更新中です…</div>}

            <p className="mt-2">
                {status === "no-id" && "学籍番号が未設定です。入力してください。"}
                {status === "idle" && "準備OK"}
                {status === "loading" && "ダウンロード中…"}
                {status === "ok" && "保存完了・通知予約OK（5秒後通知）"}
                {status === "error" && "取得に失敗しました。"}
            </p>

            {/* ✅ 내 출전 경기 목록 표시 / 自分の出場イベント一覧 */}
            {myEntries.length > 0 && (
                <div>
                    <h3 className="mt-4 font-semibold text-blue-600">✅ 出場イベント一覧</h3>
                    <ul className="list-disc pl-5 text-sm">
                        {myEntries.map((en, idx) => (
                            <li key={`my-entry-${idx}`}>
                                {en.f_event_name ?? "不明なイベント"}（集合: {en.f_gather_time ?? "未定"} / 場所:{" "}
                                {en.f_place ?? "未定"}）
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
