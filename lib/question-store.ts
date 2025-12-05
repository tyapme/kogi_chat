export type QuestionStatus = "pending" | "answered_classroom" | "no_response"

export interface Question {
  id: string
  content: string
  originalContent?: string // ブラッシュアップ前の元の質問
  isAnonymous: boolean
  nickname?: string // ニックネーム追加
  status: QuestionStatus
  createdAt: Date
  brushedUp: boolean
  answered: boolean // 口頭で回答済みフラグ
  sessionId?: string // セッションID追加
}

// インメモリストア
let questions: Question[] = []
const listeners: Set<() => void> = new Set()

export function getQuestions(): Question[] {
  return [...questions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export function addQuestion(question: Omit<Question, "id" | "createdAt" | "status" | "answered">): Question {
  const newQuestion: Question = {
    ...question,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    status: "pending",
    answered: false,
  }
  questions.push(newQuestion)
  notifyListeners()
  return newQuestion
}

export function updateQuestionStatus(id: string, status: QuestionStatus): void {
  const question = questions.find((q) => q.id === id)
  if (question) {
    question.status = status
    notifyListeners()
  }
}

export function updateQuestionAnswered(id: string, answered: boolean): void {
  const question = questions.find((q) => q.id === id)
  if (question) {
    question.answered = answered
    notifyListeners()
  }
}

export function deleteQuestion(id: string): void {
  questions = questions.filter((q) => q.id !== id)
  notifyListeners()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener())
}
