import { useNavigate, useSearchParams } from "react-router-dom"
// Button: ボタンUIコンポーネント
import { Button } from "../../components/ui/button"
// Card: 枠付きのカードUIコンポーネント
import { Card } from "../../components/ui/card"
// Switch: ON/OFF切り替えスイッチUI
import { Switch } from "../../components/ui/switch"
// Edit: 編集アイコン（lucide-react）
import { Edit } from "lucide-react"
import { useEffect, useState } from "react"
// getStudentInfo: 学生情報取得API, StudentInfo: 学生情報型
import { getStudentInfo, type StudentInfo } from "../../api"

// 設定ページのメインコンポーネント
export default function SettingsPage() {
  // 画面遷移用フック
  const router = useNavigate()
  // URLクエリ取得用フック
  const [searchParams] = useSearchParams()
  // 学生ID（クエリ or ローカルストレージ）
  const studentId = searchParams.get("studentId") || localStorage.getItem("studentId") 
  // 学生情報
  const [studentData, setStudentData] = useState<StudentInfo | null>(null)
  // ローディング状態
  const [loading, setLoading] = useState(true)

  // 初回マウント時・studentId変更時に学生情報を取得
  useEffect(() => {
    if (!studentId) {
      router("/") // IDなければトップへ
      return
    }

    // 学生情報をAPIから取得
    const fetchStudentInfo = async () => {
      try {
        const studentInfo = await getStudentInfo(studentId)
        setStudentData(studentInfo)
      } catch (error) {
        console.error("学生情報の取得に失敗しました:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudentInfo()
  }, [studentId, router])

  // 学籍番号をクリアしてトップへ遷移
  const clearStudentId = () => {
    localStorage.removeItem("studentId")
    router("/")
  }

  // ローディング中の表示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #e0f2fe 0%, #f3e5f5 25%, #fff3e0 50%, #e8f5e8 75%, #fce4ec 100%)",
        }}
      >
        <div>読み込み中...</div>
      </div>
    )
  }

  // studentIdまたはstudentDataが無い場合は何も表示しない
  if (!studentId || !studentData) {
    return null
  }

  // 設定画面の表示
  return (
    // 画面全体のラッパーdiv
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #e0f2fe 0%, #f3e5f5 25%, #fff3e0 50%, #e8f5e8 75%, #fce4ec 100%)",
      }}
    >
      {/* 背景の装飾（ぼかし円） */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/40 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-16 w-24 h-24 bg-purple-200/40 rounded-full blur-lg"></div>
        <div className="absolute bottom-32 left-20 w-28 h-28 bg-yellow-200/40 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-12 w-20 h-20 bg-green-200/40 rounded-full blur-lg"></div>
        <div className="absolute top-60 left-1/2 w-16 h-16 bg-pink-200/40 rounded-full blur-md"></div>
      </div>

      <div className="relative z-10 p-6">
        {/* ヘッダー部分 */}
        <div className="flex items-center justify-between mb-8">
          {/* ハンバーガーメニュー風アイコンボタン */}
          <Button variant="ghost" size="icon">
            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
              <div className="w-full h-0.5 bg-gray-600"></div>
              <div className="w-full h-0.5 bg-gray-600"></div>
              <div className="w-full h-0.5 bg-gray-600"></div>
            </div>
          </Button>
          {/* ページタイトル */}
          <h1 className="text-xl font-bold text-gray-700">設定</h1>
          {/* 右側スペース調整用div */}
          <div className="w-10"></div>
        </div>

        {/* 学生情報カード */}
        <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">学籍番号</div>
              <div className="text-3xl font-bold text-gray-700">{studentId}</div>
            </div>
            {/* 編集ボタン（アイコン） */}
            <Button variant="ghost" size="icon" className="text-blue-500">
              <Edit className="w-5 h-5" />
            </Button>
          </div>

          {/* クラス・出席番号・氏名 */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">クラス</span>
              <span className="font-semibold text-gray-700">{studentData.class}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">出席番号</span>
              <span className="font-semibold text-gray-700">{studentData.attendanceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">氏名</span>
              <span className="font-semibold text-gray-700">{studentData.name}</span>
            </div>
          </div>
        </Card>

        {/* プッシュ通知設定カード */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* プッシュ通知アイコン風 */}
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <span className="font-semibold text-gray-700">プッシュ通知</span>
            </div>
            {/* スイッチ（ON/OFF） */}
            <Switch defaultChecked />
          </div>
        </Card>

        {/* 下部のアクションボタン群 */}
        <div className="fixed bottom-6 left-6 right-6 flex gap-4">
          {/* タイムテーブル遷移ボタン */}
          <Button
            variant="outline"
            className="flex-1 bg-white/80 backdrop-blur-sm border-2 border-gray-200"
            onClick={() => router(`/timetable?studentId=${studentId}`)}
          >
            タイムテーブル
          </Button>
          {/* 学籍番号変更ボタン */}
          <Button
            variant="outline"
            className="flex-1 bg-white/80 backdrop-blur-sm border-2 border-gray-200"
            onClick={clearStudentId}
          >
            学籍番号変更
          </Button>
        </div>
      </div>
    </div>
  )
}
