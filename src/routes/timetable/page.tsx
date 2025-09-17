import { useEffect, useState } from "react"
// getRecreationEvents: レクリエーションイベント取得API, RecreationEvent: イベント型
import { getRecreationEvents, type RecreationEvent } from "../../api"
// useStudentId: 学生ID取得用カスタムフック
import { useStudentId } from "../../hooks/useStudentId"
// TimetableHeader: タイムテーブル画面のヘッダー
import { TimetableHeader } from "./timetable-header"
// TimetableStats: 統計・フィルター表示
import { TimetableStats } from "./timetable-stats"
// TimeSlotGrid: 時間割グリッド表示
import { TimeSlotGrid } from "./time-slot-grid"

// タイムテーブルページのメインコンポーネント
export default function TimetablePage() {
  // 学生ID取得
  const studentId = useStudentId()
  // イベント一覧
  const [events, setEvents] = useState<RecreationEvent[]>([])
  // ローディング状態
  const [loading, setLoading] = useState(true)
  // 参加予定のみ表示フラグ
  const [showOnlyParticipating, setShowOnlyParticipating] = useState(false)

  // 初回マウント時にイベント一覧を取得
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const recreationEvents = await getRecreationEvents()
        setEvents(Array.isArray(recreationEvents) ? recreationEvents : [])
      } catch (error) {
        console.error("レクリエーション活動の取得に失敗しました:", error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // 指定イベントに参加しているか判定
  const isParticipant = (event: RecreationEvent): boolean => {
    return studentId ? event.participants.includes(studentId) : false
  }

  // 参加イベント・非参加イベントで分類
  const { participatingEvents, nonParticipatingEvents } = events.reduce(
    (acc, event) => {
      if (isParticipant(event)) {
        acc.participatingEvents.push(event)
      } else {
        acc.nonParticipatingEvents.push(event)
      }
      return acc
    },
    { participatingEvents: [] as RecreationEvent[], nonParticipatingEvents: [] as RecreationEvent[] }
  )

  // 表示対象イベント（フィルター）
  const displayEvents = showOnlyParticipating ? participatingEvents : events



  // タイムテーブル画面の表示
  return (
    // 画面全体のラッパーdiv
    <div className="min-h-screen bg-black text-white">
      {/* ヘッダー部分 */}
      <TimetableHeader studentId={studentId} />

      {/* 統計・フィルター表示 */}
      <TimetableStats
        events={events}
        participatingEvents={participatingEvents}
        nonParticipatingEvents={nonParticipatingEvents}
        showOnlyParticipating={showOnlyParticipating}
        onFilterChange={setShowOnlyParticipating}
        loading={loading}
      />

      {/* 時間割グリッド表示 */}
      <TimeSlotGrid
        displayEvents={displayEvents}
        studentId={studentId}
        loading={loading}
        showOnlyParticipating={showOnlyParticipating}
      />

      {/* フッター著作権表示 */}
      <div className="fixed bottom-2 left-0 right-0 text-center text-xs text-gray-500">
        © HAL Inc. ALL RIGHTS RESERVED.
      </div>
    </div>
  )
}
