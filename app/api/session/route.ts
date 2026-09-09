import { querySnowflake } from "@/lib/snowflake"
import { DB_SCHEMA } from "@/lib/constants"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { mode, playerName } = body

    const sessionId = crypto.randomUUID()
    const roomCode = String(Math.floor(Math.random() * 10000)).padStart(4, "0")

    const qRows = await querySnowflake(
      `SELECT QUESTION_ID FROM ${DB_SCHEMA}.question_pool ORDER BY RANDOM() LIMIT 5`
    )
    const questionIds = (qRows as Record<string, unknown>[]).map((r) => String(r.QUESTION_ID)).join(",")

    await querySnowflake(
      `INSERT INTO ${DB_SCHEMA}.game_session (SESSION_ID, ROOM_CODE, MODE, STATUS, PLAYER1_NAME, QUESTION_IDS)
       VALUES (?, ?, ?, 'WAITING', ?, ?)`,
      { binds: [sessionId, roomCode, mode, playerName, questionIds] }
    )

    return Response.json({ sessionId, roomCode, questionIds: questionIds.split(",").map(Number) })
  } catch (e) {
    console.error("Failed to create session", e)
    return Response.json({ error: "Failed to create session" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const roomCode = url.searchParams.get("roomCode")
  const sessionId = url.searchParams.get("sessionId")

  try {
    let rows: Record<string, unknown>[]
    if (sessionId) {
      rows = await querySnowflake(
        `SELECT * FROM ${DB_SCHEMA}.game_session WHERE SESSION_ID = ?`,
        { binds: [sessionId] }
      ) as Record<string, unknown>[]
    } else if (roomCode) {
      rows = await querySnowflake(
        `SELECT * FROM ${DB_SCHEMA}.game_session WHERE ROOM_CODE = ? AND STATUS != 'FINISHED'
         AND CREATED_AT > DATEADD(MINUTE, -10, CURRENT_TIMESTAMP())
         ORDER BY CREATED_AT DESC LIMIT 1`,
        { binds: [roomCode] }
      ) as Record<string, unknown>[]
    } else {
      return Response.json({ error: "roomCode or sessionId required" }, { status: 400 })
    }

    if (!rows || rows.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 })
    }

    const s = rows[0]
    const qidsStr = String(s.QUESTION_IDS || "")
    const questionIds = qidsStr ? qidsStr.split(",").map(Number) : []

    // Get questions data
    let questions: Record<string, unknown>[] = []
    if (questionIds.length > 0) {
      questions = await querySnowflake(
        `SELECT QUESTION_ID, QUESTION_TYPE, QUESTION_TEXT, ANSWER_PCT
         FROM ${DB_SCHEMA}.question_pool
         WHERE QUESTION_ID IN (${questionIds.join(",")})`
      ) as Record<string, unknown>[]
    }

    // Get answers
    const answers = await querySnowflake(
      `SELECT * FROM ${DB_SCHEMA}.game_answer WHERE SESSION_ID = ? ORDER BY QUESTION_NO, CREATED_AT`,
      { binds: [String(s.SESSION_ID)] }
    ) as Record<string, unknown>[]

    return Response.json({
      sessionId: String(s.SESSION_ID),
      roomCode: String(s.ROOM_CODE),
      status: String(s.STATUS),
      mode: String(s.MODE),
      player1Name: String(s.PLAYER1_NAME),
      player2Name: s.PLAYER2_NAME ? String(s.PLAYER2_NAME) : null,
      questionIds,
      questions: questions.map((q) => ({
        questionId: Number(q.QUESTION_ID),
        questionType: String(q.QUESTION_TYPE),
        questionText: String(q.QUESTION_TEXT),
        answerPct: Number(q.ANSWER_PCT),
      })),
      answers: answers.map((a) => ({
        playerName: String(a.PLAYER_NAME),
        questionNo: Number(a.QUESTION_NO),
        answerPct: Number(a.ANSWER_PCT),
        errorAbs: Number(a.ERROR_ABS),
        damage: Number(a.DAMAGE),
        remainingHp: Number(a.REMAINING_HP),
      })),
    })
  } catch (e) {
    console.error("Failed to get session", e)
    return Response.json({ error: "Failed to get session" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { sessionId, playerName, status } = body

    if (playerName) {
      await querySnowflake(
        `UPDATE ${DB_SCHEMA}.game_session SET PLAYER2_NAME = ?, STATUS = 'PLAYING', UPDATED_AT = CURRENT_TIMESTAMP()
         WHERE SESSION_ID = ? AND PLAYER2_NAME IS NULL`,
        { binds: [playerName, sessionId] }
      )
    }
    if (status) {
      await querySnowflake(
        `UPDATE ${DB_SCHEMA}.game_session SET STATUS = ?, UPDATED_AT = CURRENT_TIMESTAMP()
         WHERE SESSION_ID = ?`,
        { binds: [status, sessionId] }
      )
    }

    return Response.json({ success: true })
  } catch (e) {
    console.error("Failed to update session", e)
    return Response.json({ error: "Failed to update session" }, { status: 500 })
  }
}
