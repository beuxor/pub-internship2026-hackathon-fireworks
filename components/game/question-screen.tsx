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
  onBackToTop: () => void
}

export function QuestionScreen({
  question, questionNo, totalQuestions, playerName, hp, isLocalMode, onSubmit, onBackToTop,
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
        <div className="w-full text-center py-3 bg-red-50 rounded-xl border-2 border-red-200">
          <span className="text-red-600 font-black text-2xl">{playerName}</span> <span className="text-xl">の番</span>
        </div>
      )}

      <div className="w-full border-3 border-foreground rounded-xl p-6 shadow-lg">
        <p className="text-lg text-muted-foreground mb-2 font-bold">第{questionNo}問</p>
        <h2 className="text-2xl font-black leading-relaxed">{question.questionText}</h2>
      </div>

      <div className="w-full flex items-center justify-end gap-3">
        <span className="text-xl font-bold">残り風船：</span>
        <span className={`text-4xl font-black font-mono ${hpPercent <= 25 ? "text-red-500 animate-pulse" : ""}`}>{hp}</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${hpPercent}%`,
            backgroundColor: hpPercent > 50 ? "#22c55e" : hpPercent > 25 ? "#eab308" : "#ef4444",
            boxShadow: hpPercent <= 25 ? "0 0 12px #ef4444" : "none",
          }}
        />
      </div>

      <div className="text-lg text-muted-foreground font-bold">
        {questionNo} / {totalQuestions} 問
      </div>

      <div className="w-full">
        <input
          type={isLocalMode ? "password" : "number"}
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }}
          disabled={submitted}
          className="w-full border-3 border-foreground rounded-xl px-6 py-5 text-3xl text-center font-mono font-bold bg-background shadow-lg"
          placeholder="入力してください %"
          autoFocus
        />

        <button
          onClick={handleSubmit}
          disabled={submitted || !value || parseInt(value) < 0 || parseInt(value) > 100}
          className="w-full mt-4 bg-red-500 text-white rounded-xl px-8 py-5 text-2xl font-black hover:bg-red-600 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          回答する
        </button>
      </div>

      <button
        onClick={onBackToTop}
        className="text-muted-foreground hover:text-foreground text-lg transition-colors mt-2"
      >
        メニューに戻る
      </button>
    </div>
  )
}
