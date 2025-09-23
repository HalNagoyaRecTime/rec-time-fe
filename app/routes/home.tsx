// app/routes/home.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Welcome } from "../welcome/welcome";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { getLastUpdatedDisplay } from "../common/forFrontEnd";

export function meta() {
  return [
    { title: "Rectime PWA" },
    { name: "description", content: "学籍番号でデータ取得" },
  ];
}

type Status = "idle" | "no-id" | "loading" | "ok" | "error";

// ✅ 기본값을 /api로 강제
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  ""
);
const AUTO_MIN_INTERVAL_MS = 5 * 60 * 1000; // 5분

// ===== 최소 스키마 =====
type StudentRow = {
  f_student_id: string;
  f_class?: string | null;
  f_number?: string | null;
  f_name?: string | null;
};
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

// ===== localStorage 키 =====
const LS_KEY_ID = "student:id";
const LS_KEY_STUDENT = (id: string) => `student:master:${id}`;
const LS_KEY_EVENTS = (id: string) => `events:list:${id}`;
const LS_KEY_LAST = "student:payload:last";
const LS_KEY_LAST_UPDATED = "student:payload:lastUpdated";

function getStudentId(): string | null {
  return localStorage.getItem(LS_KEY_ID);
}
function setStudentId(id: string) {
  localStorage.setItem(LS_KEY_ID, id);
}

// ===== 매핑 =====
function mapStudentToFE(raw: any): StudentRow {
  return {
    f_student_id: String(raw.f_student_id ?? raw.id ?? ""),
    f_class: raw.f_class ?? null,
    f_number: raw.f_number ?? null,
    f_name: raw.f_name ?? null,
  };
}

function mapEventToFE(raw: any): EventRow {
  return {
    f_event_id: String(raw.f_event_id ?? raw.id ?? ""),
    f_event_name: raw.f_event_name ?? raw.title ?? null,
    f_start_time: typeof raw.f_time === "string" ? raw.f_time : null,
    f_duration: raw.f_duration ? String(raw.f_duration) : null,
    f_place: raw.f_place ?? null,
    f_gather_time:
      typeof raw.f_gather_time === "string" ? raw.f_gather_time : null,
    f_summary: raw.f_summary ?? null,
    f_is_my_entry: Boolean(raw.f_is_my_entry ?? false),
  };
}

// ===== API 호출 =====
async function fetchByGakuseki(id: string): Promise<Payload> {
  const sRes = await fetch(
    `${API_BASE}/v1/students/${encodeURIComponent(id)}`,
    {
      credentials: "include",
    }
  );
  if (!sRes.ok) throw new Error(`students ${sRes.status}`);
  const sJson = await sRes.json();

  const eRes = await fetch(`${API_BASE}/v1/events`, { credentials: "include" });
  if (!eRes.ok) throw new Error(`events ${eRes.status}`);
  const eJson = await eRes.json();

  const eListRaw = Array.isArray(eJson?.events)
    ? eJson.events
    : Array.isArray(eJson)
      ? eJson
      : Array.isArray(eJson?.data)
        ? eJson.data
        : [];

  const m_students = mapStudentToFE(
    Array.isArray(sJson) ? (sJson[0] ?? {}) : sJson
  );
  const t_events = eListRaw.map(mapEventToFE);

  const payload: Payload = { m_students, t_events };
  if (!isValidPayload(payload)) throw new Error("invalid combined payload");
  return payload;
}

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [inputId, setInputId] = useState("");
  const studentId = useMemo(() => getStudentId(), [status]);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRun, setLastRun] = useState<number | null>(null);
  const [backoff, setBackoff] = useState(0);
  const runningRef = useRef(false);

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

  async function handleDownload(): Promise<boolean> {
    const id = getStudentId();
    if (!id) {
      setStatus("no-id");
      return false;
    }
    setStatus("loading");
    try {
      const payload = await fetchByGakuseki(id);

      const now = new Date();
      const iso = now.toISOString();

      localStorage.setItem(
        LS_KEY_STUDENT(id),
        JSON.stringify(payload.m_students)
      );
      localStorage.setItem(LS_KEY_EVENTS(id), JSON.stringify(payload.t_events));

      const payloadWithMeta = { ...payload, _downloadedAt: iso };
      localStorage.setItem(LS_KEY_LAST, JSON.stringify(payloadWithMeta));
      localStorage.setItem(LS_KEY_LAST_UPDATED, iso);

      setStatus("ok");
      setLastRun(now.getTime());
      return true;
    } catch (e) {
      console.error(e);
      setStatus("error");
      return false;
    }
  }

  async function handleDownloadSafe() {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      const ok = await handleDownload();
      if (ok) setBackoff(0);
      else
        setBackoff((prev) =>
          Math.min(prev ? prev * 2 : AUTO_MIN_INTERVAL_MS, 30 * 60 * 1000)
        );
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
  }, [autoRefresh, lastRun, backoff]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => {
      if (canAutoRefreshNow()) void handleDownloadSafe();
    }, 60 * 1000);
    return () => clearInterval(t);
  }, [autoRefresh, lastRun, backoff]);

  const { pullDistance, isRefreshing } = usePullToRefresh({
    threshold: 60,
    onRefresh: handleDownloadSafe,
  });

  return (
    <div className="p-4 space-y-4">
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

      {!studentId && (
        <div className="space-y-2">
          <div className="font-semibold">
            学籍番号を入力してください (※ 今銀PK値使用)
          </div>
          <input
            className="border rounded px-2 py-1"
            placeholder='例）"1"'
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
          />
          <button className="border rounded px-3 py-1" onClick={handleSaveId}>
            保存
          </button>
        </div>
      )}

      {studentId && (
        <div className="space-y-3">
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

          <div className="text-xs opacity-70">
            最終更新:{" "}
            {getLastUpdatedDisplay("ja-JP") ??
              (lastRun ? new Date(lastRun).toLocaleString() : "—")}
            {backoff ? ` / リトライ待ち: ${Math.round(backoff / 60000)}分` : ""}
          </div>
        </div>
      )}

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
