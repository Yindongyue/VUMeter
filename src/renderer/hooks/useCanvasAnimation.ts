import { useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook that runs a rAF animation loop for canvas rendering.
 * Automatically handles cleanup and DPI scaling.
 *
 * @param canvasRef - Ref to the canvas element
 * @param render - Render callback (called with canvas context and elapsed time)
 * @param active - Whether the loop should be running
 * @param deps - Additional dependencies to restart the loop
 */
export function useCanvasAnimation(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  render: (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => void,
  active: boolean,
  deps: React.DependencyList = []
): void {
  const rafRef = useRef<number | null>(null)
  const renderRef = useRef(render)
  renderRef.current = render

  const startTimeRef = useRef(performance.now())

  const tick = useCallback((now: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    // Only resize if needed
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr
      canvas.height = height * dpr
    }

    // Reset and apply DPI transform (not cumulative like scale)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.clearRect(0, 0, width, height)
    renderRef.current(ctx, width, height, now - startTimeRef.current)

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    if (!active) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    startTimeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [active, tick, ...deps])
}
