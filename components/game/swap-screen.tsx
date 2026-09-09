"use client"

export function SwapScreen({
  nextPlayerName,
  onReady,
}: {
  nextPlayerName: string
  onReady: () => void
}) {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-8 text-center">
      <div className="text-6xl">🔄</div>
      <h2 className="text-2xl font-bold">
        端末を<span className="text-red-500">{nextPlayerName}</span>に渡してください
      </h2>
      <p className="text-muted-foreground">
        準備ができたら下のボタンを押してください
      </p>
      <button
        onClick={onReady}
        className="w-full max-w-xs bg-red-500 text-white rounded-lg px-8 py-4 text-xl font-bold hover:bg-red-600 transition-colors"
      >
        準備OK
      </button>
    </div>
  )
}
