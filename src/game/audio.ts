import { store } from "./save.ts";

type Theme = "grove" | "orchard" | "hollow";

const C = 261.63;
const D = 293.66;
const E = 329.63;
const F = 349.23;
const G = 392.0;
const A = 440.0;

const THEMES: Record<Theme, { bpm: number; bass: number[]; lead: number[] }> = {
  grove: {
    bpm: 132,
    bass: [C / 2, G / 2, A / 2, F / 2, C / 2, G / 2, E / 2, G / 2],
    lead: [E, G, C * 2, G, E, D, C, G / 1, E, G, A, G, E, C, D, E],
  },
  orchard: {
    bpm: 118,
    bass: [F / 2, C / 2, D / 2, A / 2, F / 2, C / 2, G / 2, C / 2],
    lead: [A, F, G, A, C * 2, A, G, F, A, G, F, E, D, F, G, A],
  },
  hollow: {
    bpm: 108,
    bass: [A / 2, E / 2, F / 2, C / 2, A / 2, E / 2, G / 2, E / 2],
    lead: [A, E, F, E, C, E, A / 1, E, A, G, F, E, D, E, F, E],
  },
};

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private timer = 0;
  private step = 0;
  private theme: Theme = "grove";
  private playing = false;
  unlocked = false;

  unlock(): void {
    if (!this.ctx) {
      const ctx = new AudioContext();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.musicGain = ctx.createGain();
      this.sfxGain = ctx.createGain();
      this.musicGain.connect(this.master);
      this.sfxGain.connect(this.master);
      this.master.connect(ctx.destination);
    }
    void this.ctx.resume();
    this.unlocked = true;
    this.applyVolumes();
  }

  applyVolumes(): void {
    if (!this.musicGain || !this.sfxGain) return;
    this.musicGain.gain.value = store.data.music;
    this.sfxGain.gain.value = store.data.sfx;
  }

  startTheme(theme: Theme): void {
    this.theme = theme;
    this.step = 0;
    if (!this.unlocked) return;
    this.playing = true;
    this.tick();
  }

  stopMusic(): void {
    this.playing = false;
    if (this.timer) window.clearTimeout(this.timer);
  }

  private tick = (): void => {
    if (!this.playing || !this.ctx || !this.musicGain) return;
    const t = THEMES[this.theme];
    const beat = 60 / t.bpm;
    const now = this.ctx.currentTime;
    const bass = t.bass[this.step % t.bass.length] ?? C / 2;
    const lead = t.lead[this.step % t.lead.length] ?? E;
    this.tone(this.musicGain, bass, "triangle", now, beat * 0.92, 0.07);
    if (this.step % 2 === 0) {
      this.tone(this.musicGain, lead, "square", now, beat * 0.55, 0.035);
    }
    if (this.step % 2 === 1) {
      this.noise(this.musicGain, now, 0.035, 0.03, 1800);
    }
    this.step += 1;
    this.timer = window.setTimeout(this.tick, beat * 1000);
  };

  private tone(
    dest: GainNode,
    freq: number,
    type: OscillatorType,
    when: number,
    dur: number,
    gain: number,
  ): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  private noise(dest: GainNode, when: number, dur: number, gain: number, cutoff: number): void {
    if (!this.ctx) return;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = cutoff;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    src.start(when);
  }

  private sfxDest(): GainNode | null {
    return this.sfxGain;
  }

  click(): void {
    if (!this.ctx || !this.sfxDest()) return;
    this.tone(this.sfxDest()!, 820, "square", this.ctx.currentTime, 0.05, 0.06);
  }

  buy(): void {
    if (!this.ctx || !this.sfxDest()) return;
    const t = this.ctx.currentTime;
    this.tone(this.sfxDest()!, C * 2, "square", t, 0.07, 0.06);
    this.tone(this.sfxDest()!, E * 2, "square", t + 0.07, 0.07, 0.06);
    this.tone(this.sfxDest()!, G * 2, "square", t + 0.14, 0.12, 0.07);
  }

  deny(): void {
    if (!this.ctx || !this.sfxDest()) return;
    this.tone(this.sfxDest()!, 140, "sawtooth", this.ctx.currentTime, 0.14, 0.05);
  }

  stomp(): void {
    if (!this.ctx || !this.sfxDest()) return;
    const t = this.ctx.currentTime;
    this.noise(this.sfxDest()!, t, 0.08, 0.12, 400);
    this.tone(this.sfxDest()!, 180, "triangle", t, 0.09, 0.08);
  }

  hit(): void {
    if (!this.ctx || !this.sfxDest()) return;
    this.noise(this.sfxDest()!, this.ctx.currentTime, 0.06, 0.1, 700);
  }

  hurt(): void {
    if (!this.ctx || !this.sfxDest()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.16);
    g.gain.setValueAtTime(0.07, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(g);
    g.connect(this.sfxDest()!);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  knockdown(): void {
    if (!this.ctx || !this.sfxDest()) return;
    const t = this.ctx.currentTime;
    this.noise(this.sfxDest()!, t, 0.18, 0.14, 200);
    this.tone(this.sfxDest()!, 220, "square", t, 0.12, 0.07);
    this.tone(this.sfxDest()!, 110, "square", t + 0.1, 0.18, 0.07);
  }

  fruit(): void {
    if (!this.ctx || !this.sfxDest()) return;
    const t = this.ctx.currentTime;
    this.tone(this.sfxDest()!, 880, "triangle", t, 0.06, 0.06);
    this.tone(this.sfxDest()!, 1174, "triangle", t + 0.05, 0.08, 0.05);
  }

  crate(): void {
    if (!this.ctx || !this.sfxDest()) return;
    this.noise(this.sfxDest()!, this.ctx.currentTime, 0.1, 0.14, 300);
    this.tone(this.sfxDest()!, 90, "triangle", this.ctx.currentTime, 0.08, 0.06);
  }

  coin(): void {
    if (!this.ctx || !this.sfxDest()) return;
    const t = this.ctx.currentTime;
    this.tone(this.sfxDest()!, 988, "square", t, 0.05, 0.05);
    this.tone(this.sfxDest()!, 1318, "square", t + 0.05, 0.08, 0.05);
  }

  stripe(): void {
    if (!this.ctx || !this.sfxDest()) return;
    const t = this.ctx.currentTime;
    this.tone(this.sfxDest()!, C * 2, "square", t, 0.1, 0.07);
    this.tone(this.sfxDest()!, E * 2, "square", t + 0.1, 0.1, 0.07);
    this.tone(this.sfxDest()!, G * 2, "square", t + 0.2, 0.1, 0.07);
    this.tone(this.sfxDest()!, C * 4, "triangle", t + 0.3, 0.22, 0.08);
  }
}

export const audio = new AudioEngine();
