import { useEffect, useMemo, useRef, useState } from "react";
import { Welcome } from "../welcome/welcome";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { getLastUpdatedDisplay } from "../common/forFrontEnd";

type Status = "idle" | "no-id" | "loading" | "ok" | "error";
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  ""
);
const AUTO_MIN_INTERVAL_MS = 5 * 60 * 1000;

// === 데이터 타입 정의 ===
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
  f_gather_time: string | null; // ✅ 알람 기준
  f_summary: string | null;
  f_is_my_entry?: boolean;
};
type Payload = { m_students: StudentRow; t_events: EventRow[] };

// === 저장 키 ===
const LS_KEY_ID = "student:id";
const LS_KEY_EVENTS = (id: string) => `events:list:${id}`;
const LS_KEY_LAST_UPDATED = "student:payload:lastUpdated";

function getStudentId(): string | null {
  return localStorage.getItem(LS_KEY_ID);
}
function setStudentId(id: string) {
  localStorage.setItem(LS_KEY_ID, id);
}

// === 파싱 함수: "0930" → Date ===
function parseHHMM(hhmm: string): Date | null {
  const match = hhmm.match(/^(\d{2})(\d{2})$/);
  if (!match) return null;
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    parseInt(match[1], 10),
    parseInt(match[2], 10),
    0
  );
}

// === 알림 권한 요청 ===
function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

// === 알림 표시 ===
function showEventNotification(event: EventRow) {
  if (Notification.permission !== "granted") return;
  const title = `イベント通知: ${event.f_event_name ?? "イベント"}`;
  const body = `${event.f_place ?? "場所未定"}で間もなく始まります`;
  new Notification(title, { body });
}

// === 알림 예약 ===
function scheduleNotification(event: EventRow) {
  if (!event.f_gather_time) return;
  const time = parseHHMM(event.f_gather_time);
  if (!time) return;

  const now = Date.now();
  const diff = time.getTime() - now;

  if (diff > 0) {
    setTimeout(() => showEventNotification(event), diff);
    console.log(
      `[予約] ${event.f_event_name} → ${event.f_gather_time} に通知予定`
    );
  }
}

// === API 호출 === (데이터 완성되면 이걸로 바꾸기)
// async function fetchByGakuseki(id: string): Promise<Payload> {
//   // mock.json에서 통합 데이터 로드
//   const res = await fetch(`/mock.json`, { cache: "no-store" });
//   if (!res.ok) throw new Error(`mock.json ${res.status}`);
//   const data = await res.json();

//   const events: EventRow[] = Array.isArray(data?.t_events) ? data.t_events : [];
//   const sJson = data?.m_students ?? {};
// const student: StudentRow = {
//   f_student_id: sJson?.f_student_id ?? "",
//   f_class: sJson?.f_class ?? null,
//   f_number: sJson?.f_number ?? null,
//   f_name: sJson?.f_name ?? null,
// };
//   return { m_students: student, t_events: events };
// }

// ✅ 데이터가 없어서 대체하는 mock.json 버전
async function fetchByGakuseki(id: string): Promise<{payload: Payload, isFromCache: boolean}> {
  const res = await fetch("/mock.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Mock データ読み込み失敗");

  const isFromCache = res.headers.get('X-Cache-Source') === 'service-worker';
  if (isFromCache) {
    console.log("[App] キャッシュからデータを取得しました");
  }

  const data = await res.json();

  const student: StudentRow = {
    f_student_id: data?.m_students?.f_student_id ?? "",
    f_class: data?.m_students?.f_class ?? null,
    f_number: data?.m_students?.f_number ?? null,
    f_name: data?.m_students?.f_name ?? null,
  };

  const events: EventRow[] = Array.isArray(data?.t_events)
    ? data.t_events.map((ev: any) => ({
        f_event_id: String(ev.f_event_id ?? ""),
        f_event_name: ev.f_event_name ?? null,
        f_start_time:
          typeof ev.f_start_time === "string" ? ev.f_start_time : null,
        f_duration: ev.f_duration ? String(ev.f_duration) : null,
        f_place: ev.f_place ?? null,
        f_gather_time:
          typeof ev.f_gather_time === "string" ? ev.f_gather_time : null,
        f_summary: ev.f_summary ?? null,
        f_is_my_entry: Boolean(ev.f_is_my_entry ?? false),
      }))
    : [];

  // ✅ 테스트용: 5초 후 첫 알림 확인
  if (events.length > 0) {
    setTimeout(() => {
      showEventNotification(events[0]);
    }, 5000);
  }

  return { payload: { m_students: student, t_events: events }, isFromCache };
}

// ↑ 여기까지가 mock.json 버전

export function meta() {
  return [
    { title: "Rectime PWA" },
    { name: "description", content: "学籍番号でデータ取得" },
  ];
}

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [inputId, setInputId] = useState("");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRun, setLastRun] = useState<number | null>(null);
  const [backoff, setBackoff] = useState(0);
  const runningRef = useRef(false);

  const studentId = useMemo(() => getStudentId(), [status]);

  // === 초기 알림 권한 요청 ===
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // === 저장된 시간 표시용 ===
  useEffect(() => {
    const iso = localStorage.getItem(LS_KEY_LAST_UPDATED);
    if (iso) {
      const t = Date.parse(iso);
      if (!Number.isNaN(t)) setLastRun(t);
    }
  }, []);

  // === 학번 존재 여부 ===
  useEffect(() => {
    setStatus(studentId ? "idle" : "no-id");
  }, [studentId]);

  // === 학번 저장 ===
  function handleSaveId() {
    const id = inputId.trim();
    if (!/^\d+$/.test(id)) {
      alert("学籍番号（数字）を入力してください");
      return;
    }
    setStudentId(id);
    setStatus("idle");
  }

  // === 알림 예약 ===
  function scheduleAll(events: EventRow[]) {
    events.forEach(scheduleNotification);
  }

  // === 다운로드 및 예약 ===
  async function handleDownload(): Promise<boolean> {
    const id = getStudentId();
    if (!id) {
      setStatus("no-id");
      return false;
    }
    setStatus("loading");
    try {
      const result = await fetchByGakuseki(id);
      const payload = result.payload;
      const isFromCache = result.isFromCache;

      localStorage.setItem(LS_KEY_EVENTS(id), JSON.stringify(payload.t_events));

      // オンライン取得時のみ最終更新時間を更新
      if (!isFromCache) {
        const now = new Date();
        const iso = now.toISOString();
        localStorage.setItem(LS_KEY_LAST_UPDATED, iso);
        setLastRun(now.getTime());
      }

      setEvents(payload.t_events);
      scheduleAll(payload.t_events);

      // キャッシュ取得時は異なるステータスを設定
      setStatus(isFromCache ? "error" : "ok");
      return true;
    } catch (e) {
      console.error(e);
      setStatus("error");
      return false;
    }
  }

  // === pull-to-refresh 훅 ===
  const { pullDistance, isRefreshing } = usePullToRefresh({
    threshold: 60,
    onRefresh: async () => {
      await handleDownload();
    },
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
          <div className="font-semibold">学籍番号を入力してください</div>
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

          <button
            className="border rounded px-3 py-2"
            onClick={handleDownload}
            disabled={status === "loading"}
          >
            {status === "loading"
              ? "ダウンロード中…"
              : "イベントデータ取得 & 通知予約"}
          </button>

          <div className="text-xs opacity-70">
            最終更新:{" "}
            {getLastUpdatedDisplay("ja-JP") ??
              (lastRun ? new Date(lastRun).toLocaleString() : "—")}
          </div>
        </div>
      )}

      <p className="mt-2">
        {status === "no-id" && "学籍番号が未設定です。入力してください。"}
        {status === "idle" && "準備OK"}
        {status === "loading" && "ダウンロード中…"}
        {status === "ok" && "保存OK・通知予約完了"}
        {status === "error" && "取得に失敗しました。"}
      </p>
    </div>
  );
}
