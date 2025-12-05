import { NextResponse } from "next/server"
import {
  getQuestions,
  addQuestion,
  type QuestionStatus,
  updateQuestionStatus,
  updateQuestionAnswered,
  deleteQuestion,
} from "@/lib/question-store"

export async function GET() {
  const questions = getQuestions()
  return NextResponse.json(questions)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { content, originalContent, isAnonymous, nickname, brushedUp, sessionId } = body

  const question = addQuestion({
    content,
    originalContent,
    isAnonymous,
    nickname,
    brushedUp,
    sessionId,
  })

  return NextResponse.json(question)
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, status, answered } = body as { id: string; status?: QuestionStatus; answered?: boolean }

  if (status !== undefined) {
    updateQuestionStatus(id, status)
  }
  if (answered !== undefined) {
    updateQuestionAnswered(id, answered)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (id) {
    deleteQuestion(id)
  }

  return NextResponse.json({ success: true })
}
