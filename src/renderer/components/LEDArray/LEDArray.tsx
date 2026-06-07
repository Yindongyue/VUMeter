import React, { useRef } from 'react'
import { useCanvasAnimation } from '../../hooks/useCanvasAnimation'
import { useAudioStore } from '../../store/useAudioStore'
import { useThemeStore } from '../../store/useThemeStore'
import { useI18n } from '../../i18n/useI18n'
import { drawLEDArray } from './LEDArrayRenderer'

const LEDArray: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const currentFrame = useAudioStore(s => s.currentFrame)
  const isRunning = useAudioStore(s => s.isRunning)
  const theme = useThemeStore(s => s.currentTheme)
  const { t } = useI18n()

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
      {!isRunning && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(0,0,0,0.5)', color: '#888',
          fontSize: 18, fontWeight: 500, letterSpacing: 1
        }}>
          {t('panel.led')}
        </div>
      )}
    </div>
  )
}

export default LEDArray
