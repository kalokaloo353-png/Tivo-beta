// TIVO Audio Engine: Web Audio API Synthesizer & Sound Effects

class AudioEngine {
  private ctx: AudioContext | null = null;
  private currentTrackId: string | null = null;
  private isPlayingTrack: boolean = false;
  private trackTimer: any = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.isPlayingTrack) {
      this.stopMusicTrack();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Play subtle UI sound effects
  public playSoundEffect(type: 'like' | 'tap' | 'beep' | 'publish' | 'pop') {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === 'like') {
        // High harmonic double pulse
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'pop') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'beep') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'publish') {
        // Major chord arpeggio
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          if (!this.ctx) return;
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'sine';
          o.frequency.value = freq;
          o.connect(g);
          g.connect(this.ctx.destination);
          const t = now + i * 0.08;
          g.gain.setValueAtTime(0.15, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          o.start(t);
          o.stop(t + 0.35);
        });
      }
    } catch {
      // AudioContext safe failover
    }
  }

  // Synthesize rhythmic preview loop for audio tracks in TIVO
  public playMusicTrack(trackId: string, bpm: number = 120, genre: string = 'electro') {
    if (this.isMuted) return;
    this.stopMusicTrack();
    this.initCtx();
    if (!this.ctx) return;

    this.currentTrackId = trackId;
    this.isPlayingTrack = true;

    let step = 0;
    const interval = (60 / bpm) * 1000 / 2; // 8th notes

    const notes = genre === 'phonk'
      ? [110, 130.81, 146.83, 110, 164.81, 146.83]
      : genre === 'lofi'
      ? [220, 261.63, 329.63, 293.66, 246.94]
      : [130.81, 164.81, 196.00, 261.63, 196.00];

    const playBeat = () => {
      if (!this.isPlayingTrack || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;

        // Kick drum on beats 0, 4
        if (step % 4 === 0) {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.connect(kickGain);
          kickGain.connect(this.ctx.destination);

          kickOsc.frequency.setValueAtTime(140, now);
          kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
          kickGain.gain.setValueAtTime(0.3, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

          kickOsc.start(now);
          kickOsc.stop(now + 0.2);
        }

        // Snare / clap on beats 2, 6
        if (step % 4 === 2) {
          const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < noiseBuffer.length; i++) {
            output[i] = Math.random() * 2 - 1;
          }
          const whiteNoise = this.ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;
          const noiseGain = this.ctx.createGain();
          noiseGain.gain.setValueAtTime(0.09, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          whiteNoise.connect(noiseGain);
          noiseGain.connect(this.ctx.destination);
          whiteNoise.start(now);
        }

        // Melodic bass note
        const noteFreq = notes[step % notes.length];
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = genre === 'phonk' ? 'sawtooth' : 'triangle';
        bassOsc.frequency.setValueAtTime(noteFreq, now);

        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);

        bassGain.gain.setValueAtTime(0.08, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        bassOsc.start(now);
        bassOsc.stop(now + 0.25);

        step++;
        this.trackTimer = setTimeout(playBeat, interval);
      } catch {
        // Safe context fail
      }
    };

    playBeat();
  }

  public stopMusicTrack() {
    this.isPlayingTrack = false;
    this.currentTrackId = null;
    if (this.trackTimer) {
      clearTimeout(this.trackTimer);
      this.trackTimer = null;
    }
  }

  public getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }
}

export const audioEngine = new AudioEngine();
