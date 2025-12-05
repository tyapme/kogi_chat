"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Loader2, CheckCircle, History, Clock, Sparkles } from "lucide-react"
import { BrushUpDialog } from "./brush-up-dialog"

interface SubmittedQuestion {
  id: string
  content: string
  originalContent?: string
  createdAt: string
  brushedUp: boolean
  isAnonymous: boolean
  nickname?: string
}

export function StudentQuestionForm() {
  const [question, setQuestion] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [nickname, setNickname] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingVague, setIsCheckingVague] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showBrushUp, setShowBrushUp] = useState(false)
  const [vagueReason, setVagueReason] = useState<string | undefined>()
  const [myQuestions, setMyQuestions] = useState<SubmittedQuestion[]>([])
  const [sessionId] = useState(() => {
    if (typeof window !== "undefined") {
      let id = sessionStorage.getItem("studentSessionId")
      if (!id) {
        id = crypto.randomUUID()
        sessionStorage.setItem("studentSessionId", id)
      }
      return id
    }
    return ""
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`myQuestions_${sessionId}`)
      if (stored) {
        setMyQuestions(JSON.parse(stored))
      }
    }
  }, [sessionId])

  async function checkIfVague(): Promise<{ isVague: boolean; reason?: string }> {
    try {
      const response = await fetch("/api/check-vague", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      })
      const result = await response.json()
      return { isVague: result.isVague === true, reason: result.reason }
    } catch (error) {
      console.error("Error checking vague:", error)
      return { isVague: false }
    }
  }

  async function handleSubmit() {
    if (!question.trim()) return
    if (!isAnonymous && !nickname.trim()) return

    setIsCheckingVague(true)
    const { isVague, reason } = await checkIfVague()
    setIsCheckingVague(false)

    if (isVague) {
      setVagueReason(reason)
      setShowBrushUp(true)
    } else {
      await submitQuestion(question, false)
    }
  }

  async function submitQuestion(content: string, brushedUp: boolean, originalContent?: string) {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          originalContent: brushedUp ? originalContent : undefined,
          isAnonymous,
          nickname: isAnonymous ? undefined : nickname,
          brushedUp,
          sessionId,
        }),
      })
      const newQuestion = await response.json()

      const questionRecord: SubmittedQuestion = {
        id: newQuestion.id,
        content,
        originalContent: brushedUp ? originalContent : undefined,
        createdAt: new Date().toISOString(),
        brushedUp,
        isAnonymous,
        nickname: isAnonymous ? undefined : nickname,
      }
      const updatedQuestions = [questionRecord, ...myQuestions]
      setMyQuestions(updatedQuestions)
      localStorage.setItem(`myQuestions_${sessionId}`, JSON.stringify(updatedQuestions))

      setSubmitted(true)
      setQuestion("")
      setTimeout(() => setSubmitted(false), 3000)
    } catch (error) {
      console.error("Failed to submit question:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBrushUpAccept(brushedUpQuestion: string) {
    submitQuestion(brushedUpQuestion, true, question)
    setShowBrushUp(false)
  }

  function handleBrushUpSkip() {
    submitQuestion(question, false)
    setShowBrushUp(false)
  }

  return (
    <>
      <div className="mx-auto max-w-xl space-y-4">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <Textarea
              placeholder="講義に関する質問を入力してください..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[100px] resize-none rounded-xl border-muted text-sm"
              disabled={isSubmitting || isCheckingVague}
            />

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                <Label htmlFor="anonymous" className="text-sm">
                  匿名で投稿
                </Label>
              </div>

              {!isAnonymous && (
                <Input
                  placeholder="ニックネームを入力"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="rounded-xl text-sm"
                  disabled={isSubmitting || isCheckingVague}
                />
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!question.trim() || isSubmitting || isCheckingVague || (!isAnonymous && !nickname.trim())}
              className="w-full rounded-xl"
            >
              {isCheckingVague ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  確認中...
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  送信中...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  質問を送信
                </>
              )}
            </Button>

            {submitted && (
              <div className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-green-700 text-sm">
                <CheckCircle className="h-4 w-4" />
                質問を送信しました
              </div>
            )}
          </CardContent>
        </Card>

        {myQuestions.length > 0 && (
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <History className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">送信した質問</h3>
              </div>
              <div className="space-y-2">
                {myQuestions.slice(0, 5).map((q) => (
                  <div key={q.id} className="rounded-xl bg-muted/50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm">{q.content}</p>
                      {q.brushedUp && (
                        <span className="flex-shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                          <Sparkles className="inline h-3 w-3 mr-0.5" />
                          AI改善
                        </span>
                      )}
                    </div>
                    {q.originalContent && <p className="mt-1 text-xs text-muted-foreground">元: {q.originalContent}</p>}
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(q.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                      {!q.isAnonymous && q.nickname && <span className="ml-1">· {q.nickname}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <BrushUpDialog
        open={showBrushUp}
        onOpenChange={setShowBrushUp}
        originalQuestion={question}
        reason={vagueReason}
        onAccept={handleBrushUpAccept}
        onSkip={handleBrushUpSkip}
      />
    </>
  )
}
