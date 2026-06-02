import React from 'react'
import { GameState } from '@/types/game'

interface Props {
  gameState: GameState
}

export default function HUD({ gameState }: Props) {
  const hearts = Array.from({ length: 3 }, (_, i) => i < gameState.lives)

  return (
    <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-3 pointer-events-none">
      {/* Lives */}
      <div className="flex gap-1">
        {hearts.map((alive, i) => (
          <span key={i} className="text-2xl" style={{ opacity: alive ? 1 : 0.25 }}>❤️</span>
        ))}
      </div>

      {/* Score */}
      <div className="text-center">
        <div className="text-yellow-300 font-black text-3xl drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
          {gameState.score.toLocaleString()}
        </div>
        <div className="text-yellow-500/70 text-xs font-semibold uppercase tracking-widest">Score</div>
      </div>

      {/* Level & High Score */}
      <div className="text-right">
        <div className="text-purple-300 font-bold text-lg drop-shadow">LVL {gameState.level}</div>
        <div className="text-white/50 text-xs">Best: {gameState.highScore.toLocaleString()}</div>
      </div>
    </div>
  )
}
