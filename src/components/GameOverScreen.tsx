import React from 'react'
import { GameState } from '@/types/game'

interface Props {
  gameState: GameState
  onRestart: () => void
}

export default function GameOverScreen({ gameState, onRestart }: Props) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
      <div className="text-center">
        <div className="text-6xl mb-4">💀</div>
        <h2 className="text-5xl font-black text-red-400 mb-4" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
          Game Over
        </h2>
        <p className="text-white text-2xl font-bold mb-1">
          Score: <span className="text-yellow-300">{gameState.score.toLocaleString()}</span>
        </p>
        <p className="text-white/60 text-lg mb-6">
          Best: {gameState.highScore.toLocaleString()}
        </p>
        <button
          onClick={onRestart}
          className="mt-4 px-10 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-2xl rounded-2xl shadow-lg transition-all active:scale-95"
        >
          Play Again!
        </button>
      </div>
    </div>
  )
}
