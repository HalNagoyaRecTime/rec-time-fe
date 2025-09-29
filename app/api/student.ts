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

// ✅ 데이터가 없어서 대체하는 mock.json 버전
// === API呼び出し ===
export async function fetchByGakuseki(id: string): Promise<{ payload: ApiPayload; isFromCache: boolean }> {
    const res = await fetch("/mock.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Mock データ読み込み失敗");

    const isFromCache = res.headers.get("X-Cache-Source") === "service-worker";
    if (isFromCache) {
        console.log("[API] キャッシュからデータを取得しました");
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
