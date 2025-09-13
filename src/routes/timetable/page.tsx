import { useEffect, useState } from "react"
import { getRecreationEvents, type RecreationEvent } from "../../api"
import { useStudentId } from "../../hooks/useStudentId"
import { TimetableHeader } from "./timetable-header"
import { TimetableStats } from "./timetable-stats"
import { TimeSlotGrid } from "./time-slot-grid"

export default function TimetablePage() {
  const studentId = useStudentId()
  const [events, setEvents] = useState<RecreationEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showOnlyParticipating, setShowOnlyParticipating] = useState(false)

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

  const isParticipant = (event: RecreationEvent): boolean => {
    return studentId ? event.participants.includes(studentId) : false
  }

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

  const displayEvents = showOnlyParticipating ? participatingEvents : events



  return (
    <div className="min-h-screen bg-black text-white">
      <TimetableHeader studentId={studentId} />

      <TimetableStats
        events={events}
        participatingEvents={participatingEvents}
        nonParticipatingEvents={nonParticipatingEvents}
        showOnlyParticipating={showOnlyParticipating}
        onFilterChange={setShowOnlyParticipating}
        loading={loading}
      />

      <TimeSlotGrid
        displayEvents={displayEvents}
        studentId={studentId}
        loading={loading}
        showOnlyParticipating={showOnlyParticipating}
      />

      <div className="fixed bottom-2 left-0 right-0 text-center text-xs text-gray-500">
        © HAL Inc. ALL RIGHTS RESERVED.
      </div>
    </div>
  )
}
