/**
 * Audio cues using browser-native Web Audio API without any external dependencies or network assets.
 */

class SfxManager {
  private isEnabled = true;
  private listeners: Set<(enabled: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('colpo_basso_sfx_enabled');
      this.isEnabled = stored !== null ? stored === 'true' : true;
    }
  }

  public isSfxEnabled(): boolean {
    return this.isEnabled;
  }

  public toggleSfx(): boolean {
    this.setSfxEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  public setSfxEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('colpo_basso_sfx_enabled', String(enabled));
    }
    this.notifyListeners();
  }

  public subscribe(cb: (enabled: boolean) => void): () => void {
    this.listeners.add(cb);
    cb(this.isEnabled);
    return () => this.listeners.delete(cb);
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this.isEnabled));
  }
}

export const sfxManager = new SfxManager();
export const isSfxEnabled = () => sfxManager.isSfxEnabled();
export const toggleSfx = () => sfxManager.toggleSfx();
export const setSfxEnabled = (enabled: boolean) => sfxManager.setSfxEnabled(enabled);
export const subscribeSfx = (cb: (enabled: boolean) => void) => sfxManager.subscribe(cb);

export function playDrinkSound() {
  if (typeof window === 'undefined' || !isSfxEnabled()) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Upbeat party fanfare
    const freqs = [329.63, 440, 554.37, 659.25];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.12, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.4);
    });
  } catch {
    // Graceful fallback if audio is blocked or unsupported
  }
}

export function playTurnSound() {
  if (typeof window === 'undefined' || !isSfxEnabled()) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Bright double ping
    const freqs = [523.25, 783.99];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.12, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.32);
    });
  } catch {
    // Graceful fallback
  }
}

export function playCardPlaySound() {
  if (typeof window === 'undefined' || !isSfxEnabled()) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Satisfying card snap/slam sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch {
    // Graceful fallback
  }
}

export function playCardDrawSound() {
  if (typeof window === 'undefined' || !isSfxEnabled()) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Light crisp card slide whoosh
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  } catch {
    // Graceful fallback
  }
}

export type SpecialSoundType =
  | 'STOP'
  | 'SKIP'
  | 'REVERSE'
  | 'MIRROR'
  | 'ATTACK'
  | 'SHOCK'
  | 'SHIELD'
  | 'DUEL'
  | 'ROYAL'
  | 'TAX'
  | 'CASCADE';

/**
 * Web Audio synthesized sound effects for special cards and combat events.
 */
export function playSpecialCardSound(type: SpecialSoundType) {
  if (typeof window === 'undefined' || !isSfxEnabled()) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    switch (type) {
      case 'STOP': {
        // Authoritative Titanium Shield Barrier Slam (Punchy body thud + dual harmonic bell chimes)
        // 1. Heavy low body thud
        const bodyOsc = ctx.createOscillator();
        const bodyGain = ctx.createGain();
        bodyOsc.type = 'triangle';
        bodyOsc.frequency.setValueAtTime(160, now);
        bodyOsc.frequency.exponentialRampToValueAtTime(42, now + 0.14);
        bodyGain.gain.setValueAtTime(0.32, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        bodyOsc.connect(bodyGain);
        bodyGain.connect(ctx.destination);
        bodyOsc.start(now);
        bodyOsc.stop(now + 0.2);

        // 2. Resonant metallic shield chime (D5 - 587.33 Hz)
        const chime1 = ctx.createOscillator();
        const chimeGain1 = ctx.createGain();
        chime1.type = 'triangle';
        chime1.frequency.setValueAtTime(587.33, now);
        chimeGain1.gain.setValueAtTime(0.24, now);
        chimeGain1.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        chime1.connect(chimeGain1);
        chimeGain1.connect(ctx.destination);
        chime1.start(now);
        chime1.stop(now + 0.4);

        // 3. High harmonic chime (A5 - 880 Hz)
        const chime2 = ctx.createOscillator();
        const chimeGain2 = ctx.createGain();
        chime2.type = 'sine';
        chime2.frequency.setValueAtTime(880, now);
        chimeGain2.gain.setValueAtTime(0.18, now);
        chimeGain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        chime2.connect(chimeGain2);
        chimeGain2.connect(ctx.destination);
        chime2.start(now);
        chime2.stop(now + 0.35);

        // 4. Crisp transient click (metallic contact "clang")
        const snapOsc = ctx.createOscillator();
        const snapGain = ctx.createGain();
        snapOsc.type = 'square';
        snapOsc.frequency.setValueAtTime(1200, now);
        snapOsc.frequency.exponentialRampToValueAtTime(200, now + 0.035);
        snapGain.gain.setValueAtTime(0.14, now);
        snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        snapOsc.connect(snapGain);
        snapGain.connect(ctx.destination);
        snapOsc.start(now);
        snapOsc.stop(now + 0.045);
        break;
      }
      case 'SKIP': {
        // Futuristic fast-forward warp sweep (⏭️ Salta Turno)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(330, now);
        osc1.frequency.exponentialRampToValueAtTime(660, now + 0.09);
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.14);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(550, now + 0.04);
        osc2.frequency.exponentialRampToValueAtTime(1100, now + 0.15);
        gain2.gain.setValueAtTime(0.2, now + 0.04);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.04);
        osc2.stop(now + 0.2);
        break;
      }
      case 'REVERSE': {
        // Turntable spin-back whoosh
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.11);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.26);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
      case 'MIRROR': {
        // Crystalline sparkle deflect (ascending crystal chimes)
        const freqs = [880, 1320, 1760, 2640];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);
          gain.gain.setValueAtTime(0.14, now + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.24);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.26);
        });
        break;
      }
      case 'ATTACK': {
        // Punchy fireball impact boom
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
      case 'SHOCK': {
        // Electric zap crackle
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(850, now);
        osc.frequency.linearRampToValueAtTime(220, now + 0.04);
        osc.frequency.linearRampToValueAtTime(1050, now + 0.09);
        osc.frequency.linearRampToValueAtTime(160, now + 0.15);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }
      case 'SHIELD': {
        // Metallic gong / shield deflection
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(280, now + 0.24);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.34);
        break;
      }
      case 'DUEL': {
        // Clashing steel swords
        const freqs = [1046, 1568];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.03);
          gain.gain.setValueAtTime(0.18, now + idx * 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.03);
          osc.stop(now + idx * 0.03 + 0.23);
        });
        break;
      }
      case 'ROYAL': {
        // Majestic brass fanfare (C-E-G-C)
        const freqs = [523.25, 659.25, 783.99, 1046.5];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.15, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.26);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.3);
        });
        break;
      }
      case 'TAX': {
        // Comical descending slide whistle
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(720, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.22);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
        break;
      }
      case 'CASCADE': {
        // Tidal cascade crescendo
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(740, now + 0.16);
        gain.gain.setValueAtTime(0.19, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
    }
  } catch {
    // Graceful fallback
  }
}

export type CheersTier = 'DUO' | 'HEAVY' | 'MEGA' | 'EPIC';

/**
 * Realistic "Cin-Cin!" toast sound effect synthesized via Web Audio API.
 * Combines high-Q resonant glass ring tones, heavy mug body impact thuds,
 * and effervescent fizzy beer foam noise bursts tailored to each tier.
 */
export function playCheersSound(tier: CheersTier = 'HEAVY') {
  if (typeof window === 'undefined' || !isSfxEnabled()) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Helper for synthetic effervescent beer foam fizz
    const playFizz = (startTime: number, duration: number, gainVal: number) => {
      try {
        const bufferSize = Math.max(256, Math.floor(ctx.sampleRate * duration));
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3200, startTime);
        filter.Q.setValueAtTime(2.2, startTime);

        const fizzGain = ctx.createGain();
        fizzGain.gain.setValueAtTime(gainVal, startTime);
        fizzGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        whiteNoise.connect(filter);
        filter.connect(fizzGain);
        fizzGain.connect(ctx.destination);

        whiteNoise.start(startTime);
        whiteNoise.stop(startTime + duration);
      } catch {
        // Fallback
      }
    };

    // Helper for resonant beer mug clink (pure glass ping + harmonic overtone + mug base thud)
    const playClink = (startTime: number, freq: number, intensity: number, decayTime: number = 0.45) => {
      // 1. Crystal-clear glass ring
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, startTime);
      gain1.gain.setValueAtTime(intensity, startTime);
      gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + decayTime);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(startTime);
      osc1.stop(startTime + decayTime + 0.05);

      // 2. High harmonic overtone (ringing shimmer)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 1.48, startTime);
      gain2.gain.setValueAtTime(intensity * 0.45, startTime);
      gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + decayTime * 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(startTime);
      osc2.stop(startTime + decayTime * 0.65 + 0.05);

      // 3. Thick glass mug base resonance (low-end clunk)
      const oscThud = ctx.createOscillator();
      const gainThud = ctx.createGain();
      oscThud.type = 'triangle';
      oscThud.frequency.setValueAtTime(360, startTime);
      oscThud.frequency.exponentialRampToValueAtTime(130, startTime + 0.07);
      gainThud.gain.setValueAtTime(intensity * 0.65, startTime);
      gainThud.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.08);
      oscThud.connect(gainThud);
      gainThud.connect(ctx.destination);
      oscThud.start(startTime);
      oscThud.stop(startTime + 0.09);
    };

    switch (tier) {
      case 'DUO': {
        // Playful double clink: "Cin... Cin!" with sparkling fizz
        playClink(now, 2600, 0.22, 0.45);
        playFizz(now + 0.02, 0.28, 0.09);
        playClink(now + 0.13, 2950, 0.24, 0.55);
        playFizz(now + 0.14, 0.38, 0.12);
        break;
      }
      case 'HEAVY': {
        // Solid, punchy 3-4 sips mug collision with energetic foam splash
        playClink(now, 2350, 0.28, 0.52);
        playFizz(now + 0.02, 0.45, 0.15);
        break;
      }
      case 'MEGA': {
        // Powerful resonant 5-9 sips clink + secondary reverberation + heavy foam fountain
        playClink(now, 2150, 0.32, 0.65);
        playFizz(now + 0.01, 0.55, 0.19);
        playClink(now + 0.09, 2750, 0.26, 0.6);
        break;
      }
      case 'EPIC': {
        // Legendary 10+ sips toast: Heavy double clink + triumphant brass fanfare + massive foam explosion
        playClink(now, 2050, 0.36, 0.85);
        playClink(now + 0.1, 2800, 0.32, 0.75);
        playFizz(now + 0.02, 0.75, 0.24);

        // Celebratory triumphant fanfare (C5, E5, G5, C6)
        const fanfareNotes = [523.25, 659.25, 783.99, 1046.5];
        fanfareNotes.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + 0.12 + idx * 0.06);
          gain.gain.setValueAtTime(0.14, now + 0.12 + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12 + idx * 0.06 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + 0.12 + idx * 0.06);
          osc.stop(now + 0.12 + idx * 0.06 + 0.4);
        });
        break;
      }
    }
  } catch {
    // Graceful fallback
  }
}

/**
 * High-voltage lightning zap and reflex alarm cue
 */
export function playReflexAlertSound() {
  if (typeof window === 'undefined' || !isSfxEnabled()) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Siren alarm notes (Fast dual alert)
    const notes = [659.25, 880, 659.25, 1174.66];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.12, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.14);
    });
  } catch {
    // Fallback
  }
}

/**
 * Crisp, lightning-fast high-frequency tap confirmation sound
 */
export function playReflexTapSound() {
  if (typeof window === 'undefined' || !isSfxEnabled()) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(2400, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch {
    // Fallback
  }
}

/**
 * Low buzzer / penalty sound when a player fails the reflex test
 */
export function playReflexFailSound() {
  if (typeof window === 'undefined' || !isSfxEnabled()) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.setValueAtTime(120, now + 0.12);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  } catch {
    // Fallback
  }
}

/**
 * Playful cartoon bottle launch / whoosh sound with cork pop
 */
export function playBottleLaunchSound() {
  if (typeof window === 'undefined' || !isSfxEnabled()) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // 1. Playful ascending whoosh slide (240 -> 640 Hz)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.28);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);

    // 2. Bubbly cork pop harmonic
    const pop = ctx.createOscillator();
    const popGain = ctx.createGain();
    pop.type = 'triangle';
    pop.frequency.setValueAtTime(380, now + 0.04);
    pop.frequency.exponentialRampToValueAtTime(820, now + 0.12);
    popGain.gain.setValueAtTime(0.12, now + 0.04);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    pop.connect(popGain);
    popGain.connect(ctx.destination);
    pop.start(now + 0.04);
    pop.stop(now + 0.2);
  } catch {
    // Fallback
  }
}

