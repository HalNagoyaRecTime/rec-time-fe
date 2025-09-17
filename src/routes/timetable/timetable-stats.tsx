// RecreationEvent: レクリエーションイベント型
import type{ RecreationEvent } from "../../api/"

// TimetableStatsのprops型
interface TimetableStatsProps {
  events: RecreationEvent[]                // 全イベント
  participatingEvents: RecreationEvent[]   // 参加予定イベント
  nonParticipatingEvents: RecreationEvent[]// 未参加イベント
  showOnlyParticipating: boolean           // 参加予定のみ表示フラグ
  onFilterChange: (showOnlyParticipating: boolean) => void // フィルター切替ハンドラ
  loading: boolean                         // ローディング状態
}

// タイムテーブル統計・フィルター表示コンポーネント
export function TimetableStats({
  events,
  participatingEvents,
  nonParticipatingEvents,
  showOnlyParticipating,
  onFilterChange,
  loading
}: TimetableStatsProps) {
  // イベント配列の合計所要時間（15分単位）を計算
  const calculateTotalDuration = (events: RecreationEvent[]): number => {
    return events.reduce((total, event) => {
      const startHours = Math.floor(event.startTime / 100)
      const startMinutes = event.startTime % 100
      const endHours = Math.floor(event.endTime / 100)
      const endMinutes = event.endTime % 100

      const startTotalMinutes = startHours * 60 + startMinutes
      const endTotalMinutes = endHours * 60 + endMinutes
      const durationInMinutes = endTotalMinutes - startTotalMinutes

      return total + Math.ceil(durationInMinutes / 15)
    }, 0)
  }

  // 単位数から「○時間○分」形式に変換
  const formatDuration = (units: number): string => {
    const totalMinutes = units * 15
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    if (hours > 0 && mins > 0) {
      return `${hours}時間${mins}分`
    } else if (hours > 0) {
      return `${hours}時間`
    } else {
      return `${mins}分`
    }
  }

  // 参加予定・全体の合計所要時間
  const totalParticipatingDuration = calculateTotalDuration(participatingEvents)
  const totalEventDuration = calculateTotalDuration(events)

  // JSX描画
  return (
    <>
      {/* 上部統計・フィルター・凡例 */}
      <div className="p-4 bg-gray-900 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          {/* 件数・所要時間表示 */}
          <div className="text-sm text-gray-300">
            <div className="mb-1">
              参加予定: <span className="text-green-400 font-bold">{participatingEvents.length}件</span> /
              全体: <span className="text-gray-100 font-bold">{events.length}件</span>
            </div>
            <div className="text-xs text-gray-400">
              参加時間: <span className="text-green-400 font-bold">{formatDuration(totalParticipatingDuration)}</span> /
              総時間: <span className="text-gray-100 font-bold">{formatDuration(totalEventDuration)}</span>
            </div>
          </div>
          {/* 参加予定のみ表示フィルタ */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">
              <input
                type="checkbox"
                checked={showOnlyParticipating}
                onChange={(e) => onFilterChange(e.target.checked)}
                className="mr-2"
              />
              参加予定のみ表示
            </label>
          </div>
        </div>

        {/* 凡例（色の意味） */}
        <div className="text-sm text-gray-300 mb-2">凡例:</div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-200 rounded"></div>
            <span className="text-xs text-gray-400">一般活動</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-400 rounded"></div>
            <span className="text-xs text-gray-400">参加予定</span>
          </div>
        </div>
      </div>

      {/* 下部サマリー */}
      {events.length > 0 && !loading && (
        <div className="p-4 bg-gray-900 border-t border-gray-700">
          <div className="text-center text-sm text-gray-300">
            <div className="flex justify-center gap-6">
              {/* 参加予定サマリー */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span>参加予定: {participatingEvents.length}件 ({formatDuration(totalParticipatingDuration)})</span>
              </div>
              {/* 未参加サマリー */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-200 rounded-full"></div>
                <span>未参加: {nonParticipatingEvents.length}件</span>
              </div>
            </div>
            {/* フィルター適用中ラベル */}
            {showOnlyParticipating && participatingEvents.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                参加予定フィルター適用中
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
