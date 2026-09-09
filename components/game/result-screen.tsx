"use client"

import type { PlayerAnswer } from "@/lib/game-types"
import type { GameMode } from "@/lib/game-types"

interface ResultScreenProps {
  mode: GameMode
  lastAnswer: { p1?: PlayerAnswer; p2?: PlayerAnswer } | null
  player1Name: string
  player2Name: string
  player1GameOver: boolean
  player2GameOver: boolean
  questionNo: number
  totalQuestions: number
  onNext: () => void
}

function AnswerResult({ label, answer, isGameOver }: { label: string; answer: PlayerAnswer; isGameOver: boolean }) {
  return (
    <div className="border rounded-lg p-4 flex-1">
      <p className="font-bold text-lg mb-2">{label}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>あなたの回答</span>
          <span className="font-mono font-bold">{answer.answerPct}%</span>
        </div>
        <div className="flex justify-between">
          <span>誤差</span>
          <span className="font-mono text-red-500">-{answer.damage}</span>
        </div>
        <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
          <span>残り風船</span>
          <span className={`font-mono ${answer.remainingHp <= 0 ? "text-red-500" : ""}`}>
            {answer.remainingHp}
          </span>
        </div>
        {isGameOver && (
          <p className="text-red-500 font-bold text-center mt-2">ゲームオーバー</p>
        )}
      </div>
    </div>
  )
}

export function ResultScreen({
  mode, lastAnswer, player1Name, player2Name,
  player1GameOver, player2GameOver, questionNo, totalQuestions, onNext,
}: ResultScreenProps) {
  if (!lastAnswer) return null
  const correct = lastAnswer.p1?.correctPct ?? lastAnswer.p2?.correctPct ?? 0

  const isLast = questionNo >= totalQuestions ||
    (mode === "solo" && player1GameOver) ||
    (mode === "local" && player1GameOver && player2GameOver)

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-1">第{questionNo}問の結果</p>
        <div className="bg-green-50 border-2 border-green-500 rounded-lg px-8 py-4">
          <p className="text-sm text-green-700">正解</p>
          <p className="text-4xl font-bold text-green-600 font-mono">{correct}%</p>
        </div>
      </div>

      <div className={`w-full flex gap-4 ${mode === "solo" ? "justify-center" : ""}`}>
        {lastAnswer.p1 && (
          <AnswerResult label={mode === "solo" ? "あなた" : player1Name} answer={lastAnswer.p1} isGameOver={player1GameOver} />
        )}
        {lastAnswer.p2 && mode === "local" && (
          <AnswerResult label={player2Name} answer={lastAnswer.p2} isGameOver={player2GameOver} />
        )}
      </div>

      <button
        onClick={onNext}
        className="w-full max-w-xs bg-red-500 text-white rounded-lg px-8 py-4 text-xl font-bold hover:bg-red-600 transition-colors"
      >
        {isLast ? "結果を見る" : "次の問題へ"}
      </button>
    </div>
  )
}
