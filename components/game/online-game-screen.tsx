"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Question, PlayerState, PlayerAnswer } from "@/lib/game-types"
import { DAMAGE_RATE, INITIAL_HP, TOTAL_QUESTIONS } from "@/lib/constants"

interface OnlineGameScreenProps {
  sessionId: string
  playerName: string
  questions: Question[]
  onFinished: (player1: PlayerState, player2: PlayerState) => void
}

export function OnlineGameScreen({ sessionId, playerName, questions, onFinished }: OnlineGameScreenProps) {
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
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const submittedRef = useRef(false)

  const question = questions.length > 0 ? questions.find((q) => q.questionId === questions[currentQ]?.questionId) || questions[currentQ] : null

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
        sessionId,
        playerName,
        questionNo: currentQ + 1,
        questionId: question.questionId,
        answerPct: guess,
        correctPct: question.answerPct,
        remainingHpBefore: hp,
      }),
    })

    const myAnswer: PlayerAnswer = {
      questionNo: currentQ + 1,
      questionId: question.questionId,
      answerPct: guess,
      correctPct: question.answerPct,
      errorAbs,
      damage,
      remainingHp,
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
      } catch {
        // ignore
      }
    }, 2000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [waiting, sessionId, currentQ, playerName, question, opponentName])

  const nextQuestion = () => {
    const nextQ = currentQ + 1
    if (isGameOver || nextQ >= TOTAL_QUESTIONS || nextQ >= questions.length) {
      const me: PlayerState = {
        name: playerName,
        hp,
        answers: myAnswers,
        isGameOver,
      }
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
  }

  if (!question) return <div className="text-center">読み込み中...</div>

  if (showResult && lastResult) {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6">
        <p className="text-sm text-muted-foreground">第{currentQ + 1}問の結果</p>
        <div className="bg-green-50 border-2 border-green-500 rounded-lg px-8 py-4 text-center">
          <p className="text-sm text-green-700">正解</p>
          <p className="text-4xl font-bold text-green-600 font-mono">{question.answerPct}%</p>
        </div>
        <div className="w-full flex gap-4">
          <div className="border rounded-lg p-4 flex-1">
            <p className="font-bold mb-2">{playerName}</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>回答</span><span className="font-mono">{lastResult.my.answerPct}%</span></div>
              <div className="flex justify-between"><span>減点</span><span className="font-mono text-red-500">-{lastResult.my.damage}</span></div>
              <div className="flex justify-between font-bold"><span>残り</span><span className="font-mono">{lastResult.my.remainingHp}</span></div>
            </div>
          </div>
          <div className="border rounded-lg p-4 flex-1">
            <p className="font-bold mb-2">{opponentName || "対戦相手"}</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>回答</span><span className="font-mono">{lastResult.opponent.answerPct}%</span></div>
              <div className="flex justify-between"><span>減点</span><span className="font-mono text-red-500">-{lastResult.opponent.damage}</span></div>
              <div className="flex justify-between font-bold"><span>残り</span><span className="font-mono">{lastResult.opponent.remainingHp}</span></div>
            </div>
          </div>
        </div>
        <button onClick={nextQuestion} className="w-full max-w-xs bg-red-500 text-white rounded-lg px-8 py-4 text-xl font-bold hover:bg-red-600 transition-colors">
          {currentQ + 1 >= TOTAL_QUESTIONS || isGameOver ? "結果を見る" : "次の問題へ"}
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6">
      <div className="w-full flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{currentQ + 1} / {TOTAL_QUESTIONS}</span>
        <span className={`text-2xl font-bold font-mono ${timeLeft <= 5 ? "text-red-500" : ""}`}>⏱ {timeLeft}秒</span>
      </div>
      <div className="w-full border-2 border-foreground rounded-lg p-6">
        <p className="text-sm text-muted-foreground mb-2">第{currentQ + 1}問</p>
        <h2 className="text-xl font-bold leading-relaxed">{question.questionText}</h2>
      </div>
      <div className="w-full flex items-center justify-end gap-2">
        <span className="text-lg">残り風船：</span>
        <span className="text-3xl font-bold font-mono">{hp}</span>
      </div>
      {waiting ? (
        <div className="text-center py-8">
          <div className="animate-pulse text-2xl mb-4">⏳</div>
          <p className="text-lg font-bold">相手の回答を待っています...</p>
        </div>
      ) : (
        <div className="w-full">
          <input
            type="number"
            min={0}
            max={100}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !submitted) { const n = parseInt(value); if (!isNaN(n) && n >= 0 && n <= 100) submitMyAnswer(n) } }}
            disabled={submitted}
            className="w-full border-2 border-foreground rounded-lg px-6 py-4 text-2xl text-center font-mono bg-background"
            placeholder="入力してください %"
            autoFocus
          />
          <button
            onClick={() => { const n = parseInt(value); if (!isNaN(n) && n >= 0 && n <= 100) submitMyAnswer(n) }}
            disabled={submitted || !value}
            className="w-full mt-4 bg-red-500 text-white rounded-lg px-8 py-4 text-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            回答する
          </button>
        </div>
      )}
    </div>
  )
}
