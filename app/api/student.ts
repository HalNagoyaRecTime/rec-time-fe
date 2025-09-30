// === 데이터 타입 정의 ===
// === データタイプ定義 ===
export type StudentRow = {
    f_student_id: string;
    f_class?: string | null;
    f_number?: string | null;
    f_name?: string | null;
};

export type EventRow = {
    f_event_id: string;
    f_event_name: string | null;
    f_start_time: string | null;
    f_duration: string | null;
    f_place: string | null;
    f_gather_time: string | null;
    f_summary: string | null;
    f_is_my_entry?: boolean;
};

export type ApiPayload = { m_students: StudentRow; t_events: EventRow[] };

// ✅ 실제 백엔드에서 학생 데이터 호출
export async function fetchByGakuseki(id: string): Promise<{ payload: ApiPayload; isFromCache: boolean }> {
    // 환경 변수에서 API URL 가져오기
    const baseUrl = import.meta.env.VITE_API_URL ?? "";
    // ✅ 백엔드 라우트에 맞게 수정
    const url = `${baseUrl}/students/by-student-num/${id}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
        throw new Error(`API 호출 실패: ${res.status} ${res.statusText}`);
    }

    const isFromCache = res.headers.get("X-Cache-Source") === "service-worker";

    const data = await res.json();

    // 학생 정보 파싱
    const student: StudentRow = {
        f_student_id: data?.m_students?.f_student_id ?? "",
        f_class: data?.m_students?.f_class ?? null,
        f_number: data?.m_students?.f_number ?? null,
        f_name: data?.m_students?.f_name ?? null,
    };

    // 이벤트 정보 파싱
    const events: EventRow[] = Array.isArray(data?.t_events)
        ? data.t_events.map((ev: any) => ({
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

    return { payload: { m_students: student, t_events: events }, isFromCache };
}
