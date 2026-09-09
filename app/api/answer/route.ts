import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"
import { DAMAGE_RATE } from "@/lib/constants"
export const dynamic = "force-dynamic"

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

const ANSWERS_FILE = join(process.cwd(), ".answers.json")

function readAnswers(): Answer[] {
  if (!existsSync(ANSWERS_FILE)) return []
  try { return JSON.parse(readFileSync(ANSWERS_FILE, "utf-8")) } catch { return [] }
}
function writeAnswers(answers: Answer[]) {
  writeFileSync(ANSWERS_FILE, JSON.stringify(answers, null, 2))
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { sessionId, playerName, questionNo, questionId, answerPct, correctPct, remainingHpBefore } = body

    const errorAbs = Math.round(Math.abs(answerPct - correctPct) * 10) / 10
    const damage = Math.round(errorAbs * DAMAGE_RATE)
    const remainingHp = Math.max(0, remainingHpBefore - damage)

    const answers = readAnswers()
    answers.push({ sessionId, playerName, questionNo, questionId, answerPct, errorAbs, damage, remainingHp })
    writeAnswers(answers)

    return Response.json({ errorAbs, damage, remainingHp })
  } catch (e) {
    console.error("Failed to record answer", e)
    return Response.json({ error: "Failed to record answer" }, { status: 500 })
  }
}
