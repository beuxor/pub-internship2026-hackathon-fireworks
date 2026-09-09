"use client"

import { useState, useCallback } from "react"
import type { Question, GameMode, GamePhase, PlayerState, PlayerAnswer } from "@/lib/game-types"
import { DAMAGE_RATE, INITIAL_HP, TOTAL_QUESTIONS } from "@/lib/constants"
import { TopScreen } from "@/components/game/top-screen"
import { SetupScreen } from "@/components/game/setup-screen"
import { QuestionScreen } from "@/components/game/question-screen"
import { SwapScreen } from "@/components/game/swap-screen"
import { ResultScreen } from "@/components/game/result-screen"
import { FinishedScreen } from "@/components/game/finished-screen"
import { OnlineWaitingScreen } from "@/components/game/online-waiting-screen"
import { OnlineGameScreen } from "@/components/game/online-game-screen"

function calcDamage(guess: number, correct: number): { errorAbs: number; damage: number } {
  const errorAbs = Math.round(Math.abs(guess - correct) * 10) / 10
  const damage = Math.round(errorAbs * DAMAGE_RATE)
  return { errorAbs, damage }
}

export function GameContainer() {
  const [phase, setPhase] = useState<GamePhase>("top")
  const [mode, setMode] = useState<GameMode>("solo")
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [player1, setPlayer1] = useState<PlayerState>({ name: "", hp: INITIAL_HP, answers: [], isGameOver: false })
  const [player2, setPlayer2] = useState<PlayerState>({ name: "", hp: INITIAL_HP, answers: [], isGameOver: false })
  const [currentPlayer, setCurrentPlayer] = useState(1)
  const [lastAnswer, setLastAnswer] = useState<{ p1?: PlayerAnswer; p2?: PlayerAnswer } | null>(null)
  const [onlineSessionId, setOnlineSessionId] = useState("")
  const [onlineRoomCode, setOnlineRoomCode] = useState("")

  const resetGame = useCallback(() => {
    setPhase("top")
    setQuestions([])
    setCurrentQ(0)
    setPlayer1({ name: "", hp: INITIAL_HP, answers: [], isGameOver: false })
    setPlayer2({ name: "", hp: INITIAL_HP, answers: [], isGameOver: false })
    setCurrentPlayer(1)
    setLastAnswer(null)
    setOnlineSessionId("")
    setOnlineRoomCode("")
  }, [])

  const startGame = useCallback(async (selectedMode: GameMode, p1Name: string, p2Name?: string) => {
    setMode(selectedMode)
    setPlayer1({ name: p1Name, hp: INITIAL_HP, answers: [], isGameOver: false })
    if (p2Name) {
      setPlayer2({ name: p2Name, hp: INITIAL_HP, answers: [], isGameOver: false })
    }

    if (selectedMode === "online") {
      setPhase("waiting")
      return
    }

    const res = await fetch("/api/questions?count=5")
    const qs = await res.json()
    setQuestions(qs)
    setCurrentQ(0)
    setCurrentPlayer(1)
    setPhase("playing")
  }, [])

  const submitAnswer = useCallback((guess: number) => {
    const q = questions[currentQ]
    const { errorAbs, damage } = calcDamage(guess, q.answerPct)

    if (mode === "solo") {
      const newHp = Math.max(0, player1.hp - damage)
      const answer: PlayerAnswer = {
        questionNo: currentQ + 1,
        questionId: q.questionId,
        answerPct: guess,
        correctPct: q.answerPct,
        errorAbs,
        damage,
        remainingHp: newHp,
      }
      const isOver = newHp <= 0
      setPlayer1((prev) => ({
        ...prev,
        hp: newHp,
        answers: [...prev.answers, answer],
        isGameOver: isOver,
      }))
      setLastAnswer({ p1: answer })
      setPhase("result")
    } else if (mode === "local") {
      if (currentPlayer === 1) {
        const newHp = Math.max(0, player1.hp - damage)
        const answer: PlayerAnswer = {
          questionNo: currentQ + 1,
          questionId: q.questionId,
          answerPct: guess,
          correctPct: q.answerPct,
          errorAbs,
          damage,
          remainingHp: newHp,
        }
        setPlayer1((prev) => ({
          ...prev,
          hp: newHp,
          answers: [...prev.answers, answer],
          isGameOver: newHp <= 0,
        }))
        setLastAnswer((prev) => ({ ...prev, p1: answer }))
        if (!player2.isGameOver) {
          setPhase("swap")
        } else {
          setPhase("result")
        }
      } else {
        const newHp = Math.max(0, player2.hp - damage)
        const answer: PlayerAnswer = {
          questionNo: currentQ + 1,
          questionId: q.questionId,
          answerPct: guess,
          correctPct: q.answerPct,
          errorAbs,
          damage,
          remainingHp: newHp,
        }
        setPlayer2((prev) => ({
          ...prev,
          hp: newHp,
          answers: [...prev.answers, answer],
          isGameOver: newHp <= 0,
        }))
        setLastAnswer((prev) => ({ ...prev, p2: answer }))
        setPhase("result")
      }
    }
  }, [questions, currentQ, mode, currentPlayer, player1.hp, player2.hp, player2.isGameOver])

  const nextQuestion = useCallback(() => {
    const nextQ = currentQ + 1

    if (mode === "solo") {
      if (player1.isGameOver || nextQ >= TOTAL_QUESTIONS) {
        setPhase("finished")
      } else {
        setCurrentQ(nextQ)
        setLastAnswer(null)
        setPhase("playing")
      }
    } else if (mode === "local") {
      const bothOver = player1.isGameOver && player2.isGameOver
      if (bothOver || nextQ >= TOTAL_QUESTIONS) {
        setPhase("finished")
      } else {
        setCurrentQ(nextQ)
        setCurrentPlayer(1)
        setLastAnswer(null)
        if (player1.isGameOver) {
          setCurrentPlayer(2)
        }
        setPhase("playing")
      }
    }
  }, [currentQ, mode, player1.isGameOver, player2.isGameOver])

  const handleSwapReady = useCallback(() => {
    setCurrentPlayer(2)
    setPhase("playing")
  }, [])

  const handleOnlineReady = useCallback((sessionId: string, roomCode: string, qs: Question[]) => {
    setOnlineSessionId(sessionId)
    setOnlineRoomCode(roomCode)
    setQuestions(qs)
    setPhase("playing")
  }, [])

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4">
      {phase === "top" && (
        <TopScreen onSelectMode={(m) => { setMode(m); setPhase("setup") }} />
      )}

      {phase === "setup" && (
        <SetupScreen mode={mode} onStart={startGame} onBack={resetGame} />
      )}

      {phase === "waiting" && mode === "online" && (
        <OnlineWaitingScreen
          playerName={player1.name}
          onReady={handleOnlineReady}
          onBack={resetGame}
        />
      )}

      {phase === "playing" && mode !== "online" && questions.length > 0 && (
        <QuestionScreen
          question={questions[currentQ]}
          questionNo={currentQ + 1}
          totalQuestions={TOTAL_QUESTIONS}
          playerName={mode === "local" ? (currentPlayer === 1 ? player1.name : player2.name) : player1.name}
          hp={currentPlayer === 1 ? player1.hp : player2.hp}
          isLocalMode={mode === "local"}
          onSubmit={submitAnswer}
        />
      )}

      {phase === "playing" && mode === "online" && (
        <OnlineGameScreen
          sessionId={onlineSessionId}
          playerName={player1.name}
          questions={questions}
          onFinished={(finalPlayer1, finalPlayer2) => {
            setPlayer1(finalPlayer1)
            setPlayer2(finalPlayer2)
            setPhase("finished")
          }}
        />
      )}

      {phase === "swap" && mode === "local" && (
        <SwapScreen nextPlayerName={player2.name} onReady={handleSwapReady} />
      )}

      {phase === "result" && (
        <ResultScreen
          mode={mode}
          lastAnswer={lastAnswer}
          player1Name={player1.name}
          player2Name={player2.name}
          player1GameOver={player1.isGameOver}
          player2GameOver={player2.isGameOver}
          questionNo={currentQ + 1}
          totalQuestions={TOTAL_QUESTIONS}
          onNext={nextQuestion}
        />
      )}

      {phase === "finished" && (
        <FinishedScreen
          mode={mode}
          player1={player1}
          player2={player2}
          onPlayAgain={() => { setPhase("setup") }}
          onBackToTop={resetGame}
        />
      )}
    </div>
  )
}
