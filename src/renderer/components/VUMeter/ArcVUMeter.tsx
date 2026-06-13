import React, { useRef, useEffect, useCallback } from 'react'
import { useAudioStore } from '../../store/useAudioStore'
import { useThemeStore } from '../../store/useThemeStore'
import { drawFanVUMeter } from './ArcVUMeterRenderer'

interface FanVUMeterProps {
  channel: 'left' | 'right'
  label: string
}

const FanVUMeter: React.FC<FanVUMeterProps> = ({ channel, label }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const currentFrame = useAudioStore(s => s.currentFrame)
  const theme = useThemeStore(s => s.currentTheme)

  // Use refs to avoid stale closure issue.
  // zustand selectors return the SAME object reference (mutable object),
  // so useCallback deps on `currentFrame` would never detect a change.
  const currentFrameRef = useRef(currentFrame)
  const themeRef = useRef(theme)
  currentFrameRef.current = currentFrame
  themeRef.current = theme

  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current
    if (!canvas) {
      animFrameRef.current = requestAnimationFrame(draw)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(draw)
      return
    }

    const dpr = window.devicePixelRatio || 1
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    if (width === 0 || height === 0) {
      animFrameRef.current = requestAnimationFrame(draw)
      return
    }

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr
      canvas.height = height * dpr
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    // Read from refs — always latest value, no closure staleness
    drawFanVUMeter(ctx, width, height, currentFrameRef.current, themeRef.current, channel, label, timestamp)

    animFrameRef.current = requestAnimationFrame(draw)
  }, [channel, label])

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw)
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  }, [draw])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  )
}

export default FanVUMeter
