import { AudioFrame } from '../../audio/types'
import { ColorTheme } from '../../types/theme'

/** VU meter scale parameters */
const SCALE_START_ANGLE = -0.75 * Math.PI
const SCALE_END_ANGLE = 0.75 * Math.PI
const SCALE_RANGE = SCALE_END_ANGLE - SCALE_START_ANGLE

const DB_MIN = -20
const DB_MAX = 3
const DB_RANGE = DB_MAX - DB_MIN

// Major tick marks with labels
const MAJOR_TICKS = [-20, -10, -7, -5, -3, -1, 0, +1, +3]
// Minor tick marks (no labels)
const MINOR_TICKS: number[] = []
for (let db = -20; db <= 3; db++) {
  if (!MAJOR_TICKS.includes(db)) {
    MINOR_TICKS.push(db)
  }
}

/**
 * Map a dB value to an angle on the VU meter arc.
 */
function dbToAngle(db: number): number {
  const t = (db - DB_MIN) / DB_RANGE
  return SCALE_START_ANGLE + t * SCALE_RANGE
}

/**
 * Draw the classic analog VU meter with antique pointer style.
 */
export function drawVUMeter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: AudioFrame,
  theme: ColorTheme,
  _time: number
): void {
  const cx = width / 2
  const cy = height * 0.65
  const radius = Math.min(width, height) * 0.38

  // --- Background: dark face plate ---
  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, width, height)

  // --- Outer bezel ring ---
  const bezelOuterR = radius * 1.18
  const bezelInnerR = radius * 1.12
  const bezelGrad = ctx.createRadialGradient(cx, cy, bezelInnerR, cx, cy, bezelOuterR)
  bezelGrad.addColorStop(0, '#4a4a4a')
  bezelGrad.addColorStop(0.5, '#6a6a6a')
  bezelGrad.addColorStop(1, '#3a3a3a')
  ctx.beginPath()
  ctx.arc(cx, cy, bezelOuterR, 0, Math.PI * 2)
  ctx.fillStyle = bezelGrad
  ctx.fill()

  // --- Inner face plate ---
  const faceR = radius * 1.1
  const faceGrad = ctx.createRadialGradient(cx, cy, faceR * 0.3, cx, cy, faceR)
  faceGrad.addColorStop(0, '#1e2025')
  faceGrad.addColorStop(0.7, '#16171a')
  faceGrad.addColorStop(1, '#0d0e11')
  ctx.beginPath()
  ctx.arc(cx, cy, faceR, 0, Math.PI * 2)
  ctx.fillStyle = faceGrad
  ctx.fill()

  // --- Mirror arc (parallax mirror strip) ---
  const arcY = radius * 0.08
  ctx.beginPath()
  ctx.arc(cx, cy + arcY, radius * 0.97, SCALE_START_ANGLE + 0.05, SCALE_END_ANGLE - 0.05)
  ctx.strokeStyle = 'rgba(180,180,190,0.15)'
  ctx.lineWidth = radius * 0.08
  ctx.stroke()

  // --- Color zone arcs ---
  const arcWidth = radius * 0.09

  const drawZoneArc = (fromDb: number, toDb: number, color: string) => {
    ctx.beginPath()
    ctx.arc(cx, cy, radius, dbToAngle(fromDb), dbToAngle(toDb))
    ctx.strokeStyle = color
    ctx.lineWidth = arcWidth
    ctx.lineCap = 'butt'
    ctx.stroke()
  }

  drawZoneArc(-20, -5, theme.vuGreenZoneColor)
  drawZoneArc(-5, 0, theme.vuYellowZoneColor)
  drawZoneArc(0, 3, theme.vuRedZoneColor)

  // --- Tick marks ---
  const majorTickLen = radius * 0.1
  const minorTickLen = radius * 0.05
  const labelRadius = radius + radius * 0.2

  // Minor ticks
  for (const db of MINOR_TICKS) {
    const angle = dbToAngle(db)
    const innerX = cx + (radius - arcWidth / 2) * Math.cos(angle)
    const innerY = cy + (radius - arcWidth / 2) * Math.sin(angle)
    const outerX = cx + (radius - arcWidth / 2 - minorTickLen) * Math.cos(angle)
    const outerY = cy + (radius - arcWidth / 2 - minorTickLen) * Math.sin(angle)

    ctx.beginPath()
    ctx.moveTo(innerX, innerY)
    ctx.lineTo(outerX, outerY)
    ctx.strokeStyle = theme.vuScaleColor
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Major ticks
  for (const db of MAJOR_TICKS) {
    const angle = dbToAngle(db)
    const innerX = cx + (radius - arcWidth / 2) * Math.cos(angle)
    const innerY = cy + (radius - arcWidth / 2) * Math.sin(angle)
    const outerX = cx + (radius - arcWidth / 2 - majorTickLen) * Math.cos(angle)
    const outerY = cy + (radius - arcWidth / 2 - majorTickLen) * Math.sin(angle)

    ctx.beginPath()
    ctx.moveTo(innerX, innerY)
    ctx.lineTo(outerX, outerY)
    ctx.strokeStyle = theme.vuScaleColor
    ctx.lineWidth = 2
    ctx.stroke()

    // Label
    const labelX = cx + labelRadius * Math.cos(angle)
    const labelY = cy + labelRadius * Math.sin(angle)
    ctx.font = `${radius * 0.11}px "Times New Roman", Georgia, serif`
    ctx.fillStyle = theme.textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${db}`, labelX, labelY)
  }

  // --- "VU" label ---
  ctx.font = `bold ${radius * 0.14}px "Times New Roman", Georgia, serif`
  ctx.fillStyle = theme.textColor
  ctx.textAlign = 'center'
  ctx.fillText('VU', cx, cy - radius * 0.5)

  // --- dB label ---
  ctx.font = `${radius * 0.08}px "Times New Roman", Georgia, serif`
  ctx.fillStyle = 'rgba(180,180,180,0.6)'
  ctx.fillText('dB', cx, cy - radius * 0.35)

  // --- Needle ---
  const vuDb = Math.max(DB_MIN, Math.min(DB_MAX, frame.vuLevel))
  const needleAngle = dbToAngle(vuDb)
  const needleLen = radius * 0.82
  const counterWeightLen = radius * 0.15

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(needleAngle)

  // Needle shadow
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2

  // Needle body (thin elegant pointer)
  ctx.beginPath()
  ctx.moveTo(-counterWeightLen, -2.5)
  ctx.lineTo(needleLen, -1)
  ctx.lineTo(needleLen, 1)
  ctx.lineTo(-counterWeightLen, 2.5)
  ctx.closePath()
  ctx.fillStyle = theme.vuNeedleColor
  ctx.fill()

  // Counterweight triangle
  ctx.beginPath()
  ctx.moveTo(-counterWeightLen, -4)
  ctx.lineTo(0, 0)
  ctx.lineTo(-counterWeightLen, 4)
  ctx.closePath()
  ctx.fillStyle = '#333'
  ctx.fill()

  ctx.restore()

  ctx.restore()

  // --- Center cap (metallic pivot) ---
  const capGrad = ctx.createRadialGradient(cx - radius * 0.008, cy - radius * 0.008, radius * 0.005, cx, cy, radius * 0.045)
  capGrad.addColorStop(0, '#d0d0d0')
  capGrad.addColorStop(0.5, '#888')
  capGrad.addColorStop(1, '#444')
  ctx.beginPath()
  ctx.arc(cx, cy, radius * 0.045, 0, Math.PI * 2)
  ctx.fillStyle = capGrad
  ctx.fill()

  // --- Peak hold marker ---
  if (frame.peakHold > DB_MIN) {
    const peakAngle = dbToAngle(Math.max(DB_MIN, Math.min(DB_MAX, frame.peakHold)))
    const peakR = radius - arcWidth * 0.7
    const peakX = cx + peakR * Math.cos(peakAngle)
    const peakY = cy + peakR * Math.sin(peakAngle)

    // Glow
    ctx.beginPath()
    ctx.arc(peakX, peakY, radius * 0.035, 0, Math.PI * 2)
    ctx.fillStyle = theme.vuPeakHoldColor
    ctx.fill()

    // Bright center
    ctx.beginPath()
    ctx.arc(peakX, peakY, radius * 0.018, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
  }

  // --- Scatter light dots around perimeter (screw/rivet detail) ---
  const screwR = faceR * 0.94
  const dotSize = radius * 0.018
  for (let i = 0; i < 4; i++) {
    const dotAngle = (i / 4) * Math.PI * 2 - Math.PI / 4
    const dx = cx + screwR * Math.cos(dotAngle)
    const dy = cy + screwR * Math.sin(dotAngle)
    ctx.beginPath()
    ctx.arc(dx, dy, dotSize, 0, Math.PI * 2)
    ctx.fillStyle = '#555'
    ctx.fill()

    // Highlight
    ctx.beginPath()
    ctx.arc(dx - dotSize * 0.25, dy - dotSize * 0.25, dotSize * 0.35, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fill()
  }
}
