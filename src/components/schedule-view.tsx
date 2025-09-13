import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Calendar, Clock, Users, MapPin } from "lucide-react"
import { formatTime } from "../api"
import type { StudentInfo } from "../api"
interface ScheduleViewProps {
  student: StudentInfo
}




const categoryColors = {
  sports: "bg-blue-100 text-blue-800",
  arts: "bg-purple-100 text-purple-800",
  social: "bg-green-100 text-green-800",
  academic: "bg-orange-100 text-orange-800",
}

interface Activity {
  id: string;
  title: string;
  description: string;
  time: number;
  duration: number;
  participationStatus: "participating" | "interested" | "not-attending" | null;
  category: "sports" | "arts" | "social" | "academic";
}
  
export function ScheduleView({ student }: ScheduleViewProps) {
  const [activities, setActivities] = useState<Activity[]>([])

  const updateParticipation = (activityId: string, status: "participating" | "interested" | "not-attending" | null) => {
    setActivities((prev) =>
      prev.map((activity) => (activity.id === activityId ? { ...activity, participationStatus: status } : activity)),
    )
  } 

  const getParticipationColor = (status: "participating" | "interested" | "not-attending" | null) => {
    switch (status) {
      case "participating":
        return "bg-participating text-participating-foreground"
      case "interested":
        return "bg-interested text-interested-foreground"
      case "not-attending":
        return "bg-not-attending text-not-attending-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getParticipationText = (status: 
    "participating" | "interested" | "not-attending" | null
  ) => {
    switch (status) {
      case "participating":
        return "参加"
      case "interested":
        return "興味あり"
      case "not-attending":
        return "不参加"
      default:
        return "未定"
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">今日のスケジュール</h1>
          <p className="text-muted-foreground">
            {student.name}さん ({student.class}-{student.attendanceNumber})
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString("ja-JP")}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <Card key={activity.id} className="relative overflow-hidden">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
            {index === activities.length - 1 && (
              <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-transparent" />
            )}

            {/* Timeline dot */}
            <div
              className={`absolute left-4 top-6 w-4 h-4 rounded-full border-2 border-background ${getParticipationColor(
                activity.participationStatus,
              )}`}
            />

            <CardHeader className="pl-12 pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={categoryColors[activity.category as keyof typeof categoryColors]}>{activity.category}</Badge>
                  </div>
                  <CardTitle className="text-lg">{activity.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatTime(activity.time)} ({activity.duration}分)
                      </span>
                    </div>
                  </div>
                </div>
                <Badge className={getParticipationColor(activity.participationStatus)}>
                  {getParticipationText(activity.participationStatus)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pl-12 pt-0">
              <p className="text-sm text-muted-foreground mb-3">{activity.description}</p>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={activity.participationStatus === "participating" ? "default" : "outline"}
                  onClick={() => updateParticipation(activity.id, "participating")}
                  className={
                    activity.participationStatus === "participating"
                      ? "bg-participating text-participating-foreground hover:bg-participating/90"
                      : ""
                  }
                >
                  参加
                </Button>
                <Button
                  size="sm"
                  variant={activity.participationStatus === "interested" ? "default" : "outline"}
                  onClick={() => updateParticipation(activity.id, "interested")}
                  className={
                    activity.participationStatus === "interested"
                      ? "bg-interested text-interested-foreground hover:bg-interested/90"
                      : ""
                  }
                >
                  興味あり
                </Button>
                <Button
                  size="sm"
                  variant={activity.participationStatus === "not-attending" ? "default" : "outline"}
                  onClick={() => updateParticipation(activity.id, "not-attending")}
                  className={
                    activity.participationStatus === "not-attending"
                      ? "bg-not-attending text-not-attending-foreground hover:bg-not-attending/90"
                      : ""
                  }
                >
                  不参加
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-participating" />
              <span>
                参加予定:{" "}
                <span className="font-semibold text-participating">
                  {activities.filter((a) => a.participationStatus === "participating").length}件
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-interested" />
              <span>
                興味あり:{" "}
                <span className="font-semibold text-interested">
                  {activities.filter((a) => a.participationStatus === "interested").length}件
                </span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
