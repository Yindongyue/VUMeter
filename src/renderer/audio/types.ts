export interface AudioFrame {
  /** RMS level in dBFS (-100 to 0) */
  rms: number
  /** Peak level in dBFS (-100 to 0) */
  peak: number
  /** VU level after ballistics processing (-20 to +3 dB) */
  vuLevel: number
  /** Peak hold level (-20 to +3 dB) */
  peakHold: number
  /** 16 frequency band magnitudes (0-255 each) */
  frequencyBands: Float32Array
  /** Time-domain waveform samples (1024 values, -1 to 1) */
  waveform: Float32Array
  /** Timestamp of this frame */
  timestamp: number
}

export type AudioSourceType = 'desktop-capturer' | 'blackhole'

export interface AudioDeviceInfo {
  deviceId: string
  label: string
  type: AudioSourceType
}

export function createEmptyFrame(): AudioFrame {
  return {
    rms: -100,
    peak: -100,
    vuLevel: -20,
    peakHold: -20,
    frequencyBands: new Float32Array(16),
    waveform: new Float32Array(1024),
    timestamp: 0
  }
}
