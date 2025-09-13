"use client"

import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Settings } from "lucide-react"
import { HamburgerMenu } from "../../components/hamburger-menu"

export default function TimetablePage() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const studentId = searchParams.get("studentId") || "99999"  
  
  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 11
    return hour > 12 ? `午後${hour - 12}時` : hour === 12 ? `午後${hour}時` : `午前${hour}時`
  })

  const events = [
    {
      id: 1,
      title: "supabase - 2025/09/07",
      startTime: "12:22",
      endTime: "13:34",
      startSlot: 1, // 午後12時のスロット
      duration: 1.2, // 1時間12分 = 1.2時間
    },
    {
      id: 2,
      title: "レクリエーション活動",
      startTime: "15:00",
      endTime: "16:30",
      startSlot: 4, // 午後3時のスロット
      duration: 1.5,
    },
  ]

  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex items-center justify-between p-6 pb-4 bg-black border-b border-gray-700">
        <HamburgerMenu />
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">TimeTable</h1>
          <div className="text-sm text-gray-400">最終更新 12:20</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-400">学籍番号：{studentId}</div>
          <Button variant="ghost" size="icon" onClick={() => navigate(`/profile?studentId=${studentId}`)}>
            <Settings className="w-5 h-5 text-white" />
          </Button>
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
                  .map((event) => (
                    <div
                      key={event.id}
                      className="absolute left-2 top-2 right-2 bg-amber-200 text-black rounded p-2 shadow-sm"
                      style={{
                        height: `${event.duration * 60 - 8}px`, // 1時間 = 60px - padding
                      }}
                    >
                      <div className="text-sm font-medium">{event.title}</div>
                      <div className="text-xs text-gray-700">
                        {event.startTime}〜{event.endTime}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-2 left-0 right-0 text-center text-xs text-gray-500">
        © HAL Inc. ALL RIGHTS RESERVED.
      </div>
    </div>
  )
}
