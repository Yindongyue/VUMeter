import React from 'react'
import { useThemeStore } from '../../store/useThemeStore'
import { ColorTheme, PRESET_THEMES } from '../../types/theme'

// Color property groups for organized editing
const colorGroups: Array<{
  label: string
  keys: Array<{ key: keyof ColorTheme; label: string }>
}> = [
  {
    label: 'General',
    keys: [
      { key: 'background', label: 'Background' },
      { key: 'gridColor', label: 'Grid Lines' },
      { key: 'textColor', label: 'Text' }
    ]
  },
  {
    label: 'VU Meter',
    keys: [
      { key: 'vuNeedleColor', label: 'Needle' },
      { key: 'vuScaleColor', label: 'Scale' },
      { key: 'vuPeakHoldColor', label: 'Peak Hold' },
      { key: 'vuGreenZoneColor', label: 'Green Zone' },
      { key: 'vuYellowZoneColor', label: 'Yellow Zone' },
      { key: 'vuRedZoneColor', label: 'Red Zone' }
    ]
  },
  {
    label: 'LED Array',
    keys: [
      { key: 'ledBarOffColor', label: 'LED Off' },
      { key: 'ledBarGreenColor', label: 'LED Green' },
      { key: 'ledBarYellowColor', label: 'LED Yellow' },
      { key: 'ledBarRedColor', label: 'LED Red' }
    ]
  },
  {
    label: 'Waveform',
    keys: [
      { key: 'waveformColor', label: 'Wave Line' },
      { key: 'waveformFillColor', label: 'Wave Fill' },
      { key: 'waveformEnvelopeColor', label: 'Envelope' }
    ]
  }
]

interface ThemePanelProps {
  onClose: () => void
}

const ThemePanel: React.FC<ThemePanelProps> = ({ onClose }) => {
  const currentTheme = useThemeStore(s => s.currentTheme)
  const presets = useThemeStore(s => s.presets)
  const applyPreset = useThemeStore(s => s.applyPreset)
  const setColor = useThemeStore(s => s.setColor)
  const saveCustomTheme = useThemeStore(s => s.saveCustomTheme)
  const resetToPreset = useThemeStore(s => s.resetToPreset)

  const handleSave = () => {
    const name = prompt('Theme name:', currentTheme.name)
    if (name) {
      saveCustomTheme({ ...currentTheme, name, id: `custom-${Date.now()}` })
    }
  }

  const handleReset = () => {
    if (confirm('Reset to preset colors?')) {
      resetToPreset()
    }
  }

  return (
    <div style={{
      position: 'absolute', right: 0, top: 0, bottom: 0, width: 280,
      background: '#111', borderLeft: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', flexDirection: 'column', zIndex: 100,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>Theme Settings</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16 }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
        {/* Preset themes */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            Presets
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {presets.map(preset => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                style={{
                  padding: '6px 10px', border: `1px solid ${currentTheme.id === preset.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 4, background: 'rgba(255,255,255,0.03)', color: '#bbb',
                  fontSize: 12, cursor: 'pointer', textAlign: 'left'
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Color Groups */}
        {colorGroups.map(group => (
          <div key={group.label} style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 11, color: '#666', marginBottom: 6,
              textTransform: 'uppercase', letterSpacing: 1
            }}>
              {group.label}
            </div>
            {group.keys.map(({ key, label }) => (
              <div key={key} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 4
              }}>
                <span style={{ fontSize: 11, color: '#999' }}>{label}</span>
                <input
                  type="color"
                  value={currentTheme[key] as string}
                  onChange={e => setColor(key, e.target.value)}
                  style={{
                    width: 28, height: 22, padding: 0, border: 'none',
                    borderRadius: 3, cursor: 'pointer', background: 'none'
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom actions */}
      <div style={{
        display: 'flex', gap: 6, padding: '8px 12px',
        borderTop: '1px solid rgba(255,255,255,0.08)'
      }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1, padding: '6px 0', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 4, background: 'transparent', color: '#aaa',
            fontSize: 11, cursor: 'pointer'
          }}
        >
          Save Theme
        </button>
        <button
          onClick={handleReset}
          style={{
            flex: 1, padding: '6px 0', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 4, background: 'transparent', color: '#aaa',
            fontSize: 11, cursor: 'pointer'
          }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}

export default ThemePanel
