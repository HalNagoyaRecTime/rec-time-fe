import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Switch } from "../../components/ui/switch" 
import { HamburgerMenu } from "../../components/hamburger-menu"
import { Bell, Clock, Calendar, Users } from "lucide-react"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState({
    schedule: true,
    reminder: true,
    updates: false,
    participation: true,
  })

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-gray-200">
        <HamburgerMenu />
        <h1 className="text-xl font-bold text-gray-800">通知設定</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-6 space-y-4">
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-semibold text-gray-800">スケジュール通知</div>
                <div className="text-sm text-gray-600">新しい予定が追加された時</div>
              </div>
            </div>
            <Switch checked={notifications.schedule} onCheckedChange={() => handleToggle("schedule")} />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-semibold text-gray-800">リマインダー</div>
                <div className="text-sm text-gray-600">予定開始30分前</div>
              </div>
            </div>
            <Switch checked={notifications.reminder} onCheckedChange={() => handleToggle("reminder")} />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-semibold text-gray-800">アップデート通知</div>
                <div className="text-sm text-gray-600">アプリの更新情報</div>
              </div>
            </div>
            <Switch checked={notifications.updates} onCheckedChange={() => handleToggle("updates")} />
          </div>
        </Card>

        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-semibold text-gray-800">参加状況通知</div>
                <div className="text-sm text-gray-600">他の参加者の更新</div>
              </div>
            </div>
            <Switch checked={notifications.participation} onCheckedChange={() => handleToggle("participation")} />
          </div>
        </Card>

        <div className="pt-6">
          <Button className="w-full bg-gray-800 hover:bg-gray-900 text-white">設定を保存</Button>
        </div>
      </div>
    </div>
  )
}
