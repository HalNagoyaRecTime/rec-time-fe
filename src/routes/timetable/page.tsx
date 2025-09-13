"use client"

import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Settings } from "lucide-react"
import { HamburgerMenu } from "../../components/hamburger-menu"
import { useEffect, useState } from "react"
import { getRecreationEvents, formatTime, type RecreationEvent } from "../../api"

export default function TimetablePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [studentId, setStudentId] = useState<string | null>(null)
  const [events, setEvents] = useState<RecreationEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showOnlyParticipating, setShowOnlyParticipating] = useState(false)

  // studentIdの初期化と同期
  useEffect(() => {
    const queryStudentId = searchParams.get("studentId")
    const localStudentId = localStorage.getItem("studentId")

    if (queryStudentId) {
      // URLにstudentIdがある場合、localStorageと同期
      setStudentId(queryStudentId)
      if (localStudentId !== queryStudentId) {
        localStorage.setItem("studentId", queryStudentId)
      }
    } else if (localStudentId) {
      // localStorageにstudentIdがある場合、URLと同期
      setStudentId(localStudentId)
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev)
        newParams.set("studentId", localStudentId)
        return newParams
      })
    } else {
      // どちらにもない場合はログインページへ
      navigate("/")
    }
  }, [searchParams, navigate, setSearchParams])

  // URLのstudentIdが変更されたときのlocalStorage同期
  useEffect(() => {
    const queryStudentId = searchParams.get("studentId")
    if (queryStudentId && queryStudentId !== studentId) {
      setStudentId(queryStudentId)
      localStorage.setItem("studentId", queryStudentId)
    }
  }, [searchParams, studentId])
  
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
  
  // 15分刻みの時間スロットを生成（11:00から23:45まで）
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 11; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeValue = hour * 100 + minute
        const displayTime = hour > 12
          ? `午後${hour - 12}:${minute.toString().padStart(2, '0')}`
          : hour === 12
          ? `午後${hour}:${minute.toString().padStart(2, '0')}`
          : `午前${hour}:${minute.toString().padStart(2, '0')}`
        slots.push({ value: timeValue, display: displayTime })
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  // 参加者かどうかを判定する関数
  const isParticipant = (event: RecreationEvent): boolean => {
    return studentId ? event.participants.includes(studentId) : false
  }

  // イベントを参加状況で分類
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

  // 表示するイベントをフィルタリング
  const displayEvents = showOnlyParticipating ? participatingEvents : events

  // 総時間を15分単位で計算する関数（1時間 = 4単位）
  const calculateTotalDuration = (events: RecreationEvent[]): number => {
    return events.reduce((total, event) => {
      const startHours = Math.floor(event.startTime / 100)
      const startMinutes = event.startTime % 100
      const endHours = Math.floor(event.endTime / 100)
      const endMinutes = event.endTime % 100

      const startTotalMinutes = startHours * 60 + startMinutes
      const endTotalMinutes = endHours * 60 + endMinutes
      const durationInMinutes = endTotalMinutes - startTotalMinutes

      // 15分単位に変換（1時間 = 4単位）
      return total + Math.ceil(durationInMinutes / 15)
    }, 0)
  }

  // 15分単位を時間と分に変換する関数
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

  // イベントの15分単位での長さを計算する関数
  const getEventDurationUnits = (event: RecreationEvent): number => {
    const startHours = Math.floor(event.startTime / 100)
    const startMinutes = event.startTime % 100
    const endHours = Math.floor(event.endTime / 100)
    const endMinutes = event.endTime % 100

    const startTotalMinutes = startHours * 60 + startMinutes
    const endTotalMinutes = endHours * 60 + endMinutes
    const durationInMinutes = endTotalMinutes - startTotalMinutes

    return Math.ceil(durationInMinutes / 15)
  }

  const totalParticipatingDuration = calculateTotalDuration(participatingEvents)
  const totalEventDuration = calculateTotalDuration(events)


  // localStorageのstudentIdが外部で変更されたときのURL同期
  useEffect(() => {
    const handleStorageChange = () => {
      const newStudentId = localStorage.getItem("studentId")
      const queryStudentId = searchParams.get("studentId")

      if (newStudentId && newStudentId !== queryStudentId) {
        setStudentId(newStudentId)
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev)
          newParams.set("studentId", newStudentId)
          return newParams
        })
      } else if (!newStudentId && queryStudentId) {
        // localStorageから削除された場合
        setStudentId(null)
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev)
          newParams.delete("studentId")
          return newParams
        })
        navigate("/")
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [searchParams, setSearchParams, navigate])



  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex items-center justify-between p-6 pb-4 bg-black border-b border-gray-700">
        <HamburgerMenu />
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">TimeTable</h1>
          <div className="text-sm text-gray-400">最終更新 {new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-400">学籍番号：{studentId}</div>
          <Button variant="ghost" size="icon" onClick={() => navigate(`/profile?studentId=${studentId}`)}>
            <Settings className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>



      {/* 統計とフィルター */}
      <div className="p-4 bg-gray-900 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
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
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">
              <input
                type="checkbox"
                checked={showOnlyParticipating}
                onChange={(e) => setShowOnlyParticipating(e.target.checked)}
                className="mr-2"
              />
              参加予定のみ表示
            </label>
          </div>
        </div>
        
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

      <div className="relative">
        {timeSlots.map((timeSlot, index) => {
          // 15分刻みなので高さを調整（1時間 = 4スロット = 64px なので、15分 = 16px）
          const slotHeight = 16
          const isHourStart = index % 4 === 0 // 1時間の開始
          const isHalfHour = index % 2 === 0 // 30分刻み

          return (
          <div key={index} className="relative">
            <div className="flex" style={{ position: 'relative', zIndex: 1 }}>
              <div className={`w-24 text-sm text-gray-300 border-r border-gray-700 flex items-center ${isHourStart ? 'bg-gray-800 font-medium' : 'bg-gray-900'}`} style={{ height: `${slotHeight}px` }}>
                <div className="px-2">
                  {isHourStart ? timeSlot.display : isHalfHour ? timeSlot.display.split(':')[1] : ''}
                </div>
              </div>
              <div className="flex-1 relative" style={{ height: `${slotHeight}px` }}>
                {/* イベントの表示 */}
                {displayEvents
                  .filter((event) => {
                    // イベントの開始時刻が現在の15分スロットと一致するかチェック
                    const eventStartMinutes = Math.floor(event.startTime / 100) * 60 + (event.startTime % 100)
                    const slotStartMinutes = Math.floor(timeSlot.value / 100) * 60 + (timeSlot.value % 100)

                    // 15分スロット境界に合わせる（切り下げ）
                    const eventSlotStart = Math.floor(eventStartMinutes / 15) * 15
                    return eventSlotStart === slotStartMinutes
                  })
                  .map((event) => {
                    const participant = isParticipant(event)
                    const durationUnits = getEventDurationUnits(event)
                    const durationInMinutes = durationUnits * 15

                    // 15分スロットでの高さ計算（1単位 = 16px）
                    // イベントが複数スロットにまたがる場合の調整
                    const eventHeight = Math.max(durationUnits * 16 - 2, 12)

                    return (
                      <div
                        key={event.id}
                        className={`absolute left-1 top-1 right-1 text-black rounded p-1 shadow-sm transition-all hover:shadow-md cursor-pointer text-xs ${
                          participant
                            ? 'bg-green-400 hover:bg-green-500'
                            : 'bg-amber-200 hover:bg-amber-300'
                        }`}
                        style={{
                          height: `${eventHeight}px`,
                          zIndex: 10,
                        }}
                        title={`${event.title} - ${formatTime(event.startTime)}〜${formatTime(event.endTime)} (${durationUnits}単位 = ${formatDuration(durationUnits)}) ${participant ? '(参加予定)' : ''}`}
                      >
                        <div className="font-medium truncate" style={{ fontSize: '10px', lineHeight: '12px' }}>
                          {event.title}
                          <span className="ml-1 text-gray-600">({durationUnits})</span>
                        </div>
                        <div className="text-gray-700 truncate" style={{ fontSize: '9px', lineHeight: '10px' }}>
                          {formatTime(event.startTime)}〜{formatTime(event.endTime)}
                        </div>
                        {participant && durationInMinutes >= 30 && (
                          <div className="text-green-800 font-bold" style={{ fontSize: '8px' }}>
                            ✓ 参加予定
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )})}
      </div>

      {/* イベントがない場合のメッセージ */}
      {displayEvents.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-400">
          {showOnlyParticipating ? (
            <div>
              <div className="mb-2">参加予定のレクリエーション活動がありません</div>
              <div className="text-sm">
                フィルターを解除すると全ての活動が表示されます
              </div>
            </div>
          ) : (
            "本日は予定されているレクリエーション活動がありません"
          )}
        </div>
      )}

      {/* 参加統計情報 */}
      {events.length > 0 && !loading && (
        <div className="p-4 bg-gray-900 border-t border-gray-700">
          <div className="text-center text-sm text-gray-300">
            <div className="flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span>参加予定: {participatingEvents.length}件 ({formatDuration(totalParticipatingDuration)})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-200 rounded-full"></div>
                <span>未参加: {nonParticipatingEvents.length}件</span>
              </div>
            </div>
            {showOnlyParticipating && participatingEvents.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                参加予定フィルター適用中
              </div>
            )}
          </div>
        </div>
      )}

      <div className="fixed bottom-2 left-0 right-0 text-center text-xs text-gray-500">
        © HAL Inc. ALL RIGHTS RESERVED.
      </div>
    </div>
  )
}
