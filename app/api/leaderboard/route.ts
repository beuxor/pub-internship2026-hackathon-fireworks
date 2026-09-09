import { querySnowflake } from "@/lib/snowflake"
import { DB_SCHEMA } from "@/lib/constants"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const rows = await querySnowflake(
      `SELECT PLAYER_NAME, MODE, SCORE, QUESTIONS_CLEARED, CREATED_AT
       FROM ${DB_SCHEMA}.leaderboard
       ORDER BY SCORE DESC, CREATED_AT ASC
       LIMIT 20`
    )
    const entries = (rows as Record<string, unknown>[]).map((r) => ({
      playerName: String(r.PLAYER_NAME),
      mode: String(r.MODE),
      score: Number(r.SCORE),
      questionsCleared: Number(r.QUESTIONS_CLEARED),
      createdAt: r.CREATED_AT instanceof Date ? r.CREATED_AT.toISOString() : String(r.CREATED_AT),
    }))
    return Response.json(entries)
  } catch (e) {
    console.error("Failed to fetch leaderboard", e)
    return Response.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { playerName, mode, score, questionsCleared } = body
    await querySnowflake(
      `INSERT INTO ${DB_SCHEMA}.leaderboard (PLAYER_NAME, MODE, SCORE, QUESTIONS_CLEARED)
       VALUES (?, ?, ?, ?)`,
      { binds: [playerName, mode, score, questionsCleared] }
    )
    return Response.json({ success: true })
  } catch (e) {
    console.error("Failed to save score", e)
    return Response.json({ error: "Failed to save score" }, { status: 500 })
  }
}
