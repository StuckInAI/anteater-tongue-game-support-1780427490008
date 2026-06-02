import React, { useRef, useCallback, useEffect, useState } from 'react'
import GameCanvas from '@/components/GameCanvas'
import HUD from '@/components/HUD'
import MenuScreen from '@/components/MenuScreen'
import GameOverScreen from '@/components/GameOverScreen'
import { useAnteaterGame } from '@/hooks/useAnteaterGame'

const CANVAS_WIDTH = 900
const CANVAS_HEIGHT = 550

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ w: CANVAS_WIDTH, h: CANVAS_HEIGHT })

  const {
    gameState,
    bugs,
    tongue,
    anteater,
    popups,
    fireTongue,
    startGame,
    TONGUE_THICKNESS,
  } = useAnteaterGame(CANVAS_WIDTH, CANVAS_HEIGHT)

  const scaleRef = useRef({ sx: 1, sy: 1, ox: 0, oy: 0 })

  useEffect(() => {
    function updateScale() {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      scaleRef.current = {
        sx: CANVAS_WIDTH / rect.width,
        sy: CANVAS_HEIGHT / rect.height,
        ox: rect.left,
        oy: rect.top,
      }
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  const getCanvasPos = useCallback((clientX: number, clientY: number) => {
    const { sx, sy, ox, oy } = scaleRef.current
    return {
      x: (clientX - ox) * sx,
      y: (clientY - oy) * sy,
    }
  }, [])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (gameState.phase !== 'playing') return
    if (tongue.active) return
    const pos = getCanvasPos(e.clientX, e.clientY)
    fireTongue(pos.x, pos.y)
  }, [gameState.phase, tongue.active, fireTongue, getCanvasPos])

  const handleTouch = useCallback((e: React.TouchEvent) => {
    if (gameState.phase !== 'playing') return
    if (tongue.active) return
    e.preventDefault()
    const t = e.touches[0]
    const pos = getCanvasPos(t.clientX, t.clientY)
    fireTongue(pos.x, pos.y)
  }, [gameState.phase, tongue.active, fireTongue, getCanvasPos])

  return (
    <div className="flex items-center justify-center w-full h-full bg-[#0a0a1a]">
      <div
        ref={containerRef}
        className="relative cursor-crosshair select-none"
        style={{
          width: '95vw',
          maxWidth: `${CANVAS_WIDTH}px`,
          aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`,
          maxHeight: '90vh',
        }}
        onClick={handleClick}
        onTouchStart={handleTouch}
      >
        <div className="w-full h-full relative rounded-xl overflow-hidden shadow-2xl">
          <GameCanvas
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            bugs={bugs}
            tongue={tongue}
            anteater={anteater}
            popups={popups}
            tongueThickness={TONGUE_THICKNESS}
          />
          <HUD gameState={gameState} />
          {gameState.phase === 'menu' && (
            <MenuScreen onStart={startGame} highScore={gameState.highScore} />
          )}
          {gameState.phase === 'gameover' && (
            <GameOverScreen gameState={gameState} onRestart={startGame} />
          )}
        </div>
      </div>
    </div>
  )
}
