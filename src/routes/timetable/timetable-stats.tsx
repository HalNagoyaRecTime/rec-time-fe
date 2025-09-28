import type{ RecreationEvent } from "../../api/"

interface TimetableStatsProps {
  events: RecreationEvent[]
  participatingEvents: RecreationEvent[]
  nonParticipatingEvents: RecreationEvent[]
  showOnlyParticipating: boolean
  onFilterChange: (showOnlyParticipating: boolean) => void
  loading: boolean
}

export function TimetableStats({
  events,
  participatingEvents,
  nonParticipatingEvents,
  showOnlyParticipating,
  onFilterChange,
  loading
}: TimetableStatsProps) {
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

  const totalParticipatingDuration = calculateTotalDuration(participatingEvents)
  const totalEventDuration = calculateTotalDuration(events)

  return (
    <>
      <div className="event-card">
    <div className="event-badge">次の予定</div>
    
    <h2 className="event-title">四天王ドッチボール</h2>
    
    <div className="event-details">
      <span className="detail-label">集合時間</span>
      <div>
        <span className="detail-value">11:30</span>
        <span className="time-remaining">30分後</span>
      </div>
      
      <span className="detail-label">集合場所</span>
      <span className="detail-value">招集場所A</span>
    </div>
  </div>


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
    </>
  )
}
