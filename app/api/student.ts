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
        // 登録済み: localStorageから学生情報を取得し、学籍番号+生年月日で認証
        const { STORAGE_KEYS } = await import("~/constants/storage");
        const birthday = localStorage.getItem(STORAGE_KEYS.STUDENT_BIRTHDAY);
        if (!birthday) {
            throw new Error("生年月日が保存されていません。再度ログインしてください。");
        }

        // 学籍番号+生年月日で学生情報を取得
        const studentRes = await fetch(`${API_BASE}/students/by-student-num/${id}/birthday/${birthday}`, {
            cache: "no-store",
        });

        if (!studentRes.ok) {
            console.error(`[API] 学生情報取得失敗: ${studentRes.status}`);
            throw new Error(`学生情報の取得に失敗しました ${studentRes.status}`);
        }

        const studentData = await studentRes.json();

        // 全イベント一覧を取得
        const eventsRes = await fetch(`${API_BASE}/events?student_num=${id}`, { 
            cache: "no-store" 
        });
        
        if (!eventsRes.ok) {
            console.error(`[API] イベント情報取得失敗: ${eventsRes.status}`);
            throw new Error(`イベント情報の取得に失敗しました ${eventsRes.status}`);
        }

        const eventsData = await eventsRes.json();
        const eventsArray: any[] = Array.isArray(eventsData?.events) ? eventsData.events : [];

        // 学生の出場情報を取得
        const entriesRes = await fetch(`${API_BASE}/entries?f_student_id=${studentData.f_student_id}`, {
            cache: "no-store",
        });

        let myEntries: any[] = [];
        if (entriesRes.ok) {
            const entriesData = await entriesRes.json();
            myEntries = Array.isArray(entriesData?.entries) ? entriesData.entries : [];
        }

        // エントリーグループ情報を取得（集合場所と時間が含まれる）
        const entryGroupsRes = await fetch(`${API_BASE}/entry-groups`, {
            cache: "no-store",
        });

        let entryGroups: any[] = [];
        if (entryGroupsRes.ok) {
            const groupsData = await entryGroupsRes.json();
            entryGroups = Array.isArray(groupsData?.entryGroups) ? groupsData.entryGroups : [];
        }

        // 学生の参加イベントIDのセットを作成
        const myEventIds = new Set(myEntries.map((e: any) => String(e.f_event_id)));

        // イベントデータとグループ情報を結合
        const eventsWithMapping: EventRow[] = eventsArray.map((ev: any) => {
            const eventId = String(ev.f_event_id ?? "");
            const isMyEntry = myEventIds.has(eventId);

            // このイベントの自分のエントリーを見つける
            const myEntry = myEntries.find((e: any) => String(e.f_event_id) === eventId);

            let place = ev.f_place ?? null;
            let gatherTime = ev.f_gather_time ?? null;

            // 参加イベントの場合、グループ情報から正しい集合場所と時間を取得
            if (myEntry) {
                const group = entryGroups.find(
                    (g: any) => 
                        String(g.f_event_id) === eventId && 
                        g.f_seq === myEntry.f_seq
                );

                if (group) {
                    place = group.f_place ?? place;
                    gatherTime = group.f_gather_time ?? gatherTime;
                }
            }

            return {
                f_event_id: eventId,
                f_event_name: ev.f_event_name ?? null,
                f_start_time: ev.f_time ? String(ev.f_time) : ev.f_start_time ? String(ev.f_start_time) : null,
                f_duration: ev.f_duration ? String(ev.f_duration) : null,
                f_place: place,
                f_gather_time: gatherTime ? String(gatherTime) : null,
                f_summary: ev.f_summary ?? null,
                f_is_my_entry: isMyEntry,
            };
        });

        const student: StudentRow = {
            f_student_id: String(studentData.f_student_id ?? ""),
            f_student_num: String(studentData.f_student_num ?? ""),
            f_class: studentData.f_class ?? null,
            f_number: studentData.f_number ?? null,
            f_name: studentData.f_name ?? null,
            f_note: studentData.f_note ?? null,
            f_birthday: studentData.f_birthday ?? null,
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
