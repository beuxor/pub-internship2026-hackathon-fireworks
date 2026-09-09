import { readFileSync } from "fs"
import { join } from "path"
export const dynamic = "force-dynamic"

interface QuestionRow {
  QUESTION_ID: number
  QUESTION_TYPE: string
  QUESTION_TEXT: string
  ANSWER_PCT: string | number
}

let cachedQuestions: QuestionRow[] | null = null

function loadQuestions(): QuestionRow[] {
  if (cachedQuestions) return cachedQuestions
  const filePath = join(process.cwd(), "public", "questions.json")
  const data = readFileSync(filePath, "utf-8")
  cachedQuestions = JSON.parse(data) as QuestionRow[]
  return cachedQuestions
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const count = Number(url.searchParams.get("count") || "5")
  try {
    const all = loadQuestions()
    const selected = shuffleArray(all).slice(0, count)
    const questions = selected.map((r) => ({
      questionId: Number(r.QUESTION_ID),
      questionType: String(r.QUESTION_TYPE),
      questionText: String(r.QUESTION_TEXT),
      answerPct: Number(r.ANSWER_PCT),
    }))
    return Response.json(questions)
  } catch (e) {
    console.error("Failed to fetch questions", e)
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch questions" },
      { status: 500 }
    )
  }
}
