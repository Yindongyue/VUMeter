import { useEffect } from 'react'
import { useAudioStore } from '../store/useAudioStore'
import { AudioEngine } from '../audio/AudioEngine'
import { AudioSourceType } from '../audio/types'

interface ShortcutHandlers {
  engineRef: React.MutableRefObject<AudioEngine | null>
}

/**
 * Global keyboard shortcuts:
 * - Space: Toggle start/stop
 * - R: Reset peak hold
 * - 1/2/3: Quick theme presets (if available)
 * - T: Toggle theme panel
 */
export function useKeyboardShortcuts(
  { engineRef }: ShortcutHandlers,
  onToggleTheme?: () => void
): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      // Don't trigger if user is typing in an input
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return

      const audioStore = useAudioStore.getState()

      switch (e.code) {
        case 'Space': {
          e.preventDefault()
          const engine = engineRef.current
          if (!engine) return
          if (audioStore.isRunning) {
            engine.stop().then(() => audioStore.setIsRunning(false))
          } else {
            audioStore.setError(null)
            engine.start(audioStore.sourceType).then(() => {
              audioStore.setIsRunning(true)
              engine.onFrame((frame) => audioStore.setCurrentFrame(frame))
              engine.onError((msg) => {
                audioStore.setError(msg)
                audioStore.setIsRunning(false)
              })
            }).catch((err: Error) => {
              audioStore.setError(err.message)
            })
          }
          break
        }

        case 'KeyR': {
          // Reset - handled internally by the engine
          break
        }

        case 'KeyT': {
          onToggleTheme?.()
          break
        }

        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4': {
          // Quick theme switch - import from theme store
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [engineRef, onToggleTheme])
}
