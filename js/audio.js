/**
 * TypeHero - Redesigned SaaS Audio Engine
 * Uses Web Audio API to synthesize elegant, non-distracting audio feedback.
 * Includes multiple themes, global volume control, and key intensity modifiers.
 */

class TypeHeroAudio {
  constructor() {
    this.ctx = null;
    this.masterGainNode = null;
    
    // Load composite settings if available, fallback to individual keys
    const compositeRaw = localStorage.getItem('typehero_audio_settings');
    if (compositeRaw) {
      try {
        const composite = JSON.parse(compositeRaw);
        this.theme = composite.theme || 'premium';
        this.volume = parseInt(composite.volume ?? '50', 10);
        this.intensity = composite.intensity || 'medium';
        this.muted = composite.muted === true;
        return;
      } catch (e) {
        // Fallback
      }
    }
    
    this.theme = localStorage.getItem('typehero_audio_theme') || 'premium';
    this.volume = parseInt(localStorage.getItem('typehero_audio_volume') ?? '50', 10);
    this.intensity = localStorage.getItem('typehero_audio_intensity') || 'medium';
    this.muted = localStorage.getItem('typehero_audio_muted') === 'true';
  }

  init() {
    if (this.ctx) return;
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.connect(this.ctx.destination);
      this.updateVolume();
    }
  }

  updateVolume() {
    if (!this.ctx || !this.masterGainNode) return;
    
    const targetGain = this.muted ? 0 : (this.volume / 100);
    // Smooth volume transition to prevent sudden audio pops
    this.masterGainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.01);
  }

  setTheme(theme) {
    this.theme = theme;
    localStorage.setItem('typehero_audio_theme', theme);
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(100, volume));
    localStorage.setItem('typehero_audio_volume', this.volume.toString());
    this.updateVolume();
  }

  setIntensity(intensity) {
    this.intensity = intensity;
    localStorage.setItem('typehero_audio_intensity', intensity);
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('typehero_audio_muted', this.muted.toString());
    this.updateVolume();
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  toggle() {
    this.muted = !this.muted;
    localStorage.setItem('typehero_audio_muted', this.muted.toString());
    localStorage.setItem('typehero_audio_settings', JSON.stringify({
      theme: this.theme,
      volume: this.volume,
      intensity: this.intensity,
      muted: this.muted
    }));
    this.updateVolume();
    return !this.muted;
  }

  isEnabled() {
    return !this.muted;
  }

  getSettings() {
    return {
      theme: this.theme,
      volume: this.volume,
      intensity: this.intensity
    };
  }

  setSettings(opts) {
    if (opts.theme !== undefined) {
      this.theme = opts.theme;
      localStorage.setItem('typehero_audio_theme', this.theme);
    }
    if (opts.volume !== undefined) {
      this.volume = Math.max(0, Math.min(100, opts.volume));
      localStorage.setItem('typehero_audio_volume', this.volume.toString());
      this.updateVolume();
    }
    if (opts.intensity !== undefined) {
      this.intensity = opts.intensity;
      localStorage.setItem('typehero_audio_intensity', this.intensity);
    }
    
    // Save aggregate settings object
    localStorage.setItem('typehero_audio_settings', JSON.stringify({
      theme: this.theme,
      volume: this.volume,
      intensity: this.intensity,
      muted: this.muted
    }));

    if (window.TypeHeroStorage) {
      window.TypeHeroStorage.saveAudioSettings({
        theme: this.theme,
        volume: this.volume,
        intensity: this.intensity,
        muted: this.muted
      });
    }
  }

  getIntensityFactor() {
    switch (this.intensity) {
      case 'soft': return 0.65;
      case 'strong': return 1.4;
      case 'medium':
      default: return 1.0;
    }
  }

  // --------------------------------------------------------------------------
  // Synthesizers
  // --------------------------------------------------------------------------

  playClick() {
    if (this.theme === 'silent') return;
    this.init();
    if (!this.ctx || !this.masterGainNode) return;
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const intensity = this.getIntensityFactor();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGainNode);

    switch (this.theme) {
      case 'minimal':
        // Subconscious, very short triangle blip
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(850, now);
        
        gain.gain.setValueAtTime(0.04 * intensity, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);
        
        osc.start(now);
        osc.stop(now + 0.012);
        break;

      case 'mechanical':
        // Retro mechanical click emulation
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1100, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);
        
        // High frequency switch-bounce transient
        const clickNoise = this.ctx.createOscillator();
        const noiseGain = this.ctx.createGain();
        clickNoise.type = 'triangle';
        clickNoise.frequency.setValueAtTime(4500, now);
        
        noiseGain.gain.setValueAtTime(0.015 * intensity, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.005);
        
        clickNoise.connect(noiseGain);
        noiseGain.connect(this.masterGainNode);
        
        gain.gain.setValueAtTime(0.08 * intensity, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        
        clickNoise.start(now);
        clickNoise.stop(now + 0.006);
        
        osc.start(now);
        osc.stop(now + 0.05);
        break;

      case 'premium':
      default:
        // Elegant, soft sine wave SaaS tick
        osc.type = 'sine';
        // Gentle downward pitch glide for organic feeling
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.015);
        
        gain.gain.setValueAtTime(0.06 * intensity, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
        
        osc.start(now);
        osc.stop(now + 0.018);
        break;
    }
  }

  playSpace() {
    if (this.theme === 'silent') return;
    this.init();
    if (!this.ctx || !this.masterGainNode) return;
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const intensity = this.getIntensityFactor();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGainNode);

    switch (this.theme) {
      case 'minimal':
        // Soft deep triangle tick
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        
        gain.gain.setValueAtTime(0.06 * intensity, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
        
        osc.start(now);
        osc.stop(now + 0.018);
        break;

      case 'mechanical':
        // Deeper mechanical spacebar thud
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.07);
        
        gain.gain.setValueAtTime(0.12 * intensity, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        
        osc.start(now);
        osc.stop(now + 0.09);
        break;

      case 'premium':
      default:
        // Deeper, smooth sine click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.022);
        
        gain.gain.setValueAtTime(0.08 * intensity, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);
        
        osc.start(now);
        osc.stop(now + 0.025);
        break;
    }
  }

  playError() {
    if (this.theme === 'silent') return;
    this.init();
    if (!this.ctx || !this.masterGainNode) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGainNode);

    switch (this.theme) {
      case 'minimal':
        // Short micro low-frequency blip
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        
        osc.start(now);
        osc.stop(now + 0.045);
        break;

      case 'mechanical':
        // Discordant retro sawtooth buzz
        const osc2 = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc2.type = 'sawtooth';
        
        osc.frequency.setValueAtTime(130, now);
        osc2.frequency.setValueAtTime(135, now);
        
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        
        osc2.connect(gain);
        
        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.15);
        osc2.stop(now + 0.15);
        break;

      case 'premium':
      default:
        // Elegant soft muted pop (no buzz, helpful feedback)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.065);
        
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        
        osc.start(now);
        osc.stop(now + 0.075);
        break;
    }
  }

  playSuccess() {
    if (this.theme === 'silent') return;
    this.init();
    if (!this.ctx || !this.masterGainNode) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;

    switch (this.theme) {
      case 'minimal':
        // Two modern harmonic notes simultaneously (A5 and E6)
        const minNotes = [880.00, 1318.51];
        minNotes.forEach(freq => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          
          osc.connect(gain);
          gain.connect(this.masterGainNode);
          
          osc.start(now);
          osc.stop(now + 0.3);
        });
        break;

      case 'mechanical':
        // Retro slide + type bell sound
        const slideOsc = this.ctx.createOscillator();
        const slideGain = this.ctx.createGain();
        slideOsc.type = 'sine';
        slideOsc.frequency.setValueAtTime(350, now);
        slideOsc.frequency.linearRampToValueAtTime(800, now + 0.2);
        
        slideGain.gain.setValueAtTime(0, now);
        slideGain.gain.linearRampToValueAtTime(0.04, now + 0.05);
        slideGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        slideOsc.connect(slideGain);
        slideGain.connect(this.masterGainNode);
        
        slideOsc.start(now);
        slideOsc.stop(now + 0.28);

        // Retro Bell ring
        const bellTime = now + 0.25;
        const bellOsc1 = this.ctx.createOscillator();
        const bellOsc2 = this.ctx.createOscillator();
        const bellGain = this.ctx.createGain();
        
        bellOsc1.type = 'sine';
        bellOsc2.type = 'sine';
        bellOsc1.frequency.setValueAtTime(2200, bellTime);
        bellOsc2.frequency.setValueAtTime(2220, bellTime);
        
        bellGain.gain.setValueAtTime(0, bellTime);
        bellGain.gain.linearRampToValueAtTime(0.12, bellTime + 0.01);
        bellGain.gain.exponentialRampToValueAtTime(0.001, bellTime + 0.35);
        
        bellOsc1.connect(bellGain);
        bellOsc2.connect(bellGain);
        bellGain.connect(this.masterGainNode);
        
        bellOsc1.start(bellTime);
        bellOsc2.start(bellTime);
        bellOsc1.stop(bellTime + 0.4);
        bellOsc2.stop(bellTime + 0.4);
        break;

      case 'premium':
      default:
        // Beautiful glass-like 3-note ascending arpeggio (C-Major 9th notes: E5, G5, D6)
        const notes = [659.25, 783.99, 1174.66]; // E5, G5, D6
        
        notes.forEach((freq, index) => {
          const noteTime = now + (index * 0.075);
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteTime);
          
          // Slow rise (attack) and gentle decay
          gain.gain.setValueAtTime(0, noteTime);
          gain.gain.linearRampToValueAtTime(0.07, noteTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.65);
          
          osc.connect(gain);
          gain.connect(this.masterGainNode);
          
          osc.start(noteTime);
          osc.stop(noteTime + 0.7);
        });
        break;
    }
  }
}

// Export singleton
window.TypeHeroAudio = new TypeHeroAudio();
