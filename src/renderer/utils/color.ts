/**
 * OKLCH Color Space Utilities
 *
 * Implements the OKLab/OKLCH color space (Björn Ottosson, 2020)
 * for precise, perceptually-uniform color manipulation.
 *
 * Per Rule 2: RGB/HEX is deprecated — use OKLCH throughout.
 *
 * Conversion chain:
 *   sRGB (8-bit) → Linear sRGB → LMS → OKLab → OKLCH
 *
 * References:
 *   https://bottosson.github.io/posts/oklab/
 */

// --- Matrices for OKLab (Bottosson 2020) ---

/** Linear sRGB → LMS cone responses */
const M1 = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005],
]

/** LMS (cubic root) → OKLab */
const M2 = [
  [0.2104542553, 0.7936177850, -0.0040720468],
  [1.9779984951, -2.4285922050, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.8086757660],
]

/** OKLab → LMS (inverse of M2) */
const M2_INV = [
  [0.9999999985, 0.3963377922, 0.2158037583],
  [1.0000000089, -0.1055613416, -0.0638541743],
  [-0.0000000041, -0.0894841829, -1.2914855379],
]

/** Linear sRGB from LMS (inverse of M1) */
const M1_INV = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.7076147010],
]

// --- Helpers ---

function srgbToLinear(c: number): number {
  c = c / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function linearToSrgb(c: number): number {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * (c ** (1 / 2.4)) - 0.055
  return Math.round(Math.min(255, Math.max(0, v * 255)))
}

function matMul3(M: number[][], v: number[]): number[] {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
  ]
}

// --- Core conversions ---

export interface Oklch {
  /** Lightness [0, 1] */
  l: number
  /** Chroma [0, ~0.4] */
  c: number
  /** Hue [0, 360) degrees */
  h: number
  /** Alpha [0, 1], defaults to 1 */
  a: number
}

export interface Srgb8 {
  r: number
  g: number
  b: number
  a: number
}

/**
 * Convert 8-bit sRGB to OKLCH.
 */
export function srgb8ToOklch(r: number, g: number, b: number, a = 1): Oklch {
  // Linearize
  const rL = srgbToLinear(r)
  const gL = srgbToLinear(g)
  const bL = srgbToLinear(b)

  // LMS
  const lms = matMul3(M1, [rL, gL, bL])

  // Cube root (nonlinear)
  const lmsRoot = lms.map(v => Math.cbrt(v))

  // OKLab
  const lab = matMul3(M2, lmsRoot)

  // OKLCH
  const l = lab[0]
  const aVal = lab[1]
  const bVal = lab[2]
  const c = Math.sqrt(aVal * aVal + bVal * bVal)
  let h = (Math.atan2(bVal, aVal) * 180) / Math.PI
  if (h < 0) h += 360

  return { l, c, h, a }
}

/**
 * Convert OKLCH to 8-bit sRGB.
 * Returns { r, g, b, a } with 0–255 channels.
 */
export function oklchToSrgb8(oklch: Oklch): Srgb8 {
  const { l, c, h, a } = oklch
  const hRad = (h * Math.PI) / 180
  const aVal = c * Math.cos(hRad)
  const bVal = c * Math.sin(hRad)

  // OKLab → LMS
  const lab = [l, aVal, bVal]
  const lmsRoot = matMul3(M2_INV, lab)
  const lms = lmsRoot.map(v => v ** 3)

  // LMS → Linear sRGB
  const rgbLin = matMul3(M1_INV, lms)

  // Linear → sRGB 8-bit
  const r = linearToSrgb(rgbLin[0])
  const g = linearToSrgb(rgbLin[1])
  const b = linearToSrgb(rgbLin[2])

  return { r, g, b, a }
}

/**
 * Convert a hex color string (#rgb, #rrggbb) to OKLCH.
 */
export function hexToOklch(hex: string): Oklch {
  const clean = hex.replace('#', '')
  let r: number, g: number, b: number

  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16)
    g = parseInt(clean[1] + clean[1], 16)
    b = parseInt(clean[2] + clean[2], 16)
  } else {
    r = parseInt(clean.slice(0, 2), 16)
    g = parseInt(clean.slice(2, 4), 16)
    b = parseInt(clean.slice(4, 6), 16)
  }

  return srgb8ToOklch(r, g, b)
}

/**
 * Convert OKLCH to a CSS oklch() string.
 * E.g., `oklch(0.5 0.2 145)` or `oklch(0.5 0.2 145 / 0.8)`
 */
export function oklchToCss(oklch: Oklch): string {
  const { l, c, h, a } = oklch
  const lStr = l.toFixed(4)
  const cStr = c.toFixed(4)
  const hStr = h.toFixed(1)

  if (a >= 1) {
    return `oklch(${lStr} ${cStr} ${hStr})`
  }
  const aStr = a.toFixed(3)
  return `oklch(${lStr} ${cStr} ${hStr} / ${aStr})`
}

/**
 * Convert OKLCH to a hex string (#rrggbb). Alpha is lost.
 */
export function oklchToHex(oklch: Oklch): string {
  const { r, g, b } = oklchToSrgb8(oklch)
  const toHex = (v: number) => Math.min(255, Math.max(0, Math.round(v))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Convert an rgba() string to OKLCH.
 */
export function rgbaToOklch(rgba: string): Oklch {
  const match = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/)
  if (!match) throw new Error(`Invalid rgba string: ${rgba}`)
  const r = parseInt(match[1])
  const g = parseInt(match[2])
  const b = parseInt(match[3])
  const a = match[4] !== undefined ? parseFloat(match[4]) : 1
  return srgb8ToOklch(r, g, b, a)
}

/**
 * Try to parse any CSS color string to OKLCH.
 * Supports: hex (#rgb, #rrggbb), rgba(), oklch()
 */
export function parseToOklch(color: string): Oklch {
  const trimmed = color.trim()

  // OKLCH: already in target format — parse it
  if (trimmed.startsWith('oklch(')) {
    return parseOklchCss(trimmed)
  }

  // rgba/rgb
  if (trimmed.startsWith('rgba') || trimmed.startsWith('rgb(')) {
    return rgbaToOklch(trimmed)
  }

  // hex
  if (trimmed.startsWith('#')) {
    return hexToOklch(trimmed)
  }

  throw new Error(`Cannot parse color: ${color}`)
}

/**
 * Parse a CSS `oklch(l c h / a)` string.
 */
export function parseOklchCss(css: string): Oklch {
  const inner = css.replace(/^oklch\(/, '').replace(/\)$/, '').trim()
  // Split by space or slash
  const parts = inner.split(/\s+/).filter(p => p && p !== '/')
  const l = parseFloat(parts[0])
  const c = parseFloat(parts[1])
  const h = parseFloat(parts[2])
  const a = parts[3] !== undefined ? parseFloat(parts[3]) : 1
  return { l, c, h, a }
}

/**
 * Generate a 70-20-10 color palette from a base OKLCH color.
 *
 * - 70% (base hue, low chroma, backgrounds): l+0.1..0.2 from base
 * - 20% (medium chroma, surfaces): base l/c
 * - 10% (high chroma, accents): l-0.05, c×2
 */
export function generatePalette(base: Oklch): {
  primary: Oklch
  secondary: Oklch
  accent: Oklch
} {
  return {
    primary: { l: Math.min(1, base.l + 0.15), c: base.c * 0.3, h: base.h, a: base.a },
    secondary: { ...base, c: base.c * 0.6 },
    accent: { l: Math.max(0, base.l - 0.05), c: Math.min(0.4, base.c * 2), h: base.h, a: base.a },
  }
}

// --- Lightness / contrast helpers (Rule 7) ---

/**
 * WCAG relative luminance from sRGB (0–255).
 */
export function relativeLuminance(r: number, g: number, b: number): number {
  const rs = srgbToLinear(r)
  const gs = srgbToLinear(g)
  const bs = srgbToLinear(b)
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate WCAG contrast ratio between two OKLCH colors.
 * Contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text per Rule 7.
 */
export function contrastRatio(a: Oklch, b: Oklch): number {
  const srgbA = oklchToSrgb8(a)
  const srgbB = oklchToSrgb8(b)
  const l1 = relativeLuminance(srgbA.r, srgbA.g, srgbA.b)
  const l2 = relativeLuminance(srgbB.r, srgbB.g, srgbB.b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Adjust lightness of an OKLCH color to meet a minimum contrast ratio
 * against a background color.
 *
 * When `textColor.l` < `bgColor.l`, darken the textColor;
 * otherwise lighten it.
 * Repeats until target ratio is reached (max 32 iterations).
 */
export function ensureContrast(
  textColor: Oklch,
  bgColor: Oklch,
  targetRatio = 4.5
): Oklch {
  let result = { ...textColor }
  let ratio = contrastRatio(result, bgColor)
  const darken = result.l < bgColor.l
  const step = 0.01
  let iterations = 0

  while (ratio < targetRatio && iterations < 32) {
    if (darken) {
      result.l = Math.max(0, result.l - step)
    } else {
      result.l = Math.min(1, result.l + step)
    }
    ratio = contrastRatio(result, bgColor)
    iterations++
  }

  return result
}

// --- Common preset colors in OKLCH (convenience constants) ---
// These replace hex constants like #007bff (which is banned by Rule 2)

/** Dark background ~ #1a1a2e */
export const BG_DARK = { l: 0.12, c: 0.035, h: 270, a: 1 }
/** Medium gray text ~ #b0b0b0 */
export const TEXT_MEDIUM = { l: 0.70, c: 0.015, h: 0, a: 1 }
/** Subtle white border ~ rgba(255,255,255,0.08) */
export const BORDER_SUBTLE = { l: 0.95, c: 0.00, h: 0, a: 0.08 }
/** Bright green ~ #00ff66 */
export const GREEN_BRIGHT = { l: 0.75, c: 0.30, h: 145, a: 1 }
/** Bright yellow ~ #ffcc00 */
export const YELLOW_BRIGHT = { l: 0.75, c: 0.20, h: 95, a: 1 }
/** Bright red ~ #ff3333 */
export const RED_BRIGHT = { l: 0.55, c: 0.25, h: 25, a: 1 }
