
// ボトムナビゲーション（画面下部のメニュー）コンポーネント
"use client"

// Calendar, User: アイコンコンポーネント（lucide-react）
import { Calendar, User } from "lucide-react"
// Button: ボタンUIコンポーネント
import { Button } from "./ui/button"


// BottomNavigationのprops型
interface BottomNavigationProps {
  currentView: "schedule" | "profile" // 現在表示中のビュー
  onViewChange: (view: "schedule" | "profile") => void // ビュー切替ハンドラ
}

export const BottomNavigation = ({ currentView, onViewChange }: BottomNavigationProps) => {
  // JSX描画
  return (
    // 画面下部に固定配置
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      {/* メニューボタンを横並びで配置 */}
      <div className="flex items-center justify-around p-2">
        {/* スケジュールボタン */}
        <Button
          variant={currentView === "schedule" ? "default" : "ghost"}
          size="lg"
          onClick={() => onViewChange("schedule")}
          className="flex-1 flex flex-col items-center gap-1 h-auto py-3"
        >
          {/* カレンダーアイコン */}
          <Calendar className="h-5 w-5" />
          <span className="text-xs">スケジュール</span>
        </Button>
        {/* プロフィールボタン */}
        <Button
          variant={currentView === "profile" ? "default" : "ghost"}
          size="lg"
          onClick={() => onViewChange("profile")}
          className="flex-1 flex flex-col items-center gap-1 h-auto py-3"
        >
          {/* ユーザーアイコン */}
          <User className="h-5 w-5" />
          <span className="text-xs">プロフィール</span>
        </Button>
      </div>
    </div>
  )
}
