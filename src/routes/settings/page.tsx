import { useLocation, useNavigate, } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Switch } from "../../components/ui/switch"
import { Edit } from "lucide-react"

export default function SettingsPage() {
  const router = useNavigate()
  const location = useLocation()

  const studentId = new URLSearchParams(location.search).get("studentId") || "40571" 

  const getStudentData = (id: string) => {
    const students: Record<string, { class: string, attendance: string, name: string }> = {
      "40571": { class: "JH12A203", attendance: "20", name: "春花子" },
      "99999": { class: "JH12A204", attendance: "15", name: "田中太郎" },
    }
    return students[id] || { class: "JH12A203", attendance: "01", name: "未登録" }
  }

  const studentData = getStudentData(studentId)

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #e0f2fe 0%, #f3e5f5 25%, #fff3e0 50%, #e8f5e8 75%, #fce4ec 100%)",
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/40 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-16 w-24 h-24 bg-purple-200/40 rounded-full blur-lg"></div>
        <div className="absolute bottom-32 left-20 w-28 h-28 bg-yellow-200/40 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-12 w-20 h-20 bg-green-200/40 rounded-full blur-lg"></div>
        <div className="absolute top-60 left-1/2 w-16 h-16 bg-pink-200/40 rounded-full blur-md"></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="icon">
            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
              <div className="w-full h-0.5 bg-gray-600"></div>
              <div className="w-full h-0.5 bg-gray-600"></div>
              <div className="w-full h-0.5 bg-gray-600"></div>
            </div>
          </Button>
          <h1 className="text-xl font-bold text-gray-700">設定</h1>
          <div className="w-10"></div>
        </div>

        <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">学籍番号</div>
              <div className="text-3xl font-bold text-gray-700">{studentId}</div>
            </div>
            <Button variant="ghost" size="icon" className="text-blue-500">
              <Edit className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">クラス</span>
              <span className="font-semibold text-gray-700">{studentData.class}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">出席番号</span>
              <span className="font-semibold text-gray-700">{studentData.attendance}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">氏名</span>
              <span className="font-semibold text-gray-700">{studentData.name}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white/80 backdrop-blur-sm border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <span className="font-semibold text-gray-700">プッシュ通知</span>
            </div>
            <Switch defaultChecked />
          </div>
        </Card>

        <div className="fixed bottom-6 left-6 right-6 flex gap-4">
          <Button
            variant="outline"
            className="flex-1 bg-white/80 backdrop-blur-sm border-2 border-gray-200"
            onClick={() => router(`/timetable?studentId=${studentId}`)}
          >
            タイムテーブル
          </Button>
          <Button
            variant="outline"
            className="flex-1 bg-white/80 backdrop-blur-sm border-2 border-gray-200"
            onClick={() => router("/")}
          >
            学籍番号変更
          </Button>
        </div>
      </div>
    </div>
  )
}
