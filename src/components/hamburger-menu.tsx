import { useState } from "react"
import { Button } from "./ui/button"
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"
import { Menu, User, Calendar, Bell, Hash } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function HamburgerMenu() {
  const [open, setOpen] = useState(false)
  const router = useNavigate()
  const studentId = localStorage.getItem("studentId")
  const menuItems = [
    { icon: Hash, label: "学籍番号入力", path: "/" },
    { icon: Calendar, label: "予定一覧", path: "/timetable" },
    { icon: Bell, label: "通知設定", path: "/notifications" },
    { icon: User, label: "学生情報確認", path: "/profile" },
  ]

  const handleNavigation = (path: string) => {
    if (path === "/" || !studentId) {
      router(path)
    } else {
      router(`${path}?studentId=${studentId}`)
    }
    setOpen(false)
  }

  return (
    // 位置固定 左上に配置
    <div className="fixed top-4 left-4 z-50">
      
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-gray-700">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 bg-white">
        <div className="flex flex-col space-y-4 mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">メニュー</h2>
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className="justify-start h-12 text-left"
              onClick={() => handleNavigation(item.path)}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
    </div>
  )
}
