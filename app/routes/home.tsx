import { useEffect, useRef, useState } from "react";
import { Welcome } from "../welcome/welcome";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { getLastUpdatedDisplay } from "../common/forFrontEnd";

// ✅ 상태 타입 / 状態タイプ
type Status = "idle" | "no-id" | "loading" | "ok" | "error";

// ✅ 환경변수 기반 API URL 설정
// const API_BASE = "/api"; // ❌ 기존 상대경로 (로컬용)
// ✅ HTTPS 기반으로 수정 (Cloudflare 또는 .env 자동 인식)
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "https://rec-time-be.rectime-test.workers.dev/api";
// "http://127.0.0.1:8787/api"; // 🧪 로컬테스트용

// ✅ 데이터 타입 / データ型
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

// ✅ 로컬 키 / ローカルキー
const LS_KEY_ID = "student:id";
const LS_KEY_BIRTHDAY = "student:birthday";
const LS_KEY_ENTRIES = (id: string) => `entries:list:${id}`;
const LS_KEY_UPDATE_COUNT = "data:update:count";
const LS_KEY_LAST_UPDATED = "student:payload:lastUpdated";

/* =========================================================
   🔧 유틸 함수 / ユーティリティ関数
   ========================================================= */
function getStudentId(): string | null {
    return localStorage.getItem(LS_KEY_ID);
}
function setStudentId(id: string) {
    localStorage.setItem(LS_KEY_ID, id);
}
function getStudentBirthday(): string | null {
    return localStorage.getItem(LS_KEY_BIRTHDAY);
}
function setStudentBirthday(birthday: string) {
    localStorage.setItem(LS_KEY_BIRTHDAY, birthday);
}

/* =========================================================
   🔒 학생 인증 / 学生認証
   ========================================================= */
async function validateStudentBirthday(id: string, birthday: string): Promise<boolean> {
    const apiUrl = `${API_BASE}/students/by-student-num/${id}/birthday/${birthday}`;
    console.log("🔍 学生認証開始:", { id });

    try {
        const res = await fetch(apiUrl, { cache: "no-store" });

        if (res.status === 404) {
            console.warn("⚠️ 学生が見つかりません (404):", id);
            return false;
        }

        if (!res.ok) {
            console.error(`🚨 学生認証失敗 (${res.status}):`, await res.text());
            return false;
        }

        console.log("✅ 学生認証成功");
        return true;
    } catch (err) {
        console.error("⚠️ サーバーに接続できません。ネットワーク状態を確認してください。", err);
        return false;
    }
}

/* =========================================================
   🛰️ 데이터 호출 / データ呼び出し
   ========================================================= */
async function fetchStudentData(id: string): Promise<EventRow[]> {
    const apiUrl = `${API_BASE}/entries/alarm/${id}`;
    console.log("🛰️ API呼び出し開始:", { id, apiUrl });

    try {
        const res = await fetch(apiUrl, { cache: "no-store" });

        if (res.status === 404) {
            console.warn("⚠️ エントリーデータが見つかりません (404):", id);
            return [];
        }

        if (!res.ok) {
            console.error(`🚨 サーバー応答エラー (${res.status})`);
            throw new Error("サーバーから正しい応答を受け取れませんでした。");
        }

        const data = await res.json();
        const result = Array.isArray(data) ? data : [];
        console.log(`✅ イベントデータ取得成功: ${result.length} 件`);
        return result;
    } catch (err) {
        console.error("🛑 データ取得中にエラー:", err);
        throw err;
    }
}

/* =========================================================
   🔁 데이터 갱신 확인 / データ更新確認
   ========================================================= */
async function checkDataUpdate(): Promise<boolean> {
    try {
        const lastKnownCount = localStorage.getItem(LS_KEY_UPDATE_COUNT);
        if (!lastKnownCount) return true;

        const res = await fetch(`${API_BASE}/data-update/check?lastKnownCount=${lastKnownCount}`);
        const result = await res.json();

        if (result.hasChanged) {
            console.log("🔄 データ更新検出 → 自動ダウンロード開始");
            return true;
        }

        console.log("✅ データ更新なし（最新状態）");
        return false;
    } catch (err) {
        console.warn("⚠️ データ更新チェック失敗:", err);
        return true;
    }
}

async function saveUpdateInfo() {
    try {
        const res = await fetch(`${API_BASE}/data-update/info`);
        const info = await res.json();
        localStorage.setItem(LS_KEY_UPDATE_COUNT, info.recordCount.toString());
        console.log("📊 データ更新情報保存:", info);
    } catch {
        console.warn("⚠️ データ更新情報の保存に失敗しました。");
    }
}

/* =========================================================
   🔔 알림 관련 / 通知関連
   ========================================================= */
function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") Notification.requestPermission();
}

function showEventNotification(event: EventRow) {
    if (Notification.permission !== "granted") return;
    new Notification(`🚨 ${event.f_event_name ?? "イベント"}`, {
        body: `📢 ${event.f_place ?? "場所未定"}（集合: ${event.f_gather_time ?? "未定"}）`,
    });
    console.log(`🔔 通知表示: ${event.f_event_name}`);
}

/* =========================================================
   🧭 Home コンポーネント
   ========================================================= */
export default function Home() {
    const [status, setStatus] = useState<Status>("idle");
    const [inputId, setInputId] = useState("");
    const [inputBirthday, setInputBirthday] = useState("");
    const [studentId, setStudentIdState] = useState<string | null>(null);
    const [myEntries, setMyEntries] = useState<EventRow[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [lastRun, setLastRun] = useState<number | null>(null);
    const autoSyncRef = useRef<number | null>(null);

    async function handleSaveId() {
        const id = inputId.trim();
        const birthday = inputBirthday.trim();

        if (!/^\d+$/.test(id)) return alert("学籍番号（数字）を入力してください。");
        if (!/^\d{8}$/.test(birthday)) return alert("生年月日は8桁の数字で入力してください。");

        setStatus("loading");
        const valid = await validateStudentBirthday(id, birthday);
        if (!valid) {
            setErrorMsg("❌ 学籍番号または生年月日が正しくありません。");
            setStatus("error");
            return;
        }

        setErrorMsg(null);
        setStudentId(id);
        setStudentBirthday(birthday);
        setStudentIdState(id);
        console.log("✅ 学生認証成功 → データ取得開始");
        await handleDownload();
    }

    async function handleDownload(mode: "manual" | "auto" = "manual") {
        const id = getStudentId();
        if (!id) return;

        setStatus("loading");
        console.log(mode === "auto" ? "🔄 [自動同期] データチェック開始..." : "📥 データダウンロード開始:", { id });

        try {
            if (mode === "auto") {
                const updateNeeded = await checkDataUpdate();
                if (!updateNeeded) {
                    setStatus("ok");
                    return;
                }
            }

            const events = await fetchStudentData(id);
            localStorage.setItem(LS_KEY_ENTRIES(id), JSON.stringify(events));
            setMyEntries(events);

            const now = new Date();
            setLastRun(now.getTime());
            localStorage.setItem(LS_KEY_LAST_UPDATED, now.toISOString());
            await saveUpdateInfo();

            if (events.length > 0) {
                const sorted = [...events].sort((a, b) => (a.f_start_time ?? "").localeCompare(b.f_start_time ?? ""));
                const earliest = sorted[0];
                console.log("🔔 自動通知イベント:", earliest);
                showEventNotification(earliest);
            }

            setStatus("ok");
        } catch (err) {
            console.error("🚨 データ取得中エラー:", err);
            setErrorMsg("🚨 データ取得中にエラーが発生しました。");
            setStatus("error");
        }
    }

    const toggleAutoSync = (enabled: boolean) => {
        if (enabled) {
            localStorage.setItem("sync:alarm:auto", "1");
            if (autoSyncRef.current) clearInterval(autoSyncRef.current);
            autoSyncRef.current = window.setInterval(
                async () => {
                    console.log("🕒 [自動同期] 5分ごとに更新チェックを実行します。");
                    await handleDownload("auto");
                },
                5 * 60 * 1000
            );
            console.log("✅ 自動同期が有効になりました。");
        } else {
            localStorage.removeItem("sync:alarm:auto");
            if (autoSyncRef.current) clearInterval(autoSyncRef.current);
            autoSyncRef.current = null;
            console.log("⏸ 自動同期が無効になりました。");
        }
    };

    useEffect(() => {
        const id = getStudentId();
        console.log("🏠 コンポーネント初期化:", { studentId: id });
        setStudentIdState(id);
        requestNotificationPermission();

        const autoEnabled = localStorage.getItem("sync:alarm:auto") === "1";
        if (autoEnabled) toggleAutoSync(true);
    }, []);

    usePullToRefresh({
        onRefresh: async () => {
            console.log("🔄 [スワイプ更新] データを再取得します。");
            await handleDownload();
        },
    });

    return (
        <div className="space-y-4 p-4">
            <Welcome />

            {errorMsg && <div className="rounded bg-red-50 p-3 text-sm text-red-600">{errorMsg}</div>}

            {!studentId && (
                <div className="space-y-2">
                    <div className="font-semibold">学籍番号を入力してください</div>
                    <input
                        className="rounded border px-2 py-1"
                        placeholder="例) 50350"
                        value={inputId}
                        onChange={(e) => setInputId(e.target.value)}
                    />
                    <input
                        className="rounded border px-2 py-1"
                        placeholder="例) 20061215"
                        value={inputBirthday}
                        onChange={(e) => setInputBirthday(e.target.value)}
                    />
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

                    <label className="text-sm">
                        <input
                            type="checkbox"
                            defaultChecked={localStorage.getItem("sync:alarm:auto") === "1"}
                            onChange={(e) => toggleAutoSync(e.target.checked)}
                        />{" "}
                        通知と自動同期する（5分ごと）
                    </label>

                    <button
                        className="rounded border px-3 py-2"
                        onClick={() => handleDownload("manual")}
                        disabled={status === "loading"}
                    >
                        {status === "loading" ? "読み込み中…" : "イベントデータ取得 & 通知予約"}
                    </button>

                    <div className="text-xs opacity-70">
                        最終更新:{" "}
                        {getLastUpdatedDisplay("ja-JP") ?? (lastRun ? new Date(lastRun).toLocaleString() : "—")}
                    </div>
                </div>
            )}
        </div>
    );
}
