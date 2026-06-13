import React, { useRef } from 'react'
import { useCanvasAnimation } from '../../hooks/useCanvasAnimation'
import { useAudioStore } from '../../store/useAudioStore'
import { useThemeStore } from '../../store/useThemeStore'
import { drawLEDArray } from './LEDArrayRenderer'

const LEDArray: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const currentFrame = useAudioStore(s => s.currentFrame)
  const theme = useThemeStore(s => s.currentTheme)

  useCanvasAnimation(
    canvasRef,
    (ctx, width, height, time) => {
      drawLEDArray(ctx, width, height, currentFrame, theme, time)
    },
    true
  )

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  )
}

export default LEDArray
