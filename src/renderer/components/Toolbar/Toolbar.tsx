import React, { useEffect, useState } from 'react'
import { useAudioStore } from '../../store/useAudioStore'
import { useLayoutStore } from '../../store/useLayoutStore'
import { AudioEngine } from '../../audio/AudioEngine'
import { AudioSourceType } from '../../audio/types'
import { AppLayout } from '../../types/layout'
import { useI18n } from '../../i18n/useI18n'

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

  // Detect BlackHole availability
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

        // Start piping frames to the store
        engine.onFrame((frame) => {
          setCurrentFrame(frame)
        })
        engine.onError((msg) => {
          setError(msg)
          setIsRunning(false)
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
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
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
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
        defaultPath: `uvmeter-layout-${Date.now()}.json`,
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
      a.download = `uvmeter-layout-${Date.now()}.json`
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

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px',
      background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.08)',
      flexShrink: 0, flexWrap: 'wrap'
    }}>
      {/* Start/Stop button */}
      <button
        onClick={handleToggle}
        style={{
          padding: '6px 16px', border: 'none', borderRadius: 4, cursor: 'pointer',
          fontSize: 13, fontWeight: 600, color: '#fff',
          background: isRunning ? '#e53935' : '#43a047'
        }}
      >
        {isRunning ? t('app.stop') : t('app.start')}
      </button>

      {/* Audio source selector */}
      <select
        value={sourceType}
        onChange={e => handleSourceChange(e.target.value as AudioSourceType)}
        style={{
          padding: '5px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(0,0,0,0.3)', color: '#ddd', fontSize: 12, cursor: 'pointer'
        }}
      >
        <option value="desktop-capturer">{t('source.desktop')}</option>
        <option value="blackhole">
          {t('source.blackhole')}{blackholeDetected ? ` ✓ (${bhLabel})` : t('source.notDetected')}
        </option>
      </select>
      {blackholeDetected && (
        <span style={{ color: '#3fb950', fontSize: 10 }}>●</span>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Language switcher */}
      <button
        onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
        style={{
          padding: '4px 8px', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 4, background: 'transparent', color: '#aaa',
          fontSize: 11, cursor: 'pointer'
        }}
        title={lang === 'zh' ? 'Switch to English' : '切换到中文'}
      >
        {lang === 'zh' ? 'EN' : '中'}
      </button>

      {/* Layout controls */}
      <button
        onClick={handleSaveLayout}
        style={{
          padding: '4px 10px', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 4, background: 'transparent', color: '#aaa',
          fontSize: 11, cursor: 'pointer'
        }}
      >
        {t('app.saveLayout')}
      </button>
      <button
        onClick={handleExportLayout}
        style={{
          padding: '4px 10px', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 4, background: 'transparent', color: '#aaa',
          fontSize: 11, cursor: 'pointer'
        }}
      >
        {t('app.export')}
      </button>
      <button
        onClick={handleImportLayout}
        style={{
          padding: '4px 10px', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 4, background: 'transparent', color: '#aaa',
          fontSize: 11, cursor: 'pointer'
        }}
      >
        {t('app.import')}
      </button>
      <button
        onClick={resetLayout}
        style={{
          padding: '4px 10px', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 4, background: 'transparent', color: '#aaa',
          fontSize: 11, cursor: 'pointer'
        }}
      >
        {t('app.reset')}
      </button>

      {/* Error display */}
      {error && (
        <div style={{
          color: '#e53935', fontSize: 11, maxWidth: 500,
          whiteSpace: 'pre-wrap', lineHeight: 1.5,
          background: 'rgba(229,57,53,0.1)', padding: '4px 8px',
          borderRadius: 4, marginTop: 2
        }}>
          ⚠ {error}
        </div>
      )}
    </div>
  )
}

export default Toolbar
