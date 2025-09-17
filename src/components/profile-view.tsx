
// プロフィール表示コンポーネント
"use client"


import { User, Users, Calendar,Hash } from "lucide-react"
// StudentInfo: 学生情報型
import type { StudentInfo } from "../api"
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"

// ProfileViewのprops型
interface ProfileViewProps {
  student: StudentInfo // 学生情報
}
export function ProfileView({ student }: ProfileViewProps) {  
  // JSX描画
  return (
    <div className="p-4 space-y-4">
      {/* ヘッダー部分 */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">プロフィール</h1>
        <p className="text-muted-foreground">学生情報</p>
      </div>

      {/* 学生情報カード */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {/* ユーザーアイコン */}
            <User className="h-5 w-5 text-primary" />
            学生情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* 学籍番号 */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">学籍番号</span>
              </div>
              <Badge variant="outline" className="font-mono">
                {student.studentId}
              </Badge>
            </div>

            {/* クラス記号 */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">クラス記号</span>
              </div>
              <Badge variant="secondary">{student.class}</Badge>
            </div>

            {/* 出席番号 */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">出席番号</span>
              </div>
              <Badge variant="outline">{student.attendanceNumber}</Badge>
            </div>

            {/* 名前 */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">名前</span>
              </div>
              <span className="font-semibold">{student.name}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 参加統計カード */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {/* カレンダーアイコン */}
            <Calendar className="h-5 w-5 text-primary" />
            参加統計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* 参加予定数 */}
            <div className="text-center p-4 bg-participating/10 rounded-lg">
              <div className="text-2xl font-bold text-participating">3</div>
              <div className="text-sm text-muted-foreground">参加予定</div>
            </div>
            {/* 興味あり数 */}
            <div className="text-center p-4 bg-interested/10 rounded-lg">
              <div className="text-2xl font-bold text-interested">1</div>
              <div className="text-sm text-muted-foreground">興味あり</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 最近の活動カード */}
      <Card>
        <CardHeader>
          <CardTitle>最近の活動</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* 参加した活動 */}
            <div className="flex items-center justify-between p-2 border-l-4 border-participating bg-participating/5">
              <span className="text-sm">バスケットボール大会</span>
              <Badge className="bg-participating text-participating-foreground">参加</Badge>
            </div>
            {/* 興味あり活動 */}
            <div className="flex items-center justify-between p-2 border-l-4 border-interested bg-interested/5">
              <span className="text-sm">文化祭準備</span>
              <Badge className="bg-interested text-interested-foreground">興味あり</Badge>
            </div>
            {/* 参加した活動 */}
            <div className="flex items-center justify-between p-2 border-l-4 border-participating bg-participating/5">
              <span className="text-sm">サッカー練習</span>
              <Badge className="bg-participating text-participating-foreground">参加</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
