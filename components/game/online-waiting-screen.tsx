"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Question } from "@/lib/game-types"

interface OnlineWaitingScreenProps {
  playerName: string
  onReady: (sessionId: string, roomCode: string, questions: Question[]) => void
  onBack: () => void
}

export function OnlineWaitingScreen({ playerName, onReady, onBack }: OnlineWaitingScreenProps) {
  const [stage, setStage] = useState<"choose" | "hosting" | "joining">("choose")
  const [roomCode, setRoomCode] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [displayCode, setDisplayCode] = useState("")
  const [error, setError] = useState("")
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const createRoom = useCallback(async () => {
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "online", playerName }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setSessionId(data.sessionId)
      setDisplayCode(data.roomCode)
      setStage("hosting")
    } catch {
      setError("部屋の作成に失敗しました")
    }
  }, [playerName])

  const joinRoom = useCallback(async () => {
    if (roomCode.length !== 4) { setError("4桁の合言葉を入力してください"); return }
    try {
      const res = await fetch(`/api/session?roomCode=${roomCode}`)
      const data = await res.json()
      if (data.error) { setError("部屋が見つかりません"); return }
      if (data.player2Name) { setError("部屋は満員です"); return }

      await fetch("/api/session", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: data.sessionId, playerName }),
      })

      setSessionId(data.sessionId)
      onReady(data.sessionId, roomCode, data.questions)
    } catch {
      setError("入室に失敗しました")
    }
  }, [roomCode, playerName, onReady])

  useEffect(() => {
    if (stage !== "hosting" || !sessionId) return

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/session?sessionId=${sessionId}`)
        const data = await res.json()
        if (data.player2Name) {
          if (pollingRef.current) clearInterval(pollingRef.current)
          onReady(sessionId, displayCode, data.questions)
        }
      } catch {
        // ignore
      }
    }, 2000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [stage, sessionId, displayCode, onReady])

  if (stage === "choose") {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6">
        <h2 className="text-2xl font-bold">オンライン対戦</h2>
        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={createRoom}
            className="w-full border-2 border-red-500 rounded-lg px-8 py-4 text-xl font-bold text-red-500 hover:bg-red-50 transition-colors"
          >
            部屋を作る
          </button>
          <div className="text-center text-muted-foreground">または</div>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={4}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ""))}
              className="flex-1 border rounded-lg px-4 py-3 text-lg text-center tracking-[0.5em] font-mono bg-background"
              placeholder="合言葉"
            />
            <button
              onClick={joinRoom}
              className="bg-red-500 text-white rounded-lg px-6 py-3 font-bold hover:bg-red-600 transition-colors"
            >
              入室
            </button>
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
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

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6">
      <h2 className="text-2xl font-bold">対戦相手を待っています...</h2>
      <div className="border-2 border-red-500 rounded-lg p-8 text-center">
        <p className="text-sm text-muted-foreground mb-2">合言葉</p>
        <p className="text-5xl font-bold font-mono tracking-[0.3em] text-red-500">{displayCode}</p>
      </div>
      <p className="text-muted-foreground">この合言葉を対戦相手に伝えてください</p>
      <div className="animate-pulse text-2xl">⏳</div>
      <button
        onClick={onBack}
        className="border rounded-lg px-8 py-3 text-muted-foreground hover:bg-muted transition-colors"
      >
        キャンセル
      </button>
    </div>
  )
}
