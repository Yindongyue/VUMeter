import React, { useEffect, useRef, useState } from 'react'
import Toolbar from './components/Toolbar/Toolbar'
import Dashboard from './components/Dashboard/Dashboard'
import ThemePanel from './components/ThemePanel/ThemePanel'
import { AudioEngine } from './audio/AudioEngine'
import { useAudioStore } from './store/useAudioStore'
import { useThemeStore } from './store/useThemeStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

const App: React.FC = () => {
  const engineRef = useRef<AudioEngine | null>(null)
  const [showThemePanel, setShowThemePanel] = useState(false)
  const setDevices = useAudioStore(s => s.setDevices)
  const theme = useThemeStore(s => s.currentTheme)

  // Initialize audio engine
  useEffect(() => {
    engineRef.current = new AudioEngine()

    // Enumerate audio devices for BlackHole detection
    AudioEngine.getAudioDevices().then(setDevices)

    return () => {
      engineRef.current?.stop()
    }
  }, [setDevices])

  // Keyboard shortcuts
  useKeyboardShortcuts(
    { engineRef },
    () => setShowThemePanel(prev => !prev)
  )

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: theme.background,  // Rule 2: Use theme's OKLCH background
      position: 'relative'
    }}>
      {/* Toolbar */}
      <Toolbar engineRef={engineRef} />

      {/* Theme toggle button — Rule 7: min 44×44px touch target */}
      <button
        onClick={() => setShowThemePanel(!showThemePanel)}
        aria-label={showThemePanel ? 'Close theme panel' : 'Open theme panel'}
        style={{
          position: 'absolute', top: 40, right: showThemePanel ? 288 : 8,  // Rule 1: 8px grid
          zIndex: 50,
          padding: '8px 16px',  // Rule 1: 8px multiples
          border: '1px solid oklch(1 0 0 / 0.15)',
          borderRadius: 4,
          background: 'oklch(0 0 0 / 0.5)',
          color: 'oklch(0.7 0 0)',
          fontSize: 12,  // Rule 5: 12px base
          cursor: 'pointer',
          minWidth: 44, minHeight: 44,  // Rule 7: touch target
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        {showThemePanel ? '✕' : '🎨 Theme'}
      </button>

      {/* Main content */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <div style={{
          position: 'absolute', inset: 0,
          right: showThemePanel ? 280 : 0,
          transition: 'right 0.25s ease'  // Rule 3: 0.2-0.3s micro-interaction
        }}>
          <Dashboard />
        </div>

        {/* Theme panel overlay */}
        {showThemePanel && (
          <ThemePanel onClose={() => setShowThemePanel(false)} />
        )}
      </div>
    </div>
  )
}

export default App
