import { useEffect, useRef, useState } from "react";
import { Welcome } from "../welcome/welcome";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { getLastUpdatedDisplay } from "../common/forFrontEnd";

// ✅ 상태 타입 정의 / 状態タイプ定義
type Status = "idle" | "no-id" | "loading" | "ok" | "error";

const API_BASE = "/api";

/* =========================================================
   📧 에러 리포트 메일 전송 / エラーレポート送信処理（メール通知）
   ========================================================= */
async function reportServerError(error: {
    studentNum?: string;
    errorType: string;
    errorMessage: string;
    stackTrace?: string;
    userAgent?: string;
    url?: string;
}): Promise<void> {
    try {
        const res = await fetch(`${API_BASE}/error/report`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                studentNum: error.studentNum || getStudentId(),
                ...error,
                timestamp: new Date().toISOString(),
                userAgent: error.userAgent || navigator.userAgent,
                url: error.url || window.location.href,
            }),
        });

        if (res.ok) console.log("📧 エラーレポート送信完了（에러 리포트 전송 완료）");
        else console.error("⚠️ エラーレポート送信失敗（에러 리포트 전송 실패）:", res.status);
    } catch (err) {
        console.error("⚠️ エラーレポート送信中に失敗（에러 리포트 중 오류発生）:", err);
    }
}

// 🔹 API / 네트워크 에러 전용 함수 / API・ネットワーク専用ラッパー関数
async function reportServerApiError(studentNum: string, apiUrl: string, error: Error) {
    await reportServerError({
        studentNum,
        errorType: "Server API Error",
        errorMessage: `API呼び出し失敗（API 호출 실패）: ${error.message}`,
        url: apiUrl,
        stackTrace: error.stack,
    });
}

async function reportServerNetworkError(studentNum: string, apiUrl: string, error: Error) {
    await reportServerError({
        studentNum,
        errorType: "Server Network Error",
        errorMessage: `ネットワーク接続失敗（네트워크 연결 실패）: ${error.message}`,
        url: apiUrl,
        stackTrace: error.stack,
    });
}

/* =========================================================
   🔧 유틸 함수 / ユーティリティ関数
   ========================================================= */
const LS_KEY_ID = "student:id";
const LS_KEY_BIRTHDAY = "student:birthday";
const LS_KEY_EVENTS = (id: string) => `events:list:${id}`;
const LS_KEY_ENTRIES = (id: string) => `entries:list:${id}`;
const LS_KEY_LAST_UPDATED = "student:payload:lastUpdated";
const LS_KEY_UPDATE_COUNT = "data:update:count";

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
   🔄 데이터 갱신 체크 / データ更新チェック
   ========================================================= */
async function checkDataUpdate(): Promise<boolean> {
    try {
        const lastKnown = localStorage.getItem(LS_KEY_UPDATE_COUNT);
        if (!lastKnown) return true; // 첫 실행 시 항상 업데이트 / 初回実行時は常に更新対象

        const res = await fetch(`${API_BASE}/data-update/check?lastKnownCount=${lastKnown}`);
        const data = await res.json();
        return data.hasChanged;
    } catch (err) {
        if (err instanceof Error) {
            await reportServerError({
                errorType: "Data Update Check Error",
                errorMessage: err.message,
                stackTrace: err.stack,
            });
        }
        return true;
    }
}

/* =========================================================
   💾 데이터 갱신 정보 저장 / データ更新情報の保存
   ========================================================= */
async function saveUpdateInfo() {
    try {
        const res = await fetch(`${API_BASE}/data-update/info`);
        const info = await res.json();
        localStorage.setItem(LS_KEY_UPDATE_COUNT, info.recordCount.toString());
    } catch (err) {
        if (err instanceof Error) {
            await reportServerError({
                errorType: "Save Update Info Error",
                errorMessage: err.message,
                stackTrace: err.stack,
            });
        }
    }
}

/* =========================================================
   🔒 학생 검증 / 学生認証・バリデーション
   ========================================================= */
async function validateStudentBirthday(id: string, birthday: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE}/students/by-student-num/${id}/birthday/${birthday}`);
        return res.ok;
    } catch (err) {
        if (err instanceof Error) {
            await reportServerError({
                studentNum: id,
                errorType: "Student Validation Error",
                errorMessage: err.message,
                stackTrace: err.stack,
            });
        }
        return false;
    }
}

/* =========================================================
   🛰️ 공통 API 호출 처리 / API呼び出し共通処理
   ========================================================= */
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

async function fetchByGakuseki(id: string, birthday?: string): Promise<EventRow[]> {
    const apiUrl = birthday
        ? `${API_BASE}/students/by-student-num/${id}/birthday/${birthday}`
        : `${API_BASE}/entries/alarm/${id}`;
    try {
        const res = await fetch(apiUrl, { cache: "no-store" });
        if (!res.ok) {
            throw new Error(`API失敗（API 실패）: ${res.status} ${res.statusText}`);
        }
        return await res.json();
    } catch (err) {
        if (err instanceof TypeError) await reportServerNetworkError(id, apiUrl, err);
        else if (err instanceof Error) await reportServerApiError(id, apiUrl, err);
        throw err;
    }
}

/* =========================================================
   🧭 Home 컴포넌트 본체 / Homeコンポーネント本体
   ========================================================= */
export default function Home() {
    const [status, setStatus] = useState<Status>("idle"); // 상태 관리 / 状態管理
    const [inputId, setInputId] = useState("");
    const [inputBirthday, setInputBirthday] = useState("");
    const [studentId, setStudentIdState] = useState<string | null>(null);
    const [myEntries, setMyEntries] = useState<EventRow[]>([]);
    const [lastRun, setLastRun] = useState<number | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const autoSyncRef = useRef<number | null>(null);

    /* ✅ 메인 데이터 다운로드 / メインデータダウンロード */
    async function handleDownload(mode: string = "manual") {
        const id = getStudentId();
        if (!id) return;

        try {
            if (mode === "auto" && !(await checkDataUpdate())) return;

            const birthday = getStudentBirthday();
            const events = await fetchByGakuseki(id, birthday || undefined);

            const entries = events.filter((e) => e.f_is_my_entry);
            localStorage.setItem(LS_KEY_ENTRIES(id), JSON.stringify(entries));
            setMyEntries(entries);

            await saveUpdateInfo();
            setLastRun(Date.now());
            setStatus("ok");
        } catch (err) {
            setStatus("error");
            setErrorMsg("🚨 データ取得中にエラーが発生しました。（데이터 가져오는 중 오류 발생）");
        }
    }

    /* ✅ 자동 동기화 기능 / 自動同期機能（5分ごとにチェック） */
    const toggleAutoSync = (enabled: boolean) => {
        if (enabled) {
            localStorage.setItem("sync:alarm:auto", "1");
            autoSyncRef.current = window.setInterval(() => handleDownload("auto"), 5 * 60 * 1000);
        } else {
            localStorage.removeItem("sync:alarm:auto");
            if (autoSyncRef.current) clearInterval(autoSyncRef.current);
        }
    };

    /* ✅ 학번 + 생년월일 저장 / 学籍番号＋生年月日保存 */
    async function handleSaveId() {
        const id = inputId.trim();
        const birthday = inputBirthday.trim();
        if (!/^\d+$/.test(id) || !/^\d{8}$/.test(birthday)) {
            setErrorMsg("⚠️ 学籍番号または生年月日の形式が正しくありません。（형식이 올바르지 않습니다）");
            return;
        }
        if (!(await validateStudentBirthday(id, birthday))) {
            setErrorMsg("❌ 生年月日が一致しません。（생년월일이 일치하지 않습니다）");
            return;
        }
        setStudentId(id);
        setStudentBirthday(birthday);
        setStudentIdState(id);
        await handleDownload();
    }

    /* ✅ 초기화 처리 / 初期化処理 */
    useEffect(() => {
        const id = getStudentId();
        setStudentIdState(id);
    }, []);

    /* ✅ Pull-to-Refresh / スワイプ更新 */
    const { isRefreshing } = usePullToRefresh({
        onRefresh: async () => {
            console.log("🔄 [スクロール更新] データを再取得します。（데이터 재조회）");
            await handleDownload("pull");
        },
    });

    /* =========================================================
       🖥️ 렌더링 / 表示レンダリング
       ========================================================= */
    return (
        <div className="space-y-4 p-4">
            <Welcome />
            {errorMsg && <div className="rounded bg-red-50 p-3 text-sm text-red-600">{errorMsg}</div>}

            {/* 🔹 학생 미등록 상태 / 学生未登録状態 */}
            {!studentId && (
                <div className="space-y-2">
                    <div className="font-semibold">学籍番号を入力してください（학번을 입력하세요）</div>
                    <input
                        className="rounded border px-2 py-1"
                        placeholder="例）50350"
                        value={inputId}
                        onChange={(e) => setInputId(e.target.value)}
                    />
                    <input
                        className="rounded border px-2 py-1"
                        placeholder="例）20061215"
                        value={inputBirthday}
                        onChange={(e) => setInputBirthday(e.target.value)}
                    />
                    <button className="rounded border px-3 py-1" onClick={handleSaveId}>
                        保存（저장）
                    </button>
                </div>
            )}

            {/* 🔹 학생 등록 후 화면 / 学生登録後の画面 */}
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
                        自動同期（5分ごと） / 자동 동기화 (5분마다)
                    </label>

                    <button className="rounded border px-3 py-2" onClick={() => handleDownload()}>
                        イベントデータ取得（이벤트 데이터 가져오기）
                    </button>

                    {/* ✅ 강제 에러 테스트 버튼 / 強制エラーテストボタン */}
                    <button
                        className="rounded border border-red-400 bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100"
                        onClick={async () => {
                            try {
                                await fetch("/api/nonexistent-endpoint");
                            } catch (err) {
                                if (err instanceof Error) {
                                    await reportServerError({
                                        errorType: "Manual Test Error",
                                        errorMessage: err.message,
                                    });
                                }
                            }
                        }}
                    >
                        🧪 強制エラーテスト（강제 에러 테스트）
                    </button>

                    <div className="text-xs opacity-70">
                        最終更新（마지막 갱신）:{" "}
                        {getLastUpdatedDisplay("ja-JP") ?? (lastRun ? new Date(lastRun).toLocaleString() : "—")}
                    </div>
                </div>
            )}

            {isRefreshing && (
                <div className="mt-2 text-center text-sm text-blue-600">🔄 データ更新中です…（데이터 갱신 중…）</div>
            )}
        </div>
    );
}
