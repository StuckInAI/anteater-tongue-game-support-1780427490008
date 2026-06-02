export interface Bug {
  id: number
  x: number
  y: number
  type: 'ant' | 'beetle' | 'fly' | 'spider'
  points: number
  speed: number
  direction: number
  wiggle: number
  eaten: boolean
  splat: boolean
}

export interface ScorePopup {
  id: number
  x: number
  y: number
  points: number
}

export interface GameState {
  score: number
  highScore: number
  lives: number
  level: number
  phase: 'menu' | 'playing' | 'gameover'
}

export interface TongueSegment {
  x: number
  y: number
  vx: number
  vy: number
}

export interface TongueState {
  active: boolean
  angle: number
  length: number
  maxLength: number
  extending: boolean
  retracting: boolean
  targetX: number
  targetY: number
  segments: TongueSegment[]
  time: number
}

export interface AnteaterPos {
  x: number
  y: number
  facingRight: boolean
}
