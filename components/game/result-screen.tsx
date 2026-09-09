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
  onBackToTop: () => void
}

function ParrotBackground() {
  const positions = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${(i * 17 + 7) % 100}%`,
    top: `${(i * 23 + 3) % 100}%`,
    delay: `${(i * 0.15)}s`,
    size: 48 + (i % 4) * 16,
  }))
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {positions.map((p) => (
        <img
          key={p.id}
          src="/parrot.gif"
          alt=""
          className="absolute animate-bounce"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size, animationDelay: p.delay }}
        />
      ))}
    </div>
  )
}

function AnswerResult({ label, answer, isGameOver }: { label: string; answer: PlayerAnswer; isGameOver: boolean }) {
  const isPerfect = answer.damage === 0
  return (
    <div className={`border-2 rounded-xl p-5 flex-1 transition-all ${isPerfect ? "border-yellow-400 bg-yellow-50 shadow-lg shadow-yellow-200" : "border-border"}`}>
      <p className="font-bold text-xl mb-3">{label}</p>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-lg">回答</span>
          <span className="font-mono font-bold text-2xl">{answer.answerPct}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-lg">誤差</span>
          {isPerfect ? (
            <span className="font-mono font-bold text-2xl text-yellow-500">PERFECT!</span>
          ) : (
            <span className="font-mono font-bold text-2xl text-red-500">-{answer.damage}</span>
          )}
        </div>
        <div className="flex justify-between items-center text-xl font-bold mt-3 pt-3 border-t">
          <span>残り風船</span>
          <span className={`font-mono text-3xl ${answer.remainingHp <= 0 ? "text-red-500" : answer.remainingHp >= 80 ? "text-green-500" : ""}`}>
            {answer.remainingHp}
          </span>
        </div>
        {isGameOver && (
          <p className="text-red-500 font-bold text-center mt-3 text-xl animate-pulse">GAME OVER</p>
        )}
      </div>
    </div>
  )
}

export function ResultScreen({
  mode, lastAnswer, player1Name, player2Name,
  player1GameOver, player2GameOver, questionNo, totalQuestions, onNext, onBackToTop,
}: ResultScreenProps) {
  if (!lastAnswer) return null
  const correctRaw = lastAnswer.p1?.correctPct ?? lastAnswer.p2?.correctPct ?? 0
  const correct = Math.round(correctRaw)

  const isLast = questionNo >= totalQuestions ||
    (mode === "solo" && player1GameOver) ||
    (mode === "local" && player1GameOver && player2GameOver)

  const anyPerfect = (lastAnswer.p1?.damage === 0) || (lastAnswer.p2?.damage === 0)

  return (
    <>
      {anyPerfect && <ParrotBackground />}
      <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-8 relative z-10">
        <div className="text-center">
          <p className="text-xl text-muted-foreground mb-2">第{questionNo}問の結果</p>
          <div className={`rounded-2xl px-10 py-6 ${anyPerfect ? "bg-yellow-100 border-4 border-yellow-400 shadow-2xl shadow-yellow-300" : "bg-green-50 border-4 border-green-500"}`}>
            <p className={`text-lg ${anyPerfect ? "text-yellow-600" : "text-green-700"}`}>正解</p>
            <p className={`text-[72px] font-black font-mono leading-none ${anyPerfect ? "text-yellow-500" : "text-green-600"}`}>{correct}%</p>
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
          className="w-full max-w-xs bg-red-500 text-white rounded-xl px-8 py-5 text-2xl font-black hover:bg-red-600 transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          {isLast ? "結果を見る" : "次の問題へ"}
        </button>

        <button
          onClick={onBackToTop}
          className="text-muted-foreground hover:text-foreground text-lg transition-colors"
        >
          メニューに戻る
        </button>
      </div>
    </>
  )
}
