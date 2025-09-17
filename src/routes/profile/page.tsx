import { useNavigate, useSearchParams } from "react-router-dom"
// Card: 枠付きのカードUIコンポーネント
import { Card } from "../../components/ui/card"
// Label: ラベル表示用UIコンポーネント
import { Label } from "../../components/ui/label"
// User: ユーザーアイコン（lucide-react）
import { User } from "lucide-react"
import { useEffect, useState } from "react"
// getStudentInfo: 学生情報取得API, StudentInfo: 学生情報型
import { getStudentInfo, type StudentInfo } from "../../api"

// 学生プロフィールページのメインコンポーネント
export default function ProfilePage() {
  // 画面遷移用フック
  const navigate = useNavigate()
  // URLクエリ取得用フック
  const [searchParams] = useSearchParams()
  // 学生ID（クエリ or ローカルストレージ）
  const studentId = searchParams.get("studentId") || localStorage.getItem("studentId")
  // 学生プロフィール情報
  const [profile, setProfile] = useState<StudentInfo | null>(null)
  // ローディング状態
  const [loading, setLoading] = useState(true)

  // 初回マウント時・studentId変更時に学生情報を取得
  useEffect(() => {
    if (!studentId) {
      navigate("/") // IDなければトップへ
      return
    }

    // 学生情報をAPIから取得
    const fetchStudentInfo = async () => {
      try {
        const studentInfo = await getStudentInfo(studentId)
        setProfile(studentInfo)
      } catch (error) {
        console.error("学生情報の取得に失敗しました:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudentInfo()
  }, [studentId, navigate])

  // ローディング中の表示
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>読み込み中...</div>
      </div>
    )
  }

  // studentIdが無い場合は何も表示しない
  if (!studentId) {
    return null
  }

  // プロフィール情報が無い場合のエラー表示
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>学生情報が見つかりませんでした</div>
      </div>
    )
  }

  // プロフィール情報の表示
  return (
    // 画面全体のラッパーdiv
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー部分 */}
      <div className="flex items-center justify-center p-6 pb-4 bg-white border-b border-gray-200">
        {/* ページタイトル */}
        <h1 className="text-xl font-bold text-gray-800">学生情報確認</h1>
      </div>

      {/* プロフィールカード */}
      <div className="p-6">
        <Card className="p-6 bg-white border border-gray-200 shadow-sm">
          {/* アイコンとタイトル */}
          <div className="flex items-center space-x-3 mb-6">
            {/* ユーザーアイコン */}
            <User className="w-8 h-8 text-gray-600" />
            <div>
              <div className="text-lg font-bold text-gray-800">学生情報</div>
              <div className="text-sm text-gray-600">個人情報の確認</div>
            </div>
          </div>

          {/* 各項目の表示 */}
          <div className="space-y-4">
            {/* 学籍番号 */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                学籍番号
              </Label>
              <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-800">
                {profile.studentId}
              </div>
            </div>

            {/* クラス記号 */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                クラス記号
              </Label>
              <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-800">
                {profile.class}
              </div>
            </div>

            {/* 出席番号 */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                出席番号
              </Label>
              <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-800">
                {profile.attendanceNumber}
              </div>
            </div>

            {/* 氏名 */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                氏名
              </Label>
              <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-800">
                {profile.name}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
