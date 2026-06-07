import { useEffect, useRef } from 'react'
import { AudioEngine } from '../audio/AudioEngine'
import { AudioSourceType } from '../audio/types'
import { useAudioStore } from '../store/useAudioStore'

interface UseAudioCaptureOptions {
  engineRef: React.MutableRefObject<AudioEngine | null>
  autoStart?: boolean
}

/**
 * Hook that manages the audio engine lifecycle.
 * Handles start/stop, source switching, and cleanup.
 */
export function useAudioCapture({ engineRef, autoStart = false }: UseAudioCaptureOptions): void {
  const isRunning = useAudioStore(s => s.isRunning)
  const sourceType = useAudioStore(s => s.sourceType)
  const setCurrentFrame = useAudioStore(s => s.setCurrentFrame)
  const setIsRunning = useAudioStore(s => s.setIsRunning)
  const setError = useAudioStore(s => s.setError)
  const setDevices = useAudioStore(s => s.setDevices)
  const startedRef = useRef(false)

  // Initialize engine
  useEffect(() => {
    const engine = new AudioEngine()
    engineRef.current = engine

    // Enumerate devices
    AudioEngine.getAudioDevices().then(setDevices)

    // Auto-start if requested
    if (autoStart && !startedRef.current) {
      startedRef.current = true
      engine.start(sourceType).then(() => {
        setIsRunning(true)
        engine.onFrame((frame) => setCurrentFrame(frame))
        engine.onError((msg) => {
          setError(msg)
          setIsRunning(false)
        })
      }).catch((err) => {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
      })
    }

    return () => {
      engine.stop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // The Toolbar handles start/stop separately, so this hook
  // primarily ensures cleanup on unmount and device detection.
}
