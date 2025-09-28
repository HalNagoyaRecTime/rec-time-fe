import { useNavigate } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { HamburgerMenu } from "../../components/hamburger-menu"

interface TimetableHeaderProps {
  studentId: string | null
}

export function TimetableHeader({ studentId }: TimetableHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between p-4 bg-blue-900 border-b border-gray-700">
      <div className="flex-1"></div>
      <div className="flex items-center gap-4">
        <HamburgerMenu />
        <div>
          <h1 className="text-5xl font-bold text-yellow-300">TimeTable</h1>
        </div>
      </div>

      <div>
        <span className="ml-9 text-sm text-gray-300">
          最終更新 {new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-1 justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/profile?studentId=${studentId}`)}
        >
        </Button>
      </div>
    </div>
  )
}
