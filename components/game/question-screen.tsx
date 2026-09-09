"use client"

import { useState } from "react"
import type { Question } from "@/lib/game-types"
import { INITIAL_HP } from "@/lib/constants"

interface QuestionScreenProps {
  question: Question
  questionNo: number
  totalQuestions: number
  playerName: string
  hp: number
  isLocalMode: boolean
  onSubmit: (guess: number) => void
}

export function QuestionScreen({
  question, questionNo, totalQuestions, playerName, hp, isLocalMode, onSubmit,
}: QuestionScreenProps) {
  const [value, setValue] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 0 || num > 100) return
    setSubmitted(true)
    onSubmit(num)
  }

  const hpPercent = (hp / INITIAL_HP) * 100

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6">
      {isLocalMode && (
        <div className="w-full text-center py-2 bg-red-50 rounded-lg border border-red-200">
          <span className="text-red-600 font-bold text-lg">{playerName}</span> の番です
        </div>
      )}

      <div className="w-full border-2 border-foreground rounded-lg p-6">
        <p className="text-sm text-muted-foreground mb-2">第{questionNo}問</p>
        <h2 className="text-xl font-bold leading-relaxed">{question.questionText}</h2>
      </div>

      <div className="w-full flex items-center justify-end gap-2">
        <span className="text-lg">残り風船：</span>
        <span className="text-3xl font-bold font-mono">{hp}</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${hpPercent}%`,
            backgroundColor: hpPercent > 50 ? "#22c55e" : hpPercent > 25 ? "#eab308" : "#ef4444",
          }}
        />
      </div>

      <div className="text-sm text-muted-foreground">
        {questionNo} / {totalQuestions} 問
      </div>

      <div className="w-full">
        <div className="relative">
          <input
            type={isLocalMode ? "password" : "number"}
            min={0}
            max={100}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }}
            disabled={submitted}
            className="w-full border-2 border-foreground rounded-lg px-6 py-4 text-2xl text-center font-mono bg-background"
            placeholder="入力してください %"
            autoFocus
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitted || !value || parseInt(value) < 0 || parseInt(value) > 100}
          className="w-full mt-4 bg-red-500 text-white rounded-lg px-8 py-4 text-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          回答する
        </button>
      </div>
    </div>
  )
}
