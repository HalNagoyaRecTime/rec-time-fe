// === 데이터 타입 정의 ===
// === データタイプ定義 ===
export type StudentRow = {
    f_student_id: string;
    f_student_num: string; // 학번 (学籍番号)
    f_class?: string | null;
    f_number?: string | null;
    f_name?: string | null;
    f_birthday?: string | null; // 誕生日 (YYYY-MM-DD)
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

// === API呼び出し（データベース対応） ===
export async function fetchByGakuseki(id: string | null): Promise<{ payload: ApiPayload; isFromCache: boolean }> {
    const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

    let res: Response;

    if (id) {
        // 登録済み: 学生情報 + イベント + 出場フラグ
        res = await fetch(`${API_BASE}/students/payload/${id}`, { cache: "no-store" });
    } else {
        // 未登録: イベント一覧のみ
        res = await fetch(`${API_BASE}/events`, { cache: "no-store" });
    }

    if (!res.ok) throw new Error(`データ取得失敗 ${res.status}`);

    const isFromCache = res.headers.get("X-Cache-Source") === "service-worker";
    if (isFromCache) {
        console.log("[API] キャッシュからデータを取得しました");
    }

    const data = await res.json();

    if (id) {
        // 登録済みユーザー: /students/payload/:studentNum のレスポンス
        const events: EventRow[] = Array.isArray(data?.t_events) ? data.t_events : [];
        const sJson = data?.m_students ?? {};
        const student: StudentRow = {
            f_student_id: String(sJson?.f_student_id ?? ""),
            f_student_num: String(sJson?.f_student_num ?? ""),
            f_class: sJson?.f_class ?? null,
            f_number: sJson?.f_number ?? null,
            f_name: sJson?.f_name ?? null,
            f_birthday: sJson?.f_birthday ?? null,
        };

        const eventsWithMapping: EventRow[] = events.map((ev: any) => ({
            f_event_id: String(ev.f_event_id ?? ""),
            f_event_name: ev.f_event_name ?? null,
            // バックエンド形式 f_time → フロントエンド f_start_time にマッピング
            f_start_time: ev.f_time ? String(ev.f_time) : (ev.f_start_time ? String(ev.f_start_time) : null),
            f_duration: ev.f_duration ? String(ev.f_duration) : null,
            f_place: ev.f_place ?? null,
            f_gather_time: ev.f_gather_time ? String(ev.f_gather_time) : null,
            f_summary: ev.f_summary ?? null,
            f_is_my_entry: Boolean(ev.f_is_my_entry ?? false),
        }));

        return { payload: { m_students: student, t_events: eventsWithMapping }, isFromCache };
    } else {
        // 未登録ユーザー: /events のレスポンス
        const eventsArray: EventRow[] = Array.isArray(data?.events) ? data.events : [];
        const student: StudentRow = {
            f_student_id: "",
            f_student_num: "",
            f_class: null,
            f_number: null,
            f_name: null,
            f_birthday: null,
        };

        const eventsWithMapping: EventRow[] = eventsArray.map((ev: any) => ({
            f_event_id: String(ev.f_event_id ?? ""),
            f_event_name: ev.f_event_name ?? null,
            f_start_time: ev.f_time ? String(ev.f_time) : (ev.f_start_time ? String(ev.f_start_time) : null),
            f_duration: ev.f_duration ? String(ev.f_duration) : null,
            f_place: ev.f_place ?? null,
            f_gather_time: ev.f_gather_time ? String(ev.f_gather_time) : null,
            f_summary: ev.f_summary ?? null,
            f_is_my_entry: false,  // 未登録なので全てfalse
        }));

        return { payload: { m_students: student, t_events: eventsWithMapping }, isFromCache };
    }
}
