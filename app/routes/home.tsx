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

// ✅ 로컬 스토리지 키 정의 / ローカルストレージキー定義
const LS_KEY_ID = "student:id";
const LS_KEY_BIRTHDAY = "student:birthday"; // 🔒 보안 강화용 생년월일 / セキュリティ強化: 生年月日
const LS_KEY_EVENTS = (id: string) => `events:list:${id}`;
const LS_KEY_ENTRIES = (id: string) => `entries:list:${id}`;
const LS_KEY_LAST_UPDATED = "student:payload:lastUpdated";
const LS_KEY_UPDATE_COUNT = "data:update:count"; // 🔄 데이터 변경 감지용 / データ更新検知用

// ✅ 유틸 함수 / ユーティリティ関数
function getStudentId(): string | null {
    return localStorage.getItem(LS_KEY_ID);
}
function setStudentId(id: string) {
    localStorage.setItem(LS_KEY_ID, id);
}

// 🔒 생년월일 관련 함수 / 生年月日関連関数
function getStudentBirthday(): string | null {
    return localStorage.getItem(LS_KEY_BIRTHDAY);
}
function setStudentBirthday(birthday: string) {
    localStorage.setItem(LS_KEY_BIRTHDAY, birthday);
}

// 🔄 데이터 업데이트 감지 함수 / データ更新検知関数
async function checkDataUpdate(): Promise<boolean> {
    try {
        const lastKnownCount = localStorage.getItem(LS_KEY_UPDATE_COUNT);
        if (!lastKnownCount) return true; // 첫 실행 시 업데이트 필요 / 初回実行時は更新必要

        const response = await fetch(`${API_BASE}/data-update/check?lastKnownCount=${lastKnownCount}`);
        const result = await response.json();

        if (result.hasChanged) {
            console.log("🔄 データが更新されました。最新データを取得してください。");
            return true;
        }
        return false;
    } catch (error) {
        console.error("⚠️ データ更新チェックに失敗しました:", error);
        return true;
    }
}

// 🔄 데이터 업데이트 정보 저장 / データ更新情報を保存
async function saveUpdateInfo() {
    try {
        const response = await fetch(`${API_BASE}/data-update/info`);
        const info = await response.json();
        localStorage.setItem(LS_KEY_UPDATE_COUNT, info.recordCount.toString());
        console.log("📊 データ更新情報を保存しました:", info);
    } catch (error) {
        console.error("⚠️ データ更新情報の保存に失敗しました:", error);
    }
}

// 🔒 생년월일 검증 함수 / 生年月日照合関数
async function validateStudentBirthday(id: string, birthday: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE}/students/by-student-num/${id}/birthday/${birthday}`);
        return response.ok; // OK → 검증 성공 / OKなら照合成功
    } catch (error) {
        console.error("⚠️ 生年月日の照合に失敗しました:", error);
        return false;
    }
}

// ✅ 알림 요청 / 通知許可リクエスト
function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
        Notification.requestPermission();
    }
}

// ✅ 알림 표시 / 通知表示
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

// ✅ 백엔드 호출 / バックエンドAPI呼び出し
async function fetchByGakuseki(id: string, birthday?: string): Promise<{ events: EventRow[]; isFromCache: boolean }> {
    const apiUrl = birthday
        ? `${API_BASE}/students/by-student-num/${id}/birthday/${birthday}`
        : `${API_BASE}/entries/alarm/${id}`;

    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`API失敗: ${res.status}`);

    const isFromCache = res.headers.get("X-Cache-Source") === "service-worker";
    const data = await res.json();

    let events: EventRow[] = [];
    if (birthday) {
        // 보안모드: 이벤트별 상세 조회 / セキュリティ強化モード
        const eventsRes = await fetch(`${API_BASE}/entries/alarm/${id}`, { cache: "no-store" });
        if (eventsRes.ok) {
            const eventsData = await eventsRes.json();
            events = Array.isArray(eventsData)
                ? eventsData.map((ev: any) => ({
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
        }
    } else {
        // 일반모드 / 通常モード
        events = Array.isArray(data)
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
    }

    return { events, isFromCache };
}

export default function Home() {
    const [status, setStatus] = useState<Status>("idle");
    const [inputId, setInputId] = useState("");
    const [inputBirthday, setInputBirthday] = useState("");
    const [studentId, setStudentIdState] = useState<string | null>(null);
    const [events, setEvents] = useState<EventRow[]>([]);
    const [myEntries, setMyEntries] = useState<EventRow[]>([]);
    const [lastRun, setLastRun] = useState<number | null>(null);
    const [birthdayError, setBirthdayError] = useState<string | null>(null);

    const autoSyncRef = useRef<number | null>(null);

    // ✅ 데이터 다운로드 (수동/자동) / データダウンロード処理（手動・自動）
    async function handleDownload(mode: string = "manual"): Promise<boolean> {
        const id = getStudentId();
        if (!id) {
            setStatus("no-id");
            return false;
        }
        setStatus("loading");

        try {
            if (mode === "auto") {
                const needsUpdate = await checkDataUpdate();
                if (!needsUpdate) {
                    console.log("📊 データは最新です。更新は不要です。");
                    setStatus("ok");
                    return true;
                }
            }

            const birthday = getStudentBirthday();
            const { events: fetchedEvents, isFromCache } = await fetchByGakuseki(id, birthday || undefined);
            localStorage.setItem(LS_KEY_EVENTS(id), JSON.stringify(fetchedEvents));

            const entries = fetchedEvents.filter((e) => e.f_is_my_entry);
            localStorage.setItem(LS_KEY_ENTRIES(id), JSON.stringify(entries));
            setMyEntries(entries);

            if (!isFromCache) {
                const now = new Date();
                localStorage.setItem(LS_KEY_LAST_UPDATED, now.toISOString());
                setLastRun(now.getTime());
                await saveUpdateInfo();
            }

            setEvents(fetchedEvents);
            if (entries.length > 0) scheduleNotification(entries[0]);

            setStatus(isFromCache ? "error" : "ok");
            return true;
        } catch (e) {
            console.error("⚠️ データ取得中にエラーが発生しました:", e);
            setStatus("error");
            return false;
        }
    }

    // ✅ pull to refresh 기능 / スワイプリロード機能
    const { isRefreshing } = usePullToRefresh({
        onRefresh: async () => {
            console.log("🔄 [スクロール更新] データを再取得します。");
            await handleDownload("pull");
        },
    });

    // ✅ 학번 상태 불러오기 / 学籍番号を状態に反映
    useEffect(() => {
        const id = getStudentId();
        setStudentIdState(id);
    }, [status]);

    // ✅ 알림 권한 요청 및 캐시 복원 / 通知権限リクエスト＋キャッシュ復元
    useEffect(() => {
        requestNotificationPermission();
        const id = getStudentId();
        if (id) {
            const cached = localStorage.getItem(LS_KEY_ENTRIES(id));
            if (cached) {
                try {
                    setMyEntries(JSON.parse(cached) as EventRow[]);
                } catch (e) {
                    console.error("⚠️ キャッシュの読み込みに失敗しました:", e);
                }
            }
        }
    }, [studentId]);

    // ✅ 마지막 갱신 시간 복원 / 最終更新時刻の復元
    useEffect(() => {
        const iso = localStorage.getItem(LS_KEY_LAST_UPDATED);
        if (iso) {
            const t = Date.parse(iso);
            if (!Number.isNaN(t)) setLastRun(t);
        }
    }, []);

    // ✅ 자동 동기화 / 自動同期設定（5分ごとチェック）
    const toggleAutoSync = (enabled: boolean) => {
        if (enabled) {
            localStorage.setItem("sync:alarm:auto", "1");
            if (autoSyncRef.current) clearInterval(autoSyncRef.current);
            autoSyncRef.current = window.setInterval(
                async () => {
                    console.log("🔄 [自動同期] 5分ごとに更新チェックを実行します。");
                    await handleDownload("auto");
                },
                5 * 60 * 1000
            );
        } else {
            localStorage.removeItem("sync:alarm:auto");
            if (autoSyncRef.current) clearInterval(autoSyncRef.current);
            autoSyncRef.current = null;
        }
    };

    // ✅ 학번 + 생년월일 저장 / 学籍番号＋生年月日保存処理
    async function handleSaveId() {
        const id = inputId.trim();
        const birthday = inputBirthday.trim();

        if (!/^\d+$/.test(id)) {
            alert("学籍番号（数字）を入力してください");
            return;
        }

        // 🔒 생년월일: YYYYMMDD 형식 / 生年月日: 8桁数字のみ
        if (birthday && !/^\d{8}$/.test(birthday)) {
            setBirthdayError("生年月日は 8桁の数字で入力してください（例：20050315）");
            return;
        }

        if (birthday) {
            setStatus("loading");
            setBirthdayError(null);
            try {
                const isValid = await validateStudentBirthday(id, birthday);
                if (!isValid) {
                    setBirthdayError("❌ 入力された生年月日が学籍番号と一致しません。");
                    setStatus("idle");
                    return;
                }
                setStudentId(id);
                setStudentBirthday(birthday);
                setStudentIdState(id);
                setStatus("idle");
                await handleDownload("manual");
            } catch (error) {
                console.error("⚠️ 生年月日の確認中にエラーが発生しました:", error);
                setBirthdayError("❌ 生年月日の確認中にエラーが発生しました。");
                setStatus("idle");
                return;
            }
        } else {
            setStudentId(id);
            setStudentIdState(id);
            setStatus("idle");
            await handleDownload("manual");
        }
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
                        placeholder="例）50350"
                        value={inputId}
                        onChange={(e) => setInputId(e.target.value)}
                    />

                    <div className="text-sm text-gray-600">
                        🔒 セキュリティ強化: 生年月日を入力してください（8桁の数字）
                    </div>
                    <input
                        className={`rounded border px-2 py-1 ${birthdayError ? "border-red-500" : ""}`}
                        placeholder="例）20061215"
                        value={inputBirthday}
                        onChange={(e) => {
                            setInputBirthday(e.target.value);
                            setBirthdayError(null);
                        }}
                    />

                    {birthdayError && (
                        <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">
                            {birthdayError}
                        </div>
                    )}

                    <button className="rounded border px-3 py-1" onClick={handleSaveId} disabled={status === "loading"}>
                        {status === "loading" ? "確認中..." : "保存"}
                    </button>
                </div>
            )}

            {studentId && (
                <div className="space-y-3">
                    <div>
                        学籍番号: <b>{studentId}</b>
                        {getStudentBirthday() && (
                            <span className="ml-2 text-sm text-green-600">🔒 セキュリティ強化モード</span>
                        )}
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

                    {/* ✅ 테스트 버튼 / テスト用ボタン */}
                    <button
                        className="rounded border border-blue-400 bg-blue-50 px-3 py-1 text-sm text-blue-600 hover:bg-blue-100"
                        onClick={async () => {
                            const current = parseInt(localStorage.getItem(LS_KEY_UPDATE_COUNT) || "0", 10);
                            const newCount = current + 1;
                            localStorage.setItem(LS_KEY_UPDATE_COUNT, newCount.toString());
                            console.log(`🧩 [テスト] ローカルの update count を変更しました: ${current} → ${newCount}`);
                            await handleDownload("auto");
                        }}
                    >
                        🧩 テストデータ変更（コンソール確認用）
                    </button>

                    <div className="text-xs opacity-70">
                        最終更新:{" "}
                        {getLastUpdatedDisplay("ja-JP") ?? (lastRun ? new Date(lastRun).toLocaleString() : "—")}
                    </div>
                </div>
            )}

            {isRefreshing && <div className="mt-2 text-center text-sm text-blue-600">🔄 データ更新中です…</div>}
        </div>
    );
}
