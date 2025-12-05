"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Trash2,
  MoreVertical,
  CheckCircle,
  Clock,
  Sparkles,
  RefreshCw,
  User,
  UserX,
  BookOpen,
  XCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
} from "lucide-react"
import type { Question, QuestionStatus } from "@/lib/question-store"
import { cn } from "@/lib/utils"

export function InstructorDashboard() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const fetchQuestions = useCallback(async () => {
    try {
      const response = await fetch("/api/questions")
      const data = await response.json()
      setQuestions(
        data.map((q: Question) => ({
          ...q,
          createdAt: new Date(q.createdAt),
        })),
      )
    } catch (error) {
      console.error("Failed to fetch questions:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQuestions()
    const interval = setInterval(fetchQuestions, 3000)
    return () => clearInterval(interval)
  }, [fetchQuestions])

  async function updateStatus(id: string, status: QuestionStatus) {
    await fetch("/api/questions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    fetchQuestions()
  }

  async function deleteQuestion(id: string) {
    await fetch(`/api/questions?id=${id}`, { method: "DELETE" })
    fetchQuestions()
  }

  async function toggleAnswered(id: string) {
    const question = questions.find((q) => q.id === id)
    if (question) {
      await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, answered: !question.answered }),
      })
      fetchQuestions()
    }
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const pendingQuestions = questions.filter((q) => q.status === "pending")
  const answeredQuestions = questions.filter((q) => q.status !== "pending")

  function getStatusBadge(status: QuestionStatus) {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
            <Clock className="mr-1 h-3 w-3" />
            未回答
          </Badge>
        )
      case "answered_classroom":
        return (
          <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700">
            <BookOpen className="mr-1 h-3 w-3" />
            Classroom
          </Badge>
        )
      case "no_response":
        return (
          <Badge variant="outline" className="border-gray-300 bg-gray-50 text-gray-700">
            <XCircle className="mr-1 h-3 w-3" />
            無回答
          </Badge>
        )
    }
  }

  function formatTime(date: Date) {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">講師ダッシュボード</h1>
          <p className="text-sm text-muted-foreground">リアルタイムで学生の質問を管理</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchQuestions}>
          <RefreshCw className="mr-2 h-4 w-4" />
          更新
        </Button>
      </div>

      {/* 未回答の質問 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              未回答の質問
            </span>
            <Badge variant="secondary">{pendingQuestions.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">読み込み中...</div>
          ) : pendingQuestions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">未回答の質問はありません</div>
          ) : (
            <div className="space-y-3">
              {pendingQuestions.map((question) => (
                <div
                  key={question.id}
                  className={cn(
                    "rounded-lg border bg-card p-4 transition-all",
                    question.answered && "border-green-200 bg-green-50/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {question.isAnonymous ? (
                          <UserX className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">{question.isAnonymous ? "匿名" : "実名"}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(question.createdAt)}</span>
                        {question.brushedUp && (
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="mr-1 h-3 w-3" />
                            AI改善
                          </Badge>
                        )}
                        {question.answered && (
                          <Badge className="bg-green-500 text-white text-xs">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            回答済み
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed font-medium">{question.content}</p>

                      {question.originalContent && (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleExpanded(question.id)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {expandedIds.has(question.id) ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                            原文を表示
                          </button>
                          {expandedIds.has(question.id) && (
                            <div className="mt-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                              <span className="font-medium">原文:</span> {question.originalContent}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant={question.answered ? "default" : "outline"}
                        size="icon"
                        onClick={() => toggleAnswered(question.id)}
                        className={cn("h-8 w-8", question.answered && "bg-green-500 hover:bg-green-600")}
                        title={question.answered ? "回答済みを取り消す" : "回答済みにする"}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateStatus(question.id, "answered_classroom")}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Classroomで後日回答
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(question.id, "no_response")}>
                            <XCircle className="mr-2 h-4 w-4" />
                            無回答
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteQuestion(question.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            削除（重複など）
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 処理済みの質問 */}
      {answeredQuestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                処理済み
              </span>
              <Badge variant="secondary">{answeredQuestions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {answeredQuestions.map((question) => (
                <div key={question.id} className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getStatusBadge(question.status)}
                    <p className="text-sm text-muted-foreground truncate">{question.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => deleteQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
