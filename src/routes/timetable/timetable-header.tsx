// useNavigate: 画面遷移用フック
import { useNavigate } from "react-router-dom"
// Button: ボタンUIコンポーネント
import { Button } from "../../components/ui/button"
// Settings: 設定アイコン（lucide-react）
import { Settings } from "lucide-react"

// TimetableHeaderのprops型
interface TimetableHeaderProps {
  studentId: string | null // 学生ID
}
  export const TimetableHeader = ({ studentId }: TimetableHeaderProps) => {//export:外でも関数を使えるようにする
  // タイムテーブル画面のヘッダーコンポーネント
  const navigate = useNavigate()

  return (
    // ヘッダー全体ラッパー
    <div className="flex items-center justify-between p-6 pb-4 bg-black border-b border-gray-700">
      {/* 左側スペース調整用div */}
      <div className="flex-1"></div>
      {/* 中央タイトル・最終更新 */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-white">TimeTable</h1>
        <div className="text-sm text-gray-400">
          最終更新 {new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      {/* 右側 設定ボタン */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/profile?studentId=${studentId}`)}
        >
          {/* 設定アイコン */}
          <Settings className="w-5 h-5 text-white" />
        </Button>
      </div>
    </div>
  )
}
