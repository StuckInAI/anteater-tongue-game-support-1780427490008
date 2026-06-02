import React, { useEffect, useRef } from 'react'
import { Bug, ScorePopup, TongueState, AnteaterPos } from '@/types/game'

interface Props {
  width: number
  height: number
  bugs: Bug[]
  tongue: TongueState
  anteater: AnteaterPos
  popups: ScorePopup[]
  tongueThickness: number
}

const BUG_EMOJIS: Record<Bug['type'], string> = {
  ant: '🐜',
  beetle: '🪲',
  fly: '🪰',
  spider: '🕷️',
}

export default function GameCanvas({ width, height, bugs, tongue, anteater, popups, tongueThickness }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.clearRect(0, 0, width, height)

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height)
    skyGrad.addColorStop(0, '#0f0c29')
    skyGrad.addColorStop(0.5, '#302b63')
    skyGrad.addColorStop(1, '#24243e')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, width, height)

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    for (let i = 0; i < 80; i++) {
      const sx = ((i * 137.508) % width)
      const sy = ((i * 97.3) % (height * 0.5))
      const sr = 0.5 + (i % 3) * 0.5
      ctx.beginPath()
      ctx.arc(sx, sy, sr, 0, Math.PI * 2)
      ctx.fill()
    }

    // Ground
    const groundY = height * 0.85
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, height)
    groundGrad.addColorStop(0, '#2d5a27')
    groundGrad.addColorStop(0.3, '#1e3d1a')
    groundGrad.addColorStop(1, '#0f1f0d')
    ctx.fillStyle = groundGrad
    ctx.beginPath()
    ctx.moveTo(0, groundY)
    // Wavy ground
    for (let x = 0; x <= width; x += 40) {
      const wave = Math.sin(x * 0.02) * 8
      ctx.lineTo(x, groundY + wave)
    }
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fill()

    // Grass tufts
    ctx.strokeStyle = '#4a8c3f'
    ctx.lineWidth = 2
    for (let i = 0; i < width; i += 25) {
      const gx = i
      const gy = groundY + Math.sin(i * 0.02) * 8
      ctx.beginPath()
      ctx.moveTo(gx, gy)
      ctx.quadraticCurveTo(gx - 4, gy - 12, gx - 2, gy - 18)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(gx + 5, gy)
      ctx.quadraticCurveTo(gx + 9, gy - 14, gx + 7, gy - 20)
      ctx.stroke()
    }

    // Tongue
    if (tongue.active && tongue.length > 0) {
      const tipX = anteater.x + Math.cos(tongue.angle) * tongue.length
      const tipY = anteater.y + Math.sin(tongue.angle) * tongue.length

      ctx.save()
      // Tongue body
      ctx.beginPath()
      ctx.moveTo(anteater.x, anteater.y - 5)
      ctx.lineTo(tipX, tipY)
      ctx.strokeStyle = '#e91e8c'
      ctx.lineWidth = tongueThickness
      ctx.lineCap = 'round'
      ctx.shadowColor = '#ff6bcb'
      ctx.shadowBlur = 15
      ctx.stroke()

      // Tongue tip
      ctx.beginPath()
      ctx.arc(tipX, tipY, tongueThickness / 1.5, 0, Math.PI * 2)
      ctx.fillStyle = '#ff1493'
      ctx.fill()
      ctx.restore()
    }

    // Bugs
    bugs.forEach(bug => {
      if (bug.eaten && !bug.splat) return
      ctx.save()
      ctx.translate(bug.x, bug.y)
      const wiggleRot = Math.sin(bug.wiggle) * 0.15
      ctx.rotate(wiggleRot)
      if (bug.direction < 0) ctx.scale(-1, 1)

      if (bug.splat) {
        ctx.globalAlpha = Math.max(0, 0.8)
        ctx.font = '32px serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('💥', 0, 0)
        ctx.restore()
        return
      }

      ctx.font = '28px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(255,200,0,0.5)'
      ctx.shadowBlur = 8
      ctx.fillText(BUG_EMOJIS[bug.type], 0, 0)
      ctx.restore()
    })

    // Anteater
    drawAnteater(ctx, anteater, tongue)

    // Score popups
    popups.forEach(popup => {
      ctx.save()
      ctx.font = 'bold 24px sans-serif'
      ctx.fillStyle = '#ffd700'
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 3
      ctx.textAlign = 'center'
      ctx.strokeText(`+${popup.points}`, popup.x, popup.y)
      ctx.fillText(`+${popup.points}`, popup.x, popup.y)
      ctx.restore()
    })

  }, [width, height, bugs, tongue, anteater, popups, tongueThickness])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0"
    />
  )
}

function drawAnteater(ctx: CanvasRenderingContext2D, anteater: AnteaterPos, tongue: TongueState) {
  ctx.save()
  ctx.translate(anteater.x, anteater.y)
  if (!anteater.facingRight) ctx.scale(-1, 1)

  // Body
  ctx.beginPath()
  ctx.ellipse(0, 0, 45, 28, 0, 0, Math.PI * 2)
  const bodyGrad = ctx.createRadialGradient(-10, -8, 5, 0, 0, 45)
  bodyGrad.addColorStop(0, '#8b6914')
  bodyGrad.addColorStop(0.5, '#6b4f10')
  bodyGrad.addColorStop(1, '#3d2c08')
  ctx.fillStyle = bodyGrad
  ctx.fill()
  ctx.strokeStyle = '#2a1d05'
  ctx.lineWidth = 2
  ctx.stroke()

  // Stripe
  ctx.beginPath()
  ctx.ellipse(0, 0, 35, 18, 0, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,200,100,0.2)'
  ctx.lineWidth = 6
  ctx.stroke()

  // Tail
  ctx.beginPath()
  ctx.moveTo(-40, -5)
  ctx.quadraticCurveTo(-70, -30, -60, -55)
  ctx.strokeStyle = '#5a3f0c'
  ctx.lineWidth = 14
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-40, -5)
  ctx.quadraticCurveTo(-70, -30, -60, -55)
  ctx.strokeStyle = '#7a5a1a'
  ctx.lineWidth = 8
  ctx.stroke()

  // Head
  ctx.beginPath()
  ctx.ellipse(40, -10, 22, 16, -0.2, 0, Math.PI * 2)
  ctx.fillStyle = '#7a5a12'
  ctx.fill()
  ctx.strokeStyle = '#2a1d05'
  ctx.lineWidth = 2
  ctx.stroke()

  // Snout
  ctx.beginPath()
  ctx.moveTo(54, -12)
  ctx.quadraticCurveTo(80, -12, 90, -15)
  ctx.strokeStyle = '#5a4010'
  ctx.lineWidth = 10
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(54, -12)
  ctx.quadraticCurveTo(80, -12, 90, -15)
  ctx.strokeStyle = '#8a6520'
  ctx.lineWidth = 5
  ctx.stroke()

  // Nostril
  ctx.beginPath()
  ctx.arc(90, -15, 3, 0, Math.PI * 2)
  ctx.fillStyle = '#2a1d05'
  ctx.fill()

  // Eye
  ctx.beginPath()
  ctx.arc(50, -18, 5, 0, Math.PI * 2)
  ctx.fillStyle = '#1a1a1a'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(51, -19, 2, 0, Math.PI * 2)
  ctx.fillStyle = 'white'
  ctx.fill()

  // Ear
  ctx.beginPath()
  ctx.ellipse(38, -24, 5, 8, -0.3, 0, Math.PI * 2)
  ctx.fillStyle = '#6a4a10'
  ctx.fill()

  // Front leg
  ctx.beginPath()
  ctx.moveTo(20, 22)
  ctx.quadraticCurveTo(18, 40, 12, 48)
  ctx.strokeStyle = '#5a3f0c'
  ctx.lineWidth = 10
  ctx.lineCap = 'round'
  ctx.stroke()

  // Back leg
  ctx.beginPath()
  ctx.moveTo(-20, 24)
  ctx.quadraticCurveTo(-22, 42, -28, 50)
  ctx.stroke()

  // Claws front
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath()
    ctx.moveTo(12 + i * 4, 48)
    ctx.lineTo(10 + i * 4, 56)
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  ctx.restore()
}
