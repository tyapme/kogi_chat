export async function POST(request: Request) {
  const { mode, question, reason, history } = await request.json()

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    return new Response("API key not configured", { status: 500 })
  }

  try {
    let prompt = ""

    if (mode === "clarify") {
      // 最初の質問: AIが学生に詳細を聞く
      prompt = `あなたは講義中の学生の質問をブラッシュアップするアシスタントです。

学生が以下の曖昧な質問をしました：
「${question}」

${reason ? `曖昧な理由: ${reason}` : ""}

この質問を改善するために、学生に1つだけ具体的な質問をしてください。
- 何について知りたいのか
- どの部分がわからないのか
- どのような状況で困っているのか

などを聞いて、質問を明確にする手助けをしてください。

注意:
- これは講義中の質問なので、科目名や授業名を聞く必要はありません
- 「先生、」などの枕詞は不要です
- カジュアルで簡潔な質問にしてください

短く、親しみやすい日本語で質問してください（1-2文）。`
    } else {
      // 対話の続き
      const historyText = history
        .map((m: { role: string; content: string }) => (m.role === "user" ? `学生: ${m.content}` : `AI: ${m.content}`))
        .join("\n")

      prompt = `あなたは講義中の学生の質問をブラッシュアップするアシスタントです。

元の質問: 「${question}」

これまでの対話:
${historyText}

上記の対話を踏まえて、以下のどちらかを行ってください：

1. まだ情報が不足している場合：追加で1つ質問してください（1-2文）

2. 十分な情報が集まった場合：改善された質問を生成してください。
   その場合、以下の形式で出力してください：
   
   十分な情報をいただきました！以下のように質問を改善しました。
   
   【改善された質問】
   （ここに改善された質問を1-2文で）

注意:
- これは講義中の質問なので、科目名や授業名は不要です
- 「先生、」などの枕詞は不要です
- カジュアルで簡潔な質問にしてください

短く、親しみやすい日本語で回答してください。`
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] Gemini API error:", response.status, errorText)
      return new Response("API error", { status: 500 })
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6))
                  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
                  if (text) {
                    controller.enqueue(new TextEncoder().encode(text))
                  }
                } catch {
                  // JSONパースエラーは無視
                }
              }
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error) {
    console.log("[v0] Error:", error)
    return new Response("Error occurred", { status: 500 })
  }
}
