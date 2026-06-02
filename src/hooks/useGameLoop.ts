import { useEffect, useRef } from 'react'

export function useGameLoop(callback: (dt: number) => void, active: boolean): void {
  const callbackRef = useRef<(dt: number) => void>(callback)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!active) return

    const loop = (time: number): void => {
      const dt = lastTimeRef.current ? Math.min((time - lastTimeRef.current) / 1000, 0.05) : 0.016
      lastTimeRef.current = time
      callbackRef.current(dt)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(rafRef.current)
      lastTimeRef.current = 0
    }
  }, [active])
}
