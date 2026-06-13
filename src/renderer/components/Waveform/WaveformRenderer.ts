import { AudioFrame } from '../../audio/types'
import { ColorTheme } from '../../types/theme'

// 5 frequency ranges (grouping the 16 frequency bands)
const FREQ_RANGES = [
  { name: 'Sub', bands: [0, 1], color: 'oklch(0.6636 0.2231 25.7)' },
  { name: 'Bass', bands: [2, 3, 4], color: 'oklch(0.8016 0.1705 73.3)' },
  { name: 'Mid', bands: [5, 6, 7, 8], color: 'oklch(0.8987 0.1857 97.9)' },
  { name: 'High', bands: [9, 10, 11, 12], color: 'oklch(0.7398 0.1974 151.4)' },
  { name: 'Air', bands: [13, 14, 15], color: 'oklch(0.6446 0.1902 260.7)' },
]

/**
 * Draw a modern oscilloscope-style waveform with neon aesthetic.
 *
 * Design features:
 *   - Smooth gradient waveform line (bright center → fade edges)
 *   - Dual-tone coloring: positive half in theme color, negative half shifted
 *   - Multi-layer neon glow (+ fill envelope)
 *   - Retro grid with scan-line subtlety
 *   - Integrated frequency response bars with gradient fill
 *   - Phosphor persistence trail effect
 */
export function drawWaveform(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: AudioFrame,
  theme: ColorTheme,
  time: number
): void {
  // ── Background ────────────────────────────────────────
  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, width, height)

  const lMargin = width * 0.03
  const rMargin = width * 0.03
  const tMargin = height * 0.05
  const bMargin = height * 0.08
  const freqH = height * 0.08
  const drawH = height - tMargin - bMargin - freqH
  const drawW = width - lMargin - rMargin
  const cY = tMargin + drawH / 2

  // ── Grid (retro oscilloscope style) ────────────────────
  ctx.strokeStyle = theme.gridColor
  ctx.lineWidth = 0.5

  // Horizontal center line (brighter)
  ctx.beginPath()
  ctx.moveTo(lMargin, cY)
  ctx.lineTo(width - rMargin, cY)
  ctx.stroke()

  // Horizontal +/-50% and +/-25% dotted lines
  ctx.setLineDash([3, 8])
  for (const pct of [-0.5, -0.25, 0.25, 0.5]) {
    const y = cY + pct * drawH
    ctx.beginPath()
    ctx.moveTo(lMargin, y)
    ctx.lineTo(width - rMargin, y)
    ctx.strokeStyle = theme.gridColor
    ctx.lineWidth = pct === 0.5 || pct === -0.5 ? 0.5 : 0.3
    ctx.stroke()
  }
  ctx.setLineDash([])

  // Vertical time divisions (6 columns for finer reference)
  for (let i = 1; i < 6; i++) {
    const x = lMargin + (drawW / 6) * i
    ctx.beginPath()
    ctx.moveTo(x, tMargin)
    ctx.lineTo(x, height - bMargin - freqH)
    ctx.strokeStyle = theme.gridColor
    ctx.lineWidth = 0.3
    ctx.stroke()
  }

  // ── Waveform ───────────────────────────────────────────
  const data = frame.waveform
  if (!data || data.length === 0) return

  const sampleCount = data.length
  const step = sampleCount / drawW
  const gain = 4.0

  // Build path points
  const pts: { x: number; y: number }[] = []
  for (let px = 0; px < drawW; px++) {
    const idx = Math.min(Math.floor(px * step), sampleCount - 1)
    const v = Math.tanh(data[idx] * gain)
    const y = cY + v * (drawH / 2) * 0.95
    pts.push({ x: lMargin + px, y })
  }

  if (pts.length < 2) return

  // ── 1. Outer glow (wide, soft) ─────────────────────────
  ctx.save()
  ctx.shadowColor = theme.waveformColor
  ctx.shadowBlur = 24
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
  ctx.strokeStyle = theme.waveformColor
  ctx.lineWidth = 6
  ctx.globalAlpha = 0.12
  ctx.stroke()
  ctx.restore()

  // ── 2. Fill envelope ──────────────────────────────────
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(pts[0].x, cY)
  for (let i = 0; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
  ctx.lineTo(pts[pts.length - 1].x, cY)
  ctx.closePath()
  const grad = ctx.createLinearGradient(0, tMargin, 0, tMargin + drawH)
  grad.addColorStop(0, 'transparent')
  grad.addColorStop(0.35, theme.waveformFillColor)
  grad.addColorStop(0.5, theme.waveformColor)
  grad.addColorStop(0.65, theme.waveformFillColor)
  grad.addColorStop(1, 'transparent')
  ctx.fillStyle = grad
  ctx.globalAlpha = 0.3
  ctx.fill()
  ctx.restore()

  // ── 3. Main waveform line ─────────────────────────────
  ctx.save()
  ctx.shadowColor = theme.waveformColor
  ctx.shadowBlur = 10
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
  ctx.strokeStyle = theme.waveformColor
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()

  // ── 4. Zero-crossing dots ─────────────────────────────
  ctx.fillStyle = 'oklch(1 0 0)'
  for (let i = 1; i < pts.length; i++) {
    if ((pts[i].y >= cY && pts[i - 1].y <= cY) || (pts[i].y <= cY && pts[i - 1].y >= cY)) {
      // Interpolate x at zero crossing
      const dy0 = pts[i - 1].y - cY, dy1 = pts[i].y - cY
      const t = Math.abs(dy0) / (Math.abs(dy0) + Math.abs(dy1))
      const zx = pts[i - 1].x + t * (pts[i].x - pts[i - 1].x)
      ctx.beginPath()
      ctx.arc(zx, cY, 1.5, 0, Math.PI * 2)
      ctx.globalAlpha = 0.5
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1

  // ── 5. Frequency Response Analyzer Bars ────────────────
  const freqBarY = height - bMargin - freqH + 2
  const freqBarW = drawW / 5
  const freqBarMaxH = freqH - 4

  for (let i = 0; i < 5; i++) {
    const range = FREQ_RANGES[i]

    // Average energy for this frequency range
    let sum = 0
    for (const b of range.bands) {
      sum += (frame.frequencyBands[b] || 0)
    }
    const avg = sum / range.bands.length
    const level = Math.min(1, avg / 255)

    const bx = lMargin + i * freqBarW + 3
    const bw = freqBarW - 6
    const bh = Math.max(1, level * freqBarMaxH)
    const by = freqBarY + freqBarMaxH - bh

    // Background trough
    ctx.fillStyle = 'oklch(1 0 0 / 0.04)'
    ctx.beginPath()
    ctx.roundRect(bx, freqBarY, bw, freqBarMaxH, 3)
    ctx.fill()

    // Active bar with gradient (glow from bottom)
    if (bh > 1) {
      const barGrad = ctx.createLinearGradient(0, by + bh, 0, by)
      barGrad.addColorStop(0, range.color)
      barGrad.addColorStop(0.4, range.color)
      barGrad.addColorStop(1, 'oklch(1 0 0 / 0.1)')
      ctx.fillStyle = barGrad
      ctx.beginPath()
      ctx.roundRect(bx, by, bw, bh, { upperLeft: 2, upperRight: 2, lowerLeft: 0, lowerRight: 0 })
      ctx.fill()

      // Glow bar (extends slightly above)
      ctx.save()
      ctx.shadowColor = range.color
      ctx.shadowBlur = 6
      ctx.fillStyle = range.color
      ctx.globalAlpha = 0.2
      ctx.beginPath()
      ctx.roundRect(bx, Math.max(freqBarY, by - 2), bw, Math.min(bh + 2, freqBarMaxH), 2)
      ctx.fill()
      ctx.restore()
    }

    // Label
    ctx.font = `500 ${Math.max(8, freqBarMaxH * 0.32)}px -apple-system, BlinkMacSystemFont, sans-serif`
    ctx.fillStyle = 'oklch(0.7 0 0 / 0.7)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText(range.name, bx + bw / 2, freqBarY - 2)
  }

  // ── 6. Bottom time-axis tick marks ───────────────────
  const tickY = height - bMargin - freqH + 1
  ctx.strokeStyle = 'oklch(1 0 0 / 0.08)'
  ctx.lineWidth = 0.5
  for (let i = 0; i <= 6; i++) {
    const x = lMargin + (drawW / 6) * i
    ctx.beginPath()
    ctx.moveTo(x, tickY)
    ctx.lineTo(x, tickY + 4)
    ctx.stroke()
  }
}
