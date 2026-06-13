/**
 * Color themes using OKLCH color space (Rule 2).
 *
 * All colors are stored as CSS `oklch()` strings — no hex, no rgb().
 * Per Rule 4 (70-20-10):
 *   70% Primary — backgrounds, grids, base surfaces
 *   20% Secondary — functional indicators (zone/bar/waveform colors)
 *   10% Accent — needles, peak-hold markers, highlights
 * Per Rule 7 (Accessibility):
 *   Text colors maintain ≥4.5:1 contrast against their backgrounds.
 *   Information is never conveyed by color alone.
 */

export interface ColorTheme {
  id: string
  name: string

  // ── 70% Primary ─────────────────────────────────────────
  background: string    // Base canvas/dashboard background
  gridColor: string     // Grid lines, subtle borders
  textColor: string     // Labels, scale text, UI text

  // ── 20% Secondary ───────────────────────────────────────
  // VU Meter
  vuScaleColor: string        // Scale/tick marks
  vuGreenZoneColor: string    // Safe zone (0 to -5 dB)
  vuYellowZoneColor: string   // Caution zone (-5 to 0 dB)
  vuRedZoneColor: string      // Danger zone (0 to +3 dB)

  // LED Array
  ledBarOffColor: string      // Inactive segment
  ledBarGreenColor: string    // Lower 50% segments
  ledBarYellowColor: string   // 50-75% segments
  ledBarRedColor: string      // Top 25% segments

  // Waveform
  waveformColor: string       // Wave line
  waveformFillColor: string   // Fill below wave
  waveformEnvelopeColor: string // Envelope glow

  // ── 10% Accent ──────────────────────────────────────────
  vuNeedleColor: string       // VU meter needle
  vuPeakHoldColor: string     // Peak hold marker
}

export const PRESET_THEMES: ColorTheme[] = [
  // ─────────────────────────────────────────────────────────
  // Classic Analog — warm, instrument-panel feel
  // 70%: deep navy background, warm gray scale
  // 20%: vintage green/yellow/red zones
  // 10%: red-orange needle, orange peak-hold
  // ─────────────────────────────────────────────────────────
  {
    id: 'classic-analog',
    name: 'Classic Analog',
    // 70%
    background: 'oklch(0.2284 0.0384 282.9)',
    gridColor: 'oklch(1 0 0 / 0.1)',
    textColor: 'oklch(0.7572 0 0)',
    // 20%
    vuScaleColor: 'oklch(0.5999 0 0)',
    vuGreenZoneColor: 'oklch(0.7398 0.1974 151.4)',
    vuYellowZoneColor: 'oklch(0.8652 0.1768 90.4)',
    vuRedZoneColor: 'oklch(0.6489 0.237 27)',
    ledBarOffColor: 'oklch(1 0 0 / 0.05)',
    ledBarGreenColor: 'oklch(0.8718 0.2547 147.6)',
    ledBarYellowColor: 'oklch(0.8987 0.1857 97.9)',
    ledBarRedColor: 'oklch(0.6489 0.237 27)',
    waveformColor: 'oklch(0.8763 0.2278 152.5)',
    waveformFillColor: 'oklch(0.8763 0.2278 152.5 / 0.15)',
    waveformEnvelopeColor: 'oklch(0.8763 0.2278 152.5 / 0.05)',
    // 10%
    vuNeedleColor: 'oklch(0.6636 0.2231 25.7)',
    vuPeakHoldColor: 'oklch(0.6958 0.2043 43.5)',
  },

  // ─────────────────────────────────────────────────────────
  // Dark Studio — modern DAW aesthetic, GitHub-dark inspired
  // 70%: very dark blue-gray, subtle grid
  // 20%: muted green/yellow/red LEDs, blue waveform
  // 10%: bright blue needle, warm orange peak-hold
  // ─────────────────────────────────────────────────────────
  {
    id: 'dark-studio',
    name: 'Dark Studio',
    // 70%
    background: 'oklch(0.1763 0.014 258.4)',
    gridColor: 'oklch(1 0 0 / 0.08)',
    textColor: 'oklch(0.6625 0.0181 250.9)',
    // 20%
    vuScaleColor: 'oklch(0.33 0.0149 252.3)',
    vuGreenZoneColor: 'oklch(0.6951 0.1809 145.6)',
    vuYellowZoneColor: 'oklch(0.7196 0.1401 79.9)',
    vuRedZoneColor: 'oklch(0.6651 0.2046 27)',
    ledBarOffColor: 'oklch(1 0 0 / 0.03)',
    ledBarGreenColor: 'oklch(0.6951 0.1809 145.6)',
    ledBarYellowColor: 'oklch(0.7196 0.1401 79.9)',
    ledBarRedColor: 'oklch(0.6651 0.2046 27)',
    waveformColor: 'oklch(0.7153 0.1518 253.3)',
    waveformFillColor: 'oklch(0.7153 0.1518 253.3 / 0.12)',
    waveformEnvelopeColor: 'oklch(0.7153 0.1518 253.3 / 0.04)',
    // 10%
    vuNeedleColor: 'oklch(0.7153 0.1518 253.3)',
    vuPeakHoldColor: 'oklch(0.7273 0.1534 52.8)',
  },

  // ─────────────────────────────────────────────────────────
  // Retro 90s — high-contrast terminal green-on-black
  // 70%: pure black background, neon green text
  // 20%: bright green/yellow/red zones
  // 10%: pure red needle
  // ─────────────────────────────────────────────────────────
  {
    id: 'retro-90s',
    name: 'Retro 90s',
    // 70%
    background: 'oklch(0 0 0)',
    gridColor: 'oklch(0.8664 0.2948 142.5 / 0.1)',
    textColor: 'oklch(0.8664 0.2948 142.5)',
    // 20%
    vuScaleColor: 'oklch(0.8664 0.2948 142.5)',
    vuGreenZoneColor: 'oklch(0.8664 0.2948 142.5)',
    vuYellowZoneColor: 'oklch(0.968 0.211 109.8)',
    vuRedZoneColor: 'oklch(0.628 0.2577 29.2)',
    ledBarOffColor: 'oklch(0.8664 0.2948 142.5 / 0.05)',
    ledBarGreenColor: 'oklch(0.8664 0.2948 142.5)',
    ledBarYellowColor: 'oklch(0.968 0.211 109.8)',
    ledBarRedColor: 'oklch(0.628 0.2577 29.2)',
    waveformColor: 'oklch(0.8664 0.2948 142.5)',
    waveformFillColor: 'oklch(0.8664 0.2948 142.5 / 0.1)',
    waveformEnvelopeColor: 'oklch(0.8664 0.2948 142.5 / 0.03)',
    // 10%
    vuNeedleColor: 'oklch(0.628 0.2577 29.2)',
    vuPeakHoldColor: 'oklch(0.968 0.211 109.8)',
  },

  // ─────────────────────────────────────────────────────────
  // Minimal Light — clean, high-contrast light mode
  // 70%: near-white background, mid-gray text
  // 20%: muted earthy tones for zones
  // 10%: red accents for needles/peaks
  // ─────────────────────────────────────────────────────────
  {
    id: 'minimal-light',
    name: 'Minimal Light',
    // 70%
    background: 'oklch(0.9702 0 0)',
    gridColor: 'oklch(0 0 0 / 0.08)',
    textColor: 'oklch(0.5103 0 0)',
    // 20%
    vuScaleColor: 'oklch(0.683 0 0)',
    vuGreenZoneColor: 'oklch(0.6291 0.1543 144.2)',
    vuYellowZoneColor: 'oklch(0.8883 0.1697 95.3)',
    vuRedZoneColor: 'oklch(0.6083 0.209 27)',
    ledBarOffColor: 'oklch(0 0 0 / 0.04)',
    ledBarGreenColor: 'oklch(0.6291 0.1543 144.2)',
    ledBarYellowColor: 'oklch(0.8883 0.1697 95.3)',
    ledBarRedColor: 'oklch(0.6083 0.209 27)',
    waveformColor: 'oklch(0.6179 0.1668 250.9)',
    waveformFillColor: 'oklch(0.6179 0.1668 250.9 / 0.1)',
    waveformEnvelopeColor: 'oklch(0.6179 0.1668 250.9 / 0.03)',
    // 10%
    vuNeedleColor: 'oklch(0.6083 0.209 27)',
    vuPeakHoldColor: 'oklch(0.7076 0.1975 46.5)',
  },
]

/**
 * Get a CSS oklch() string with modified opacity.
 * Useful for creating derived colors at different opacities.
 */
export function withAlpha(oklchColor: string, alpha: number): string {
  const base = oklchColor.replace(/oklch\(/, '').replace(/\)$/, '').trim()
  const parts = base.split(/\s+/).filter(p => p && p !== '/')
  // parts[0]=l, [1]=c, [2]=h, [3]=existing alpha or undefined
  return `oklch(${parts[0]} ${parts[1]} ${parts[2]} / ${alpha})`
}
