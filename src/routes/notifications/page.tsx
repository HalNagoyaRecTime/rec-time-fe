import { useState } from "react"
// Button: ボタンUIコンポーネント
import { Button } from "../../components/ui/button"
// Card: 枠付きのカードUIコンポーネント
import { Card } from "../../components/ui/card"
// Switch: ON/OFF切り替えスイッチUI
import { Switch } from "../../components/ui/switch"
// lucide-react: アイコンコンポーネント集
import { Bell, Clock, Calendar, Users } from "lucide-react"

// 通知設定ページのメインコンポーネント
export default function NotificationsPage() {

  // 通知設定の状態管理
  const [notifications, setNotifications] = useState({
    schedule: true,        // スケジュール通知
    reminder: true,        // リマインダー
    updates: false,        // アップデート通知
    participation: true,   // 参加状況通知
  })

  // スイッチ切り替え時のハンドラ
  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key], // 指定した通知のON/OFFを反転
    }))
  }

  return (
    // 画面全体のラッパーdiv
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー部分 */}
      <div className="flex items-center justify-center p-6 pb-4 bg-white border-b border-gray-200">
        {/* ページタイトル */}
        <h1 className="text-xl font-bold text-gray-800">通知設定</h1>
      </div>

      {/* 通知設定カード群 */}
      <div className="p-6 space-y-4">
        {/* スケジュール通知カード */}
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* カレンダーアイコン */}
              <Calendar className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-semibold text-gray-800">スケジュール通知</div>
                <div className="text-sm text-gray-600">新しい予定が追加された時</div>
              </div>
            </div>
            {/* スイッチ（ON/OFF） */}
            <Switch checked={notifications.schedule} onCheckedChange={() => handleToggle("schedule")} />
          </div>
        </Card>

        {/* リマインダー通知カード */}
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* 時計アイコン */}
              <Clock className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-semibold text-gray-800">リマインダー</div>
                <div className="text-sm text-gray-600">予定開始30分前</div>
              </div>
            </div>
            {/* スイッチ（ON/OFF） */}
            <Switch checked={notifications.reminder} onCheckedChange={() => handleToggle("reminder")} />
          </div>
        </Card>

        {/* アップデート通知カード */}
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* ベルアイコン */}
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-semibold text-gray-800">アップデート通知</div>
                <div className="text-sm text-gray-600">アプリの更新情報</div>
              </div>
            </div>
            {/* スイッチ（ON/OFF） */}
            <Switch checked={notifications.updates} onCheckedChange={() => handleToggle("updates")} />
          </div>
        </Card>

        {/* 参加状況通知カード */}
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* ユーザーアイコン */}
              <Users className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-semibold text-gray-800">参加状況通知</div>
                <div className="text-sm text-gray-600">他の参加者の更新</div>
              </div>
            </div>
            {/* スイッチ（ON/OFF） */}
            <Switch checked={notifications.participation} onCheckedChange={() => handleToggle("participation")} />
          </div>
        </Card>

        {/* 設定を保存ボタン */}
        <div className="pt-6">
          <Button className="w-full bg-gray-800 hover:bg-gray-900 text-white">設定を保存</Button>
        </div>
      </div>
    </div>
  )
}
