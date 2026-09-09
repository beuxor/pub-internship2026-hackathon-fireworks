import { querySnowflake } from "@/lib/snowflake"
import { DB_SCHEMA } from "@/lib/constants"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const count = Number(url.searchParams.get("count") || "5")
  try {
    const rows = await querySnowflake(
      `SELECT QUESTION_ID, QUESTION_TYPE, QUESTION_TEXT, ANSWER_PCT
       FROM ${DB_SCHEMA}.question_pool
       ORDER BY RANDOM()
       LIMIT ${count}`
    )
    const questions = (rows as Record<string, unknown>[]).map((r) => ({
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
