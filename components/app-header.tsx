"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageSquare, Monitor, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"

export function AppHeader() {
  const pathname = usePathname()
  const isStudent = pathname === "/student"
  const isInstructor = pathname === "/instructor"

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <GraduationCap className="h-5 w-5" />
          <span>講義チャット</span>
        </Link>

        <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
          <Link href="/student">
            <Button
              variant={isStudent ? "default" : "ghost"}
              size="sm"
              className={cn("gap-2", !isStudent && "text-muted-foreground")}
            >
              <MessageSquare className="h-4 w-4" />
              学生
            </Button>
          </Link>
          <Link href="/instructor">
            <Button
              variant={isInstructor ? "default" : "ghost"}
              size="sm"
              className={cn("gap-2", !isInstructor && "text-muted-foreground")}
            >
              <Monitor className="h-4 w-4" />
              講師
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
