import React, { useEffect, useRef, useState, useCallback } from 'react'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 500
const ANTEATER_X = 100
const ANTEATER_Y = 300
const TONGUE_SPEED = 12
const TONGUE_MAX_LENGTH = 320
const TONGUE_RETRACT_SPEED = 16
const BUG_SPEED_BASE = 1.2
const BUG_SPAWN_INTERVAL = 1400
const BUG_RADIUS = 12

type TongueState = 'idle' | 'extending' | 'retracting'

interface Bug {
  id: number
  x: number
  y: number
  type: 'ant' | 'beetle' | 'fly'
  eaten: boolean
  speed: number
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

let bugIdCounter = 0
let particleIdCounter = 0

function randomBetween(a: number, b: number): number {
  return a + Math.random() * (b - a)
}

function spawnBug(): Bug {
  const types: Bug['type'][] = ['ant', 'beetle', 'fly']
  const type = types[Math.floor(Math.random() * types.length)]
  return {
    id: bugIdCounter++,
    x: CANVAS_WIDTH + 20,
    y: randomBetween(120, CANVAS_HEIGHT - 60),
    type,
    eaten: false,
    speed: BUG_SPEED_BASE + Math.random() * 1.5,
  }
}

function drawAnteater(ctx: CanvasRenderingContext2D, tongueLength: number, tongueAngle: number) {
  const cx = ANTEATER_X
  const cy = ANTEATER_Y

  // Body
  ctx.save()
  ctx.fillStyle = '#8B6914'
  ctx.beginPath()
  ctx.ellipse(cx + 10, cy + 10, 55, 30, 0, 0, Math.PI * 2)
  ctx.fill()

  // Head
  ctx.fillStyle = '#A0792A'
  ctx.beginPath()
  ctx.ellipse(cx + 55, cy - 5, 28, 20, -0.2, 0, Math.PI * 2)
  ctx.fill()

  // Snout
  ctx.fillStyle = '#C49A3C'
  ctx.beginPath()
  ctx.ellipse(cx + 88, cy - 2, 22, 10, 0.1, 0, Math.PI * 2)
  ctx.fill()

  // Eye
  ctx.fillStyle = '#111'
  ctx.beginPath()
  ctx.arc(cx + 65, cy - 12, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(cx + 66, cy - 13, 1.5, 0, Math.PI * 2)
  ctx.fill()

  // Ear
  ctx.fillStyle = '#7A5C10'
  ctx.beginPath()
  ctx.ellipse(cx + 52, cy - 22, 8, 14, -0.3, 0, Math.PI * 2)
  ctx.fill()

  // Legs
  ctx.strokeStyle = '#6B4F0E'
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  for (let i = 0; i < 4; i++) {
    const lx = cx - 20 + i * 22
    ctx.beginPath()
    ctx.moveTo(lx, cy + 35)
    ctx.lineTo(lx - 4, cy + 58)
    ctx.stroke()
  }

  // Tail
  ctx.strokeStyle = '#8B6914'
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.moveTo(cx - 40, cy + 10)
  ctx.bezierCurveTo(cx - 70, cy - 10, cx - 80, cy + 30, cx - 60, cy + 40)
  ctx.stroke()

  // Tongue
  if (tongueLength > 0) {
    const tx = cx + 108
    const ty = cy - 2
    const ex = tx + Math.cos(tongueAngle) * tongueLength
    const ey = ty + Math.sin(tongueAngle) * tongueLength

    ctx.strokeStyle = '#e05080'
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(tx, ty)
    ctx.lineTo(ex, ey)
    ctx.stroke()

    // Tongue tip
    ctx.fillStyle = '#ff6090'
    ctx.beginPath()
    ctx.arc(ex, ey, 7, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

function getBugColor(type: Bug['type']): string {
  if (type === 'ant') return '#cc2200'
  if (type === 'beetle') return '#226622'
  return '#555599'
}

function drawBug(ctx: CanvasRenderingContext2D, bug: Bug) {
  const { x, y, type } = bug
  const color = getBugColor(type)

  ctx.save()
  ctx.fillStyle = color

  if (type === 'ant') {
    // Three body segments
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x - 10, y, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x - 20, y, 4, 0, Math.PI * 2)
    ctx.fill()
    // Legs
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(x - 8 - i * 5, y - 5)
      ctx.lineTo(x - 12 - i * 5, y - 12)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x - 8 - i * 5, y + 5)
      ctx.lineTo(x - 12 - i * 5, y + 12)
      ctx.stroke()
    }
  } else if (type === 'beetle') {
    ctx.beginPath()
    ctx.ellipse(x, y, 12, 9, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#33aa33'
    ctx.beginPath()
    ctx.ellipse(x + 2, y, 6, 8, 0, 0, Math.PI)
    ctx.fill()
    ctx.strokeStyle = '#1a4d1a'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, y - 9)
    ctx.lineTo(x, y + 9)
    ctx.stroke()
  } else {
    // fly
    ctx.beginPath()
    ctx.ellipse(x, y, 7, 5, 0, 0, Math.PI * 2)
    ctx.fill()
    // Wings
    ctx.fillStyle = 'rgba(180,180,255,0.55)'
    ctx.beginPath()
    ctx.ellipse(x - 3, y - 8, 9, 5, -0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(x + 3, y - 8, 9, 5, 0.3, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save()
  ctx.globalAlpha = Math.max(0, p.life / 30)
  ctx.fillStyle = p.color
  ctx.beginPath()
  ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  // Sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT * 0.65)
  skyGrad.addColorStop(0, '#87ceeb')
  skyGrad.addColorStop(1, '#d4f0ff')
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT * 0.65)

  // Ground
  const groundGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT * 0.65, 0, CANVAS_HEIGHT)
  groundGrad.addColorStop(0, '#5a8a30')
  groundGrad.addColorStop(1, '#3a5c1a')
  ctx.fillStyle = groundGrad
  ctx.fillRect(0, CANVAS_HEIGHT * 0.65, CANVAS_WIDTH, CANVAS_HEIGHT * 0.35)

  // Dirt line
  ctx.fillStyle = '#8B5E3C'
  ctx.fillRect(0, CANVAS_HEIGHT * 0.65, CANVAS_WIDTH, 6)

  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  const clouds = [[120, 60, 40, 18], [300, 40, 55, 20], [560, 70, 45, 16], [700, 45, 38, 15]]
  for (const [cx2, cy2, rx, ry] of clouds) {
    ctx.beginPath()
    ctx.ellipse(cx2, cy2, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx2 + 25, cy2 + 5, rx * 0.7, ry * 0.8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx2 - 20, cy2 + 5, rx * 0.6, ry * 0.75, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Anthill
  ctx.fillStyle = '#a0703a'
  ctx.beginPath()
  ctx.moveTo(30, CANVAS_HEIGHT * 0.65 + 6)
  ctx.lineTo(90, CANVAS_HEIGHT * 0.65 + 6)
  ctx.lineTo(60, CANVAS_HEIGHT * 0.65 - 40)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#7a5020'
  ctx.beginPath()
  ctx.ellipse(60, CANVAS_HEIGHT * 0.65 - 2, 12, 6, 0, 0, Math.PI * 2)
  ctx.fill()
}

function getTongueTip(tongueLength: number, tongueAngle: number): { x: number; y: number } {
  const tx = ANTEATER_X + 108
  const ty = ANTEATER_Y - 2
  return {
    x: tx + Math.cos(tongueAngle) * tongueLength,
    y: ty + Math.sin(tongueAngle) * tongueLength,
  }
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    bugs: [] as Bug[],
    particles: [] as Particle[],
    tongueLength: 0,
    tongueAngle: 0,
    tongueState: 'idle' as TongueState,
    score: 0,
    lives: 3,
    gameOver: false,
    lastSpawn: 0,
    animFrame: 0,
  })
  const mouseRef = useRef({ x: 0, y: 0 })
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const scaleRef = useRef({ sx: 1, sy: 1, ox: 0, oy: 0 })

  const restart = useCallback(() => {
    const s = stateRef.current
    s.bugs = []
    s.particles = []
    s.tongueLength = 0
    s.tongueAngle = 0
    s.tongueState = 'idle'
    s.score = 0
    s.lives = 3
    s.gameOver = false
    s.lastSpawn = 0
    setScore(0)
    setLives(3)
    setGameOver(false)
    setStarted(true)
  }, [])

  useEffect(() => {
    if (!started) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function updateScale() {
      const rect = canvas!.getBoundingClientRect()
      scaleRef.current = {
        sx: rect.width / CANVAS_WIDTH,
        sy: rect.height / CANVAS_HEIGHT,
        ox: rect.left,
        oy: rect.top,
      }
    }
    updateScale()
    window.addEventListener('resize', updateScale)

    function onMouseMove(e: MouseEvent) {
      const { sx, sy, ox, oy } = scaleRef.current
      mouseRef.current = {
        x: (e.clientX - ox) / sx,
        y: (e.clientY - oy) / sy,
      }
    }
    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      const { sx, sy, ox, oy } = scaleRef.current
      const t = e.touches[0]
      mouseRef.current = {
        x: (t.clientX - ox) / sx,
        y: (t.clientY - oy) / sy,
      }
    }

    function onFire() {
      const s = stateRef.current
      if (s.gameOver) return
      if (s.tongueState === 'idle') {
        const mx = mouseRef.current.x
        const my = mouseRef.current.y
        const tx = ANTEATER_X + 108
        const ty = ANTEATER_Y - 2
        s.tongueAngle = Math.atan2(my - ty, mx - tx)
        s.tongueState = 'extending'
      }
    }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('click', onFire)
    canvas.addEventListener('touchstart', onFire)

    let lastTime = 0

    function loop(ts: number) {
      const dt = ts - lastTime
      lastTime = ts
      const s = stateRef.current

      if (!s.gameOver) {
        // Spawn bugs
        if (ts - s.lastSpawn > BUG_SPAWN_INTERVAL) {
          s.bugs.push(spawnBug())
          s.lastSpawn = ts
        }

        // Move bugs
        for (const bug of s.bugs) {
          if (!bug.eaten) {
            bug.x -= bug.speed
          }
        }

        // Tongue logic
        if (s.tongueState === 'extending') {
          s.tongueLength += TONGUE_SPEED
          if (s.tongueLength >= TONGUE_MAX_LENGTH) {
            s.tongueState = 'retracting'
          }
        } else if (s.tongueState === 'retracting') {
          s.tongueLength -= TONGUE_RETRACT_SPEED
          if (s.tongueLength <= 0) {
            s.tongueLength = 0
            s.tongueState = 'idle'
          }
        }

        // Collision detection
        if (s.tongueLength > 0) {
          const tip = getTongueTip(s.tongueLength, s.tongueAngle)
          for (const bug of s.bugs) {
            if (bug.eaten) continue
            const dx = tip.x - bug.x
            const dy = tip.y - bug.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < BUG_RADIUS + 8) {
              bug.eaten = true
              s.tongueState = 'retracting'
              s.score += bug.type === 'fly' ? 30 : bug.type === 'beetle' ? 20 : 10
              setScore(s.score)
              // Particles
              for (let i = 0; i < 10; i++) {
                s.particles.push({
                  id: particleIdCounter++,
                  x: bug.x,
                  y: bug.y,
                  vx: randomBetween(-3, 3),
                  vy: randomBetween(-4, 1),
                  life: 30,
                  color: getBugColor(bug.type),
                })
              }
            }
          }
        }

        // Remove bugs that have passed the anteater
        const beforeLen = s.bugs.length
        s.bugs = s.bugs.filter(b => {
          if (!b.eaten && b.x < ANTEATER_X - 60) return false
          return true
        })
        const escaped = beforeLen - s.bugs.filter(b => !b.eaten || b.eaten).length
        // Count escapes properly
        const escapedCount = s.bugs.filter(b => !b.eaten && b.x < ANTEATER_X - 60).length
        // Remove escaped bugs and subtract lives
        const newBugs: Bug[] = []
        let lostLives = 0
        for (const b of s.bugs) {
          if (!b.eaten && b.x < ANTEATER_X - 60) {
            lostLives++
          } else {
            newBugs.push(b)
          }
        }
        // Remove eaten bugs after a delay — just remove immediately
        s.bugs = newBugs.filter(b => b.x > -40 || b.eaten === false)
        // Actually simplify: remove bugs that are far left
        s.bugs = s.bugs.filter(b => b.x > -50)

        if (lostLives > 0) {
          s.lives = Math.max(0, s.lives - lostLives)
          setLives(s.lives)
          if (s.lives <= 0) {
            s.gameOver = true
            setGameOver(true)
          }
        }

        // Particles
        for (const p of s.particles) {
          p.x += p.vx
          p.y += p.vy
          p.vy += 0.15
          p.life--
        }
        s.particles = s.particles.filter(p => p.life > 0)
      }

      // Draw
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      drawBackground(ctx)

      for (const bug of s.bugs) {
        if (!bug.eaten) drawBug(ctx, bug)
      }
      for (const p of s.particles) {
        drawParticle(ctx, p)
      }

      drawAnteater(ctx, s.tongueLength, s.tongueAngle)

      s.animFrame = requestAnimationFrame(loop)
    }

    stateRef.current.animFrame = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(stateRef.current.animFrame)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('click', onFire)
      canvas.removeEventListener('touchstart', onFire)
      window.removeEventListener('resize', updateScale)
    }
  }, [started])

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[#1a2a0a]">
      {!started && !gameOver && (
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-5xl font-bold text-yellow-300 drop-shadow-lg">🐜 Anteater!</h1>
          <p className="text-white text-lg">Click or tap to shoot your tongue and eat bugs!</p>
          <p className="text-gray-300 text-sm">Ants = 10pts · Beetles = 20pts · Flies = 30pts</p>
          <button
            onClick={() => setStarted(true)}
            className="px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xl rounded-full shadow-lg transition-colors"
          >
            Play!
          </button>
        </div>
      )}

      {started && (
        <div className="relative">
          <div className="flex justify-between items-center px-2 py-1 mb-1 text-white text-sm font-bold">
            <span className="text-yellow-300">Score: {score}</span>
            <span>{Array.from({ length: lives }).map((_, i) => '❤️').join(' ')}</span>
          </div>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block rounded-xl shadow-2xl cursor-crosshair"
            style={{ maxWidth: '95vw', maxHeight: '80vh', aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
          />
          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl">
              <h2 className="text-4xl font-bold text-red-400 mb-2">Game Over!</h2>
              <p className="text-white text-xl mb-6">Final Score: {score}</p>
              <button
                onClick={restart}
                className="px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xl rounded-full shadow-lg transition-colors"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
