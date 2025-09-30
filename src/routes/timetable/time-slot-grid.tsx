import { formatTime } from "../../api"
import type { RecreationEvent } from "../../api/recreation"
import React, { useState, useEffect } from 'react';

interface CurrentTimeIndicatorProps {
  timelineStartHour: number;
  timelineEndHour: number;
  pixelsPerMinute: number; // 1分あたりのピクセル数を指定
}

const CurrentTimeIndicator = ({ timelineStartHour, timelineEndHour, pixelsPerMinute }: CurrentTimeIndicatorProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // 1分ごとに現在時刻を更新するタイマーを設定
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 60秒

    // コンポーネントがアンマウントされる時にタイマーを解除
    return () => clearInterval(intervalId);
  }, []); // 初回レンダリング時にのみ実行

  const currentHour = currentTime.getHours();
  if(currentHour < timelineStartHour || currentHour >= timelineEndHour) {
    return null;
  }


  // タイムライン開始時刻からの経過分数を計算
  const startMinutes = timelineStartHour * 60;
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const elapsedMinutes = currentMinutes - startMinutes;

  // 経過分数と1分あたりのピクセル数からtopの位置を計算
  const topPosition = elapsedMinutes * pixelsPerMinute;

  // 表示用の時刻をフォーマット (例: 13:06)
  const formattedTime = currentTime.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: `${topPosition}px`, // 計算した位置をtopに設定
        left: 0, // left-24 の領域内に配置するため0にする
        right: 0,
        display: 'flex',
        alignItems: 'center',
        height: '2px',
        backgroundColor: 'gold',
        zIndex: 20, // イベント(zIndex: 10)より手前に表示
      }}
    >
      <span
        style={{
          backgroundColor: 'gold',
          color: 'black',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          // 線の左端からの相対位置
          position: 'absolute',
          left: '-2.5rem', // text-gray-300の領域にはみ出すように調整
          transform: 'translateY(-50%)', // 線の真ん中に来るように調整
        }}
      >
        {formattedTime}
      </span>
    </div>
  );
};

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
    for (let hour = 9; hour <= 20; hour++) {
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

  const calculateEventLayout = (events: RecreationEvent[]) => {
    const eventPositions = new Map<number, { top: number; height: number; column: number; totalColumns: number }>()
    const sortedEvents = [...events].sort((a, b) => a.startTime - b.startTime)
    const columns: Array<{ events: RecreationEvent[]; endTime: number }> = []

    sortedEvents.forEach(event => {
      const startHours = Math.floor(event.startTime / 100)
      const startMinutes = event.startTime % 100
      const startTotalMinutes = startHours * 60 + startMinutes
      // 基準の時刻を9時に変更
      const baseMinutes = 9 * 60
      const eventStartUnits = Math.floor((startTotalMinutes - baseMinutes) / 15)

      let columnIndex = columns.findIndex(col => col.endTime <= event.startTime)
      if (columnIndex === -1) {
        columnIndex = columns.length
        columns.push({ events: [], endTime: 0 })
      }

      columns[columnIndex].events.push(event)
      columns[columnIndex].endTime = event.endTime

      eventPositions.set(event.id, {
        top: eventStartUnits * 16,
        height: getEventDurationUnits(event) * 16 - 2,
        column: columnIndex,
        totalColumns: 0
      })
    })

    eventPositions.forEach((position) => {
      // 重なり合うイベントグループごとにカラム数を計算
      const overlappingEvents = sortedEvents.filter(e => {
          const eLayout = eventPositions.get(e.id);
          const pLayout = position;
          if (!eLayout) return false;
          // 簡単な重なり判定: 開始時間と終了時間が少しでも被るか
          const pEndTop = pLayout.top + pLayout.height;
          const eEndTop = eLayout.top + eLayout.height;
          return Math.max(pLayout.top, eLayout.top) < Math.min(pEndTop, eEndTop);
      });
      position.totalColumns = new Set(overlappingEvents.map(e => eventPositions.get(e.id)?.column)).size;
    })

    return eventPositions
  }

  const eventLayout = calculateEventLayout(displayEvents)

  return (
    <div className="relative">
      {/* タイムスロット背景 */}
      {timeSlots.map((timeSlot, index) => {
        const slotHeight = 16
        const isHourStart = index % 4 === 0

        return (
          <div key={index} className="relative">
            <div className="flex" style={{ zIndex: 1 }}>
              <div
                className={`w-24 text-sm text-gray-300 border-r flex items-center ${
                  isHourStart ? 'bg-gray-800 font-medium' : 'bg-gray-900'
                }`}
                style={{ height: `${slotHeight}px` }}
              >
                <div className="px-2">
                  {isHourStart ? timeSlot.display.substring(2) : ''}
                </div>
              </div>
              <div className="flex-1 relative" style={{ height: `${slotHeight}px` }}>
                {isHourStart && (
                  <div className="absolute top-0 left-0 w-full h-px bg-gray-600"></div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* イベント表示と現在時刻インジケーターのコンテナ */}
      <div className="absolute top-0 left-24 right-0" style={{ height: `${timeSlots.length * 16}px` }}>
        <CurrentTimeIndicator
          timelineStartHour={9}
          timelineEndHour={20}
          pixelsPerMinute={16 / 15} // 15分で16px -> 1分あたりは 16/15 px
        />

        {displayEvents.map((event) => {
          const participant = isParticipant(event)
          const durationUnits = getEventDurationUnits(event)
          const durationInMinutes = durationUnits * 15
          const layout = eventLayout.get(event.id)

          if (!layout) return null
          
          const getOptimalWidth = (totalColumns: number) => {
             if (totalColumns === 1) return 'calc(100% - 8px)'
             return `calc(${100 / totalColumns}% - 4px)`
          }

          const getOptimalLeft = (column: number, totalColumns: number) => {
              if (totalColumns === 1) return '4px'
              return `calc(${ (column * 100) / totalColumns }% + 2px)`
          }

          const width = getOptimalWidth(layout.totalColumns)
          const left = getOptimalLeft(layout.column, layout.totalColumns)

          return (
            <div
              key={event.id}
              className={`absolute text-black rounded p-1 shadow-sm transition-all hover:shadow-md cursor-pointer text-xs ${
                participant
                  ? 'bg-green-400 hover:bg-green-500'
                  : 'bg-amber-200 hover:bg-amber-300'
              }`}
              style={{
                top: `${layout.top}px`,
                height: `${Math.max(layout.height, 12)}px`,
                left: left,
                width: width,
                zIndex: 10,
              }}
              title={`${event.title} - ${formatTime(event.startTime)}〜${formatTime(event.endTime)} (${durationUnits}単位 = ${formatDuration(durationUnits)}) ${participant ? '(参加予定)' : ''}`}
            >
              <div className="font-medium truncate" style={{ fontSize: '10px', lineHeight: '12px' }}>
                {event.title}
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
        <div className="absolute top-0 left-24 right-0 text-center py-8 text-gray-400">
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