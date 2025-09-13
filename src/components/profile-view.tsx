"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { User, Hash, Users, Calendar } from "lucide-react"
import type { StudentInfo } from "../api"

interface ProfileViewProps {
  student: StudentInfo
}

export function ProfileView({ student }: ProfileViewProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">プロフィール</h1>
        <p className="text-muted-foreground">学生情報</p>
      </div>

      {/* Student Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            学生情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">学籍番号</span>
              </div>
              <Badge variant="outline" className="font-mono">
                {student.studentId}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">クラス記号</span>
              </div>
              <Badge variant="secondary">{student.class}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">出席番号</span>
              </div>
              <Badge variant="outline">{student.attendanceNumber}</Badge>
            </div>

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

      {/* Activity Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            参加統計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-participating/10 rounded-lg">
              <div className="text-2xl font-bold text-participating">3</div>
              <div className="text-sm text-muted-foreground">参加予定</div>
            </div>
            <div className="text-center p-4 bg-interested/10 rounded-lg">
              <div className="text-2xl font-bold text-interested">1</div>
              <div className="text-sm text-muted-foreground">興味あり</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>最近の活動</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 border-l-4 border-participating bg-participating/5">
              <span className="text-sm">バスケットボール大会</span>
              <Badge className="bg-participating text-participating-foreground">参加</Badge>
            </div>
            <div className="flex items-center justify-between p-2 border-l-4 border-interested bg-interested/5">
              <span className="text-sm">文化祭準備</span>
              <Badge className="bg-interested text-interested-foreground">興味あり</Badge>
            </div>
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
