"use client"

import { useState } from "react"
import type { GameMode } from "@/lib/game-types"

interface SetupScreenProps {
  mode: GameMode
  onStart: (mode: GameMode, p1Name: string, p2Name?: string) => void
  onBack: () => void
}

export function SetupScreen({ mode, onStart, onBack }: SetupScreenProps) {
  const [p1Name, setP1Name] = useState("")
  const [p2Name, setP2Name] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [isHost, setIsHost] = useState(true)
  const [error, setError] = useState("")

  const modeLabel = mode === "solo" ? "ひとり用" : mode === "local" ? "ふたり用（ローカル）" : "ふたり用（オンライン）"

  const handleStart = () => {
    if (!p1Name.trim()) { setError("名前を入力してください"); return }
    if (p1Name.trim().length > 20) { setError("名前は20文字以内で入力してください"); return }
    if ((mode === "local") && !p2Name.trim()) { setError("プレイヤー2の名前を入力してください"); return }
    if ((mode === "local") && p1Name.trim() === p2Name.trim()) { setError("同じ名前は使えません"); return }
    if (mode === "online" && !isHost && !roomCode.trim()) { setError("合言葉を入力してください"); return }
    setError("")
    onStart(mode, p1Name.trim(), mode !== "solo" ? p2Name.trim() || undefined : undefined)
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6">
      <h2 className="text-2xl font-bold">{modeLabel}</h2>

      <div className="w-full flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {mode === "solo" ? "プレイヤー名" : "プレイヤー1の名前"}
          </label>
          <input
            type="text"
            maxLength={20}
            value={p1Name}
            onChange={(e) => setP1Name(e.target.value)}
            className="w-full border rounded-lg px-4 py-3 text-lg bg-background"
            placeholder="名前を入力"
          />
        </div>

        {mode === "local" && (
          <div>
            <label className="block text-sm font-medium mb-1">プレイヤー2の名前</label>
            <input
              type="text"
              maxLength={20}
              value={p2Name}
              onChange={(e) => setP2Name(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 text-lg bg-background"
              placeholder="名前を入力"
            />
          </div>
        )}

        {mode === "online" && (
          <>
            <div className="flex gap-3">
              <button
                onClick={() => setIsHost(true)}
                className={`flex-1 py-2 rounded-lg border-2 ${isHost ? "border-red-500 bg-red-50 text-red-600" : "border-gray-300"}`}
              >
                部屋を作る
              </button>
              <button
                onClick={() => setIsHost(false)}
                className={`flex-1 py-2 rounded-lg border-2 ${!isHost ? "border-red-500 bg-red-50 text-red-600" : "border-gray-300"}`}
              >
                部屋に入る
              </button>
            </div>
            {!isHost && (
              <div>
                <label className="block text-sm font-medium mb-1">合言葉（4桁）</label>
                <input
                  type="text"
                  maxLength={4}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full border rounded-lg px-4 py-3 text-lg text-center tracking-[0.5em] font-mono bg-background"
                  placeholder="0000"
                />
              </div>
            )}
          </>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleStart}
          className="w-full bg-red-500 text-white rounded-lg px-8 py-4 text-xl font-bold hover:bg-red-600 transition-colors"
        >
          {mode === "online" && !isHost ? "入室する" : "ゲーム開始"}
        </button>

        <button
          onClick={onBack}
          className="w-full border rounded-lg px-8 py-3 text-muted-foreground hover:bg-muted transition-colors"
        >
          戻る
        </button>
      </div>
    </div>
  )
}
