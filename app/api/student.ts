// === 데이터 타입 정의 ===
// === データタイプ定義 ===
export type StudentRow = {
    f_student_id: string;
    f_student_num: string; // 학번 (学籍番号)
    f_class?: string | null;
    f_number?: string | null;
    f_name?: string | null;
    f_note?: string | null; // 読み仮名 (読み仮名)
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
import { getApiBaseUrl } from "~/utils/apiConfig";

export async function fetchByGakuseki(id: string | null): Promise<{ payload: ApiPayload; isFromCache: boolean }> {
    const API_BASE = getApiBaseUrl();

    if (id) {
        // 登録済み: アラーム情報エンドポイントを使用（集合場所・時間を含む完全なデータ）
        const alarmRes = await fetch(`${API_BASE}/entries/alarm/${id}`, {
            cache: "no-store",
        });

        if (!alarmRes.ok) {
            console.error(`[API] アラーム情報取得失敗: ${alarmRes.status}`);
            throw new Error(`アラーム情報の取得に失敗しました ${alarmRes.status}`);
        }

        const alarmEvents: any[] = await alarmRes.json();
        console.log(`[API] アラーム情報取得成功: ${alarmEvents.length}件のイベント`);

        // 学生情報を取得（生年月日認証用に保存されている場合）
        const { STORAGE_KEYS } = await import("~/constants/storage");
        const birthday = localStorage.getItem(STORAGE_KEYS.STUDENT_BIRTHDAY);

        let studentData: any = null;
        if (birthday) {
            const studentRes = await fetch(`${API_BASE}/students/by-student-num/${id}/birthday/${birthday}`, {
                cache: "no-store",
            });
            if (studentRes.ok) {
                studentData = await studentRes.json();
            }
        }

        // 全イベント一覧を取得
        const eventsRes = await fetch(`${API_BASE}/events?student_num=${id}`, {
            cache: "no-store"
        });
        
        if (!eventsRes.ok) {
            console.error(`[API] イベント情報取得失敗: ${eventsRes.status}`);
            throw new Error(`イベント情報の取得に失敗しました ${eventsRes.status}`);
        }

        const eventsData = await eventsRes.json();
        const allEvents: any[] = Array.isArray(eventsData?.events) ? eventsData.events : [];

        // 全イベントとアラーム情報をマージ
        const eventsWithMapping: EventRow[] = allEvents.map((ev: any) => {
            const eventId = String(ev.f_event_id ?? "");

            // アラーム情報から該当イベントを検索
            const alarmEvent = alarmEvents.find(e => String(e.f_event_id) === eventId);

            const startTime = ev.f_time ? String(ev.f_time) : ev.f_start_time ? String(ev.f_start_time) : null;

            if (alarmEvent) {
                // アラーム情報がある場合（参加イベント）、そのデータを使用
                console.log(`[アラーム] ${ev.f_event_name}: 集合時間 = ${alarmEvent.f_gather_time || 'なし'}, 場所 = ${alarmEvent.f_place || 'なし'}`);
                return {
                    f_event_id: eventId,
                    f_event_name: ev.f_event_name ?? alarmEvent.f_event_name ?? null,
                    f_start_time: alarmEvent.f_start_time ?? startTime,
                    f_duration: alarmEvent.f_duration ?? (ev.f_duration ? String(ev.f_duration) : null),
                    f_place: alarmEvent.f_place ?? ev.f_place ?? null,
                    f_gather_time: alarmEvent.f_gather_time ? String(alarmEvent.f_gather_time) : null,
                    f_summary: alarmEvent.f_summary ?? ev.f_summary ?? null,
                    f_is_my_entry: true,
                };
            } else {
                // 参加していないイベント
                return {
                    f_event_id: eventId,
                    f_event_name: ev.f_event_name ?? null,
                    f_start_time: startTime,
                    f_duration: ev.f_duration ? String(ev.f_duration) : null,
                    f_place: ev.f_place ?? null,
                    f_gather_time: ev.f_gather_time ? String(ev.f_gather_time) : null,
                    f_summary: ev.f_summary ?? null,
                    f_is_my_entry: false,
                };
            }
        });

        const student: StudentRow = studentData ? {
            f_student_id: String(studentData.f_student_id ?? ""),
            f_student_num: String(studentData.f_student_num ?? ""),
            f_class: studentData.f_class ?? null,
            f_number: studentData.f_number ?? null,
            f_name: studentData.f_name ?? null,
            f_note: studentData.f_note ?? null,
            f_birthday: studentData.f_birthday ?? null,
        } : {
            f_student_id: "",
            f_student_num: id,
            f_class: null,
            f_number: null,
            f_name: null,
            f_note: null,
            f_birthday: null,
        };

        return { payload: { m_students: student, t_events: eventsWithMapping }, isFromCache: false };
    } else {
        // 未登録: イベント一覧のみ
        // 未登録 사용자도 다운로드 로그 기록을 위해 student_num 파라미터 추가
        const res = await fetch(`${API_BASE}/events?student_num=`, { cache: "no-store" });

        if (!res.ok) {
            console.error(`[API] イベント情報取得失敗: ${res.status}`);
            throw new Error(`データ取得失敗 ${res.status}`);
        }

        const isFromCache = res.headers.get("X-Cache-Source") === "service-worker";
        if (isFromCache) {
            console.log("[API] キャッシュからデータを取得しました");
        }

        const data = await res.json();
        const eventsArray: EventRow[] = Array.isArray(data?.events) ? data.events : [];
        const student: StudentRow = {
            f_student_id: "",
            f_student_num: "",
            f_class: null,
            f_number: null,
            f_name: null,
            f_note: null,
            f_birthday: null,
        };

        const eventsWithMapping: EventRow[] = eventsArray.map((ev: any) => ({
            f_event_id: String(ev.f_event_id ?? ""),
            f_event_name: ev.f_event_name ?? null,
            f_start_time: ev.f_time ? String(ev.f_time) : ev.f_start_time ? String(ev.f_start_time) : null,
            f_duration: ev.f_duration ? String(ev.f_duration) : null,
            f_place: ev.f_place ?? null,
            f_gather_time: ev.f_gather_time ? String(ev.f_gather_time) : null,
            f_summary: ev.f_summary ?? null,
            f_is_my_entry: false, // 未登録なので全てfalse
        }));

        return { payload: { m_students: student, t_events: eventsWithMapping }, isFromCache };
    }
}
