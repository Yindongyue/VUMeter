import {
  AudioFrame,
  AudioSourceType,
  AudioCaptureError,
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

  // Per-channel state for stereo VU meters
  private previousLeftVU = -20
  private previousRightVU = -20
  private peakHoldLeft = -20
  private peakHoldRight = -20
  private peakHoldTimeL = 0
  private peakHoldTimeR = 0

  // Audio data buffers (reused)
  private timeDomainData: Uint8Array | null = null
  private frequencyData: Uint8Array | null = null
  private timeDomainDataL: Uint8Array | null = null
  private timeDomainDataR: Uint8Array | null = null

  // Per-channel analysers and splitter
  private channelAnalyserL: AnalyserNode | null = null
  private channelAnalyserR: AnalyserNode | null = null
  private channelSplitter: ChannelSplitterNode | null = null

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
    this.previousLeftVU = -20
    this.previousRightVU = -20
    this.peakHoldLeft = -20
    this.peakHoldRight = -20
    this.peakHoldTimeL = 0
    this.peakHoldTimeR = 0

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

      // ── Stereo channel splitting for VU meters ──
      this.channelSplitter = this.audioContext.createChannelSplitter(2)
      this.source.connect(this.channelSplitter)

      this.channelAnalyserL = this.audioContext.createAnalyser()
      this.channelAnalyserL.fftSize = 2048
      this.channelAnalyserL.smoothingTimeConstant = 0.8
      this.channelSplitter.connect(this.channelAnalyserL, 0)
      this.timeDomainDataL = new Uint8Array(this.channelAnalyserL.frequencyBinCount)

      this.channelAnalyserR = this.audioContext.createAnalyser()
      this.channelAnalyserR.fftSize = 2048
      this.channelAnalyserR.smoothingTimeConstant = 0.8
      this.channelSplitter.connect(this.channelAnalyserR, 1)
      this.timeDomainDataR = new Uint8Array(this.channelAnalyserR.frequencyBinCount)

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
    if (this.channelSplitter) {
      this.channelSplitter.disconnect()
      this.channelSplitter = null
    }
    if (this.channelAnalyserL) {
      this.channelAnalyserL.disconnect()
      this.channelAnalyserL = null
    }
    if (this.channelAnalyserR) {
      this.channelAnalyserR.disconnect()
      this.channelAnalyserR = null
    }
    this.analyser = null
    this.timeDomainData = null
    this.frequencyData = null
    this.timeDomainDataL = null
    this.timeDomainDataR = null
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

  /**
   * Desktop audio capture via screen sharing.
   *
   * Always calls getDisplayMedia first → shows native system picker.
   * On Electron, if the stream has no audio track (chromium polyfill gap),
   * falls back to getUserMedia with chromeMediaSource constraint.
   */
  private async getStreamFromDesktopCapturer(): Promise<MediaStream> {
    // Step 1: Show native picker via getDisplayMedia (works in all environments)
    let stream: MediaStream | null = null

    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: true,
      })
    } catch (displayErr) {
      // getDisplayMedia may throw if user cancels or API unavailable
      console.warn('[AudioEngine] getDisplayMedia failed:', displayErr)
      stream = null
    }

    if (!stream) {
      // Step 2: Fallback — getUserMedia with chromeMediaSource (Electron only)
      if (!(window as any).electronAPI?.getDesktopSourceIds) {
        throw new AudioCaptureError(
          'no-sources',
          'No screen sources found. Please grant screen recording permission.'
        )
      }

      console.log('[AudioEngine] getDisplayMedia unavailable, using chromeMediaSource fallback')
      return await this.getStreamFromElectronFallback()
    }

    // Stop video tracks — we only need audio
    stream.getVideoTracks().forEach(track => track.stop())

    let audioTracks = stream.getAudioTracks()

    // Step 3: Electron fallback — getDisplayMedia may omit audio on Windows
    if ((!audioTracks || audioTracks.length === 0) && (window as any).electronAPI?.getDesktopSourceIds) {
      console.log('[AudioEngine] Fallback: getDisplayMedia gave no audio, trying chromeMediaSource')
      try {
        const fallback = await this.getStreamFromElectronFallback()
        const fbTracks = fallback.getAudioTracks()
        if (fbTracks && fbTracks.length > 0) {
          console.log('[AudioEngine] Electron fallback obtained audio track:', fbTracks[0].label)
          // Clean up the original stream
          stream.getTracks().forEach(t => t.stop())
          return fallback
        }
      } catch (fbErr) {
        console.warn('[AudioEngine] Electron fallback failed:', fbErr)
      }
    }

    if (!audioTracks || audioTracks.length === 0) {
      throw new AudioCaptureError(
        'no-audio-track',
        'Desktop capture has no audio track. Enable audio sharing in the system picker.'
      )
    }

    return stream
  }

  /**
   * Electron fallback: getUserMedia with chromeMediaSource constraint.
   * Only reached when getDisplayMedia failed to provide audio.
   * The user already approved screen sharing in getDisplayMedia above.
   */
  private async getStreamFromElectronFallback(): Promise<MediaStream> {
    const electronAPI = (window as any).electronAPI as {
      getDesktopSourceIds: () => Promise<{ id: string; name: string }[]>
    }

    // First, try the standard getUserMedia with audio:true
    // This works if getDisplayMedia was already called and the user granted permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      })
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length > 0) {
        console.log('[AudioEngine] getUserMedia(audio:true) succeeded:', audioTracks[0].label)
        return stream
      }
      stream.getTracks().forEach(t => t.stop())
    } catch (e) {
      console.warn('[AudioEngine] getUserMedia(audio:true) failed:', e)
    }

    // Second: try chromeMediaSource approach via desktopCapturer
    if (!(window as any).electronAPI?.getDesktopSourceIds) {
      throw new AudioCaptureError(
        'no-sources',
        'No screen sources for audio. Please share a screen with audio enabled.'
      )
    }

    try {
      const sources = await electronAPI.getDesktopSourceIds()
      if (!sources || sources.length === 0) {
        throw new AudioCaptureError(
          'no-sources',
          'No screen sources for audio. Please share a screen with audio enabled.'
        )
      }

      // Try chromeMediaSource constraint (Electron-specific)
      const audioConstraints: any = {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      }
      // @ts-expect-error — chromeMediaSource is Electron-specific
      audioConstraints.chromeMediaSource = 'desktop'
      // @ts-expect-error — chromeMediaSourceId is Electron-specific
      audioConstraints.chromeMediaSourceId = sources[0].id

      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length > 0) {
        console.log('[AudioEngine] chromeMediaSource fallback succeeded:', audioTracks[0].label)
        return stream
      }
      stream.getTracks().forEach(t => t.stop())
    } catch (e) {
      console.warn('[AudioEngine] chromeMediaSource fallback failed:', e)
    }

    throw new AudioCaptureError(
      'no-audio-track',
      'Could not capture system audio. Make sure audio sharing is enabled in the system picker.'
    )
  }

  private async getStreamFromBlackHole(): Promise<MediaStream> {
    const blackhole = await this.findBlackHoleDevice()

    if (!blackhole) {
      throw new AudioCaptureError(
        'no-blackhole',
        'BlackHole virtual audio device not found.'
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

    // Read audio data (mono — for frequency/Waveform)
    this.analyser.getByteTimeDomainData(this.timeDomainData)
    this.analyser.getByteFrequencyData(this.frequencyData)

    // Debug: log every 2 seconds
    if (Math.floor(now / 2000) !== Math.floor((this.currentFrame.timestamp || 0) / 2000)) {
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

    const dt = this.currentFrame.timestamp > 0
      ? (now - this.currentFrame.timestamp) / 1000
      : 1 / 60

    // ── Per-channel stereo VU analysis ──
    // Apply gain boost to VU signal so the meter responds more visibly.
    // Desktop audio capture typically produces very low RMS levels.
    const VU_GAIN_DB = 12  // boost by 12 dB

    let leftRms = -100, leftPeak = -100, leftVu = -20, leftPeakHold = -20
    let rightRms = -100, rightPeak = -100, rightVu = -20, rightPeakHold = -20

    if (this.channelAnalyserL && this.timeDomainDataL) {
      this.channelAnalyserL.getByteTimeDomainData(this.timeDomainDataL)
      leftRms = computeRMS(this.timeDomainDataL)
      leftPeak = computePeak(this.timeDomainDataL)
      leftVu = applyVUBallistics(leftRms + VU_GAIN_DB, this.previousLeftVU, dt)
      this.previousLeftVU = leftVu
      const lph = updatePeakHold(leftPeak, this.peakHoldLeft, dt, this.peakHoldTimeL)
      this.peakHoldLeft = lph.value
      this.peakHoldTimeL = lph.holdTime
      leftPeakHold = this.peakHoldLeft
    }

    if (this.channelAnalyserR && this.timeDomainDataR) {
      this.channelAnalyserR.getByteTimeDomainData(this.timeDomainDataR)
      rightRms = computeRMS(this.timeDomainDataR)
      rightPeak = computePeak(this.timeDomainDataR)
      rightVu = applyVUBallistics(rightRms + VU_GAIN_DB, this.previousRightVU, dt)
      this.previousRightVU = rightVu
      const rph = updatePeakHold(rightPeak, this.peakHoldRight, dt, this.peakHoldTimeR)
      this.peakHoldRight = rph.value
      this.peakHoldTimeR = rph.holdTime
      rightPeakHold = this.peakHoldRight
    }

    // Mono-combined (average) for backward compat
    const rms = (leftRms + rightRms) / 2
    const peak = Math.max(leftPeak, rightPeak)
    const vuLevel = (leftVu + rightVu) / 2
    const peakHold = Math.max(this.peakHoldLeft, this.peakHoldRight)

    // ── Original mono path (kept for Waveform / LED) ──
    const vuLevelMono = applyVUBallistics(rms, this.previousVULevel, dt)
    this.previousVULevel = vuLevelMono
    const peakResult = updatePeakHold(peak, this.peakHoldValue, dt, this.peakHoldTime)
    this.peakHoldValue = peakResult.value
    this.peakHoldTime = peakResult.holdTime

    const frequencyBands = computeFrequencyBands(this.frequencyData, this.sampleRate)

    // Build frame
    this.currentFrame = {
      rms,
      peak,
      vuLevel: Math.max(-20, Math.min(3, vuLevelMono)),
      peakHold: this.peakHoldValue,
      frequencyBands,
      waveform: new Float32Array(this.timeDomainData.map(v => ((v - 128) / 128) * 3)),
      timestamp: now,
      leftChannel: {
        vuLevel: Math.max(-20, Math.min(3, leftVu)),
        peakHold: leftPeakHold,
        rms: leftRms,
        peak: leftPeak
      },
      rightChannel: {
        vuLevel: Math.max(-20, Math.min(3, rightVu)),
        peakHold: rightPeakHold,
        rms: rightRms,
        peak: rightPeak
      }
    }

    // Notify
    this.onFrameCallback?.(this.currentFrame)

    this.rafId = requestAnimationFrame(this.tick)
  }
}
