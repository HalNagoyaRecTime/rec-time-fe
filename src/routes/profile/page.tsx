import { useLocation,  } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { HamburgerMenu } from "../../components/hamburger-menu"
import { User, Edit3, Save } from "lucide-react"
import { useState } from "react"

export default function ProfilePage() {
  const location = useLocation()
  const studentId = new URLSearchParams(location.search).get("studentId") || "99999"

  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    studentId: studentId,
    class: "JH12A203",
    attendanceNumber: "20",
    name: "春花子",
  })

  const handleSave = () => {
    setIsEditing(false)
    // ここで保存処理を実装
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-gray-200">
        <HamburgerMenu />
        <h1 className="text-xl font-bold text-gray-800">学生情報確認</h1>
        <Button variant="ghost" size="icon" onClick={() => (isEditing ? handleSave() : setIsEditing(true))}>
          {isEditing ? <Save className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
        </Button>
      </div>

      <div className="p-6">
        <Card className="p-6 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <User className="w-8 h-8 text-gray-600" />
            <div>
              <div className="text-lg font-bold text-gray-800">学生情報</div>
              <div className="text-sm text-gray-600">個人情報の確認・編集</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="studentId" className="text-sm font-medium text-gray-700">
                学籍番号
              </Label>
              <Input
                id="studentId"
                value={profile.studentId}
                onChange={(e) => setProfile((prev) => ({ ...prev, studentId: e.target.value }))}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="class" className="text-sm font-medium text-gray-700">
                クラス記号
              </Label>
              <Input
                id="class"
                value={profile.class}
                onChange={(e) => setProfile((prev) => ({ ...prev, class: e.target.value }))}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="attendanceNumber" className="text-sm font-medium text-gray-700">
                出席番号
              </Label>
              <Input
                id="attendanceNumber"
                value={profile.attendanceNumber}
                onChange={(e) => setProfile((prev) => ({ ...prev, attendanceNumber: e.target.value }))}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                氏名
              </Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} className="flex-1 bg-gray-800 hover:bg-gray-900 text-white">
                保存
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                キャンセル
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
