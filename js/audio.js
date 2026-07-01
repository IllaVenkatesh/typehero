/**
 * TypeHero - Premium Audio Synthesizer
 * Uses the Web Audio API to deliver subtle, polished feedback for typing.
 * The experience is designed to feel calm, focused, and premium rather than game-like.
 */

class TypeHeroAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.settings = this.getStoredSettings();
    this.enabled = true;
  }

  getDefaultSettings() {
    return {
      theme: 'premium',
      volume: 80,
      intensity: 'soft',
      muted: false
    };
  }

  getStoredSettings() {
    try {
      const fromStorage = window.TypeHeroStorage?.getAudioSettings?.();
      if (fromStorage) {
        return { ...this.getDefaultSettings(), ...fromStorage };
      }
    } catch (err) {
      // Fall back to defaults below.
    }

    try {
      const legacyMuted = localStorage.getItem('typehero_sound_enabled');
      return {
        ...this.getDefaultSettings(),
        muted: legacyMuted === 'false'
      };
    } catch (err) {
      return this.getDefaultSettings();
    }
  }

  init() {
    if (this.ctx) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.getMasterGainValue();
    this.masterGain.connect(this.ctx.destination);
  }

  persistSettings() {
    try {
      window.TypeHeroStorage?.saveAudioSettings?.(this.settings);
    } catch (err) {
      // Ignore persistence errors silently.
    }

    try {
      localStorage.setItem('typehero_sound_enabled', String(!this.settings.muted));
    } catch (err) {
      // Ignore persistence errors silently.
    }
  }

  getSettings() {
    return { ...this.settings };
  }

  setSettings(partial = {}) {
    this.settings = { ...this.settings, ...partial };
    this.persistSettings();

    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.getMasterGainValue(), this.ctx.currentTime, 0.08);
    }
  }

  toggle() {
    this.settings.muted = !this.settings.muted;
    this.persistSettings();
    return this.isEnabled();
  }

  isEnabled() {
    return !this.settings.muted && this.settings.theme !== 'silent' && this.enabled;
  }

  getIntensityMultiplier() {
    if (this.settings.intensity === 'strong') return 1.05;
    if (this.settings.intensity === 'medium') return 0.9;
    return 0.72;
  }

  getThemeProfile() {
    const theme = this.settings.theme || 'premium';
    if (theme === 'minimal') {
      return {
        clickDuration: 0.011,
        spaceDuration: 0.013,
        errorDuration: 0.06,
        successDuration: 0.42,
        gainScale: 0.7
      };
    }

    if (theme === 'mechanical') {
      return {
        clickDuration: 0.018,
        spaceDuration: 0.019,
        errorDuration: 0.075,
        successDuration: 0.55,
        gainScale: 1.08
      };
    }

    return {
      clickDuration: 0.014,
      spaceDuration: 0.016,
      errorDuration: 0.07,
      successDuration: 0.48,
      gainScale: 0.9
    };
  }

  getMasterGainValue() {
    if (!this.isEnabled()) return 0;
    const volumeRatio = (this.settings.volume || 80) / 100;
    const themeGain = this.getThemeProfile().gainScale;
    return volumeRatio * this.getIntensityMultiplier() * themeGain * 0.16;
  }

  ensureAudioContext() {
    this.init();
    if (!this.ctx || !this.masterGain) return null;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  playTone(options = {}) {
    if (!this.isEnabled()) return;

    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const profile = this.getThemeProfile();
    const duration = options.duration ?? profile.clickDuration;
    const gainLevel = (options.gain ?? 0.03) * profile.gainScale * this.getIntensityMultiplier();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = options.type || 'sine';
    osc.frequency.setValueAtTime(options.frequency ?? 780, now);

    if (options.slideTo) {
      osc.frequency.exponentialRampToValueAtTime(options.slideTo, now + (options.slideTime ?? 0.008));
    }

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(gainLevel, now + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  playClick() {
    if (!this.isEnabled()) return;

    const profile = this.getThemeProfile();
    this.playTone({
      type: this.settings.theme === 'mechanical' ? 'triangle' : 'sine',
      frequency: 780,
      slideTo: 640,
      duration: profile.clickDuration,
      gain: 0.028
    });
  }

  playSpace() {
    if (!this.isEnabled()) return;

    const profile = this.getThemeProfile();
    this.playTone({
      type: 'triangle',
      frequency: 360,
      slideTo: 240,
      duration: profile.spaceDuration,
      gain: 0.034
    });
  }

  playError() {
    if (!this.isEnabled()) return;

    const profile = this.getThemeProfile();
    this.playTone({
      type: 'triangle',
      frequency: 180,
      slideTo: 140,
      duration: profile.errorDuration,
      gain: 0.018
    });
  }

  playSuccess() {
    if (!this.isEnabled()) return;

    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const profile = this.getThemeProfile();
    const notes = this.settings.theme === 'minimal'
      ? [440, 587, 740]
      : [523.25, 659.25, 783.99];

    notes.forEach((freq, index) => {
      const noteTime = now + index * 0.055;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gainNode.gain.setValueAtTime(0.0001, noteTime);
      gainNode.gain.linearRampToValueAtTime(0.028 * this.getIntensityMultiplier(), noteTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteTime + profile.successDuration);

      osc.connect(gainNode);
      gainNode.connect(this.masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + profile.successDuration + 0.01);
    });
  }
}

window.TypeHeroAudio = new TypeHeroAudio();
