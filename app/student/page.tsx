import { StudentQuestionForm } from "@/components/student-question-form"

export default function StudentPage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-background to-muted/30 px-4 py-12">
      <div className="mx-auto max-w-xl text-center mb-8">
        <h1 className="text-2xl font-bold">講義への質問</h1>
        <p className="mt-1 text-sm text-muted-foreground">質問を投稿すると、講師がリアルタイムで確認します</p>
      </div>
      <StudentQuestionForm />
    </main>
  )
}
