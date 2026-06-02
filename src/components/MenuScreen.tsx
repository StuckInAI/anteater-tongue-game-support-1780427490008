import React from 'react'

interface Props {
  onStart: () => void
  highScore: number
}

export default function MenuScreen({ onStart, highScore }: Props) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
      <div className="text-center">
        <div className="text-6xl mb-4">🐜</div>
        <h1 className="text-5xl font-black text-yellow-300 mb-2" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
          Anteater Game
        </h1>
        <p className="text-white/70 text-lg mb-2">Click to fire your tongue and eat bugs!</p>
        {highScore > 0 && (
          <p className="text-yellow-400 text-sm mb-6">Best: {highScore.toLocaleString()}</p>
        )}
        <button
          onClick={onStart}
          className="mt-6 px-10 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-2xl rounded-2xl shadow-lg transition-all active:scale-95"
        >
          Play!
        </button>
      </div>
    </div>
  )
}
