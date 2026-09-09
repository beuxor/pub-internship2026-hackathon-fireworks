"use client"

import { useState } from "react"
import type { GameMode, PlayerState } from "@/lib/game-types"
import { TOTAL_QUESTIONS } from "@/lib/constants"

interface FinishedScreenProps {
  mode: GameMode
  player1: PlayerState
  player2: PlayerState
  onPlayAgain: () => void
  onBackToTop: () => void
}

function determineWinner(p1: PlayerState, p2: PlayerState): "p1" | "p2" | "draw" {
  const p1Cleared = p1.answers.length
  const p2Cleared = p2.answers.length
  const p1Finished = !p1.isGameOver || p1.answers.length >= TOTAL_QUESTIONS
  const p2Finished = !p2.isGameOver || p2.answers.length >= TOTAL_QUESTIONS

  if (p1Finished && !p2Finished) return "p1"
  if (!p1Finished && p2Finished) return "p2"
  if (p1Finished && p2Finished) {
    if (p1.hp > p2.hp) return "p1"
    if (p2.hp > p1.hp) return "p2"
    return "draw"
  }
  if (p1Cleared > p2Cleared) return "p1"
  if (p2Cleared > p1Cleared) return "p2"
  return "draw"
}

export function FinishedScreen({ mode, player1, player2, onPlayAgain, onBackToTop }: FinishedScreenProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const isBattle = mode === "local" || mode === "online"
  const winner = isBattle ? determineWinner(player1, player2) : null

  const saveScore = async () => {
    setSaving(true)
    try {
      const entries = [{ playerName: player1.name, mode, score: player1.hp, questionsCleared: player1.answers.length }]
      if (isBattle && player2.name) {
        entries.push({ playerName: player2.name, mode, score: player2.hp, questionsCleared: player2.answers.length })
      }
      for (const entry of entries) {
        await fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        })
      }
      setSaved(true)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-8">
      <h2 className="text-5xl font-black">ゲーム終了</h2>

      {isBattle && winner && (
        <div className="text-center">
          {winner === "draw" ? (
            <p className="text-4xl font-black text-yellow-500 animate-pulse">引き分け</p>
          ) : (
            <p className="text-4xl font-black text-red-500 animate-bounce">
              {winner === "p1" ? player1.name : player2.name} の勝ち！
            </p>
          )}
        </div>
      )}

      <div className={`w-full flex gap-4 ${!isBattle ? "justify-center" : ""}`}>
        <PlayerResult
          label={mode === "solo" ? "あなた" : player1.name}
          player={player1}
          isWinner={winner === "p1"}
        />
        {isBattle && player2.name && (
          <PlayerResult
            label={player2.name}
            player={player2}
            isWinner={winner === "p2"}
          />
        )}
      </div>

      {!saved && (
        <button
          onClick={saveScore}
          disabled={saving}
          className="w-full max-w-xs bg-green-500 text-white rounded-xl px-8 py-4 text-xl font-black hover:bg-green-600 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg"
        >
          {saving ? "保存中..." : "スコアを登録"}
        </button>
      )}
      {saved && <p className="text-green-600 font-black text-xl">スコアを登録しました</p>}

      <div className="flex gap-4 w-full max-w-xs">
        <button
          onClick={onPlayAgain}
          className="flex-1 border-3 border-red-500 text-red-500 rounded-xl px-4 py-4 text-xl font-black hover:bg-red-50 transition-all hover:scale-105 active:scale-95"
        >
          もう一度
        </button>
        <button
          onClick={onBackToTop}
          className="flex-1 border-2 rounded-xl px-4 py-4 text-lg text-muted-foreground hover:bg-muted transition-colors"
        >
          トップへ
        </button>
      </div>
    </div>
  )
}

function PlayerResult({ label, player, isWinner }: { label: string; player: PlayerState; isWinner: boolean }) {
  return (
    <div className={`border-2 rounded-xl p-5 flex-1 transition-all ${isWinner ? "border-yellow-400 bg-yellow-50 shadow-xl shadow-yellow-200" : "border-border"}`}>
      <p className="font-black text-xl mb-3 text-center">{label} {isWinner && "👑"}</p>
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground font-bold">最終スコア</p>
        <p className="text-5xl font-black font-mono">{player.hp}</p>
      </div>
      <div className="text-lg space-y-1">
        <div className="flex justify-between">
          <span>回答数</span>
          <span className="font-mono font-bold">{player.answers.length} / {TOTAL_QUESTIONS}</span>
        </div>
        <div className="flex justify-between">
          <span>状態</span>
          <span className="font-bold">{player.isGameOver ? "GAME OVER" : "CLEAR"}</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t space-y-1 text-sm">
        {player.answers.map((a, i) => (
          <div key={i} className="flex justify-between">
            <span className="font-bold">第{a.questionNo}問</span>
            <span className="font-mono">
              {a.answerPct}% → {Math.round(a.correctPct)}% ({a.damage === 0 ? "PERFECT" : `−${a.damage}`})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
