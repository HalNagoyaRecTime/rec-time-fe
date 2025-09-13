import { useNavigate } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Settings } from "lucide-react"
import { HamburgerMenu } from "../../components/hamburger-menu"

interface TimetableHeaderProps {
  studentId: string | null
}

export function TimetableHeader({ studentId }: TimetableHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between p-6 pb-4 bg-black border-b border-gray-700">
      <HamburgerMenu />
      <div className="text-center">
        <h1 className="text-xl font-bold text-white">TimeTable</h1>
        <div className="text-sm text-gray-400">
          最終更新 {new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-400">学籍番号：{studentId}</div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/profile?studentId=${studentId}`)}
        >
          <Settings className="w-5 h-5 text-white" />
        </Button>
      </div>
    </div>
  )
}