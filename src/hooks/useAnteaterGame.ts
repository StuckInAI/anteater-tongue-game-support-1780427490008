import { useState, useCallback, useRef } from 'react'
import { Bug, ScorePopup, GameState, TongueState, TongueSegment, AnteaterPos } from '@/types/game'
import { useGameLoop } from './useGameLoop'

const BUG_TYPES: Bug['type'][] = ['ant', 'beetle', 'fly', 'spider']
const BUG_POINTS: Record<Bug['type'], number> = { ant: 10, beetle: 20, fly: 30, spider: 50 }
const BUG_SPEEDS: Record<Bug['type'], number> = { ant: 80, beetle: 50, fly: 130, spider: 90 }

let nextBugId = 1
let nextPopupId = 1

const TONGUE_SPEED = 600
const TONGUE_MAX_LENGTH = 350
const TONGUE_THICKNESS = 12
const TONGUE_SEGMENT_COUNT = 20
const TONGUE_WAVE_AMPLITUDE = 18
const TONGUE_WAVE_FREQUENCY = 4.5
const TONGUE_WAVE_SPEED = 12

function randomBug(level: number, canvasW: number, canvasH: number): Bug {
  const type = BUG_TYPES[Math.floor(Math.random() * BUG_TYPES.length)]
  const side = Math.random() < 0.5 ? 0 : 1
  const x = side === 0 ? -30 : canvasW + 30
  const y = canvasH * 0.4 + Math.random() * canvasH * 0.45
  const direction = side === 0 ? 1 : -1
  return {
    id: nextBugId++,
    x,
    y,
    type,
    points: BUG_POINTS[type],
    speed: BUG_SPEEDS[type] * (1 + (level - 1) * 0.15),
    direction,
    wiggle: Math.random() * Math.PI * 2,
    eaten: false,
    splat: false,
  }
}

function buildTongueSegments(ax: number, ay: number, angle: number, length: number, time: number): TongueSegment[] {
  const segments: TongueSegment[] = []
  const perpX = -Math.sin(angle)
  const perpY = Math.cos(angle)

  for (let i = 0; i <= TONGUE_SEGMENT_COUNT; i++) {
    const t = i / TONGUE_SEGMENT_COUNT
    const dist = t * length

    // Wave gets stronger toward tip, zero at base
    const waveEnvelope = Math.pow(t, 1.5)
    // Traveling wave that moves outward
    const wave = Math.sin(t * TONGUE_WAVE_FREQUENCY * Math.PI - time * TONGUE_WAVE_SPEED) * TONGUE_WAVE_AMPLITUDE * waveEnvelope
    // Add a secondary smaller, faster wave for organic feel
    const wave2 = Math.sin(t * TONGUE_WAVE_FREQUENCY * 2.3 * Math.PI - time * TONGUE_WAVE_SPEED * 1.7 + 1.3) * TONGUE_WAVE_AMPLITUDE * 0.3 * waveEnvelope

    const totalWave = wave + wave2

    const sx = ax + Math.cos(angle) * dist + perpX * totalWave
    const sy = ay + Math.sin(angle) * dist + perpY * totalWave

    segments.push({ x: sx, y: sy, vx: perpX * totalWave, vy: perpY * totalWave })
  }
  return segments
}

function defaultTongue(): TongueState {
  return {
    active: false,
    angle: 0,
    length: 0,
    maxLength: TONGUE_MAX_LENGTH,
    extending: false,
    retracting: false,
    targetX: 0,
    targetY: 0,
    segments: [],
    time: 0,
  }
}

export function useAnteaterGame(canvasWidth: number, canvasHeight: number) {
  const [gameState, setGameState] = useState<GameState>(() => ({
    score: 0,
    highScore: parseInt(localStorage.getItem('anteater_hs') || '0', 10),
    lives: 3,
    level: 1,
    phase: 'menu',
  }))

  const [bugs, setBugs] = useState<Bug[]>([])
  const [popups, setPopups] = useState<ScorePopup[]>([])
  const [tongue, setTongue] = useState<TongueState>(defaultTongue)
  const [anteater, setAnteater] = useState<AnteaterPos>({
    x: canvasWidth / 2,
    y: canvasHeight * 0.75,
    facingRight: true,
  })

  const stateRef = useRef(gameState)
  const bugsRef = useRef(bugs)
  const tongueRef = useRef(tongue)
  const anteaterRef = useRef(anteater)
  const popupsRef = useRef(popups)
  const spawnTimerRef = useRef<number>(0)
  const levelTimerRef = useRef<number>(0)
  const tongueTimeRef = useRef<number>(0)

  stateRef.current = gameState
  bugsRef.current = bugs
  tongueRef.current = tongue
  anteaterRef.current = anteater
  popupsRef.current = popups

  const fireTongue = useCallback((targetX: number, targetY: number) => {
    const at = anteaterRef.current
    const angle = Math.atan2(targetY - at.y, targetX - at.x)
    tongueTimeRef.current = 0
    setTongue({
      active: true,
      angle,
      length: 0,
      maxLength: TONGUE_MAX_LENGTH,
      extending: true,
      retracting: false,
      targetX,
      targetY,
      segments: [],
      time: 0,
    })
    setAnteater(prev => ({ ...prev, facingRight: targetX >= prev.x }))
  }, [])

  const startGame = useCallback(() => {
    nextBugId = 1
    nextPopupId = 1
    spawnTimerRef.current = 0
    levelTimerRef.current = 0
    tongueTimeRef.current = 0
    setBugs([])
    setPopups([])
    setTongue(defaultTongue())
    setAnteater({ x: canvasWidth / 2, y: canvasHeight * 0.75, facingRight: true })
    setGameState(prev => ({
      ...prev,
      score: 0,
      lives: 3,
      level: 1,
      phase: 'playing',
    }))
  }, [canvasWidth, canvasHeight])

  const tick = useCallback((dt: number) => {
    const gs = stateRef.current
    if (gs.phase !== 'playing') return

    // Spawn bugs
    spawnTimerRef.current += dt
    const spawnInterval = Math.max(0.5, 2.0 - (gs.level - 1) * 0.15)
    if (spawnTimerRef.current >= spawnInterval) {
      spawnTimerRef.current = 0
      const count = bugsRef.current.filter(b => !b.eaten && !b.splat).length
      const maxBugs = 3 + gs.level
      if (count < maxBugs) {
        const newBug = randomBug(gs.level, canvasWidth, canvasHeight)
        setBugs(prev => [...prev, newBug])
      }
    }

    // Level up timer
    levelTimerRef.current += dt
    if (levelTimerRef.current >= 20) {
      levelTimerRef.current = 0
      setGameState(prev => ({ ...prev, level: prev.level + 1 }))
    }

    // Move bugs
    setBugs(prev => {
      const at = anteaterRef.current
      let livesLost = 0
      const updated = prev.map(bug => {
        if (bug.eaten || bug.splat) return bug
        const newX = bug.x + bug.direction * bug.speed * dt
        const newWiggle = bug.wiggle + dt * 5
        const dist = Math.hypot(newX - at.x, bug.y - at.y)
        if (dist < 40) {
          livesLost++
          return { ...bug, splat: true, x: newX, wiggle: newWiggle }
        }
        if (newX < -80 || newX > canvasWidth + 80) {
          return { ...bug, eaten: true }
        }
        return { ...bug, x: newX, wiggle: newWiggle }
      })
      if (livesLost > 0) {
        setGameState(prev2 => {
          const newLives = prev2.lives - livesLost
          if (newLives <= 0) {
            const hs = Math.max(prev2.highScore, prev2.score)
            localStorage.setItem('anteater_hs', String(hs))
            return { ...prev2, lives: 0, highScore: hs, phase: 'gameover' }
          }
          return { ...prev2, lives: newLives }
        })
      }
      return updated
    })

    // Move tongue
    const t = tongueRef.current
    if (t.active) {
      tongueTimeRef.current += dt
      const currentTime = tongueTimeRef.current

      if (t.extending) {
        const newLen = t.length + TONGUE_SPEED * dt
        if (newLen >= t.maxLength) {
          const segs = buildTongueSegments(anteaterRef.current.x, anteaterRef.current.y, t.angle, t.maxLength, currentTime)
          setTongue(prev => ({ ...prev, length: t.maxLength, extending: false, retracting: true, segments: segs, time: currentTime }))
        } else {
          // Check tongue tip vs bugs
          const at2 = anteaterRef.current
          const segs = buildTongueSegments(at2.x, at2.y, t.angle, newLen, currentTime)
          const tipSeg = segs[segs.length - 1]
          const tipX = tipSeg.x
          const tipY = tipSeg.y

          setBugs(prev => {
            let scoreGained = 0
            const newPopups: ScorePopup[] = []
            const updated = prev.map(bug => {
              if (bug.eaten || bug.splat) return bug
              const dist = Math.hypot(tipX - bug.x, tipY - bug.y)
              if (dist < 28) {
                scoreGained += bug.points
                newPopups.push({ id: nextPopupId++, x: bug.x, y: bug.y, points: bug.points })
                return { ...bug, eaten: true }
              }
              return bug
            })
            if (scoreGained > 0) {
              setGameState(prev2 => {
                const newScore = prev2.score + scoreGained
                return { ...prev2, score: newScore, highScore: Math.max(prev2.highScore, newScore) }
              })
              setPopups(prev2 => [...prev2, ...newPopups])
              setTimeout(() => {
                setPopups(prev2 => prev2.filter(p => !newPopups.find(np => np.id === p.id)))
              }, 800)
              setTongue(prev => ({ ...prev, length: newLen, extending: false, retracting: true, segments: segs, time: currentTime }))
              return updated
            }
            return updated
          })
          setTongue(prev => ({ ...prev, length: newLen, segments: segs, time: currentTime }))
        }
      } else if (t.retracting) {
        const newLen = t.length - TONGUE_SPEED * 1.5 * dt
        if (newLen <= 0) {
          setTongue(defaultTongue())
        } else {
          const at2 = anteaterRef.current
          const segs = buildTongueSegments(at2.x, at2.y, t.angle, newLen, currentTime)
          setTongue(prev => ({ ...prev, length: newLen, segments: segs, time: currentTime }))
        }
      }
    }

    // Cleanup old bugs
    setBugs(prev => prev.filter(b => !(b.eaten && !b.splat)))
  }, [canvasWidth, canvasHeight])

  useGameLoop(tick, gameState.phase === 'playing')

  return {
    gameState,
    bugs,
    tongue,
    anteater,
    popups,
    fireTongue,
    startGame,
    TONGUE_THICKNESS,
  }
}
