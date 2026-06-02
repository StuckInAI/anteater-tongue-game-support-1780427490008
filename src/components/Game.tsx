import React, { useRef, useCallback, useEffect, useState } from 'react'
import { useAnteaterGame } from '@/hooks/useAnteaterGame'
import GameCanvas from './GameCanvas'
import HUD from './HUD'
import MenuScreen from './MenuScreen'
import GameOverScreen from './GameOverScreen'

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    const onResize = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const { gameState, bugs, tongue, anteater, popups, fireTongue, startGame, TONGUE_THICKNESS } = useAnteaterGame(dims.w, dims.h)

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState.phase !== 'playing') return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (!tongue.active) {
      fireTongue(x, y)
    }
  }, [gameState.phase, tongue.active, fireTongue])

  const handleTouch = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (gameState.phase !== 'playing') return
    e.preventDefault()
    const touch = e.touches[0]
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    if (!tongue.active) {
      fireTongue(x, y)
    }
  }, [gameState.phase, tongue.active, fireTongue])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full cursor-crosshair"
      onClick={handleClick}
      onTouchStart={handleTouch}
      style={{ touchAction: 'none' }}
    >
      <GameCanvas
        width={dims.w}
        height={dims.h}
        bugs={bugs}
        tongue={tongue}
        anteater={anteater}
        popups={popups}
        tongueThickness={TONGUE_THICKNESS}
      />
      {gameState.phase === 'playing' && (
        <HUD gameState={gameState} />
      )}
      {gameState.phase === 'menu' && (
        <MenuScreen onStart={startGame} highScore={gameState.highScore} />
      )}
      {gameState.phase === 'gameover' && (
        <GameOverScreen gameState={gameState} onRestart={startGame} />
      )}
    </div>
  )
}
