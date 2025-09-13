import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

export function useStudentId() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [studentId, setStudentId] = useState<string | null>(null)

  useEffect(() => {
    const queryStudentId = searchParams.get("studentId")
    const localStudentId = localStorage.getItem("studentId")

    if (queryStudentId) {
      setStudentId(queryStudentId)
      if (localStudentId !== queryStudentId) {
        localStorage.setItem("studentId", queryStudentId)
      }
    } else if (localStudentId) {
      setStudentId(localStudentId)
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev)
        newParams.set("studentId", localStudentId)
        return newParams
      })
    } else {
      navigate("/")
    }
  }, [searchParams, navigate, setSearchParams])

  useEffect(() => {
    const queryStudentId = searchParams.get("studentId")
    if (queryStudentId && queryStudentId !== studentId) {
      setStudentId(queryStudentId)
      localStorage.setItem("studentId", queryStudentId)
    }
  }, [searchParams, studentId])

  useEffect(() => {
    const handleStorageChange = () => {
      const newStudentId = localStorage.getItem("studentId")
      const queryStudentId = searchParams.get("studentId")

      if (newStudentId && newStudentId !== queryStudentId) {
        setStudentId(newStudentId)
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev)
          newParams.set("studentId", newStudentId)
          return newParams
        })
      } else if (!newStudentId && queryStudentId) {
        setStudentId(null)
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev)
          newParams.delete("studentId")
          return newParams
        })
        navigate("/")
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [searchParams, setSearchParams, navigate])

  return studentId
}