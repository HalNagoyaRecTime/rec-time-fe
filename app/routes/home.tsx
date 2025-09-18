// app/routes/home.tsx (상단 import 부분만 교체)
import { useEffect, useMemo, useRef, useState } from "react";
import { Welcome } from "../welcome/welcome";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

// 함수(값)는 일반 import
import { getNextMyEvent, getLastUpdatedDisplay } from "../common/forFrontEnd";
// 타입은 type 전용 import
import type { EventRow as FEEventRow } from "../common/forFrontEnd";

export function meta() {
  return [
    { title: "Rectime PWA" },
    { name: "description", content: "学籍番号でデータ取得" },
  ];
}

type Status = "idle" | "no-id" | "loading" | "ok" | "error";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const AUTO_MIN_INTERVAL_MS = 5 * 60 * 1000; // 5분

// 최소 스키마
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

// localStorage 키
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

// API / mock 폴백
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

  // 자동 새로고침 상태
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRun, setLastRun] = useState<number | null>(null); // 최근 성공 시각
  const [backoff, setBackoff] = useState(0);
  const runningRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // “다음 경기” 표시용 상태 (공통 타입 사용)
  const [nextEvent, setNextEvent] = useState<FEEventRow | null>(null);

  // 앱 로드시 마지막 다운로드 시각 불러오기
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

  // 학번/상태가 바뀌거나 다운로드 성공 후 → 다음 경기 재계산
  useEffect(() => {
    if (studentId) {
      setNextEvent(getNextMyEvent(studentId));
    } else {
      setNextEvent(null);
    }
  }, [studentId, status, lastRun]);

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
    console.log("[ refresh 실행됨 ]");

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

      // 로컬 저장
      localStorage.setItem(
        LS_KEY_STUDENT(id),
        JSON.stringify(payload.m_students)
      );
      localStorage.setItem(LS_KEY_EVENTS(id), JSON.stringify(payload.t_events));

      const payloadWithMeta = { ...payload, _downloadedAt: iso };
      localStorage.setItem(LS_KEY_LAST, JSON.stringify(payloadWithMeta));
      localStorage.setItem(LS_KEY_LAST_UPDATED, iso);

      // (옵션) SW 로그
      const msg = { type: "LOG_JSON", payload: { id, ...payloadWithMeta } };
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage(msg);
      } else {
        navigator.serviceWorker?.ready.then((reg) =>
          reg.active?.postMessage(msg)
        );
      }

      setStatus("ok");
      setLastRun(now.getTime());
      setNextEvent(getNextMyEvent(id)); // 최신 이벤트 갱신
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

      {/* 학번 저장 */}
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

      {/* 서버에서 다운로드 + 자동 업데이트 */}
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

          {/* 다음 경기 카드 */}
          {nextEvent && (
            <div className="mt-2 p-3 border rounded bg-gray-50 dark:bg-gray-900 text-sm">
              <div className="font-semibold mb-1">次の競技</div>
              <div>競技名：{nextEvent.f_event_name ?? "—"}</div>
              <div>開始時刻：{nextEvent.f_start_time ?? "—"}</div>
              {nextEvent.f_place && <div>場所：{nextEvent.f_place}</div>}
            </div>
          )}

          {/* 마지막 업데이트 시각 */}
          <div className="text-xs opacity-70">
            最終更新:{" "}
            {getLastUpdatedDisplay("ja-JP") ??
              (lastRun ? new Date(lastRun).toLocaleString() : "—")}
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
