// === イベント分類・フィルタリング・ソート ユーティリティ ===

import type { EventRow } from "~/api/student";
import { isEventOngoing, isCallingOut } from "~/utils/timetable/eventStatusChecker";
import { getCurrentTime } from "~/utils/currentTimeManager";

/**
 * イベント分類の結果型
 */
export interface ClassifiedEvents {
  ongoing: EventRow[];
  calling: EventRow[];
  future: EventRow[];
  past: EventRow[];
}

/**
 * 現在時刻（HHmm形式）を取得
 * currentTimeManager から時刻を取得してデバッグ機能に対応
 * @returns 現在時刻（例：1430）
 */
function getCurrentTimeHHmm(): number {
  const now = getCurrentTime(); // デバッグ機能対応
  return now.getHours() * 100 + now.getMinutes();
}

/**
 * イベントリストを時刻順にソート
 * @param events - ソート対象のイベント
 * @returns 時刻順ソート済みイベント
 */
export function getSortedEvents(events: EventRow[]): EventRow[] {
  return [...events].sort((a, b) => {
    const aTime = parseInt(a.f_start_time || "0", 10);
    const bTime = parseInt(b.f_start_time || "0", 10);
    return aTime - bTime;
  });
}

/**
 * イベントを分類（開催中、呼び出し中、未来、過去）
 * @param events - 参加予定のイベント（f_is_my_entry === true のもののみ）
 * @returns 分類済みイベント
 */
export function classifyEvents(events: EventRow[]): ClassifiedEvents {
  const currentTime = getCurrentTimeHHmm();

  const ongoing: EventRow[] = [];
  const calling: EventRow[] = [];
  const future: EventRow[] = [];
  const past: EventRow[] = [];

  for (const event of events) {
    if (isEventOngoing(event)) {
      ongoing.push(event);
    } else if (isCallingOut(event)) {
      calling.push(event);
    } else {
      const startTime = parseInt(event.f_start_time || "0", 10);
      if (startTime > currentTime) {
        future.push(event);
      } else {
        past.push(event);
      }
    }
  }

  return {
    ongoing,
    calling,
    future,
    past,
  };
}

/**
 * ハイライト表示対象イベントを決定
 * - 開催中・呼び出し中のイベント（人によって状態が異なる場合も含む）: 全て表示 + 同時刻の未来イベント
 * - 開催中・呼び出し中がない場合: 次のイベント（または同時刻の複数）
 *
 * @param activeEvents - 開催中・呼び出し中のイベント（両方が混在可能）
 * @param future - 未来イベント
 * @returns ハイライト対象イベント
 */
export function getHighlightedEvents(
  activeEvents: EventRow[],
  future: EventRow[]
): {
  highlighted: EventRow[];
  remaining: EventRow[];
} {
  const highlighted: EventRow[] = [];
  const remaining: EventRow[] = [];

  if (activeEvents.length > 0) {
    // 開催中・呼び出し中のイベントが存在する場合
    // 複数の時刻がある場合もあるので、最後のアクティブイベントの時刻を基準にする
    const lastActiveTime = parseInt(
      activeEvents[activeEvents.length - 1].f_start_time || "0",
      10
    );

    // 開催中・呼び出し中のイベントを全て追加（人によって状態が異なる場合も共存）
    highlighted.push(...activeEvents);

    // 未来のイベントで、アクティブイベントと同時刻のものも大きく表示
    future.forEach((event) => {
      const startTime = parseInt(event.f_start_time || "0", 10);
      if (startTime === lastActiveTime) {
        highlighted.push(event);
      } else {
        remaining.push(event);
      }
    });
  } else if (future.length > 0) {
    // 開催中・呼び出し中がない場合、次のイベントの時刻を取得
    const nextEventTime = parseInt(future[0].f_start_time || "0", 10);

    // 同時刻のイベントを全て大きく表示
    future.forEach((event) => {
      const startTime = parseInt(event.f_start_time || "0", 10);
      if (startTime === nextEventTime) {
        highlighted.push(event);
      } else {
        remaining.push(event);
      }
    });
  }

  return { highlighted, remaining };
}

/**
 * イベント分類・ハイライト判定を一括実行
 * @param events - 参加予定のイベント
 * @returns 分類・整理済みイベント
 */
export interface EventSections {
  highlightedEvents: EventRow[];
  remainingFutureEvents: EventRow[];
  pastEvents: EventRow[];
}

export function sectionizeEvents(events: EventRow[]): EventSections {
  const myEvents = events.filter((event) => event.f_is_my_entry === true);
  const sorted = getSortedEvents(myEvents);
  const classified = classifyEvents(sorted);

  const futureEvents = classified.future;
  const { highlighted, remaining } = getHighlightedEvents(
    [...classified.ongoing, ...classified.calling],
    futureEvents
  );

  return {
    highlightedEvents: highlighted,
    remainingFutureEvents: remaining,
    pastEvents: classified.past,
  };
}
