"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Question, PlayerState, PlayerAnswer } from "@/lib/game-types"
import { DAMAGE_RATE, INITIAL_HP, TOTAL_QUESTIONS } from "@/lib/constants"

interface OnlineGameScreenProps {
  sessionId: string
  playerName: string
  questions: Question[]
  onFinished: (player1: PlayerState, player2: PlayerState) => void
  onBackToTop: () => void
}

const AUTO_ADVANCE_SECONDS = 4

export function OnlineGameScreen({ sessionId, playerName, questions, onFinished, onBackToTop }: OnlineGameScreenProps) {
  const [currentQ, setCurrentQ] = useState(0)
  const [hp, setHp] = useState(INITIAL_HP)
  const [value, setValue] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15)
  const [myAnswers, setMyAnswers] = useState<PlayerAnswer[]>([])
  const [showResult, setShowResult] = useState(false)
  const [lastResult, setLastResult] = useState<{ my: PlayerAnswer; opponent: PlayerAnswer } | null>(null)
  const [isGameOver, setIsGameOver] = useState(false)
  const [opponentName, setOpponentName] = useState("")
  const [autoAdvanceCount, setAutoAdvanceCount] = useState(AUTO_ADVANCE_SECONDS)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const submittedRef = useRef(false)

  const question = questions.length > 0 ? questions[currentQ] || null : null

  const nextQuestion = useCallback(() => {
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current)
    const nextQ = currentQ + 1
    if (isGameOver || nextQ >= TOTAL_QUESTIONS || nextQ >= questions.length) {
      const me: PlayerState = { name: playerName, hp, answers: myAnswers, isGameOver }
      const opp: PlayerState = {
        name: opponentName || "対戦相手",
        hp: lastResult?.opponent.remainingHp ?? INITIAL_HP,
        answers: [],
        isGameOver: (lastResult?.opponent.remainingHp ?? INITIAL_HP) <= 0,
      }
      onFinished(me, opp)
      return
    }
    setCurrentQ(nextQ)
    setValue("")
    setSubmitted(false)
    submittedRef.current = false
    setShowResult(false)
    setLastResult(null)
    setWaiting(false)
    setAutoAdvanceCount(AUTO_ADVANCE_SECONDS)
  }, [currentQ, isGameOver, questions.length, playerName, hp, myAnswers, opponentName, lastResult, onFinished])

  const submitMyAnswer = useCallback(async (guess: number) => {
    if (!question || submittedRef.current) return
    submittedRef.current = true
    setSubmitted(true)
    if (timerRef.current) clearInterval(timerRef.current)

    const errorAbs = Math.round(Math.abs(guess - question.answerPct) * 10) / 10
    const damage = Math.round(errorAbs * DAMAGE_RATE)
    const remainingHp = Math.max(0, hp - damage)

    await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId, playerName, questionNo: currentQ + 1, questionId: question.questionId,
        answerPct: guess, correctPct: question.answerPct, remainingHpBefore: hp,
      }),
    })

    const myAnswer: PlayerAnswer = {
      questionNo: currentQ + 1, questionId: question.questionId,
      answerPct: guess, correctPct: question.answerPct, errorAbs, damage, remainingHp,
    }

    setHp(remainingHp)
    setMyAnswers((prev) => [...prev, myAnswer])
    if (remainingHp <= 0) setIsGameOver(true)
    setWaiting(true)
  }, [question, hp, sessionId, playerName, currentQ])

  // Timer countdown
  useEffect(() => {
    if (submitted || showResult || !question) return
    setTimeLeft(15)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          submitMyAnswer(Math.round(question.answerPct + 50) % 101)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [currentQ, submitted, showResult, question, submitMyAnswer])

  // Poll for opponent's answer
  useEffect(() => {
    if (!waiting) return
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/session?sessionId=${sessionId}`)
        const data = await res.json()
        if (!opponentName && data.player2Name && data.player1Name) {
          setOpponentName(data.player1Name === playerName ? data.player2Name : data.player1Name)
        }
        const qNo = currentQ + 1
        const answersForQ = data.answers?.filter((a: { questionNo: number }) => a.questionNo === qNo) || []
        if (answersForQ.length >= 2) {
          if (pollingRef.current) clearInterval(pollingRef.current)
          const myA = answersForQ.find((a: { playerName: string }) => a.playerName === playerName)
          const opA = answersForQ.find((a: { playerName: string }) => a.playerName !== playerName)
          if (myA && opA) {
            setLastResult({
              my: { ...myA, correctPct: question?.answerPct || 0 },
              opponent: { ...opA, correctPct: question?.answerPct || 0 },
            })
          }
          setShowResult(true)
          setWaiting(false)
        }
      } catch { /* ignore */ }
    }, 2000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [waiting, sessionId, currentQ, playerName, question, opponentName])

  // Auto-advance countdown when result is shown
  useEffect(() => {
    if (!showResult) return
    setAutoAdvanceCount(AUTO_ADVANCE_SECONDS)
    autoAdvanceRef.current = setInterval(() => {
      setAutoAdvanceCount((prev) => {
        if (prev <= 1) {
          nextQuestion()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current) }
  }, [showResult, nextQuestion])

  if (!question) return <div className="text-center text-2xl">読み込み中...</div>

  const anyPerfect = lastResult && (lastResult.my.damage === 0 || lastResult.opponent.damage === 0)

  if (showResult && lastResult) {
    const correctDisplay = Math.round(question.answerPct)
    return (
      <>
        {anyPerfect && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {Array.from({ length: 15 }, (_, i) => (
              <img key={i} src="/parrot.gif" alt="" className="absolute animate-bounce"
                style={{ left: `${(i * 17 + 7) % 100}%`, top: `${(i * 23 + 3) % 100}%`, width: 56, height: 56, animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
        <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6 relative z-10">
          <p className="text-xl text-muted-foreground font-bold">第{currentQ + 1}問の結果</p>
          <div className={`rounded-2xl px-10 py-6 text-center ${anyPerfect ? "bg-yellow-100 border-4 border-yellow-400 shadow-2xl" : "bg-green-50 border-4 border-green-500"}`}>
            <p className={`text-lg ${anyPerfect ? "text-yellow-600" : "text-green-700"}`}>正解</p>
            <p className={`text-[72px] font-black font-mono leading-none ${anyPerfect ? "text-yellow-500" : "text-green-600"}`}>{correctDisplay}%</p>
          </div>
          <div className="w-full flex gap-4">
            <div className={`border-2 rounded-xl p-5 flex-1 ${lastResult.my.damage === 0 ? "border-yellow-400 bg-yellow-50" : "border-border"}`}>
              <p className="font-bold text-xl mb-2">{playerName}</p>
              <div className="space-y-2 text-lg">
                <div className="flex justify-between"><span>回答</span><span className="font-mono font-bold">{lastResult.my.answerPct}%</span></div>
                <div className="flex justify-between"><span>減点</span>{lastResult.my.damage === 0 ? <span className="font-bold text-yellow-500">PERFECT!</span> : <span className="font-mono text-red-500 font-bold">-{lastResult.my.damage}</span>}</div>
                <div className="flex justify-between font-bold text-xl border-t pt-2"><span>残り</span><span className="font-mono">{lastResult.my.remainingHp}</span></div>
              </div>
            </div>
            <div className={`border-2 rounded-xl p-5 flex-1 ${lastResult.opponent.damage === 0 ? "border-yellow-400 bg-yellow-50" : "border-border"}`}>
              <p className="font-bold text-xl mb-2">{opponentName || "対戦相手"}</p>
              <div className="space-y-2 text-lg">
                <div className="flex justify-between"><span>回答</span><span className="font-mono font-bold">{lastResult.opponent.answerPct}%</span></div>
                <div className="flex justify-between"><span>減点</span>{lastResult.opponent.damage === 0 ? <span className="font-bold text-yellow-500">PERFECT!</span> : <span className="font-mono text-red-500 font-bold">-{lastResult.opponent.damage}</span>}</div>
                <div className="flex justify-between font-bold text-xl border-t pt-2"><span>残り</span><span className="font-mono">{lastResult.opponent.remainingHp}</span></div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-red-500">{autoAdvanceCount}秒後に次へ...</p>
          </div>
          <button onClick={onBackToTop} className="text-muted-foreground hover:text-foreground text-lg transition-colors">メニューに戻る</button>
        </div>
      </>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6">
      <div className="w-full flex justify-between items-center">
        <span className="text-lg font-bold text-muted-foreground">{currentQ + 1} / {TOTAL_QUESTIONS}</span>
        <span className={`text-3xl font-black font-mono ${timeLeft <= 5 ? "text-red-500 animate-pulse" : ""}`}>{timeLeft}秒</span>
      </div>
      <div className="w-full border-3 border-foreground rounded-xl p-6 shadow-lg">
        <p className="text-lg text-muted-foreground mb-2 font-bold">第{currentQ + 1}問</p>
        <h2 className="text-2xl font-black leading-relaxed">{question.questionText}</h2>
      </div>
      <div className="w-full flex items-center justify-end gap-3">
        <span className="text-xl font-bold">残り風船：</span>
        <span className="text-4xl font-black font-mono">{hp}</span>
      </div>
      {waiting ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4 animate-bounce">⏳</div>
          <p className="text-2xl font-black">相手の回答を待っています...</p>
        </div>
      ) : (
        <div className="w-full">
          <input type="number" min={0} max={100} value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !submitted) { const n = parseInt(value); if (!isNaN(n) && n >= 0 && n <= 100) submitMyAnswer(n) } }}
            disabled={submitted}
            className="w-full border-3 border-foreground rounded-xl px-6 py-5 text-3xl text-center font-mono font-bold bg-background shadow-lg"
            placeholder="入力してください %" autoFocus />
          <button
            onClick={() => { const n = parseInt(value); if (!isNaN(n) && n >= 0 && n <= 100) submitMyAnswer(n) }}
            disabled={submitted || !value}
            className="w-full mt-4 bg-red-500 text-white rounded-xl px-8 py-5 text-2xl font-black hover:bg-red-600 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-lg"
          >
            回答する
          </button>
        </div>
      )}
      <button onClick={onBackToTop} className="text-muted-foreground hover:text-foreground text-lg transition-colors mt-2">メニューに戻る</button>
    </div>
  )
}
