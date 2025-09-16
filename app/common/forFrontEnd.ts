// app/common/forFrontEnd.ts
// Frontend 팀용: LocalStorage 데이터 접근/헬퍼

export type StudentRow = {
  f_student_id: string;
  f_class?: string | null;
  f_number?: string | null;
  f_name?: string | null;
};

export type EventRow = {
  f_event_id: string;
  f_event_name: string | null;
  f_start_time: string | null; // "HHmm"
  f_duration?: string | null;
  f_place?: string | null;
  f_gather_time?: string | null; // "HHmm"
  f_summary?: string | null;
};

const LS_KEY_ID = "student:id";
const LS_KEY_STUDENT = (id: string) => `student:master:${id}`;
const LS_KEY_EVENTS = (id: string) => `events:list:${id}`;
const LS_KEY_LAST_UPDATED = "student:payload:lastUpdated";

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}
function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function hhmmToMinutes(hhmm: string): number | null {
  if (!/^\d{4}$/.test(hhmm)) return null;
  const h = +hhmm.slice(0, 2),
    m = +hhmm.slice(2, 4);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}
function nowHHMM(): string {
  const d = new Date();
  return (
    String(d.getHours()).padStart(2, "0") +
    String(d.getMinutes()).padStart(2, "0")
  );
}

export function getStudentId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(LS_KEY_ID);
}
export function fetchStudent(id: string | null = getStudentId()) {
  if (!id) return null;
  return readJSON(LS_KEY_STUDENT(id), null as any);
}
export function fetchEvents(id: string | null = getStudentId()) {
  if (!id) return [];
  return readJSON(LS_KEY_EVENTS(id), [] as any[]);
}
export function getNextEvent(id: string | null = getStudentId()) {
  const events = fetchEvents(id);
  if (!events.length) return null;

  const nowMin = hhmmToMinutes(nowHHMM());
  if (nowMin == null) return null;

  const future = events
    .filter((e) => e?.f_start_time)
    .map((e) => ({ e, mins: hhmmToMinutes(e.f_start_time as string) }))
    .filter((x) => x.mins != null && x.mins >= nowMin)
    .sort((a, b) => a.mins! - b.mins!);

  return future[0]?.e ?? null;
}
export function getLastUpdatedDisplay(locale?: string): string | null {
  if (!isBrowser()) return null;
  const iso = localStorage.getItem(LS_KEY_LAST_UPDATED);
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return new Date(t).toLocaleString(locale);
}
