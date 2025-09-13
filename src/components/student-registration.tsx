
import type React from "react"

import { useState } from "react"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"

interface Student {
  studentId: string
  classSymbol: string
  attendanceNumber: string
  name: string
}

interface StudentRegistrationProps {
  onRegister: (student: Student) => void
}

export function StudentRegistration({ onRegister }: StudentRegistrationProps) {
  const [formData, setFormData] = useState({
    studentId: "",
    classSymbol: "",
    attendanceNumber: "",
    name: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.studentId.length === 5 && formData.classSymbol && formData.attendanceNumber && formData.name) {
      onRegister(formData)
    }
  }

  const handleStudentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 5)
    setFormData((prev) => ({ ...prev, studentId: value }))
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">レクスケジュール</CardTitle>
          <CardDescription>学生情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">学籍番号（5桁）</Label>
              <Input
                id="studentId"
                type="text"
                placeholder="12345"
                value={formData.studentId}
                onChange={handleStudentIdChange}
                maxLength={5}
                className="text-center text-lg font-mono"
              />
              <p className="text-sm text-muted-foreground">{formData.studentId.length}/5桁</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="classSymbol">クラス記号</Label>
              <Input
                id="classSymbol"
                type="text"
                placeholder="例: 3A"
                value={formData.classSymbol}
                onChange={(e) => setFormData((prev) => ({ ...prev, classSymbol: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendanceNumber">出席番号</Label>
              <Input
                id="attendanceNumber"
                type="text"
                placeholder="例: 15"
                value={formData.attendanceNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, attendanceNumber: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                type="text"
                placeholder="山田太郎"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                formData.studentId.length !== 5 || !formData.classSymbol || !formData.attendanceNumber || !formData.name
              }
            >
              登録
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
