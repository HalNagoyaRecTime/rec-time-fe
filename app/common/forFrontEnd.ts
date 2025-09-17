// app/common/forFrontEnd.ts
// Frontend 팀용: LocalStorage 데이터 접근/헬퍼 (1~6 전부 지원)

//// 타입 정의
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

  // 출전 정보 (팀 규칙에 따라 둘 중 하나 사용)
  f_is_my_entry?: boolean; // A) 내가 출전하는지 여부
  f_entries?: string[] | null; // B) 출전 학번 목록
};

// ⑤ 알림 기록
export type NotifRow = {
  notif_id: string;
  event_id?: string | null;
  kind: "remind-5min" | "info" | "system";
  at_iso: string; // ISO 시각
  status: "queued" | "sent" | "clicked" | "dismissed" | "error";
  meta?: any;
};

// ⑥ 변경 기록
export type UpdateRow = {
  update_id: string;
  event_id?: string | null;
  field: string; // 변경된 필드명 (예: "f_start_time")
  old_value: any;
  new_value: any;
  at_iso: string; // ISO 시각
  source?: "server" | "admin" | "client";
};

//// 저장 키
const LS_KEY_ID = "student:id";
const LS_KEY_STUDENT = (id: string) => `student:master:${id}`;
const LS_KEY_EVENTS = (id: string) => `events:list:${id}`;
const LS_KEY_LAST_UPDATED = "student:payload:lastUpdated";
const LS_KEY_NOTIFS = (id: string) => `notifs:list:${id}`;
const LS_KEY_UPDATES = (id: string) => `updates:list:${id}`;

//// 내부 유틸
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

//// ① 학생 정보
export function getStudentId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(LS_KEY_ID);
}
export function fetchStudent(
  id: string | null = getStudentId()
): StudentRow | null {
  if (!id) return null;
  return readJSON<StudentRow>(LS_KEY_STUDENT(id), null as any);
}

//// ② 이벤트 정보 (+출전 여부)
export function fetchEvents(id: string | null = getStudentId()): EventRow[] {
  if (!id) return [];
  return readJSON<EventRow[]>(LS_KEY_EVENTS(id), []);
}
/** 내가 출전하는 경기인지 확인 */
export function isMyEntry(
  ev: EventRow,
  studentId: string | null = getStudentId()
): boolean {
  if (!studentId) return false;
  if (typeof ev.f_is_my_entry === "boolean") return ev.f_is_my_entry;
  if (Array.isArray(ev.f_entries)) return ev.f_entries.includes(studentId);
  return false;
}
/** 출전 여부에 따른 색상 클래스 (예시) */
export function getEventColorClass(
  ev: EventRow,
  studentId: string | null = getStudentId()
): string {
  return isMyEntry(ev, studentId)
    ? "bg-amber-100 dark:bg-amber-900/40 border-amber-300"
    : "bg-gray-50 dark:bg-gray-900 border-gray-300";
}
/** 내가 출전하는 이벤트 목록 */
export function fetchMyEvents(id: string | null = getStudentId()): EventRow[] {
  return fetchEvents(id).filter((ev) => isMyEntry(ev, id));
}

//// ③ 최종 업데이트 시각
export function getLastUpdatedDisplay(locale?: string): string | null {
  if (!isBrowser()) return null;
  const iso = localStorage.getItem(LS_KEY_LAST_UPDATED);
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return new Date(t).toLocaleString(locale);
}

//// ④ 직후 출전 이벤트
export function getNextMyEvent(
  id: string | null = getStudentId()
): EventRow | null {
  const events = fetchEvents(id);
  if (!events.length) return null;

  const nowMin = hhmmToMinutes(nowHHMM());
  if (nowMin == null) return null;

  const futureMine = events
    .filter((ev) => isMyEntry(ev, id))
    .filter((ev) => ev.f_start_time)
    .map((ev) => ({ ev, mins: hhmmToMinutes(ev.f_start_time as string) }))
    .filter((x) => x.mins != null && x.mins >= nowMin)
    .sort((a, b) => a.mins! - b.mins!);

  return futureMine[0]?.ev ?? null;
}

//// ⑤ 알림 기록 (아직 저장은 안 함, 읽기만 가능)
export function fetchNotifHistory(
  id: string | null = getStudentId()
): NotifRow[] {
  if (!id) return [];
  return readJSON<NotifRow[]>(LS_KEY_NOTIFS(id), []);
}

//// ⑥ 변경 기록 (아직 저장은 안 함, 읽기만 가능)
export function fetchUpdateHistory(
  id: string | null = getStudentId()
): UpdateRow[] {
  if (!id) return [];
  return readJSON<UpdateRow[]>(LS_KEY_UPDATES(id), []);
}
