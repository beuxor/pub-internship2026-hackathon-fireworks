import { querySnowflake } from "@/lib/snowflake"
import { DB_SCHEMA, DAMAGE_RATE } from "@/lib/constants"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { sessionId, playerName, questionNo, questionId, answerPct, correctPct, remainingHpBefore } = body

    const errorAbs = Math.round(Math.abs(answerPct - correctPct) * 10) / 10
    const damage = Math.round(errorAbs * DAMAGE_RATE)
    const remainingHp = Math.max(0, remainingHpBefore - damage)

    await querySnowflake(
      `INSERT INTO ${DB_SCHEMA}.game_answer
       (SESSION_ID, PLAYER_NAME, QUESTION_NO, QUESTION_ID, ANSWER_PCT, ERROR_ABS, DAMAGE, REMAINING_HP)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      { binds: [sessionId, playerName, questionNo, questionId, answerPct, errorAbs, damage, remainingHp] }
    )

    return Response.json({ errorAbs, damage, remainingHp })
  } catch (e) {
    console.error("Failed to record answer", e)
    return Response.json({ error: "Failed to record answer" }, { status: 500 })
  }
}
