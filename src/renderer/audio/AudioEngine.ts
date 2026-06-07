import {
  AudioFrame,
  AudioSourceType,
  createEmptyFrame
} from './types'
import {
  computeRMS,
  computePeak,
  applyVUBallistics,
  computeFrequencyBands,
  updatePeakHold
} from './AudioFrame'

/**
 * AudioEngine singleton:
 * - Captures system audio via desktopCapturer or BlackHole getUserMedia
 * - Processes through AnalyserNode
 * - Produces AudioFrame data at ~60fps via rAF loop
 * - Callback-based so it works outside React
 */
export class AudioEngine {
  private audioContext: AudioContext | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private analyser: AnalyserNode | null = null
  private gainNode: GainNode | null = null
  private stream: MediaStream | null = null
  private rafId: number | null = null
  private running = false

  // Frame state (carried between frames for ballistics)
  private previousVULevel = -20
  private peakHoldValue = -20
  private peakHoldTime = 0

  // Audio data buffers (reused)
  private timeDomainData: Uint8Array | null = null
  private frequencyData: Uint8Array | null = null

  // Current frame (last produced)
  private currentFrame: AudioFrame = createEmptyFrame()

  private onFrameCallback: ((frame: AudioFrame) => void) | null = null
  private onErrorCallback: ((error: string) => void) | null = null

  private currentSourceType: AudioSourceType = 'desktop-capturer'
  private sampleRate = 48000

  /** Register frame callback (called ~60 times/sec) */
  onFrame(cb: (frame: AudioFrame) => void): void {
    this.onFrameCallback = cb
  }

  /** Register error callback */
  onError(cb: (error: string) => void): void {
    this.onErrorCallback = cb
  }

  /** Get the current source type */
  getSourceType(): AudioSourceType {
    return this.currentSourceType
  }

  /** Check if engine is running */
  isRunning(): boolean {
    return this.running
  }

  /** Get the last produced frame */
  getCurrentFrame(): AudioFrame {
    return this.currentFrame
  }

  /**
   * Start audio capture with the specified source type.
   */
  async start(sourceType: AudioSourceType = 'desktop-capturer'): Promise<void> {
    if (this.running) {
      await this.stop()
    }

    this.currentSourceType = sourceType
    this.previousVULevel = -20
    this.peakHoldValue = -20
    this.peakHoldTime = 0

    try {
      this.stream = await this.getAudioStream(sourceType)

      console.log('[AudioEngine] Stream captured:', {
        audioTracks: this.stream.getAudioTracks().length,
        audioTrackLabel: this.stream.getAudioTracks().map(t => t.label),
        audioTrackReadyState: this.stream.getAudioTracks().map(t => t.readyState),
        active: this.stream.active
      })

      this.audioContext = new AudioContext({ sampleRate: this.sampleRate })
      console.log('[AudioEngine] AudioContext state after create:', this.audioContext.state)
      // AudioContext created outside user gesture starts 'suspended' in Chromium.
      // Resume explicitly to ensure audio processing runs.
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      this.source = this.audioContext.createMediaStreamSource(this.stream)
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = 0.8

      this.source.connect(this.analyser)

      // Connect analyser -> zero-gain -> destination to ensure audio graph
      // processes. Chromium skips processing when nothing reaches destination,
      // which causes the AnalyserNode to always return silence.
      this.gainNode = this.audioContext.createGain()
      this.gainNode.gain.value = 0
      this.analyser.connect(this.gainNode)
      this.gainNode.connect(this.audioContext.destination)

      this.timeDomainData = new Uint8Array(this.analyser.frequencyBinCount)
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)

      this.running = true
      this.tick()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      this.onErrorCallback?.(msg)
      await this.stop()
      throw err
    }
  }

  /**
   * Stop audio capture and release resources.
   */
  async stop(): Promise<void> {
    this.running = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.source) {
      this.source.disconnect()
      this.source = null
    }
    if (this.gainNode) {
      this.gainNode.disconnect()
      this.gainNode = null
    }
    if (this.audioContext) {
      await this.audioContext.close()
      this.audioContext = null
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    this.analyser = null
    this.timeDomainData = null
    this.frequencyData = null
  }

  /**
   * Get a list of available audio devices (for BlackHole detection).
   */
  static async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.filter(d => d.kind === 'audioinput')
    } catch {
      return []
    }
  }

  private async getAudioStream(sourceType: AudioSourceType): Promise<MediaStream> {
    if (sourceType === 'desktop-capturer') {
      return this.getStreamFromDesktopCapturer()
    } else {
      return this.getStreamFromBlackHole()
    }
  }

  private async getStreamFromDesktopCapturer(): Promise<MediaStream> {
    // Use the macOS native system picker (useSystemPicker: true in main).
    // On macOS 14.2+ it supports system audio capture via ScreenCaptureKit.
    // We request both video + audio; the system picker shows the audio toggle.
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    })

    // Stop video tracks — we only need audio
    stream.getVideoTracks().forEach(track => track.stop())

    const audioTracks = stream.getAudioTracks()
    if (!audioTracks || audioTracks.length === 0) {
      throw new Error(
        '未获取到系统音频。\n\n' +
        '请在系统弹窗中开启音频捕获开关，\n' +
        '并确保已授予屏幕录制权限：\n' +
        '系统设置 > 隐私与安全性 > 屏幕录制'
      )
    }

    return stream
  }

  private async getStreamFromBlackHole(): Promise<MediaStream> {
    const blackhole = await this.findBlackHoleDevice()

    if (!blackhole) {
      throw new Error(
        'BlackHole virtual audio device not found.\n\n' +
        'To use BlackHole capture:\n' +
        '1. Open Audio MIDI Setup (/Applications/Utilities/Audio MIDI Setup.app)\n' +
        '2. Click + at bottom left → Create Multi-Output Device\n' +
        '3. Check BlackHole 2ch + Built-in Output\n' +
        '4. Right-click the new device → Use This Device For Sound Output\n' +
        '5. Select "BlackHole" as the audio source in this app'
      )
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: { exact: blackhole.deviceId },
        sampleRate: { ideal: 48000 },
        channelCount: { ideal: 2 },
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    })

    return stream
  }

  /**
   * Find BlackHole audio input device.
   * Handles the case where device labels are empty (before permission grant).
   */
  private async findBlackHoleDevice(): Promise<MediaDeviceInfo | null> {
    // Try with labels first
    let devices = await navigator.mediaDevices.enumerateDevices()
    let audioInputs = devices.filter(d => d.kind === 'audioinput')

    // Look for BlackHole by label
    let blackhole = audioInputs.find(
      d => d.label && d.label.toLowerCase().includes('blackhole')
    )
    if (blackhole) return blackhole

    // Labels are empty (no permission yet). Request permission via a temp stream,
    // then re-enumerate with populated labels.
    if (!audioInputs.some(d => d.label)) {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        devices = await navigator.mediaDevices.enumerateDevices()
        audioInputs = devices.filter(d => d.kind === 'audioinput')
        tempStream.getTracks().forEach(t => t.stop())
      } catch {
        // Permission denied; try fallback below
      }

      blackhole = audioInputs.find(
        d => d.label && d.label.toLowerCase().includes('blackhole')
      )
      if (blackhole) return blackhole
    }

    // Fallback: if we can't find by label, try matching by group or return first input
    // that isn't the default microphone, as a heuristic
    return null
  }

  private tick = (): void => {
    if (!this.running || !this.analyser || !this.timeDomainData || !this.frequencyData) return

    const now = performance.now()

    // Read audio data
    this.analyser.getByteTimeDomainData(this.timeDomainData)
    this.analyser.getByteFrequencyData(this.frequencyData)

    // Debug: log once per second
    if (Math.floor(now / 1000) !== Math.floor((this.currentFrame.timestamp || 0) / 1000)) {
      const timeDomainMin = Math.min(...this.timeDomainData)
      const timeDomainMax = Math.max(...this.timeDomainData)
      const freqMax = Math.max(...this.frequencyData)
      console.log('[AudioEngine] Tick data:', {
        timeDomainMin, timeDomainMax,
        freqMax,
        audioContextState: this.audioContext?.state,
        analyserFftSize: this.analyser.fftSize,
        analyserFreqBinCount: this.analyser.frequencyBinCount
      })
    }

    // Compute levels
    const rms = computeRMS(this.timeDomainData)
    const peak = computePeak(this.timeDomainData)
    const dt = this.currentFrame.timestamp > 0
      ? (now - this.currentFrame.timestamp) / 1000
      : 1 / 60

    const vuLevel = applyVUBallistics(rms, this.previousVULevel, dt)
    this.previousVULevel = vuLevel

    const peakResult = updatePeakHold(peak, this.peakHoldValue, dt, this.peakHoldTime)
    this.peakHoldValue = peakResult.value
    this.peakHoldTime = peakResult.holdTime

    const frequencyBands = computeFrequencyBands(this.frequencyData, this.sampleRate)

    // Build frame
    this.currentFrame = {
      rms,
      peak,
      vuLevel: Math.max(-20, Math.min(3, vuLevel)),
      peakHold: this.peakHoldValue,
      frequencyBands,
      waveform: new Float32Array(this.timeDomainData.map(v => ((v - 128) / 128) * 3)),
      timestamp: now
    }

    // Notify
    this.onFrameCallback?.(this.currentFrame)

    this.rafId = requestAnimationFrame(this.tick)
  }
}
