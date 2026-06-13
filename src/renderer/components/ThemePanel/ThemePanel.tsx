import React, { useCallback } from 'react'
import { useThemeStore } from '../../store/useThemeStore'
import { ColorTheme, PRESET_THEMES } from '../../types/theme'
import { parseToOklch, oklchToHex, oklchToCss } from '../../utils/color'

// Color property groups for organized editing
const colorGroups: Array<{
  label: string
  keys: Array<{ key: keyof ColorTheme; label: string }>
}> = [
  {
    label: '70% Primary',
    keys: [
      { key: 'background', label: 'Background' },
      { key: 'gridColor', label: 'Grid Lines' },
      { key: 'textColor', label: 'Text' }
    ]
  },
  {
    label: '20% Secondary — VU Meter',
    keys: [
      { key: 'vuScaleColor', label: 'Scale' },
      { key: 'vuGreenZoneColor', label: 'Green Zone' },
      { key: 'vuYellowZoneColor', label: 'Yellow Zone' },
      { key: 'vuRedZoneColor', label: 'Red Zone' }
    ]
  },
  {
    label: '20% Secondary — LED Array',
    keys: [
      { key: 'ledBarOffColor', label: 'LED Off' },
      { key: 'ledBarGreenColor', label: 'LED Green' },
      { key: 'ledBarYellowColor', label: 'LED Yellow' },
      { key: 'ledBarRedColor', label: 'LED Red' }
    ]
  },
  {
    label: '20% Secondary — Waveform',
    keys: [
      { key: 'waveformColor', label: 'Wave Line' },
      { key: 'waveformFillColor', label: 'Wave Fill' },
      { key: 'waveformEnvelopeColor', label: 'Envelope' }
    ]
  },
  {
    label: '10% Accent',
    keys: [
      { key: 'vuNeedleColor', label: 'Needle' },
      { key: 'vuPeakHoldColor', label: 'Peak Hold' }
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

  const handleColorChange = useCallback((key: keyof ColorTheme, hexValue: string) => {
    // Convert hex back to OKLCH for storage
    const oklch = parseToOklch(hexValue)
    setColor(key, oklchToCss(oklch))
  }, [setColor])

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

  // Convert current oklch value to hex for the <input type="color">
  const toHex = (oklchCss: string): string => {
    try {
      return oklchToHex(parseToOklch(oklchCss))
    } catch {
      return '#000000'
    }
  }

  return (
    <div style={{
      position: 'absolute', right: 0, top: 0, bottom: 0, width: 280,
      background: 'oklch(0.15 0.02 270)',
      borderLeft: '1px solid oklch(1 0 0 / 0.1)',
      display: 'flex', flexDirection: 'column', zIndex: 100,
      overflow: 'hidden'
    }}>
      {/* Header — Rule 1: padding 16px, Rule 5: font 15px */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px', borderBottom: '1px solid oklch(1 0 0 / 0.08)'
      }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'oklch(0.8 0 0)' }}>
          Theme Settings
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: 'oklch(0.6 0 0)',
            cursor: 'pointer', fontSize: 18,
            minWidth: 44, minHeight: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          aria-label="Close theme panel"
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* Preset themes */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 12, color: 'oklch(0.5 0 0)', marginBottom: 8,
            textTransform: 'uppercase', letterSpacing: 1
          }}>
            Presets
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {presets.map(preset => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                style={{
                  padding: '8px 16px',
                  border: `1px solid ${currentTheme.id === preset.id ? 'oklch(1 0 0 / 0.3)' : 'oklch(1 0 0 / 0.08)'}`,
                  borderRadius: 4,
                  background: 'oklch(1 0 0 / 0.03)',
                  color: 'oklch(0.75 0 0)',
                  fontSize: 12, cursor: 'pointer', textAlign: 'left',
                  minHeight: 44
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Color Groups with 70-20-10 labels */}
        {colorGroups.map(group => (
          <div key={group.label} style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 12, color: 'oklch(0.5 0 0)', marginBottom: 8,
              textTransform: 'uppercase', letterSpacing: 1
            }}>
              {group.label}
            </div>
            {group.keys.map(({ key, label }) => (
              <div key={key} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 8
              }}>
                <span style={{ fontSize: 12, color: 'oklch(0.65 0 0)' }}>
                  {label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* OKLCH value label (compact) */}
                  <span style={{
                    fontSize: 9, color: 'oklch(0.5 0 0)',
                    fontFamily: 'monospace', maxWidth: 80,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {(() => {
                      try {
                        const o = parseToOklch(currentTheme[key] as string)
                        return `L${(o.l * 100).toFixed(0)} C${(o.c * 100).toFixed(0)}`
                      } catch { return '' }
                    })()}
                  </span>
                  <input
                    type="color"
                    value={toHex(currentTheme[key] as string)}
                    onChange={e => handleColorChange(key, e.target.value)}
                    style={{
                      width: 32, height: 32, padding: 0, border: 'none',
                      borderRadius: 4, cursor: 'pointer', background: 'none'
                    }}
                    title={`${label}: ${currentTheme[key]}`}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom actions — Rule 1: padding 16px */}
      <div style={{
        display: 'flex', gap: 8, padding: '16px',
        borderTop: '1px solid oklch(1 0 0 / 0.08)'
      }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1, padding: '8px 0',
            border: '1px solid oklch(1 0 0 / 0.15)',
            borderRadius: 4, background: 'transparent',
            color: 'oklch(0.7 0 0)',
            fontSize: 12, cursor: 'pointer',
            minHeight: 44
          }}
        >
          Save Theme
        </button>
        <button
          onClick={handleReset}
          style={{
            flex: 1, padding: '8px 0',
            border: '1px solid oklch(1 0 0 / 0.15)',
            borderRadius: 4, background: 'transparent',
            color: 'oklch(0.7 0 0)',
            fontSize: 12, cursor: 'pointer',
            minHeight: 44
          }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}

export default ThemePanel
