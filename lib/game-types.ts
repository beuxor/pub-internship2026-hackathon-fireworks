export interface Question {
  questionId: number
  questionType: string
  questionText: string
  answerPct: number
}

export interface PlayerState {
  name: string
  hp: number
  answers: PlayerAnswer[]
  isGameOver: boolean
}

export interface PlayerAnswer {
  questionNo: number
  questionId: number
  answerPct: number
  correctPct: number
  errorAbs: number
  damage: number
  remainingHp: number
}

export interface LeaderboardEntry {
  playerName: string
  mode: string
  score: number
  questionsCleared: number
  createdAt: string
}

export type GameMode = "solo" | "local" | "online"
export type GamePhase =
  | "top"
  | "setup"
  | "playing"
  | "swap"
  | "result"
  | "finished"
  | "waiting"

export interface OnlineSession {
  sessionId: string
  roomCode: string
  status: string
  player1Name: string
  player2Name: string | null
  questionIds: number[]
  currentQuestionNo: number
}
