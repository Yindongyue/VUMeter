import React, { useEffect, useRef, useState } from 'react'
import Toolbar from './components/Toolbar/Toolbar'
import Dashboard from './components/Dashboard/Dashboard'
import ThemePanel from './components/ThemePanel/ThemePanel'
import { AudioEngine } from './audio/AudioEngine'
import { useAudioStore } from './store/useAudioStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

const App: React.FC = () => {
  const engineRef = useRef<AudioEngine | null>(null)
  const [showThemePanel, setShowThemePanel] = useState(false)
  const setDevices = useAudioStore(s => s.setDevices)

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
      background: '#0d1117', position: 'relative'
    }}>
      {/* Toolbar */}
      <Toolbar engineRef={engineRef} />

      {/* Theme toggle button */}
      <button
        onClick={() => setShowThemePanel(!showThemePanel)}
        style={{
          position: 'absolute', top: 40, right: showThemePanel ? 290 : 10, zIndex: 50,
          padding: '5px 8px', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 4, background: 'rgba(0,0,0,0.5)', color: '#aaa',
          fontSize: 11, cursor: 'pointer'
        }}
      >
        {showThemePanel ? '✕' : '🎨 Theme'}
      </button>

      {/* Main content */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <div style={{
          position: 'absolute', inset: 0,
          right: showThemePanel ? 280 : 0,
          transition: 'right 0.2s ease'
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
