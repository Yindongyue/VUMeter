/**
 * VU meter ballistics and audio processing utilities.
 */

// Standard VU meter time constants
const VU_ATTACK = 0.3    // 300ms
const VU_RELEASE = 0.3   // 300ms

// Peak hold
const PEAK_HOLD_MS = 1000
const PEAK_DECAY_DB_PER_S = 20

/**
 * Compute RMS level from time-domain data.
 * Returns dBFS (0 = maximum, -100 = silence floor)
 */
export function computeRMS(data: Uint8Array): number {
  let sumSquares = 0
  const len = data.length
  for (let i = 0; i < len; i++) {
    // Convert unsigned 8-bit (0-255) to signed float (-1 to 1)
    const sample = (data[i] - 128) / 128
    sumSquares += sample * sample
  }
  const rms = Math.sqrt(sumSquares / len)

  // Convert to dBFS, floor at -100
  if (rms < 1e-6) return -100
  return Math.max(-100, 20 * Math.log10(rms))
}

/**
 * Compute peak level from time-domain data.
 * Returns dBFS (0 = maximum, -100 = silence floor)
 */
export function computePeak(data: Uint8Array): number {
  let maxAbs = 0
  const len = data.length
  for (let i = 0; i < len; i++) {
    const sample = Math.abs((data[i] - 128) / 128)
    if (sample > maxAbs) maxAbs = sample
  }
  if (maxAbs < 1e-6) return -100
  return Math.max(-100, 20 * Math.log10(maxAbs))
}

/**
 * Apply VU meter ballistics with attack/release smoothing.
 * Maps dBFS to VU scale (-20 to +3 dB).
 *
 * @param currentLevel - Current RMS in dBFS
 * @param previousLevel - Previous VU level from last frame
 * @param dt - Delta time in seconds
 * @returns Smoothed VU level
 */
export function applyVUBallistics(
  currentLevel: number,
  previousLevel: number,
  dt: number
): number {
  // Map dBFS to VU scale: 0 dBFS ≈ 0 VU, with slight offset
  const vuInput = Math.max(-20, Math.min(3, currentLevel + 0))

  const alphaAttack = 1 - Math.exp(-dt / VU_ATTACK)
  const alphaRelease = 1 - Math.exp(-dt / VU_RELEASE)

  if (vuInput > previousLevel) {
    return previousLevel + (vuInput - previousLevel) * alphaAttack
  } else {
    return previousLevel + (vuInput - previousLevel) * alphaRelease
  }
}

/**
 * Process frequency band data from FFT bins.
 * Splits FFT bins into 16 frequency bands.
 *
 * @param fftData - Byte frequency data from AnalyserNode (0-255 each)
 * @param sampleRate - Audio sample rate (default 48000)
 * @param fftSize - FFT size (default 2048)
 * @returns 16 frequency band magnitudes
 */
export function computeFrequencyBands(
  fftData: Uint8Array,
  sampleRate: number = 48000,
  fftSize: number = 2048
): Float32Array {
  const nyquist = sampleRate / 2
  const numBins = fftData.length // fftSize / 2
  const bands = new Float32Array(16)

  // Frequency ranges for 16 bands (20Hz - 20kHz, log-spaced)
  const bandFreqs = [
    20, 60, 100, 150, 250, 400, 600, 800,
    1200, 2000, 3000, 5000, 7000, 10000, 13000, 16000, 20000
  ]

  for (let i = 0; i < 16; i++) {
    const lowFreq = bandFreqs[i]
    const highFreq = bandFreqs[i + 1]

    const lowBin = Math.floor((lowFreq / nyquist) * (fftData.length - 1))
    const highBin = Math.ceil((highFreq / nyquist) * (fftData.length - 1))
    const actualHighBin = Math.min(highBin, fftData.length - 1)

    let sum = 0
    let count = 0
    for (let b = lowBin; b <= actualHighBin; b++) {
      sum += fftData[b]
      count++
    }
    bands[i] = count > 0 ? sum / count : 0
  }

  // Apply basic smoothing and floor
  for (let i = 0; i < 16; i++) {
    bands[i] = Math.max(0, Math.min(255, bands[i]))
  }

  return bands
}

/**
 * Update peak hold value with decay.
 */
export function updatePeakHold(
  currentPeak: number,
  previousPeakHold: number,
  dt: number,
  peakHoldTime: number
): { value: number; holdTime: number } {
  if (currentPeak > previousPeakHold) {
    return { value: currentPeak, holdTime: 0 }
  }

  const newHoldTime = peakHoldTime + dt * 1000

  if (newHoldTime < PEAK_HOLD_MS) {
    return { value: previousPeakHold, holdTime: newHoldTime }
  }

  // After hold time, decay
  const decayed = previousPeakHold - PEAK_DECAY_DB_PER_S * dt
  return { value: Math.max(-20, decayed), holdTime: PEAK_HOLD_MS }
}

/**
 * Linear to dB conversion with floor.
 */
export function linearToDb(linear: number, floor: number = -100): number {
  if (linear < 1e-10) return floor
  return Math.max(floor, 20 * Math.log10(linear))
}

/**
 * dB to linear conversion.
 */
export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20)
}
