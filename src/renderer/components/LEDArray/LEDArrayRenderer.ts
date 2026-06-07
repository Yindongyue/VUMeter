import { AudioFrame } from '../../audio/types'
import { ColorTheme } from '../../types/theme'

const BAR_COUNT = 16
const SEGMENTS_PER_BAR = 10

/**
 * Draw the LED array bar graph with individual LED segments
 * at a 1:3 width-to-height aspect ratio (tall narrow rectangles).
 */
export function drawLEDArray(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: AudioFrame,
  theme: ColorTheme,
  time: number
): void {
  // Background
  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, width, height)

  const leftMargin = width * 0.06
  const rightMargin = width * 0.06
  const topMargin = height * 0.05
  const bottomMargin = height * 0.05
  const barAreaWidth = width - leftMargin - rightMargin
  const barAreaHeight = height - topMargin - bottomMargin

  const barWidth = barAreaWidth / BAR_COUNT
  const gapRatio = 0.2
  const barW = barWidth * (1 - gapRatio)
  const gap = barWidth * gapRatio

  // LED aspect ratio 1:3 (width:height) — each LED is a tall narrow rectangle
  const segW = barW
  const segH = segW * 3
  const segGap = segW * 0.3

  // Total height of one bar
  const totalBarHeight = SEGMENTS_PER_BAR * segH + (SEGMENTS_PER_BAR - 1) * segGap

  // Center bars vertically
  const barStartY = topMargin + (barAreaHeight - totalBarHeight) / 2

  for (let bar = 0; bar < BAR_COUNT; bar++) {
    const x = leftMargin + bar * barWidth + gap / 2

    // Value for this bar (0-255)
    const rawValue = frame.frequencyBands[bar] || 0
    const normalizedValue = Math.min(1, rawValue / 255)
    const litSegments = Math.round(normalizedValue * SEGMENTS_PER_BAR)

    for (let seg = 0; seg < SEGMENTS_PER_BAR; seg++) {
      // Bottom to top
      const segY = barStartY + (SEGMENTS_PER_BAR - 1 - seg) * (segH + segGap)
      const isLit = seg < litSegments

      if (!isLit) {
        ctx.fillStyle = theme.ledBarOffColor
      } else {
        const ratio = seg / SEGMENTS_PER_BAR
        if (ratio < 0.5) {
          ctx.fillStyle = theme.ledBarGreenColor
        } else if (ratio < 0.75) {
          ctx.fillStyle = theme.ledBarYellowColor
        } else {
          // Peak segment: flash if this is the top-most lit segment
          if (seg === litSegments - 1 && litSegments > SEGMENTS_PER_BAR * 0.75) {
            const flash = Math.sin(time / 1000 * 8 * Math.PI) > 0
            ctx.fillStyle = flash ? '#ffffff' : theme.ledBarRedColor
          } else {
            ctx.fillStyle = theme.ledBarRedColor
          }
        }
      }

      // Draw narrow rectangular LED segment with rounded corners
      const rx = segW * 0.2
      const ry = segW * 0.2
      ctx.beginPath()
      ctx.roundRect(x, segY, segW, segH, [rx, rx, ry, ry])
      ctx.fill()
    }
  }

  // Frequency labels
  const freqLabels = ['20', '60', '100', '150', '250', '400', '600', '800', '1.2k', '2k', '3k', '5k', '7k', '10k', '13k', '16k']
  ctx.font = `${Math.max(8, barWidth * 0.22)}px -apple-system, sans-serif`
  ctx.fillStyle = theme.textColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  for (let bar = 0; bar < BAR_COUNT; bar++) {
    const x = leftMargin + bar * barWidth + barWidth / 2
    ctx.fillText(freqLabels[bar], x, height - bottomMargin + 2)
  }
}
