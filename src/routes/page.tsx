import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { NumberKeypad } from "./number-keypad"

export default function StudentIdInputPage() {
  const [inputStudentId, setInputStudentId] = useState("")
  const navigate = useNavigate()

  const handleNumberClick = (num: string) => {
    if (inputStudentId.length < 5) {
      setInputStudentId((prev) => prev + num)
    }
  }

  const handleClear = () => {
    setInputStudentId("")
  }

  const handleSubmit = () => {
    if (inputStudentId.length === 5) {
      localStorage.setItem("studentId", inputStudentId)
      navigate(`/timetable?studentId=${inputStudentId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col items-center justify-center min-h-screen p-6">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">学籍番号入力</h1>
          <p className="text-gray-600">5桁の学籍番号を入力してください</p>
        </div>

        <Card className="w-80 h-32 mb-8 flex items-center justify-center bg-white border border-gray-200 shadow-sm">
          <div className="text-6xl font-bold bg-white tracking-wider">
            {inputStudentId
              .padEnd(5, "_")
              .split("")
              .map((char, index) => (
                <span key={index} className={char === "_" ? "text-gray-400" : ""}>
                  {char}
                </span>
              ))}
          </div>
        </Card>

        <NumberKeypad onNumberClick={handleNumberClick} onClear={handleClear} />

        <div className="flex gap-4">
          <Button
            variant="default"
            className="px-8 py-3 bg-gray-800 hover:bg-gray-900 text-white"
            onClick={handleSubmit}
            disabled={inputStudentId.length !== 5}
          >
            決定
          </Button>
          <Button
            variant="outline"
            className="px-8 py-3 bg-white border border-gray-300 hover:bg-gray-50"
            onClick={handleClear}
          >
            キャンセル
          </Button>
        </div>
      </div>
    </div>
  )
}
