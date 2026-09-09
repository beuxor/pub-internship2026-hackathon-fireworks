"use client"

import { useEffect, useState } from "react"
import type { GameMode } from "@/lib/game-types"
import type { LeaderboardEntry } from "@/lib/game-types"

export function TopScreen({ onSelectMode }: { onSelectMode: (mode: GameMode) => void }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setLeaderboard(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-8">
      <div className="w-full border-4 border-red-500 rounded-lg p-6 text-center">
        <h1 className="text-3xl font-bold text-red-500 flex items-center justify-center gap-3">
          <span className="text-4xl">R</span>
          <span>楽天市場パーセントバルーン</span>
        </h1>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => onSelectMode("solo")}
          className="w-full border-2 border-red-500 rounded-lg px-8 py-4 text-xl font-bold text-red-500 hover:bg-red-50 transition-colors"
        >
          ひとり用
        </button>
        <button
          onClick={() => onSelectMode("local")}
          className="w-full border-2 border-red-500 rounded-lg px-8 py-3 text-lg text-red-500 hover:bg-red-50 transition-colors"
        >
          ふたり用（ローカル）
        </button>
        <button
          onClick={() => onSelectMode("online")}
          className="w-full border-2 border-red-500 rounded-lg px-8 py-3 text-lg text-red-500 hover:bg-red-50 transition-colors"
        >
          ふたり用（オンライン）
        </button>
      </div>

      <div className="w-full mt-4">
        <h2 className="text-xl font-bold mb-3 text-center">リーダーボード</h2>
        {loading ? (
          <p className="text-center text-muted-foreground">読み込み中...</p>
        ) : leaderboard.length === 0 ? (
          <p className="text-center text-muted-foreground">まだ記録がありません</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">プレイヤー</th>
                  <th className="px-3 py-2 text-right">スコア</th>
                  <th className="px-3 py-2 text-right">問数</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{entry.playerName}</td>
                    <td className="px-3 py-2 text-right font-mono">{entry.score}</td>
                    <td className="px-3 py-2 text-right">{entry.questionsCleared}/5</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
