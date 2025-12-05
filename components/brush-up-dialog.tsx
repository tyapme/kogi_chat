"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Send, Check, X, Loader2, Bot, User, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  role: "ai" | "user"
  content: string
}

interface BrushUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  originalQuestion: string
  reason?: string
  onAccept: (brushedUpQuestion: string) => void
  onSkip: () => void
}

export function BrushUpDialog({ open, onOpenChange, originalQuestion, onAccept, onSkip }: BrushUpDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [finalQuestion, setFinalQuestion] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content
  const canSubmitEarly = messages.length >= 2 && lastUserMessage && !finalQuestion

  useEffect(() => {
    if (open && originalQuestion) {
      setMessages([])
      setFinalQuestion(null)
      setInput("")
      generateInitialQuestion()
    }
  }, [open, originalQuestion])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function generateInitialQuestion() {
    setIsLoading(true)
    try {
      const response = await fetch("/api/brushup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "clarify",
          question: originalQuestion,
          history: [],
        }),
      })

      if (!response.body) return

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let result = ""

      setMessages([{ role: "ai", content: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        result += decoder.decode(value, { stream: true })
        setMessages([{ role: "ai", content: result }])
      }
    } catch (error) {
      console.error("Initial question failed:", error)
      setMessages([{ role: "ai", content: "質問をより具体的にするために、もう少し詳しく教えていただけますか？" }])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSend() {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch("/api/brushup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "continue",
          question: originalQuestion,
          history: [...messages, { role: "user", content: userMessage }],
        }),
      })

      if (!response.body) return

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let result = ""

      setMessages((prev) => [...prev, { role: "ai", content: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        result += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = { role: "ai", content: result }
          return newMessages
        })
      }

      if (result.includes("【改善された質問】")) {
        const match = result.match(/【改善された質問】\s*(.+)/s)
        if (match) {
          setFinalQuestion(match[1].trim())
        }
      }
    } catch (error) {
      console.error("Continue conversation failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleAccept() {
    if (finalQuestion) {
      onAccept(finalQuestion)
    }
    onOpenChange(false)
  }

  function handleSkip() {
    onSkip()
    onOpenChange(false)
  }

  function handleSubmitWithContext() {
    // 元の質問 + 対話で得られた追加情報を組み合わせて送信
    const userResponses = messages.filter((m) => m.role === "user").map((m) => m.content)
    const combinedQuestion = `${originalQuestion}（補足: ${userResponses.join("、")}）`
    onAccept(combinedQuestion)
    onOpenChange(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[550px] max-h-[85vh] flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-lg sm:max-w-lg">
        <div className="flex items-center gap-3 border-b bg-muted/30 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          <div>
            <h2 className="font-medium">質問をブラッシュアップ</h2>
            <p className="text-xs text-muted-foreground">AIと対話して質問を具体的にしましょう</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden p-4">
          <div className="mb-4 rounded-xl bg-muted/50 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">元の質問</p>
            <p className="text-sm">{originalQuestion}</p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {messages.map((message, index) => (
              <div key={index} className={cn("flex gap-2", message.role === "user" ? "justify-end" : "justify-start")}>
                {message.role === "ai" && (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-foreground">
                    <Bot className="h-3.5 w-3.5 text-background" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    message.role === "user" ? "bg-foreground text-background" : "bg-muted",
                  )}
                >
                  {message.content || <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                {message.role === "user" && (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {finalQuestion && (
            <div className="mt-3 rounded-xl border bg-muted/30 px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Check className="h-3 w-3" />
                改善された質問
              </p>
              <p className="text-sm font-medium">{finalQuestion}</p>
            </div>
          )}

          {!finalQuestion && (
            <div className="mt-3 flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="詳細を入力... (Shift+Enterで送信)"
                disabled={isLoading}
                rows={2}
                className="flex-1 resize-none rounded-xl text-sm"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="h-auto w-10 rounded-xl"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t px-5 py-3">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="rounded-xl text-muted-foreground">
            <X className="mr-1.5 h-3.5 w-3.5" />
            元のまま投稿
          </Button>
          <div className="flex gap-2">
            {canSubmitEarly && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSubmitWithContext}
                className="rounded-xl bg-transparent"
              >
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                この内容で送信
              </Button>
            )}
            {finalQuestion && (
              <Button size="sm" onClick={handleAccept} className="rounded-xl">
                <Check className="mr-1.5 h-3.5 w-3.5" />
                改善版で投稿
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
