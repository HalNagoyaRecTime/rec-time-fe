import { useLocation } from "react-router-dom"
import { Card } from "../../components/ui/card"
import { Label } from "../../components/ui/label"
import { HamburgerMenu } from "../../components/hamburger-menu"
import { User } from "lucide-react"

export default function ProfilePage() {
  const location = useLocation()
  const studentId = new URLSearchParams(location.search).get("studentId") || "99999"

  const profile = {
    studentId: studentId,
    class: "JH12A203",
    attendanceNumber: "20",
    name: "春花子",
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-gray-200">
        <HamburgerMenu />
        <h1 className="text-xl font-bold text-gray-800">学生情報確認</h1>
        <div></div>
      </div>

      <div className="p-6">
        <Card className="p-6 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <User className="w-8 h-8 text-gray-600" />
            <div>
              <div className="text-lg font-bold text-gray-800">学生情報</div>
              <div className="text-sm text-gray-600">個人情報の確認</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                学籍番号
              </Label>
              <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-800">
                {profile.studentId}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                クラス記号
              </Label>
              <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-800">
                {profile.class}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                出席番号
              </Label>
              <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-800">
                {profile.attendanceNumber}
              </div>
            </div>

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
