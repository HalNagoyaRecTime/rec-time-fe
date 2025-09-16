// app/routes/home.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Welcome } from "../welcome/welcome";
import { usePullToRefresh } from "../hooks/usePullToRefresh"; // ⬅ スワイプ

export function meta() {
  return [
    { title: "Rectime PWA" },
    { name: "description", content: "学籍番号でデータ取得" },
  ];
}

type Status = "idle" | "no-id" | "loading" | "ok" | "error";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const AUTO_MIN_INTERVAL_MS = 5 * 60 * 1000; // 5분

// 最小スキーマ
type StudentRow = {
  f_student_id: string;
  f_class?: string | null;
  f_number?: string | null;
  f_name?: string | null;
};
type EventRow = {
  f_event_id: string;
  f_event_name: string | null;
  f_start_time: string | null; // "HHmm"
  f_duration: string | null;
  f_place: string | null;
  f_gather_time: string | null; // "HHmm"
  f_summary: string | null;
};
type Payload = { m_students: StudentRow; t_events: EventRow[] };

const HHMM = /^([01]\d|2[0-3])[0-5]\d$/;
function isValidPayload(x: any): x is Payload {
  return (
    x &&
    typeof x === "object" &&
    x.m_students &&
    typeof x.m_students.f_student_id === "string" &&
    Array.isArray(x.t_events) &&
    x.t_events.every(
      (ev: any) =>
        typeof ev.f_event_id === "string" &&
        (ev.f_start_time === null ||
          (typeof ev.f_start_time === "string" &&
            HHMM.test(ev.f_start_time))) &&
        (ev.f_gather_time === null ||
          (typeof ev.f_gather_time === "string" && HHMM.test(ev.f_gather_time)))
    )
  );
}

// localStorage キー
const LS_KEY_ID = "student:id";
const LS_KEY_STUDENT = (id: string) => `student:master:${id}`;
const LS_KEY_EVENTS = (id: string) => `events:list:${id}`;
const LS_KEY_LAST = "student:payload:last"; // 전체 JSON
const LS_KEY_LAST_UPDATED = "student:payload:lastUpdated"; // ISO 시각만 저장

function getStudentId(): string | null {
  return localStorage.getItem(LS_KEY_ID);
}
function setStudentId(id: string) {
  localStorage.setItem(LS_KEY_ID, id);
}

// API / mock フォールバック
async function fetchByGakuseki(id: string): Promise<Payload> {
  const url = `${API_BASE}/download?gakusekino=${encodeURIComponent(id)}`;
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    if (!isValidPayload(data)) throw new Error("invalid payload");
    return data;
  } catch {
    const mock = await fetch("/mock.json");
    if (!mock.ok) throw new Error(`mock ${mock.status}`);
    const data = await mock.json();
    if (!isValidPayload(data)) throw new Error("invalid mock payload");
    return data;
  }
}

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [inputId, setInputId] = useState("");
  const studentId = useMemo(() => getStudentId(), [status]);

  // 🔁 자동 새로고침 상태
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRun, setLastRun] = useState<number | null>(null); // 최근 성공 시각(메모리)
  const [backoff, setBackoff] = useState(0);
  const runningRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // 앱 로드시, 저장돼 있던 "마지막 다운로드 시각"을 불러와서 표시
  useEffect(() => {
    const iso = localStorage.getItem(LS_KEY_LAST_UPDATED);
    if (iso) {
      const t = Date.parse(iso);
      if (!Number.isNaN(t)) setLastRun(t);
    }
  }, []);

  useEffect(() => {
    setStatus(studentId ? "idle" : "no-id");
  }, [studentId]);

  async function handleSaveId() {
    const id = inputId.trim();
    if (!/^\d+$/.test(id)) {
      alert("学籍番号（数字）を入力してください");
      return;
    }
    setStudentId(id);
    setStatus("idle");
  }

  // 성공/실패 boolean 반환
  async function handleDownload(): Promise<boolean> {
    console.log("[ refresh 실행됨 ]");

    const id = getStudentId();
    if (!id) {
      setStatus("no-id");
      return false;
    }
    setStatus("loading");
    try {
      const payload = await fetchByGakuseki(id);

      // 다운로드 시각
      const now = new Date();
      const iso = now.toISOString();

      // ローカル保存（학생/이벤트)
      localStorage.setItem(
        LS_KEY_STUDENT(id),
        JSON.stringify(payload.m_students)
      );
      localStorage.setItem(LS_KEY_EVENTS(id), JSON.stringify(payload.t_events));

      // 전체 JSON에도 시각을 함께 저장 (_downloadedAt 필드 추가)
      const payloadWithMeta = { ...payload, _downloadedAt: iso };
      localStorage.setItem(LS_KEY_LAST, JSON.stringify(payloadWithMeta));

      // 시각만 별도 키에도 저장 (ガントチャート 2番)
      localStorage.setItem(LS_KEY_LAST_UPDATED, iso);

      // (任意) SW에 로그
      const msg = { type: "LOG_JSON", payload: { id, ...payloadWithMeta } };
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage(msg);
      } else {
        navigator.serviceWorker?.ready.then((reg) =>
          reg.active?.postMessage(msg)
        );
      }

      setStatus("ok");
      // 화면 표시용(메모리) 갱신
      setLastRun(now.getTime());
      return true;
    } catch (e) {
      console.error(e);
      setStatus("error");
      return false;
    }
  }

  // 안전 래퍼
  async function handleDownloadSafe() {
    if (runningRef.current) return;
    runningRef.current = true;
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const ok = await handleDownload();
      if (ok) {
        setBackoff(0);
      } else {
        setBackoff((prev) =>
          Math.min(prev ? prev * 2 : AUTO_MIN_INTERVAL_MS, 30 * 60 * 1000)
        );
      }
    } finally {
      runningRef.current = false;
    }
  }

  function canAutoRefreshNow() {
    if (document.visibilityState !== "visible") return false;
    const et = (navigator as any).connection?.effectiveType as
      | string
      | undefined;
    if (et && (et.includes("2g") || et === "slow-2g")) return false;
    const interval = Math.max(AUTO_MIN_INTERVAL_MS, backoff || 0);
    if (lastRun && Date.now() - lastRun < interval) return false;
    if (!getStudentId()) return false;
    return true;
  }

  useEffect(() => {
    const onVis = () => {
      if (autoRefresh && canAutoRefreshNow()) void handleDownloadSafe();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, lastRun, backoff]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => {
      if (canAutoRefreshNow()) void handleDownloadSafe();
    }, 60 * 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, lastRun, backoff]);

  // 스와이프(풀다운)으로 실행
  const { pullDistance, isRefreshing } = usePullToRefresh({
    threshold: 60,
    onRefresh: handleDownloadSafe,
  });

  return (
    <div className="p-4 space-y-4">
      {/* 풀다운 인디케이터 */}
      <div aria-hidden style={{ height: pullDistance }} />
      {(pullDistance > 0 || isRefreshing) && (
        <div className="text-center text-xs opacity-80 -mt-2">
          {isRefreshing
            ? "読み込み中..."
            : pullDistance >= 60
              ? "離すと更新"
              : "下にスワイプで更新"}
        </div>
      )}

      <Welcome />

      {/* 1. 学籍番号 保存 */}
      {!studentId && (
        <div className="space-y-2">
          <div className="font-semibold">学籍番号を入力してください</div>
          <input
            className="border rounded px-2 py-1"
            placeholder='例）"50416"'
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
          />
          <button className="border rounded px-3 py-1" onClick={handleSaveId}>
            保存
          </button>
        </div>
      )}

      {/* 2. サーバーからダウンロード + 自動更新 */}
      {studentId && (
        <div className="space-y-2">
          <div>
            学籍番号: <b>{studentId}</b>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button
              className="border rounded px-3 py-1"
              onClick={handleDownloadSafe}
              disabled={status === "loading"}
            >
              {status === "loading"
                ? "ダウンロード中…"
                : "サーバーからダウンロード"}
            </button>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              自動更新（5分間隔 / 低速回線や非表示時は停止）
            </label>
          </div>

          {/* 저장된 시각 표시 (앱 재시작 후에도 유지) */}
          <div className="text-xs opacity-70">
            最終更新: {lastRun ? new Date(lastRun).toLocaleString() : "—"}
            {backoff ? ` / リトライ待ち: ${Math.round(backoff / 60000)}分` : ""}
          </div>
        </div>
      )}

      {/* 상태 메시지 */}
      <p className="mt-2">
        {status === "no-id" && "学籍番号が未設定です。入力してください。"}
        {status === "idle" && "準備OK"}
        {status === "loading" && "ダウンロード中…"}
        {status === "ok" &&
          "保存OK（student:master/<id>・events:list/<id>・payload(+_downloadedAt)）"}
        {status === "error" && "取得に失敗しました。"}
      </p>
    </div>
  );
}
