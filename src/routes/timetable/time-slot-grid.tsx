import { formatTime } from "../../api"
import type { RecreationEvent } from "../../api/recreation"

interface TimeSlotGridProps {
  displayEvents: RecreationEvent[]
  studentId: string | null
  loading: boolean
  showOnlyParticipating: boolean
}

interface TimeSlot {
  value: number
  display: string
}

export function TimeSlotGrid({ displayEvents, studentId, loading, showOnlyParticipating }: TimeSlotGridProps) {
  const generateTimeSlots = (): TimeSlot[] => {
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

  const isParticipant = (event: RecreationEvent): boolean => {
    return studentId ? event.participants.includes(studentId) : false
  }

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

  const getEventPosition = (event: RecreationEvent) => {
    const startHours = Math.floor(event.startTime / 100)
    const startMinutes = event.startTime % 100
    const startTotalMinutes = startHours * 60 + startMinutes

    // 11:00を基準とした15分単位での位置
    const baseMinutes = 11 * 60
    const eventStartUnits = Math.floor((startTotalMinutes - baseMinutes) / 15)

    return {
      top: eventStartUnits * 16,
      height: getEventDurationUnits(event) * 16 - 2
    }
  }

  return (
    <div className="relative">
      {/* タイムスロット背景 */}
      {timeSlots.map((timeSlot, index) => {
        const slotHeight = 16
        const isHourStart = index % 4 === 0

        return (
          <div key={index} className="relative">
            <div className="flex" style={{ position: 'relative', zIndex: 1 }}>
              <div
                className={`w-24 text-sm text-gray-300 border-r flex items-center ${
                  isHourStart ? 'bg-gray-800 font-medium' : 'bg-gray-900'
                }`}
                style={{ height: `${slotHeight}px` }}
              >
                <div className="px-2">
                  {isHourStart ? timeSlot.display : ''}
                </div>
              </div>
              <div className="flex-1 relative" style={{ height: `${slotHeight}px` }}>
                {/* 1時間ごとの背景線 - イベントがない場合のみ表示 */}
                {isHourStart && displayEvents.filter((event) => {
                  const eventStartMinutes = Math.floor(event.startTime / 100) * 60 + (event.startTime % 100)
                  const slotStartMinutes = Math.floor(timeSlot.value / 100) * 60 + (timeSlot.value % 100)
                  const eventSlotStart = Math.floor(eventStartMinutes / 15) * 15
                  return eventSlotStart === slotStartMinutes
                }).length === 0 && (
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-600 -z-50"></div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* イベント表示 - 絶対位置で配置 */}
      <div className="absolute top-0 left-24 right-0" style={{ height: `${timeSlots.length * 16}px` }}>
        {displayEvents.map((event) => {
          const participant = isParticipant(event)
          const durationUnits = getEventDurationUnits(event)
          const durationInMinutes = durationUnits * 15
          const position = getEventPosition(event)

          return (
            <div
              key={event.id}
              className={`absolute left-1 right-1 text-black rounded p-1 shadow-sm transition-all hover:shadow-md cursor-pointer text-xs ${
                participant
                  ? 'bg-green-400 hover:bg-green-500'
                  : 'bg-amber-200 hover:bg-amber-300'
              }`}
              style={{
                top: `${position.top}px`,
                height: `${Math.max(position.height, 12)}px`,
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
    </div>
  )
}
