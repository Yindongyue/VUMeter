import { create } from 'zustand'
import { AudioFrame, AudioSourceType, createEmptyFrame } from '../audio/types'

interface AudioState {
  /** Current audio frame data */
  currentFrame: AudioFrame
  /** Whether the engine is running */
  isRunning: boolean
  /** Currently selected audio source type */
  sourceType: AudioSourceType
  /** Error message if any */
  error: string | null
  /** List of available audio input devices */
  devices: MediaDeviceInfo[]
  /** Available desktop capture sources */
  desktopSources: string[]

  // Actions
  setCurrentFrame: (frame: AudioFrame) => void
  setIsRunning: (running: boolean) => void
  setSourceType: (type: AudioSourceType) => void
  setError: (error: string | null) => void
  setDevices: (devices: MediaDeviceInfo[]) => void
  setDesktopSources: (sources: string[]) => void
}

export const useAudioStore = create<AudioState>((set) => ({
  currentFrame: createEmptyFrame(),
  isRunning: false,
  sourceType: 'desktop-capturer',
  error: null,
  devices: [],
  desktopSources: [],

  setCurrentFrame: (frame) => set({ currentFrame: frame }),
  setIsRunning: (running) => set({ isRunning: running }),
  setSourceType: (type) => set({ sourceType: type }),
  setError: (error) => set({ error }),
  setDevices: (devices) => set({ devices }),
  setDesktopSources: (sources) => set({ desktopSources: sources })
}))
