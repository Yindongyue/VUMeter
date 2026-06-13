import { AudioFrame } from '../../audio/types'
import { ColorTheme } from '../../types/theme'

/**
 * VU meter: 150° fan arc, graph-style.
 *
 * Canvas Y-down:
 *   Left  (-20 dB) → 13π/12 (195° → up-left on screen)
 *   Right (+  3 dB) → 23π/12 (345° → up-right on screen)
 *   sweep = 5π/6 = 150°
 *
 * Design:
 *   - Real-time needle from pivot to arc, pointing at current level
 *   - Thermometer-style arc fill: green→yellow→red, fills up to needle
 *   - Tick marks touch the arc edge (labels placed right next to ticks)
 *   - No peak-hold marker
 */
const START_ANGLE = (13 / 12) * Math.PI
const END_ANGLE   = (23 / 12) * Math.PI
const SWEEP       = END_ANGLE - START_ANGLE

const DB_MIN = -20
const DB_MAX = 3
const DB_RANGE = DB_MAX - DB_MIN

const MAJOR_TICKS = [-20, -10, -7, -5, -3, -1, 0, +1, +3]

const MINOR_TICKS: number[] = []
for (let db = DB_MIN; db <= DB_MAX; db++) {
  if (!MAJOR_TICKS.includes(db)) MINOR_TICKS.push(db)
}

function dbToAngle(db: number): number {
  const t = Math.max(0, Math.min(1, (db - DB_MIN) / DB_RANGE))
  return START_ANGLE + t * SWEEP
}

/**
 * Determine the zone color for a given dB value.
 */
function getZoneColor(db: number, theme: ColorTheme): string {
  if (db >= 1) return theme.vuRedZoneColor
  if (db >= 0) return theme.vuYellowZoneColor
  return theme.vuGreenZoneColor
}

export function drawFanVUMeter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: AudioFrame,
  theme: ColorTheme,
  channel: 'left' | 'right',
  channelLabel: 'L' | 'R',
  _time: number
): void {
  const ch = channel === 'left' ? frame.leftChannel : frame.rightChannel

  const cx = width / 2
  const R = Math.min(width, height) * 0.42
  const pivotX = cx
  const pivotY = height * 0.80

  // ── 1. Background ─────────────────────────────────
  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, width, height)

  // ── 2. Thermometer arc fill (dimmed baseline + active fill) ──
  const arcWidth = R * 0.08
  const vuDb = Math.max(DB_MIN, Math.min(DB_MAX, ch.vuLevel))

  // Dimmed full-track baseline (always visible)
  ctx.beginPath()
  ctx.arc(pivotX, pivotY, R, START_ANGLE, END_ANGLE)
  ctx.strokeStyle = theme.vuScaleColor
  ctx.globalAlpha = 0.25
  ctx.lineWidth = arcWidth
  ctx.lineCap = 'butt'
  ctx.stroke()
  ctx.globalAlpha = 1

  // Active gradient fill: left-to-right green → yellow → red mapped to -20dB … +3dB
  if (vuDb > DB_MIN) {
    const fillEnd = dbToAngle(vuDb)
    if (fillEnd > START_ANGLE) {
      // Screen-space X for a horizontal gradient that maps to the arc sweep
      const startX = pivotX + R * Math.cos(START_ANGLE)
      const endX   = pivotX + R * Math.cos(fillEnd)
      const y      = pivotY + R * Math.sin(START_ANGLE)
      const grad = ctx.createLinearGradient(startX, y, endX, y)
      grad.addColorStop(0, theme.vuGreenZoneColor)          // -20 dB
      grad.addColorStop(20 / 23, theme.vuGreenZoneColor)    //   0 dB
      grad.addColorStop(21 / 23, theme.vuYellowZoneColor)   //   1 dB
      grad.addColorStop(1, theme.vuRedZoneColor)            // +3 dB
      ctx.beginPath()
      ctx.arc(pivotX, pivotY, R, START_ANGLE, fillEnd)
      ctx.strokeStyle = grad
      ctx.lineWidth = arcWidth
      ctx.lineCap = 'butt'
      ctx.stroke()
    }
  }

  // ── 3. Tick marks (touch the arc edge) ───────────
  const majorTickLen = R * 0.12
  const minorTickLen = R * 0.06
  const tickInnerR = R + arcWidth / 2 + 2

  // Minor ticks
  ctx.lineWidth = 1
  ctx.strokeStyle = theme.vuScaleColor
  ctx.globalAlpha = 0.5
  for (const db of MINOR_TICKS) {
    const angle = dbToAngle(db)
    const r1 = tickInnerR
    const r2 = r1 - minorTickLen
    ctx.beginPath()
    ctx.moveTo(pivotX + r1 * Math.cos(angle), pivotY + r1 * Math.sin(angle))
    ctx.lineTo(pivotX + r2 * Math.cos(angle), pivotY + r2 * Math.sin(angle))
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // Major ticks (longer, bolder)
  ctx.strokeStyle = theme.vuScaleColor
  ctx.lineWidth = 2
  for (const db of MAJOR_TICKS) {
    const angle = dbToAngle(db)
    const r1 = tickInnerR
    const r2 = r1 - majorTickLen
    ctx.beginPath()
    ctx.moveTo(pivotX + r1 * Math.cos(angle), pivotY + r1 * Math.sin(angle))
    ctx.lineTo(pivotX + r2 * Math.cos(angle), pivotY + r2 * Math.sin(angle))
    ctx.stroke()
  }

  // ── 4. dB labels (tight against ticks) ──
  const labelR = tickInnerR + majorTickLen + R * 0.01
  for (const db of MAJOR_TICKS) {
    const angle = dbToAngle(db)
    const lx = pivotX + labelR * Math.cos(angle)
    const ly = pivotY + labelR * Math.sin(angle)

    const isRed = db >= 3
    const isOrange = db >= 1 && db < 3

    const fontSize = Math.max(12, R * 0.09)
    ctx.font = `600 ${fontSize}px "SF Pro Display", "Inter", "Segoe UI", "Helvetica Neue", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = isRed ? theme.vuRedZoneColor : (isOrange ? theme.vuYellowZoneColor : theme.textColor)
    ctx.fillText(`${db}`, lx, ly)
  }

  // ── 5. Channel label + "dB" (faint, decorative) ──
  const chLabelR = R * 0.48
  ctx.font = `600 ${R * 0.13}px "SF Pro Display", "Inter", "Segoe UI", "Helvetica Neue", sans-serif`
  ctx.fillStyle = theme.vuScaleColor
  ctx.globalAlpha = 0.5
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(channelLabel, pivotX, pivotY - chLabelR)
  ctx.font = `400 ${R * 0.09}px "SF Pro Display", "Inter", "Segoe UI", "Helvetica Neue", sans-serif`
  ctx.fillText('dB', pivotX, pivotY - chLabelR - R * 0.14)
  ctx.globalAlpha = 1

  // ── 6. Needle (real-time level indicator) ─────────
  const needleAngle = dbToAngle(vuDb)
  ctx.save()
  ctx.translate(pivotX, pivotY)
  ctx.rotate(needleAngle)

  // Shadow
  ctx.save()
  ctx.shadowColor = 'oklch(0 0 0 / 0.4)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetX = 1
  ctx.shadowOffsetY = 2

  // Tapered needle: points outward (positive X in rotated frame)
  ctx.beginPath()
  ctx.moveTo(-R * 0.12, -1.5)
  ctx.lineTo(R * 0.08, -1.0)
  ctx.lineTo(R * 0.85, -0.4)
  ctx.lineTo(R * 0.85, 0.4)
  ctx.lineTo(R * 0.08, 1.0)
  ctx.lineTo(-R * 0.12, 1.5)
  ctx.closePath()

  // Needle colored by zone
  ctx.fillStyle = getZoneColor(vuDb, theme)
  ctx.fill()
  ctx.restore()

  ctx.restore()

  // ── 7. Pivot cap ─────────────────────────────────
  ctx.beginPath()
  ctx.arc(pivotX, pivotY, R * 0.035, 0, Math.PI * 2)
  ctx.strokeStyle = theme.vuNeedleColor
  ctx.globalAlpha = 0.4
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.globalAlpha = 1

  ctx.beginPath()
  ctx.arc(pivotX, pivotY, R * 0.015, 0, Math.PI * 2)
  ctx.fillStyle = theme.vuNeedleColor
  ctx.fill()
}
