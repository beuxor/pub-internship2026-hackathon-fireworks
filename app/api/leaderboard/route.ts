import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"
export const dynamic = "force-dynamic"

interface LeaderboardEntry {
  playerName: string
  mode: string
  score: number
  questionsCleared: number
  createdAt: string
}

const LOCAL_FILE = join(process.cwd(), ".leaderboard.json")

function readLocal(): LeaderboardEntry[] {
  if (!existsSync(LOCAL_FILE)) return []
  try {
    return JSON.parse(readFileSync(LOCAL_FILE, "utf-8")) as LeaderboardEntry[]
  } catch {
    return []
  }
}

function writeLocal(entries: LeaderboardEntry[]) {
  writeFileSync(LOCAL_FILE, JSON.stringify(entries, null, 2))
}

export async function GET() {
  const local = readLocal()
    .sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt))
    .slice(0, 20)
  return Response.json(local)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { playerName, mode, score, questionsCleared } = body

    const local = readLocal()
    local.push({
      playerName,
      mode,
      score,
      questionsCleared,
      createdAt: new Date().toISOString(),
    })
    writeLocal(local)

    return Response.json({ success: true })
  } catch (e) {
    console.error("Failed to save score", e)
    return Response.json({ error: "Failed to save score" }, { status: 500 })
  }
}
