/**
 * Sound synthesis and Text-to-Speech utilities using native Web Audio & Web Speech APIs.
 * Zero external audio assets required, guaranteed zero 404s.
 */

class SoundController {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCorrect() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      // Arpeggio E5 -> G#5 -> B5 (Bright Major Chord)
      osc1.frequency.setValueAtTime(659.25, now);
      osc1.frequency.setValueAtTime(830.61, now + 0.08);
      osc1.frequency.setValueAtTime(987.77, now + 0.16);

      osc2.frequency.setValueAtTime(329.63, now);
      osc2.frequency.setValueAtTime(415.30, now + 0.08);
      osc2.frequency.setValueAtTime(493.88, now + 0.16);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } catch {
      // Audio not permitted or unsupported
    }
  }

  playWrong() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Ignore
    }
  }

  playClick() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Ignore
    }
  }

  playFanfare() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime + idx * 0.1;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
      });
    } catch {
      // Ignore
    }
  }
}

export const soundFx = new SoundController();

/**
 * Text-to-Speech wrapper for Indonesian reading passages
 */
export class SpeechReader {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static utterance: SpeechSynthesisUtterance | null = null;
  private static indonesianVoice: SpeechSynthesisVoice | null = null;

  static initVoices(): Promise<SpeechSynthesisVoice | null> {
    return new Promise((resolve) => {
      if (!this.synth) return resolve(null);

      const updateVoice = () => {
        const voices = this.synth!.getVoices();
        // Look for Indonesian voice
        const idVoice = voices.find((v) => v.lang.startsWith('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesian'));
        this.indonesianVoice = idVoice || voices[0] || null;
        resolve(this.indonesianVoice);
      };

      if (this.synth.getVoices().length > 0) {
        updateVoice();
      } else {
        this.synth.onvoiceschanged = updateVoice;
      }
    });
  }

  static speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      onBoundary?: (charIndex: number) => void;
      onEnd?: () => void;
      onError?: () => void;
    }
  ) {
    if (!this.synth) return;

    this.stop();

    const cleanText = text.replace(/[*_#]/g, '');
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = 'id-ID';
    utter.rate = options?.rate ?? 0.95; // Slightly comfortable pace for learning
    utter.pitch = options?.pitch ?? 1.0;

    if (this.indonesianVoice) {
      utter.voice = this.indonesianVoice;
    }

    if (options?.onBoundary) {
      utter.onboundary = (e) => {
        if (e.name === 'word') {
          options.onBoundary!(e.charIndex);
        }
      };
    }

    utter.onend = () => {
      if (options?.onEnd) options.onEnd();
    };

    utter.onerror = () => {
      if (options?.onError) options.onError();
    };

    this.utterance = utter;
    this.synth.speak(utter);
  }

  static pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  static resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  static stop() {
    if (this.synth) {
      this.synth.cancel();
      this.utterance = null;
    }
  }

  static isSpeaking(): boolean {
    return !!this.synth && this.synth.speaking && !this.synth.paused;
  }
}
