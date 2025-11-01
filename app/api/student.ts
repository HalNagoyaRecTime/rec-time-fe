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
import { getApiBaseUrl } from "~/config/apiConfig";

export async function fetchByGakuseki(id: string | null): Promise<{ payload: ApiPayload; isFromCache: boolean }> {
    const API_BASE = getApiBaseUrl();

    if (id) {
        // 登録済み: アラーム情報エンドポイントを使用（集合場所・時間を含む完全なデータ）
        const alarmRes = await fetch(`${API_BASE}/entries/alarm/${id}`, {
            cache: "no-store",
        });

        let alarmEvents: any[] = [];
        if (!alarmRes.ok) {
            if (alarmRes.status === 404) {
                // ユーザーデータがない場合は空配列として処理を続行
                console.log(`[API] アラーム情報が見つかりません（新規ユーザー）- 全イベントのみ表示します`);
                alarmEvents = [];
            } else {
                // それ以外のエラーはthrow
                console.error(`[API] アラーム情報取得失敗: ${alarmRes.status}`);
                throw new Error(`アラーム情報の取得に失敗しました ${alarmRes.status}`);
            }
        } else {
            alarmEvents = await alarmRes.json();
            console.log(`[API] アラーム情報取得成功: ${alarmEvents.length}件のイベント`);
            if (alarmEvents.length > 0) {
                console.log(`[API] 알람 이벤트 전체 필드 (첫 번째):`, alarmEvents[0]);
                console.log(
                    `[API] アラーム情報 상세:`,
                    alarmEvents.map((e) => ({
                        id: e.f_event_id,
                        name: e.f_event_name,
                        time: e.f_time,
                        time_type: typeof e.f_time,
                        time_length: e.f_time ? String(e.f_time).length : 0,
                    }))
                );
            }
        }

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

        // 全イベント一覧を取得（フィルターなし - 全イベントを取得）
        const eventsRes = await fetch(`${API_BASE}/events`, {
            cache: "no-store",
        });

        if (!eventsRes.ok) {
            console.error(`[API] イベント情報取得失敗: ${eventsRes.status}`);
            throw new Error(`イベント情報の取得に失敗しました ${eventsRes.status}`);
        }

        const eventsData = await eventsRes.json();
        const allEvents: any[] = Array.isArray(eventsData?.events) ? eventsData.events : [];
        console.log(`[API] 전체 이벤트: ${allEvents.length}件`);
        console.log(`[API] 백엔드 응답 전체:`, eventsData);
        console.log(`[API] 첫 번째 이벤트 전체 필드:`, allEvents[0]);
        console.log(
            `[API] 전체 이벤트 상세:`,
            allEvents.map((e) => ({
                id: e.f_event_id,
                name: e.f_event_name,
                time: e.f_time,
                time_type: typeof e.f_time,
                time_length: e.f_time ? String(e.f_time).length : 0,
            }))
        );

        // 全イベントとアラーム情報をマージ
        // 同じイベントで複数の集合時刻（グループ）がある場合も対応
        const eventsWithMapping: EventRow[] = allEvents.flatMap((ev: any): EventRow[] => {
            const eventId = String(ev.f_event_id ?? "");

            // アラーム情報から該当イベントを検索（複数マッチ対応）
            const alarmEvents_filtered = alarmEvents.filter((e) => String(e.f_event_id) === eventId);

            // 時刻フォーマット化関数
            const normalizeTime = (time: any): string | null => {
                if (!time) return null;
                const timeStr = String(time).trim();

                // "12:00" 形式の場合 "1200" に変換
                if (timeStr.includes(":")) {
                    const [hours, minutes] = timeStr.split(":");
                    return (hours || "00").padStart(2, "0") + (minutes || "00").padStart(2, "0");
                }

                // 2桁の数字なら4桁に変換（例："12" -> "1200"）
                if (timeStr.length === 2 && /^\d{2}$/.test(timeStr)) {
                    return timeStr + "00";
                }

                // 既に4桁ならそのまま使用
                return timeStr;
            };

            const startTime = normalizeTime(ev.f_start_time ?? ev.f_time);

            if (alarmEvents_filtered.length > 0) {
                // アラーム情報がある場合（参加イベント）
                // 複数のグループがある場合は、各グループごとにレコードを生成
                return alarmEvents_filtered.map((alarmEvent) => {
                    const alarmStartTime = normalizeTime(alarmEvent?.f_start_time ?? alarmEvent?.f_time);
                    const finalStartTime = alarmStartTime ?? startTime;
                    console.log(
                        `[API] 参加イベント - イベント: ${ev.f_event_name}, 集合時間: ${alarmEvent.f_gather_time}`
                    );
                    return {
                        f_event_id: eventId,
                        f_event_name: ev.f_event_name ?? alarmEvent.f_event_name ?? null,
                        f_start_time: finalStartTime,
                        f_duration: alarmEvent.f_duration ?? (ev.f_duration ? String(ev.f_duration) : null),
                        f_place: alarmEvent.f_place ?? ev.f_place ?? null,
                        f_gather_time: alarmEvent.f_gather_time ? String(alarmEvent.f_gather_time) : null,
                        f_summary: alarmEvent.f_summary ?? ev.f_summary ?? null,
                        f_is_my_entry: true,
                    };
                });
            } else {
                // 参加していないイベント
                return [{
                    f_event_id: eventId,
                    f_event_name: ev.f_event_name ?? null,
                    f_start_time: startTime,
                    f_duration: ev.f_duration ? String(ev.f_duration) : null,
                    f_place: ev.f_place ?? null,
                    f_gather_time: ev.f_gather_time ? String(ev.f_gather_time) : null,
                    f_summary: ev.f_summary ?? null,
                    f_is_my_entry: false,
                }];
            }
        });

        const student: StudentRow = studentData
            ? {
                  f_student_id: String(studentData.f_student_id ?? ""),
                  f_student_num: String(studentData.f_student_num ?? ""),
                  f_class: studentData.f_class ?? null,
                  f_number: studentData.f_number ?? null,
                  f_name: studentData.f_name ?? null,
                  f_note: studentData.f_note ?? null,
                  f_birthday: studentData.f_birthday ?? null,
              }
            : {
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
        const res = await fetch(`${API_BASE}/events`, { cache: "no-store" });

        if (!res.ok) {
            console.error(`[API] イベント情報取得失敗: ${res.status}`);
            throw new Error(`データ取得失敗 ${res.status}`);
        }

        const isFromCache = res.headers.get("X-Cache-Source") === "service-worker";

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

        // 시간 정규화 함수 (백엔드 응답 처리)
        const normalizeTime = (time: any): string | null => {
            if (!time) return null;
            const timeStr = String(time).trim();

            // "12:00" 형식인 경우 "1200"으로 변환
            if (timeStr.includes(":")) {
                const [hours, minutes] = timeStr.split(":");
                const normalized = (hours || "00").padStart(2, "0") + (minutes || "00").padStart(2, "0");
                console.log(`[normalizeTime] 콜론 제거: "${timeStr}" -> "${normalized}"`);
                return normalized;
            }

            // 2자리 숫자면 4자리로 변환 (예: "12" -> "1200")
            if (timeStr.length === 2 && /^\d{2}$/.test(timeStr)) {
                return timeStr + "00";
            }

            // 이미 4자리면 그대로 사용
            return timeStr;
        };

        const eventsWithMapping: EventRow[] = eventsArray.map((ev: any) => ({
            f_event_id: String(ev.f_event_id ?? ""),
            f_event_name: ev.f_event_name ?? null,
            f_start_time: normalizeTime(ev.f_start_time ?? ev.f_time), // 백엔드가 f_start_time 또는 f_time 반환 가능
            f_duration: ev.f_duration ? String(ev.f_duration) : null,
            f_place: ev.f_place ?? null,
            f_gather_time: ev.f_gather_time ? String(ev.f_gather_time) : null,
            f_summary: ev.f_summary ?? null,
            f_is_my_entry: false, // 未登録なので全てfalse
        }));

        return { payload: { m_students: student, t_events: eventsWithMapping }, isFromCache };
    }
}
