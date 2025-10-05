// === サンプルからコピーしたイベント表示付きタイムスロットグリッド ===
// === 샘플에서 복사한 이벤트 표시 포함 타임슬롯 그리드 ===
import React from "react";
import type { EventRow } from "../../api/student";

interface TimeSlotGridWithEventsProps {
    displayEvents: EventRow[];
    studentId: string | null;
    loading: boolean;
}

interface TimeSlot {
    value: number;
    display: string;
}

// === HHmm形式の時刻をフォーマット ===
// === HHmm 형식의 시각을 포맷 ===
function formatTime(hhmm: string | null): string {
    if (!hhmm || hhmm.length !== 4) return "";
    const hour = parseInt(hhmm.substring(0, 2), 10);
    const minute = hhmm.substring(2, 4);
    return `${hour}:${minute}`;
}

export default function TimeSlotGridWithEvents({
    displayEvents,
    studentId,
    loading,
}: TimeSlotGridWithEventsProps) {
    // === 9:00-20:00の15分刻みタイムスロットを生成 ===
    // === 9:00-20:00 15분 단위 타임슬롯 생성 ===
    const generateTimeSlots = (): TimeSlot[] => {
        const slots = [];
        for (let hour = 9; hour <= 20; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                const timeValue = hour * 100 + minute;
                const displayTime = `${hour}:${minute.toString().padStart(2, "0")}`;
                slots.push({ value: timeValue, display: displayTime });
            }
        }
        return slots;
    };

    const timeSlots = generateTimeSlots();

    // === 参加者チェック ===
    // === 참가자 체크 ===
    const isParticipant = (event: EventRow): boolean => {
        if (!studentId) return false;
        // f_is_my_entry または f_entries で判定
        if (typeof event.f_is_my_entry === "boolean") {
            return event.f_is_my_entry;
        }
        if (Array.isArray(event.f_entries)) {
            return event.f_entries.includes(studentId);
        }
        return false;
    };

    // === イベントの長さ（15分単位） ===
    // === 이벤트 길이（15분 단위） ===
    const getEventDurationUnits = (event: EventRow): number => {
        if (!event.f_start_time || !event.f_duration) return 0;

        const durationMinutes = parseInt(event.f_duration, 10);
        return Math.ceil(durationMinutes / 15);
    };

    // === 時間の長さをフォーマット ===
    // === 시간 길이를 포맷 ===
    const formatDuration = (units: number): string => {
        const totalMinutes = units * 15;
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        if (hours > 0 && mins > 0) {
            return `${hours}時間${mins}分`;
        } else if (hours > 0) {
            return `${hours}時間`;
        } else {
            return `${mins}分`;
        }
    };

    // === 重なりを検出し、イベントのレイアウトを計算する関数 ===
    // === 겹침을 검출하여 이벤트 레이아웃을 계산하는 함수 ===
    const calculateEventLayout = (events: EventRow[]) => {
        const eventPositions = new Map<
            string,
            { top: number; height: number; column: number; totalColumns: number; actualColumns: number; positionIndex: number }
        >();

        // 時間順でソート
        const sortedEvents = [...events].sort((a, b) => {
            const aTime = parseInt(a.f_start_time || "0", 10);
            const bTime = parseInt(b.f_start_time || "0", 10);
            return aTime - bTime;
        });

        // 重なりを検出するための配列
        const columns: Array<{ events: EventRow[]; endTime: number }> = [];

        // イベントごとの時間範囲を保存
        const eventTimeRanges: Map<string, { start: number; end: number }> = new Map();

        sortedEvents.forEach((event) => {
            if (!event.f_start_time) return;

            const startTime = parseInt(event.f_start_time, 10);
            const startHours = Math.floor(startTime / 100);
            const startMinutes = startTime % 100;
            const startTotalMinutes = startHours * 60 + startMinutes;
            const baseMinutes = 9 * 60; // 9:00基準
            const eventStartUnits = Math.floor((startTotalMinutes - baseMinutes) / 15);

            // 終了時刻を計算
            const durationMinutes = parseInt(event.f_duration || "0", 10);
            const endTotalMinutes = startTotalMinutes + durationMinutes;
            const endHours = Math.floor(endTotalMinutes / 60);
            const endMinutes = endTotalMinutes % 60;
            const endTime = endHours * 100 + endMinutes;

            // 時間範囲を保存
            eventTimeRanges.set(event.f_event_id, { start: startTime, end: endTime });

            // 利用可能なカラムを探す
            let columnIndex = columns.findIndex((col) => col.endTime <= startTime);

            if (columnIndex === -1) {
                // 新しいカラムを作成
                columnIndex = columns.length;
                columns.push({ events: [], endTime: 0 });
            }

            // カラムにイベントを追加
            columns[columnIndex].events.push(event);
            columns[columnIndex].endTime = endTime;

            // ポジション情報を保存
            eventPositions.set(event.f_event_id, {
                top: eventStartUnits * 16,
                height: getEventDurationUnits(event) * 16 - 2,
                column: columnIndex,
                totalColumns: 0,
                actualColumns: 1, // 後で計算
                positionIndex: 0, // 後で計算
            });
        });

        // 各イベントの実際の重複数と位置インデックスを計算
        eventPositions.forEach((position, eventId) => {
            const timeRange = eventTimeRanges.get(eventId);
            if (!timeRange) return;

            // このイベントと重複するイベントのIDリスト（自分を含む）
            const overlappingEventIds: string[] = [eventId];
            eventTimeRanges.forEach((otherRange, otherEventId) => {
                if (eventId === otherEventId) return;

                // 時間範囲が重複しているかチェック（終了時刻 = 開始時刻は重複しない）
                const isOverlapping =
                    (timeRange.start < otherRange.end && timeRange.end > otherRange.start) &&
                    !(timeRange.end === otherRange.start || timeRange.start === otherRange.end);

                if (isOverlapping) {
                    overlappingEventIds.push(otherEventId);
                }
            });

            // actualColumns = 重複するイベント数
            position.actualColumns = overlappingEventIds.length;
            position.totalColumns = columns.length;

            // 重複グループ内での位置インデックスを計算（開始時刻順）
            const sortedOverlapping = overlappingEventIds.sort((a, b) => {
                const aTime = parseInt(eventTimeRanges.get(a)?.start.toString() || "0", 10);
                const bTime = parseInt(eventTimeRanges.get(b)?.start.toString() || "0", 10);
                return aTime - bTime;
            });
            position.positionIndex = sortedOverlapping.indexOf(eventId);
        });

        return eventPositions;
    };

    const eventLayout = calculateEventLayout(displayEvents);

    // === 予定数に応じて動的に幅を調整（実際の重複数を使用） ===
    // === 예정 수에 따라 동적으로 너비 조정（실제 겹침 수 사용） ===
    const getOptimalWidth = (actualColumns: number) => {
        if (actualColumns === 1) return "calc(100% - 8px)";
        if (actualColumns === 2) return "48%";
        if (actualColumns === 3) return "32%";
        return `${Math.max(20, 100 / actualColumns)}%`;
    };

    const getOptimalLeft = (positionIndex: number, actualColumns: number) => {
        if (actualColumns === 1) return "4px";
        if (actualColumns === 2) return `${positionIndex * 50 + 1}%`;
        if (actualColumns === 3) return `${positionIndex * 33.33 + 1}%`;
        return `${(positionIndex * 100) / actualColumns + 0.5}%`;
    };

    return (
        <div className="relative h-full w-full rounded-lg bg-blue-950 px-1">
            {/* タイムスロット背景 */}
            <div className="flex">
                {/* 左側：時間ラベル列 */}
                <div className="w-12 flex-shrink-0">
                    {timeSlots.map((slot, index) => {
                        const isHourStart = index % 4 === 0;
                        return (
                            <div key={index} className="relative" style={{ height: "16px" }}>
                                {isHourStart && (
                                    <div className="absolute -top-[14px] right-2 text-right text-sm font-normal text-[#FFCC5299]/80">
                                        {slot.display}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* 右側：イベントエリア + 区切り線 */}
                <div className="relative flex-1">
                    {timeSlots.map((slot, index) => {
                        const isHourStart = index % 4 === 0;

                        return (
                            <div key={index} className="relative" style={{ height: "16px" }}>
                                {/* 1時間ごとの区切り線 */}
                                {isHourStart && (
                                    <div className="absolute top-0 right-0 left-0 h-px bg-[#FFB4004D]/60"></div>
                                )}
                            </div>
                        );
                    })}

                    {/* イベント表示 - 絶対位置で配置 */}
                    <div className="absolute top-0 left-0 right-0" style={{ height: `${timeSlots.length * 16}px` }}>
                        {displayEvents.map((event) => {
                            const participant = isParticipant(event);
                            const durationUnits = getEventDurationUnits(event);
                            const layout = eventLayout.get(event.f_event_id);

                            if (!layout) return null;

                            const width = getOptimalWidth(layout.actualColumns);
                            const left = getOptimalLeft(layout.positionIndex, layout.actualColumns);

                            return (
                                <div
                                    key={event.f_event_id}
                                    className={`absolute rounded p-1 shadow-sm transition-all hover:shadow-md cursor-pointer text-xs ${
                                        participant
                                            ? "bg-[#FFB400] hover:bg-[#FFC940] text-blue-950"
                                            : "bg-blue-500 hover:bg-blue-400 text-white"
                                    } ${layout.totalColumns > 1 ? "mr-0.5" : ""}`}
                                    style={{
                                        top: `${layout.top}px`,
                                        height: `${Math.max(layout.height, 12)}px`,
                                        left: left,
                                        width: width,
                                        zIndex: 10,
                                    }}
                                    title={`${event.f_event_name || "イベント"} - ${formatTime(event.f_start_time)} (${formatDuration(durationUnits)}) ${participant ? "(参加予定)" : ""}`}
                                >
                                    <div
                                        className="font-medium truncate"
                                        style={{ fontSize: "10px", lineHeight: "12px" }}
                                    >
                                        {event.f_event_name}
                                    </div>
                                    <div
                                        className="opacity-80 truncate"
                                        style={{ fontSize: "9px", lineHeight: "10px" }}
                                    >
                                        {formatTime(event.f_start_time)}
                                    </div>
                                    {participant && (
                                        <div className="font-bold" style={{ fontSize: "8px" }}>
                                            ✓ 参加予定
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {displayEvents.length === 0 && !loading && (
                <div className="text-center py-8 text-white/70">
                    本日は予定されているイベントがありません
                </div>
            )}
        </div>
    );
}