// ハンバーガーメニュー（左上のメニューアイコン）コンポーネント
import { useState } from "react"
// Button: ボタンUIコンポーネント
import { Button } from "./ui/button"
// Sheet, SheetContent, SheetTrigger: サイドメニュー用UI
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"
// Menu, User, Calendar, Bell, Hash: アイコンコンポーネント（lucide-react）
import { Menu, User, Calendar, Bell, Hash } from "lucide-react"
// useNavigate: 画面遷移用フック
import { useNavigate } from "react-router-dom"

export const HamburgerMenu = () => {
  // メニュー開閉状態
  const [open, setOpen] = useState(false)
  // 画面遷移用
  const router = useNavigate()
  // ローカルストレージから学生ID取得
  const studentId = localStorage.getItem("studentId")
  // メニュー項目リスト
  const menuItems = [
    { icon: Hash, label: "学籍番号入力", path: "/" },
    { icon: Calendar, label: "予定一覧", path: "/timetable" },
    { icon: Bell, label: "通知設定", path: "/notifications" },
    { icon: User, label: "学生情報確認", path: "/profile" },
  ]

  // メニュー項目クリック時の遷移処理
  const handleNavigation = (path: string) => {
    if (path === "/" || !studentId) {
      router(path)
    } else {
      router(`${path}?studentId=${studentId}`)
    }
    setOpen(false)
  }

  // JSX描画
  return (
    // 位置固定 左上に配置
    <div className="fixed top-4 left-4 z-50">
      {/* サイドメニュー本体 */}
      <Sheet open={open} onOpenChange={setOpen}>
        {/* メニュー開閉トリガー（ハンバーガーアイコン） */}
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-gray-700">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        {/* メニュー内容 */}
        <SheetContent side="left" className="w-80 bg-white">
          <div className="flex flex-col space-y-4 mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">メニュー</h2>
            {/* メニュー項目リスト */}
            {menuItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className="justify-start h-12 text-left"
                onClick={() => handleNavigation(item.path)}
              >
                {/* アイコンとラベル */}
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
