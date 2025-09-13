"use client"

import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Settings } from "lucide-react"
import { HamburgerMenu } from "../../components/hamburger-menu"
import { useEffect, useState } from "react"
import { getRecreationEvents, formatTime, type RecreationEvent } from "../../api"

export default function TimetablePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const studentId = searchParams.get("studentId") || localStorage.getItem("studentId")
  const [events, setEvents] = useState<RecreationEvent[]>([])
  const [loading, setLoading] = useState(true)
  
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
  
  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 11
    return hour > 12 ? `午後${hour - 12}時` : hour === 12 ? `午後${hour}時` : `午前${hour}時`
  })


  // 参加者かどうかを判定する関数
  const isParticipant = (event: RecreationEvent): boolean => {
    return studentId ? event.participants.includes(studentId) : false
  }


  useEffect(() => {
    if (!studentId) {
      navigate("/")
    }
  }, [studentId, navigate])



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



      {/* 凡例 */}
      <div className="p-4 bg-gray-900 border-b border-gray-700">
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
        {timeSlots.map((timeSlot, index) => (
          <div key={index} className="relative">
            <div className="flex border-b border-gray-700">
              <div className="w-24 p-4 text-sm text-gray-300 border-r border-gray-700">{timeSlot}</div>
              <div className="flex-1 relative h-16">
                {/* イベントの表示 */}
                {events
                  .filter((event) => event.startSlot === index)
                  .map((event) => {
                    const participant = isParticipant(event)
                    return (
                      <div
                        key={event.id}
                        className={`absolute left-2 top-2 right-2 text-black rounded p-2 shadow-sm transition-all hover:shadow-md ${
                          participant 
                            ? 'bg-green-400 border-2 border-green-600' 
                            : 'bg-amber-200'
                        }`}
                        style={{
                          height: `${event.duration * 60 - 8}px`, // 1時間 = 60px - padding
                        }}
                      >
                        <div className="text-sm font-medium">{event.title}</div>
                        <div className="text-xs text-gray-700">
                          {formatTime(event.startTime)}〜{formatTime(event.endTime)}
                        </div>
                        {participant && (
                          <div className="text-xs text-green-800 font-bold mt-1">
                            ✓ 参加予定
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* イベントがない場合のメッセージ */}
      {events.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-400">
          本日は予定されているレクリエーション活動がありません
        </div>
      )}

      <div className="fixed bottom-2 left-0 right-0 text-center text-xs text-gray-500">
        © HAL Inc. ALL RIGHTS RESERVED.
      </div>
    </div>
  )
}
