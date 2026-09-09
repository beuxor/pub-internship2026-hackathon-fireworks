import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"
export const dynamic = "force-dynamic"

interface Session {
  sessionId: string
  roomCode: string
  mode: string
  status: string
  player1Name: string
  player2Name: string | null
  questionIds: number[]
  createdAt: string
  updatedAt: string
}

interface Answer {
  sessionId: string
  playerName: string
  questionNo: number
  questionId: number
  answerPct: number
  errorAbs: number
  damage: number
  remainingHp: number
}

const SESSIONS_FILE = join(process.cwd(), ".sessions.json")
const ANSWERS_FILE = join(process.cwd(), ".answers.json")

function readSessions(): Session[] {
  if (!existsSync(SESSIONS_FILE)) return []
  try { return JSON.parse(readFileSync(SESSIONS_FILE, "utf-8")) } catch { return [] }
}
function writeSessions(sessions: Session[]) {
  writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2))
}
function readAnswers(): Answer[] {
  if (!existsSync(ANSWERS_FILE)) return []
  try { return JSON.parse(readFileSync(ANSWERS_FILE, "utf-8")) } catch { return [] }
}
function writeAnswers(answers: Answer[]) {
  writeFileSync(ANSWERS_FILE, JSON.stringify(answers, null, 2))
}

// Load questions from cache
function loadQuestionIds(): number[] {
  const filePath = join(process.cwd(), "public", "questions.json")
  const data = JSON.parse(readFileSync(filePath, "utf-8")) as { QUESTION_ID: number }[]
  const shuffled = data.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 5).map((q) => q.QUESTION_ID)
}

function loadQuestionsByIds(ids: number[]) {
  const filePath = join(process.cwd(), "public", "questions.json")
  const all = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>[]
  return all
    .filter((q) => ids.includes(Number(q.QUESTION_ID)))
    .map((q) => ({
      questionId: Number(q.QUESTION_ID),
      questionType: String(q.QUESTION_TYPE),
      questionText: String(q.QUESTION_TEXT),
      answerPct: Number(q.ANSWER_PCT),
    }))
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { mode, playerName } = body

    const sessionId = crypto.randomUUID()
    const roomCode = String(Math.floor(Math.random() * 10000)).padStart(4, "0")
    const questionIds = loadQuestionIds()

    const sessions = readSessions()
    sessions.push({
      sessionId, roomCode, mode, status: "WAITING",
      player1Name: playerName, player2Name: null,
      questionIds, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    writeSessions(sessions)

    return Response.json({ sessionId, roomCode, questionIds })
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
    const sessions = readSessions()
    let session: Session | undefined
    if (sessionId) {
      session = sessions.find((s) => s.sessionId === sessionId)
    } else if (roomCode) {
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      session = sessions
        .filter((s) => s.roomCode === roomCode && s.status !== "FINISHED" && s.createdAt > tenMinAgo)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    }

    if (!session) {
      return Response.json({ error: "Session not found" }, { status: 404 })
    }

    const questions = loadQuestionsByIds(session.questionIds)
    const allAnswers = readAnswers()
    const answers = allAnswers
      .filter((a) => a.sessionId === session.sessionId)
      .map((a) => ({
        playerName: a.playerName,
        questionNo: a.questionNo,
        answerPct: a.answerPct,
        errorAbs: a.errorAbs,
        damage: a.damage,
        remainingHp: a.remainingHp,
      }))

    return Response.json({
      sessionId: session.sessionId,
      roomCode: session.roomCode,
      status: session.status,
      mode: session.mode,
      player1Name: session.player1Name,
      player2Name: session.player2Name,
      questionIds: session.questionIds,
      questions,
      answers,
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

    const sessions = readSessions()
    const session = sessions.find((s) => s.sessionId === sessionId)
    if (!session) {
      return Response.json({ error: "Session not found" }, { status: 404 })
    }

    if (playerName && !session.player2Name) {
      session.player2Name = playerName
      session.status = "PLAYING"
    }
    if (status) {
      session.status = status
    }
    session.updatedAt = new Date().toISOString()
    writeSessions(sessions)

    return Response.json({ success: true })
  } catch (e) {
    console.error("Failed to update session", e)
    return Response.json({ error: "Failed to update session" }, { status: 500 })
  }
}
