export async function POST(request: Request) {
  const { question } = await request.json()

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    console.log("[v0] No API key found")
    return Response.json({ isVague: false })
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `講義中の学生からの質問を評価してください。

質問: "${question}"

重要: これは講義中の質問なので、科目名や授業名は不要です。「期末試験いつ？」のような質問は明確と判断してください。

以下の場合のみ曦昧な質問です：
- 「わからない」「教えて」だけで何がわからないか不明
- 「これ」「あれ」などの指示語のみ
- 意味のない文字列（あいうえお等）

以下は明確な質問です：
- 「期末試験いつ？」「レポートの締切は？」→ 講義の文脈で明確
- 具体的な内容がある質問

必ずJSON形式のみで回答してください（説明不要）:
曦昧な場合: {"isVague": true, "reason": "理由"}
明確な場合: {"isVague": false}`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.1,
          },
        }),
      },
    )

    const responseText = await response.text()
    console.log("[v0] Gemini API status:", response.status)
    console.log("[v0] Gemini API response body:", responseText)

    if (!response.ok) {
      return Response.json({ isVague: true, reason: "APIエラーが発生しました" })
    }

    const data = JSON.parse(responseText)
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    console.log("[v0] Extracted text:", text)

    // JSONを抽出
    const jsonMatch = text.match(/\{[^{}]*\}/)
    if (jsonMatch) {
      try {
        const result = JSON.parse(jsonMatch[0])
        return Response.json(result)
      } catch {
        // パース失敗
      }
    }

    // フォールバック: テキストに"true"が含まれるかチェック
    const isVague =
      text.toLowerCase().includes('"isvague": true') ||
      text.toLowerCase().includes('"isvague":true') ||
      text.includes("true")

    return Response.json({
      isVague,
      reason: isVague ? "質問が曖昧です" : undefined,
    })
  } catch (error) {
    console.log("[v0] Error:", error)
    return Response.json({ isVague: true, reason: "エラーが発生しました" })
  }
}
