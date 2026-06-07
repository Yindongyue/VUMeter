export interface ColorTheme {
  id: string
  name: string

  // General
  background: string
  gridColor: string
  textColor: string

  // VU Meter
  vuNeedleColor: string
  vuScaleColor: string
  vuPeakHoldColor: string
  vuGreenZoneColor: string
  vuYellowZoneColor: string
  vuRedZoneColor: string

  // LED Array
  ledBarOffColor: string
  ledBarGreenColor: string
  ledBarYellowColor: string
  ledBarRedColor: string

  // Waveform
  waveformColor: string
  waveformFillColor: string
  waveformEnvelopeColor: string
}

export const PRESET_THEMES: ColorTheme[] = [
  {
    id: 'classic-analog',
    name: 'Classic Analog',
    background: '#1a1a2e',
    gridColor: 'rgba(255,255,255,0.1)',
    textColor: '#b0b0b0',
    vuNeedleColor: '#ff4444',
    vuScaleColor: '#808080',
    vuPeakHoldColor: '#ff6600',
    vuGreenZoneColor: '#00cc66',
    vuYellowZoneColor: '#ffcc00',
    vuRedZoneColor: '#ff3333',
    ledBarOffColor: 'rgba(255,255,255,0.05)',
    ledBarGreenColor: '#00ff66',
    ledBarYellowColor: '#ffdd00',
    ledBarRedColor: '#ff3333',
    waveformColor: '#00ff88',
    waveformFillColor: 'rgba(0,255,136,0.15)',
    waveformEnvelopeColor: 'rgba(0,255,136,0.05)'
  },
  {
    id: 'dark-studio',
    name: 'Dark Studio',
    background: '#0d1117',
    gridColor: 'rgba(255,255,255,0.08)',
    textColor: '#8b949e',
    vuNeedleColor: '#58a6ff',
    vuScaleColor: '#30363d',
    vuPeakHoldColor: '#f0883e',
    vuGreenZoneColor: '#3fb950',
    vuYellowZoneColor: '#d29922',
    vuRedZoneColor: '#f85149',
    ledBarOffColor: 'rgba(255,255,255,0.03)',
    ledBarGreenColor: '#3fb950',
    ledBarYellowColor: '#d29922',
    ledBarRedColor: '#f85149',
    waveformColor: '#58a6ff',
    waveformFillColor: 'rgba(88,166,255,0.12)',
    waveformEnvelopeColor: 'rgba(88,166,255,0.04)'
  },
  {
    id: 'retro-90s',
    name: 'Retro 90s',
    background: '#000000',
    gridColor: 'rgba(0,255,0,0.1)',
    textColor: '#00ff00',
    vuNeedleColor: '#ff0000',
    vuScaleColor: '#00ff00',
    vuPeakHoldColor: '#ffff00',
    vuGreenZoneColor: '#00ff00',
    vuYellowZoneColor: '#ffff00',
    vuRedZoneColor: '#ff0000',
    ledBarOffColor: 'rgba(0,255,0,0.05)',
    ledBarGreenColor: '#00ff00',
    ledBarYellowColor: '#ffff00',
    ledBarRedColor: '#ff0000',
    waveformColor: '#00ff00',
    waveformFillColor: 'rgba(0,255,0,0.1)',
    waveformEnvelopeColor: 'rgba(0,255,0,0.03)'
  },
  {
    id: 'minimal-light',
    name: 'Minimal Light',
    background: '#f5f5f5',
    gridColor: 'rgba(0,0,0,0.08)',
    textColor: '#666666',
    vuNeedleColor: '#e53935',
    vuScaleColor: '#999999',
    vuPeakHoldColor: '#ff6f00',
    vuGreenZoneColor: '#43a047',
    vuYellowZoneColor: '#fdd835',
    vuRedZoneColor: '#e53935',
    ledBarOffColor: 'rgba(0,0,0,0.04)',
    ledBarGreenColor: '#43a047',
    ledBarYellowColor: '#fdd835',
    ledBarRedColor: '#e53935',
    waveformColor: '#1e88e5',
    waveformFillColor: 'rgba(30,136,229,0.1)',
    waveformEnvelopeColor: 'rgba(30,136,229,0.03)'
  }
]
