/**
 * Cyber-Lounge Background Music Engine for "Colpo Basso: Faida di Semi"
 * Procedural Web Audio API synthesizer — 100% asset-free, zero downloads, zero lag, infinite loop.
 */

class BackgroundMusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private isEnabled = false;
  private volume = 0.22; // Comfortable, non-intrusive level
  private current16thNote = 0;
  private nextNoteTime = 0.0;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(enabled: boolean) => void> = new Set();
  private userInteractionBound = false;

  private readonly BPM = 110;
  private readonly scheduleAheadTime = 0.25; // seconds
  private readonly lookaheadInterval = 40; // ms

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('colpo_basso_music_enabled');
      // Default to true on first visit or respect saved preference
      this.isEnabled = stored !== null ? stored === 'true' : true;
      const storedVol = localStorage.getItem('colpo_basso_music_vol');
      if (storedVol) {
        const v = parseFloat(storedVol);
        if (!isNaN(v) && v >= 0 && v <= 1) this.volume = v;
      }
      this.setupAutoResume();
    }
  }

  private initAudio() {
    if (this.ctx) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isEnabled ? this.volume : 0;
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // AudioContext not supported
    }
  }

  private setupAutoResume() {
    if (typeof window === 'undefined' || this.userInteractionBound) return;
    this.userInteractionBound = true;

    const handleFirstGesture = () => {
      this.initAudio();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (this.isEnabled && !this.isPlaying) {
        this.startLoop();
      }
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true });
  }

  public isMusicEnabled(): boolean {
    return this.isEnabled;
  }

  public toggleMusic(): boolean {
    this.setEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('colpo_basso_music_enabled', String(enabled));
    }

    this.initAudio();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(enabled ? this.volume : 0, now + 0.15);
    }

    if (enabled) {
      if (!this.isPlaying) {
        this.startLoop();
      }
    }

    this.notifyListeners();
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      localStorage.setItem('colpo_basso_music_vol', String(this.volume));
    }
    if (this.masterGain && this.ctx && this.isEnabled) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(this.volume, now, 0.05);
    }
  }

  public subscribe(cb: (enabled: boolean) => void): () => void {
    this.listeners.add(cb);
    cb(this.isEnabled);
    return () => this.listeners.delete(cb);
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this.isEnabled));
  }

  public start() {
    if (!this.isEnabled) return;
    this.initAudio();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.isPlaying) {
      this.startLoop();
    }
  }

  private startLoop() {
    if (!this.ctx || !this.masterGain) return;
    this.isPlaying = true;
    this.current16thNote = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.scheduler();
    }, this.lookaheadInterval);
  }

  public stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isPlaying = false;
  }

  private scheduler() {
    if (!this.ctx || !this.masterGain) return;
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.current16thNote, this.nextNoteTime);
      this.advanceNote();
    }
  }

  private advanceNote() {
    const secondsPerBeat = 60.0 / this.BPM;
    this.nextNoteTime += 0.25 * secondsPerBeat; // 16th note
    this.current16thNote = (this.current16thNote + 1) % 128; // 8 bars (16 * 8)
  }

  /* ---------------- Procedural Synth Instruments ---------------- */

  // Chord Progression across 8 bars:
  // Bar 0: Am7  (A2 root)
  // Bar 1: Fmaj7 (F2 root)
  // Bar 2: Dm7   (D2 root)
  // Bar 3: Em7   (E2 root)
  // Bar 4: Am9   (A2 root)
  // Bar 5: Fmaj7#11 (F2 root)
  // Bar 6: Dm9   (D2 root)
  // Bar 7: E7alt (E2 root)
  private readonly ROOT_NOTES = [
    55, // A1 / A2 (110Hz)
    43.65, // F1 (87.3Hz)
    73.42, // D2
    82.41, // E2
    55, // A1
    43.65, // F1
    73.42, // D2
    82.41, // E2
  ];

  private readonly CHORDS = [
    [220, 261.63, 329.63, 392], // Am7 (A3, C4, E4, G4)
    [174.61, 220, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
    [146.83, 174.61, 220, 261.63], // Dm7 (D3, F3, A3, C4)
    [164.81, 196, 246.94, 293.66], // Em7 (E3, G3, B3, D4)
    [220, 261.63, 329.63, 392, 493.88], // Am9
    [174.61, 220, 246.94, 329.63], // Fmaj7#11 (F, A, B, E)
    [146.83, 174.61, 220, 261.63, 329.63], // Dm9
    [164.81, 207.65, 293.66, 369.99], // E7alt (E3, G#3, D4, F#4)
  ];

  private readonly MELODY_STEPS: Record<number, number> = {
    // Sparse, elegant cyber-bells
    0: 659.25, // E5
    4: 783.99, // G5
    8: 880.0, // A5
    16: 523.25, // C5
    20: 659.25, // E5
    26: 783.99, // G5
    32: 698.46, // F5
    36: 880.0, // A5
    42: 1046.5, // C6
    48: 987.77, // B5
    52: 783.99, // G5
    58: 659.25, // E5
    64: 1046.5, // C6
    68: 987.77, // B5
    74: 880.0, // A5
    80: 659.25, // E5
    86: 987.77, // B5
    96: 698.46, // F5
    100: 1046.5, // C6
    106: 1174.66, // D6
    112: 1318.51, // E6
    116: 1174.66, // D6
    120: 987.77, // B5
    124: 830.61, // G#5
  };

  private scheduleNote(step: number, time: number) {
    if (!this.ctx || !this.masterGain) return;

    const bar = Math.floor(step / 16);
    const stepInBar = step % 16;
    const rootFreq = this.ROOT_NOTES[bar];
    const chordFreqs = this.CHORDS[bar];

    // 1. GROOVY BASSLINE (Warm synth bass with snappy lowpass filter)
    if (stepInBar === 0) {
      this.playBass(rootFreq, time, 0.35);
    } else if (stepInBar === 4) {
      this.playBass(rootFreq * 1.5, time, 0.2); // Fifth
    } else if (stepInBar === 6) {
      this.playBass(rootFreq, time, 0.18);
    } else if (stepInBar === 10) {
      this.playBass(rootFreq * 2, time, 0.22); // Octave
    } else if (stepInBar === 14) {
      this.playBass(rootFreq * 1.33, time, 0.16); // Passing 4th
    }

    // 2. CHORD STABS (Rhodes-like warm mellow keyboard)
    if (stepInBar === 2 || stepInBar === 8 || stepInBar === 11) {
      this.playChord(chordFreqs, time, stepInBar === 2 ? 0.4 : 0.25);
    }

    // 3. LEAD CHIME / MELODY (Gentle crystalline vibes)
    if (this.MELODY_STEPS[step]) {
      this.playChime(this.MELODY_STEPS[step], time);
    }

    // 4. DRUMS (Subtle chillhop/arcade rhythm)
    // Kick on beat 1 (step 0), beat 3 (step 8), and offbeat swing (step 10)
    if (stepInBar === 0 || stepInBar === 8) {
      this.playKick(time, 0.22);
    } else if (stepInBar === 10 && bar % 2 === 1) {
      this.playKick(time, 0.14);
    }

    // Snare/Rimshot on beat 2 (step 4) and beat 4 (step 12)
    if (stepInBar === 4 || stepInBar === 12) {
      this.playSnare(time);
    }

    // Hi-hat on every 8th note (even steps) with swing
    if (stepInBar % 2 === 0) {
      const isAccent = stepInBar % 4 === 0;
      this.playHiHat(time, isAccent ? 0.04 : 0.02);
    }
  }

  private playBass(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(360, time);
    filter.frequency.exponentialRampToValueAtTime(140, time + duration);

    gain.gain.setValueAtTime(0.24, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  private playChord(freqs: number[], time: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const filter = this.ctx!.createBiquadFilter();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time + idx * 0.008); // micro strum

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, time);

      const amp = 0.05 / freqs.length;
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(amp, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + duration + 0.05);
    });
  }

  private playChime(freq: number, time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.045, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.4);
  }

  private playKick(time: number, vol = 0.2) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.1);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.14);
  }

  private playSnare(time: number) {
    if (!this.ctx || !this.masterGain) return;
    // Layer 1: soft tone thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(175, time);
    oscGain.gain.setValueAtTime(0.07, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.09);

    // Layer 2: White noise snap
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, time);
    filter.Q.setValueAtTime(1.2, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.09);
  }

  private playHiHat(time: number, vol = 0.03) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.05);
  }
}

// Global singleton instance
export const backgroundMusic = new BackgroundMusicEngine();
