/**
 * Haptic Vibration Feedback for Mobile Smartphones using navigator.vibrate
 * Provides tactile feedback when it's your turn, when struck by attacks, or taking sips.
 */

class HapticManager {
  private isEnabled = true;
  private listeners: Set<(enabled: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('colpo_basso_haptic_enabled');
      this.isEnabled = stored !== null ? stored === 'true' : true;
    }
  }

  public isHapticEnabled(): boolean {
    return this.isEnabled;
  }

  public toggleHaptic(): boolean {
    this.setHapticEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  public setHapticEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('colpo_basso_haptic_enabled', String(enabled));
    }
    this.listeners.forEach((cb) => cb(this.isEnabled));
  }

  public subscribe(cb: (enabled: boolean) => void): () => void {
    this.listeners.add(cb);
    cb(this.isEnabled);
    return () => this.listeners.delete(cb);
  }

  /**
   * Triggers a specific vibration pattern on supported mobile devices
   */
  public trigger(type: 'turn' | 'attack' | 'defense' | 'drink' | 'tap') {
    if (!this.isEnabled) return;
    if (typeof window === 'undefined' || !('vibrate' in navigator)) return;

    try {
      switch (type) {
        case 'turn':
          // Light subtle pulse: Tocca a te!
          navigator.vibrate([40, 30, 40]);
          break;
        case 'attack':
          // Sharp heavy hit: Colpo secco quando vieni attaccato o contrattaccato!
          navigator.vibrate([110, 40, 110]);
          break;
        case 'defense':
          // Solid confirmation clack: Parata / Scudo
          navigator.vibrate([60]);
          break;
        case 'drink':
          // Bubbling penalty pulse: Momento Sorso
          navigator.vibrate([60, 40, 60, 40, 90]);
          break;
        case 'tap':
          // Micro-pulse: feedback tocco
          navigator.vibrate(20);
          break;
      }
    } catch {
      // Graceful fallback for unsupported browsers
    }
  }
}

export const hapticManager = new HapticManager();
export const isHapticEnabled = () => hapticManager.isHapticEnabled();
export const toggleHaptic = () => hapticManager.toggleHaptic();
export const triggerHapticFeedback = (
  type: 'turn' | 'attack' | 'defense' | 'drink' | 'tap'
) => hapticManager.trigger(type);
