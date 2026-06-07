import { AudioFrame } from '../../audio/types'
import { ColorTheme } from '../../types/theme'

// 5 frequency ranges (grouping the 16 frequency bands)
const FREQ_RANGES = [
  { name: 'Sub', bands: [0, 1], color: '#ff4444' },       // 20-60Hz   -> Red
  { name: 'Bass', bands: [2, 3, 4], color: '#ffaa00' },    // 60-250Hz  -> Orange
  { name: 'Mid', bands: [5, 6, 7, 8], color: '#ffdd00' },  // 250-2kHz  -> Yellow
  { name: 'High', bands: [9, 10, 11, 12], color: '#00cc66' }, // 2-8kHz  -> Green
  { name: 'Air', bands: [13, 14, 15], color: '#4488ff' }   // 8-16kHz   -> Blue
]

/**
 * Draw the real-time oscilloscope-style waveform with 5-level
 * frequency response colors mapped to amplitude ranges.
 */
export function drawWaveform(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: AudioFrame,
  theme: ColorTheme,
  _time: number
): void {
  // Background
  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, width, height)

  const leftMargin = width * 0.03
  const rightMargin = width * 0.03
  const topMargin = height * 0.05
  const bottomMargin = height * 0.08
  const freqBarHeight = height * 0.08 // Space for frequency range indicators
  const drawHeight = height - topMargin - bottomMargin - freqBarHeight
  const drawWidth = width - leftMargin - rightMargin
  const centerY = topMargin + drawHeight / 2

  // Grid lines
  ctx.strokeStyle = theme.gridColor
  ctx.lineWidth = 0.5

  // Horizontal center line
  ctx.beginPath()
  ctx.moveTo(leftMargin, centerY)
  ctx.lineTo(width - rightMargin, centerY)
  ctx.stroke()

  // Horizontal grid: +/-50% dotted lines
  ctx.setLineDash([4, 6])
  for (const pct of [-0.5, 0.5]) {
    const y = centerY + pct * drawHeight
    ctx.beginPath()
    ctx.moveTo(leftMargin, y)
    ctx.lineTo(width - rightMargin, y)
    ctx.stroke()
  }
  ctx.setLineDash([])

  // Vertical time markers (4 divisions)
  for (let i = 1; i <= 3; i++) {
    const x = leftMargin + (drawWidth / 4) * i
    ctx.beginPath()
    ctx.moveTo(x, topMargin)
    ctx.lineTo(x, height - bottomMargin - freqBarHeight)
    ctx.strokeStyle = theme.gridColor
    ctx.lineWidth = 0.5
    ctx.stroke()
  }

  // Draw waveform
  const data = frame.waveform
  if (!data || data.length === 0) return

  const sampleCount = data.length
  const step = sampleCount / drawWidth

  // Boost gain by 4x and apply soft clip for visibility
  const gain = 4.0
  function amplify(v: number): number {
    const boosted = v * gain
    return Math.tanh(boosted)
  }

  // Outer glow
  ctx.save()
  ctx.shadowColor = theme.waveformColor
  ctx.shadowBlur = 12

  // Fill below wave
  ctx.beginPath()
  ctx.moveTo(leftMargin, centerY)

  for (let x = 0; x < drawWidth; x++) {
    const idx = Math.floor(x * step)
    const clampedIdx = Math.min(idx, sampleCount - 1)
    const sample = amplify(data[clampedIdx])
    const y = centerY + sample * (drawHeight / 2) * 0.95
    ctx.lineTo(leftMargin + x, y)
  }

  ctx.lineTo(width - rightMargin, centerY)
  ctx.closePath()

  const gradient = ctx.createLinearGradient(0, topMargin, 0, topMargin + drawHeight)
  gradient.addColorStop(0, theme.waveformFillColor)
  gradient.addColorStop(0.5, 'transparent')
  ctx.fillStyle = gradient
  ctx.fill()

  ctx.restore()

  // Waveform line with glow
  ctx.save()
  ctx.shadowColor = theme.waveformColor
  ctx.shadowBlur = 8

  ctx.beginPath()
  for (let x = 0; x < drawWidth; x++) {
    const idx = Math.floor(x * step)
    const clampedIdx = Math.min(idx, sampleCount - 1)
    const sample = amplify(data[clampedIdx])
    const y = centerY + sample * (drawHeight / 2) * 0.95
    if (x === 0) {
      ctx.moveTo(leftMargin + x, y)
    } else {
      ctx.lineTo(leftMargin + x, y)
    }
  }
  ctx.strokeStyle = theme.waveformColor
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.restore()

  // --- 5-Level Frequency Response Bar ---
  const freqBarY = height - bottomMargin - freqBarHeight + 4
  const freqBarW = drawWidth / 5
  const freqBarMaxH = freqBarHeight - 4

  for (let i = 0; i < 5; i++) {
    const range = FREQ_RANGES[i]

    // Compute average energy for this frequency range from frequencyBands
    let sum = 0
    for (const b of range.bands) {
      sum += (frame.frequencyBands[b] || 0)
    }
    const avg = sum / range.bands.length
    const level = Math.min(1, avg / 255)

    // Bar dimensions
    const bx = leftMargin + i * freqBarW + 2
    const bw = freqBarW - 4
    const bh = Math.max(2, level * freqBarMaxH)
    const by = freqBarY + freqBarMaxH - bh

    // Background (inactive) area
    ctx.fillStyle = 'rgba(255,255,255,0.03)'
    ctx.beginPath()
    ctx.roundRect(bx, freqBarY, bw, freqBarMaxH, 2)
    ctx.fill()

    // Active level bar
    ctx.fillStyle = range.color
    ctx.beginPath()
    ctx.roundRect(bx, by, bw, bh, [bh < freqBarMaxH ? 2 : 2, bh < freqBarMaxH ? 2 : 2, 2, 2])
    ctx.fill()

    // Active glow
    ctx.fillStyle = range.color.replace(')', ',0.3)').replace('rgb', 'rgba')
    if (range.color.startsWith('#')) {
      // Convert hex to rgba for glow
      const r = parseInt(range.color.slice(1, 3), 16)
      const g = parseInt(range.color.slice(3, 5), 16)
      const b = parseInt(range.color.slice(5, 7), 16)
      ctx.fillStyle = `rgba(${r},${g},${b},0.3)`
    }
    ctx.beginPath()
    ctx.roundRect(bx, by, bw, Math.min(bh + 4, freqBarMaxH), 2)
    ctx.fill()

    // Label
    ctx.font = `${Math.max(7, freqBarMaxH * 0.28)}px -apple-system, sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText(range.name, bx + bw / 2, freqBarY - 2)
  }
}
