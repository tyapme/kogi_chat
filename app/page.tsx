import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Monitor, Sparkles } from "lucide-react"

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-6 px-4 py-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">講義内チャットシステム</h1>
        <p className="text-muted-foreground">リアルタイムで質問を投稿・管理</p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          <span>AIによる質問ブラッシュアップ機能付き</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="w-[280px] transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              学生
            </CardTitle>
            <CardDescription>質問を投稿する</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/student">
              <Button className="w-full">質問ページへ</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="w-[280px] transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              講師
            </CardTitle>
            <CardDescription>質問を管理する</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/instructor">
              <Button variant="outline" className="w-full bg-transparent">
                ダッシュボードへ
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
