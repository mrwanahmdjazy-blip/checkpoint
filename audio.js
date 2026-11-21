'use strict';

/* =========================================================
   محرك الصوت — كل الأصوات مولّدة برمجياً (WebAudio)
   ========================================================= */
const Sfx = {
  ctx: null,
  master: null,
  muted: false,
  ready: false,
  engine: null,
  ambient: null,

  init() {
    if (this.ready) {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.6;
      this.master.connect(this.ctx.destination);
      this.startAmbient();
      this.ready = true;
    } catch (e) { this.ready = false; }
  },

  setMuted(m) {
    this.muted = !!m;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.6;
  },

  toggle() { this.setMuted(!this.muted); return this.muted; },

  startAmbient() {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * 2.2);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.2;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 360;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    src.connect(lp); lp.connect(g); g.connect(this.master);
    src.start();
    this.ambient = g;
  },

  tone(freq, dur, type, vol, slideTo, delay) {
    if (!this.ready) return;
    try {
      const ctx = this.ctx;
      const t0 = ctx.currentTime + (delay || 0);
      const osc = ctx.createOscillator();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(24, slideTo), t0 + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    } catch (e) { /* ignore */ }
  },

  noise(dur, freq, vol, delay, type) {
    if (!this.ready) return;
    try {
      const ctx = this.ctx;
      const t0 = ctx.currentTime + (delay || 0);
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = type || 'bandpass';
      bp.frequency.value = freq;
      bp.Q.value = 0.9;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol || 0.1, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(bp); bp.connect(g); g.connect(this.master);
      src.start(t0);
    } catch (e) { /* ignore */ }
  },

  /* ---- واجهة ---- */
  click() { this.tone(520, 0.06, 'triangle', 0.07); },

  scan() {
    this.tone(180, 0.5, 'sine', 0.05, 1200);
    this.tone(240, 0.4, 'triangle', 0.03, 900, 0.05);
    this.noise(0.35, 1800, 0.03, 0, 'bandpass');
  },

  clue() {
    this.tone(880, 0.12, 'square', 0.07);
    this.tone(660, 0.14, 'square', 0.07, null, 0.13);
    this.tone(880, 0.18, 'square', 0.06, null, 0.28);
  },

  clean() { this.tone(300, 0.16, 'sine', 0.05, 220); },

  arrestOk() {
    this.noise(0.32, 220, 0.22, 0, 'lowpass');
    this.tone(110, 0.5, 'sine', 0.14, 60);
    this.tone(1046, 0.12, 'triangle', 0.08, null, 0.24);
    this.tone(1568, 0.2, 'triangle', 0.07, null, 0.36);
  },

  arrestBad() {
    this.tone(170, 0.45, 'sawtooth', 0.11, 90);
    this.tone(120, 0.5, 'square', 0.08, 70, 0.12);
    this.noise(0.4, 300, 0.08, 0, 'lowpass');
  },

  passBy() { this.noise(0.5, 900, 0.05, 0, 'highpass'); },

  bribe() {
    this.noise(0.7, 2400, 0.05, 0, 'bandpass');
    this.tone(300, 0.2, 'sine', 0.05, 200, 0.1);
    this.tone(420, 0.18, 'triangle', 0.05, 300, 0.35);
  },

  cash() {
    this.tone(988, 0.09, 'triangle', 0.07);
    this.tone(1319, 0.14, 'triangle', 0.06, null, 0.08);
    this.noise(0.18, 5200, 0.04, 0, 'highpass');
  },

  barrier() {
    this.noise(0.22, 1000, 0.1);
    this.tone(240, 0.18, 'square', 0.04, 160);
  },

  wheelTick() { this.tone(900 + Math.random() * 300, 0.04, 'square', 0.03); },

  fanfare() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.26, 'triangle', 0.08, null, i * 0.13));
  },

  lose() {
    [440, 370, 294, 196].forEach((f, i) => this.tone(f, 0.45, 'sine', 0.1, null, i * 0.22));
    this.tone(90, 1.6, 'sawtooth', 0.06, 60, 0.3);
  },

  /* ---- الأسلحة والخطوات ---- */
  gunshot() {
    this.noise(0.28, 900, 0.34, 0, 'lowpass');
    this.noise(0.12, 3200, 0.16, 0, 'highpass');
    this.tone(90, 0.22, 'square', 0.16, 48);
    this.noise(0.5, 500, 0.06, 0.08, 'bandpass');
  },

  dryFire() { this.tone(1200, 0.04, 'square', 0.05); },

  reload() {
    this.noise(0.09, 1800, 0.09, 0, 'bandpass');
    this.noise(0.09, 1200, 0.08, 0.34, 'bandpass');
    this.tone(320, 0.08, 'square', 0.05, 200, 0.55);
  },

  draw() { this.noise(0.12, 2400, 0.06, 0, 'highpass'); },

  punch() {
    this.noise(0.16, 380, 0.18, 0, 'lowpass');
    this.tone(120, 0.18, 'sine', 0.1, 70);
  },

  step() { this.noise(0.07, 240, 0.035, 0, 'lowpass'); },

  /* ---- محرك السيارة ---- */
  engineStart() {
    if (!this.ready) return;
    this.engineStop(0.05);
    try {
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.055, now + 0.5);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 460;
      const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 44;
      const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 66;
      o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(this.master);
      o1.start(); o2.start();
      o1.frequency.linearRampToValueAtTime(74, now + 0.55);
      o1.frequency.linearRampToValueAtTime(48, now + 1.7);
      o2.frequency.linearRampToValueAtTime(108, now + 0.55);
      o2.frequency.linearRampToValueAtTime(70, now + 1.7);
      this.engine = { g, lp, o1, o2 };
    } catch (e) { /* ignore */ }
  },

  engineIdle() {
    if (!this.engine) return;
    try {
      const ctx = this.ctx;
      const t = ctx.currentTime;
      this.engine.g.gain.cancelScheduledValues(t);
      this.engine.g.gain.linearRampToValueAtTime(0.026, t + 0.4);
      this.engine.o1.frequency.linearRampToValueAtTime(42, t + 0.5);
      this.engine.o2.frequency.linearRampToValueAtTime(63, t + 0.5);
    } catch (e) { /* ignore */ }
  },

  engineRev() {
    if (!this.engine) return;
    try {
      const ctx = this.ctx;
      const t = ctx.currentTime;
      this.engine.g.gain.cancelScheduledValues(t);
      this.engine.g.gain.linearRampToValueAtTime(0.07, t + 0.12);
      this.engine.g.gain.linearRampToValueAtTime(0.0001, t + 1.6);
      this.engine.o1.frequency.cancelScheduledValues(t);
      this.engine.o1.frequency.linearRampToValueAtTime(120, t + 0.6);
      this.engine.o2.frequency.linearRampToValueAtTime(180, t + 0.6);
    } catch (e) { /* ignore */ }
  },

  engineStop(fade) {
    if (!this.engine) return;
    try {
      const ctx = this.ctx;
      const t = ctx.currentTime;
      const f = fade || 0.4;
      this.engine.g.gain.cancelScheduledValues(t);
      this.engine.g.gain.linearRampToValueAtTime(0.0001, t + f);
      this.engine.o1.stop(t + f + 0.05);
      this.engine.o2.stop(t + f + 0.05);
    } catch (e) { /* ignore */ }
    this.engine = null;
  },
};
