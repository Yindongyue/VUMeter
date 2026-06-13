import React, { useEffect, useMemo, useState } from 'react'
import { useAudioStore } from '../../store/useAudioStore'
import { useLayoutStore } from '../../store/useLayoutStore'
import { AudioEngine } from '../../audio/AudioEngine'
import { AudioSourceType, AudioCaptureError } from '../../audio/types'
import { AppLayout } from '../../types/layout'
import { useI18n } from '../../i18n/useI18n'
import { detectPlatform, getErrorKey } from '../../i18n/translations'

interface ToolbarProps {
  engineRef: React.MutableRefObject<AudioEngine | null>
}

const Toolbar: React.FC<ToolbarProps> = ({ engineRef }) => {
  const isRunning = useAudioStore(s => s.isRunning)
  const sourceType = useAudioStore(s => s.sourceType)
  const error = useAudioStore(s => s.error)
  const devices = useAudioStore(s => s.devices)
  const setCurrentFrame = useAudioStore(s => s.setCurrentFrame)
  const setIsRunning = useAudioStore(s => s.setIsRunning)
  const setSourceType = useAudioStore(s => s.setSourceType)
  const setError = useAudioStore(s => s.setError)
  const setDevices = useAudioStore(s => s.setDevices)
  const { t, lang, setLang } = useI18n()

  // Layout management
  const saveLayout = useLayoutStore(s => s.saveLayout)
  const resetLayout = useLayoutStore(s => s.resetLayout)

  // Platform detection
  const platform = useMemo(() => detectPlatform(), [])
  const isWindows = platform === 'win'
  const isMac = platform === 'mac'

  // Detect BlackHole availability (macOS-only virtual device)
  const [blackholeDetected, setBlackholeDetected] = useState(false)
  const [bhLabel, setBhLabel] = useState('')

  useEffect(() => {
    const check = async () => {
      const bh = devices.find(
        d => d.label && d.label.toLowerCase().includes('blackhole')
      )
      setBlackholeDetected(!!bh)
      setBhLabel(bh?.label || '')
    }
    check()
  }, [devices])

  // Re-enumerate devices periodically
  useEffect(() => {
    AudioEngine.getAudioDevices().then(setDevices)
    const interval = setInterval(() => {
      AudioEngine.getAudioDevices().then(setDevices)
    }, 3000)
    return () => clearInterval(interval)
  }, [setDevices])

  /** Translate AudioCaptureError code to localized platform-specific message */
  const translateError = (err: unknown): string => {
    if (err instanceof AudioCaptureError) {
      switch (err.code) {
        case 'no-audio-track':
          return t(getErrorKey('noAudioTrack'))
        case 'no-sources':
          return t(getErrorKey('noSources'))
        case 'no-blackhole':
          return t('error.mac.noBlackhole')
        default:
          return err.message
      }
    }
    const msg = err instanceof Error ? err.message : String(err)
    return msg
  }

  const handleToggle = async () => {
    const engine = engineRef.current
    if (!engine) return

    if (isRunning) {
      await engine.stop()
      setIsRunning(false)
    } else {
      setError(null)
      try {
        await engine.start(sourceType)
        setIsRunning(true)
        console.log('[Toolbar] Audio engine started successfully')

        // Start piping frames to the store
        engine.onFrame((frame) => {
          console.log('[Toolbar] Frame received:', { vuLevel: frame.vuLevel, leftVu: frame.leftChannel.vuLevel, rightVu: frame.rightChannel.vuLevel, timestamp: frame.timestamp })
          setCurrentFrame(frame)
        })
        engine.onError((msg) => {
          console.error('[Toolbar] Audio engine error:', msg)
          setError(msg)
          setIsRunning(false)
        })
      } catch (err) {
        console.error('[Toolbar] Failed to start audio engine:', err)
        setError(translateError(err))
      }
    }
  }

  const handleSourceChange = async (newSource: AudioSourceType) => {
    const engine = engineRef.current
    if (!engine) return

    setSourceType(newSource)

    if (isRunning) {
      await engine.stop()
      setIsRunning(false)

      // Restart with new source
      setError(null)
      try {
        await engine.start(newSource)
        setIsRunning(true)
        engine.onFrame((frame) => {
          setCurrentFrame(frame)
        })
        engine.onError((msg) => {
          setError(msg)
          setIsRunning(false)
        })
      } catch (err) {
        setError(translateError(err))
      }
    }
  }

  const handleSaveLayout = () => {
    const name = prompt(t('app.saveLayout'))
    if (name) saveLayout(name)
  }

  const handleExportLayout = async () => {
    const layout = useLayoutStore.getState().currentLayout
    const data = JSON.stringify({ items: layout, cols: 12, exportedAt: new Date().toISOString() }, null, 2)

    try {
      const result = await window.electronAPI.showSaveDialog({
        title: t('app.exportLayout'),
        defaultPath: `vu-meter-layout-${Date.now()}.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      })
      if (!result.canceled && result.filePath) {
        await window.electronAPI.writeFile(result.filePath, data)
      }
    } catch {
      // Fallback: download via browser
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vu-meter-layout-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleImportLayout = async () => {
    try {
      const result = await window.electronAPI.showOpenDialog({
        title: t('app.importLayout'),
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
      })
      if (!result.canceled && result.filePaths.length > 0) {
        const content = await window.electronAPI.readFile(result.filePaths[0])
        const parsed: AppLayout | { items: AppLayout['items'] } = JSON.parse(content)
        if ('items' in parsed) {
          useLayoutStore.getState().setLayout(parsed.items as any)
        } else if ('id' in parsed) {
          useLayoutStore.getState().setLayout((parsed as AppLayout).items)
        }
      }
    } catch {
      alert('Failed to import layout. Check the file format.')
    }
  }

  // Shared button/label styles using OKLCH (Rule 2)
  const controlBtnBase: React.CSSProperties = {
    padding: '8px 16px',       // Rule 1: 8px grid
    border: '1px solid oklch(1 0 0 / 0.15)',
    borderRadius: 4,
    background: 'transparent',
    color: 'oklch(0.7 0 0)',
    fontSize: 12,               // Rule 5: 12px base
    cursor: 'pointer',
    minWidth: 44, minHeight: 44, // Rule 7: touch target
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,       // Rule 1: 8px gap
      padding: '8px 16px',                                   // Rule 1: 8px multiples
      background: 'oklch(0 0 0 / 0.3)',
      borderBottom: '1px solid oklch(1 0 0 / 0.08)',
      flexShrink: 0, flexWrap: 'wrap'
    }}>
      {/* Start/Stop button — Rule 2: OKLCH, Rule 7: 44px touch target */}
      <button
        onClick={handleToggle}
        style={{
          ...controlBtnBase,
          background: isRunning ? 'oklch(0.6083 0.209 27)' : 'oklch(0.6291 0.1543 144.2)',
          color: '#fff',
          border: 'none',
          fontWeight: 600
        }}
        aria-label={isRunning ? 'Stop audio capture' : 'Start audio capture'}
      >
        {isRunning ? t('app.stop') : t('app.start')}
      </button>

      {/* Audio source selector */}
      <select
        value={sourceType}
        onChange={e => handleSourceChange(e.target.value as AudioSourceType)}
        style={{
          padding: '8px',
          borderRadius: 4,
          border: '1px solid oklch(1 0 0 / 0.15)',
          background: 'oklch(0 0 0 / 0.3)',
          color: 'oklch(0.85 0 0)',
          fontSize: 12,
          cursor: 'pointer',
          minHeight: 44
        }}
        aria-label="Audio source"
      >
        <option value="desktop-capturer">{t('source.desktop')}</option>
        {/* BlackHole is macOS-only; hide on Windows or show disabled */}
        <option value="blackhole" disabled={isWindows}>
          {t('source.blackhole')}
          {isMac
            ? (blackholeDetected ? ` ✓ (${bhLabel})` : t('source.notDetected'))
            : '（仅 macOS）'
          }
        </option>
      </select>

      {/* Windows hint — shown once when idle and not running */}
      {isWindows && !isRunning && !error && (
        <span style={{
          color: 'oklch(0.7 0.05 220 / 0.7)',
          fontSize: 11,
          maxWidth: 320,
          lineHeight: 1.4
        }}>
          💡 {t('source.windowsHint')}
        </span>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Language switcher */}
      <button
        onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
        style={controlBtnBase}
        title={lang === 'zh' ? 'Switch to English' : '切换到中文'}
        aria-label="Switch language"
      >
        {lang === 'zh' ? 'EN' : '中'}
      </button>

      {/* Layout controls */}
      <button
        onClick={handleSaveLayout}
        style={controlBtnBase}
        aria-label="Save layout"
      >
        {t('app.saveLayout')}
      </button>
      <button
        onClick={handleExportLayout}
        style={controlBtnBase}
        aria-label="Export layout"
      >
        {t('app.export')}
      </button>
      <button
        onClick={handleImportLayout}
        style={controlBtnBase}
        aria-label="Import layout"
      >
        {t('app.import')}
      </button>
      <button
        onClick={resetLayout}
        style={controlBtnBase}
        aria-label="Reset layout"
      >
        {t('app.reset')}
      </button>

      {/* Error display */}
      {error && (
        <div style={{
          width: '100%',
          color: 'oklch(0.6083 0.209 27)',
          fontSize: 12,
          whiteSpace: 'pre-wrap', lineHeight: 1.5,
          background: 'oklch(0.6083 0.209 27 / 0.1)',
          padding: '8px 12px',
          borderRadius: 4,
          marginTop: 4
        }} role="alert">
          ⚠ {error}
        </div>
      )}
    </div>
  )
}

export default Toolbar
