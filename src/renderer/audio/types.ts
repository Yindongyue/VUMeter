export interface ChannelData {
  /** VU level after ballistics processing (-20 to +3 dB) */
  vuLevel: number
  /** Peak hold level (-20 to +3 dB) */
  peakHold: number
  /** RMS level in dBFS (-100 to 0) */
  rms: number
  /** Peak level in dBFS (-100 to 0) */
  peak: number
}

export interface AudioFrame {
  /** RMS level in dBFS (-100 to 0) — mono-combined average */
  rms: number
  /** Peak level in dBFS (-100 to 0) — mono-combined max */
  peak: number
  /** VU level after ballistics processing (-20 to +3 dB) — mono-combined average */
  vuLevel: number
  /** Peak hold level (-20 to +3 dB) — mono-combined max */
  peakHold: number
  /** 16 frequency band magnitudes (0-255 each) */
  frequencyBands: Float32Array
  /** Time-domain waveform samples (1024 values, -1 to 1) */
  waveform: Float32Array
  /** Timestamp of this frame */
  timestamp: number
  /** Left channel data */
  leftChannel: ChannelData
  /** Right channel data */
  rightChannel: ChannelData
}

export type AudioSourceType = 'desktop-capturer' | 'blackhole'

export interface AudioDeviceInfo {
  deviceId: string
  label: string
  type: AudioSourceType
}

export function createEmptyFrame(): AudioFrame {
  const empty = {
    vuLevel: -20,
    peakHold: -20,
    rms: -100,
    peak: -100
  }
  return {
    rms: -100,
    peak: -100,
    vuLevel: -20,
    peakHold: -20,
    frequencyBands: new Float32Array(16),
    waveform: new Float32Array(1024),
    timestamp: 0,
    leftChannel: { ...empty },
    rightChannel: { ...empty }
  }
}

/**
 * Platform-aware audio capture error.
 * Carries a type code so the UI can show locale- and platform-specific messages.
 */
export class AudioCaptureError extends Error {
  /** Error type for i18n lookup */
  code: 'no-audio-track' | 'no-blackhole' | 'no-sources' | 'unknown'

  constructor(code: AudioCaptureError['code'], message: string) {
    super(message)
    this.name = 'AudioCaptureError'
    this.code = code
  }
}
