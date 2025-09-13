"use client"

import { Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BottomNavigationProps {
  currentView: "schedule" | "profile"
  onViewChange: (view: "schedule" | "profile") => void
}

export function BottomNavigation({ currentView, onViewChange }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex items-center justify-around p-2">
        <Button
          variant={currentView === "schedule" ? "default" : "ghost"}
          size="lg"
          onClick={() => onViewChange("schedule")}
          className="flex-1 flex flex-col items-center gap-1 h-auto py-3"
        >
          <Calendar className="h-5 w-5" />
          <span className="text-xs">スケジュール</span>
        </Button>
        <Button
          variant={currentView === "profile" ? "default" : "ghost"}
          size="lg"
          onClick={() => onViewChange("profile")}
          className="flex-1 flex flex-col items-center gap-1 h-auto py-3"
        >
          <User className="h-5 w-5" />
          <span className="text-xs">プロフィール</span>
        </Button>
      </div>
    </div>
  )
}
