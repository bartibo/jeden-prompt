'use strict';
/* Dźwięk syntezowany na żywo przez Web Audio: dudnienie, trzaski, szkło, syrena, fala tsunami. */

const Sound = {
  ctx: null,
  enabled: true,
  master: null,
  lastCrash: 0,
  lastGlass: 0,
  lastCreak: 0,

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain();
    this.master.gain.value = this.enabled ? 0.9 : 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 5;
    this.master.connect(comp);
    comp.connect(ctx.destination);

    // Bufory szumu: brązowy (dudnienie) i biały (trzaski, szkło)
    const len = ctx.sampleRate * 4;
    this.brown = ctx.createBuffer(1, len, ctx.sampleRate);
    this.white = ctx.createBuffer(1, len, ctx.sampleRate);
    const b = this.brown.getChannelData(0), w = this.white.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const r = Math.random() * 2 - 1;
      w[i] = r;
      last = (last + 0.02 * r) / 1.02;
      b[i] = last * 3.5;
    }

    // Stałe dudnienie (głośność sterowana siłą drgań)
    const mk = (buf, type, f, q, g) => {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const fl = ctx.createBiquadFilter();
      fl.type = type;
      fl.frequency.value = f;
      fl.Q.value = q;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(fl);
      fl.connect(gain);
      gain.connect(this.master);
      src.start();
      return { gain, fl, max: g };
    };
    this.rumbleLow = mk(this.brown, 'lowpass', 85, 0.7, 1.6);
    this.rumbleMid = mk(this.brown, 'bandpass', 220, 0.8, 0.9);
    this.rattle = mk(this.white, 'bandpass', 1800, 1.4, 0.07);
    this.waterRoar = mk(this.white, 'bandpass', 420, 0.5, 0.55);
    this.fireCrackle = mk(this.white, 'highpass', 2500, 0.7, 0.04);

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 31;
    this.subGain = ctx.createGain();
    this.subGain.gain.value = 0;
    sub.connect(this.subGain);
    this.subGain.connect(this.master);
    sub.start();
    this.sub = sub;

    // Syrena alarmowa (dwa oscylatory)
    this.sirenGain = ctx.createGain();
    this.sirenGain.gain.value = 0;
    this.sirenGain.connect(this.master);
    this.siren = ctx.createOscillator();
    this.siren.type = 'sawtooth';
    this.siren.frequency.value = 420;
    const sf = ctx.createBiquadFilter();
    sf.type = 'lowpass';
    sf.frequency.value = 1400;
    this.siren.connect(sf);
    sf.connect(this.sirenGain);
    this.siren.start();
    this.sirenOn = false;
  },

  setEnabled(on) {
    this.enabled = on;
    if (this.master) this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05);
  },

  /* level 0..1 – siła drgań; hf 0..1 – udział wysokich częstotliwości */
  setShake(level, hf) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const l = Math.min(1, level);
    this.rumbleLow.gain.gain.setTargetAtTime(l * this.rumbleLow.max, t, 0.08);
    this.rumbleMid.gain.gain.setTargetAtTime(Math.pow(l, 1.4) * this.rumbleMid.max, t, 0.08);
    this.rumbleMid.fl.frequency.setTargetAtTime(160 + hf * 260, t, 0.2);
    this.rattle.gain.gain.setTargetAtTime(Math.pow(l, 1.2) * this.rattle.max * (0.4 + hf), t, 0.05);
    this.subGain.gain.setTargetAtTime(Math.pow(l, 0.8) * 0.5, t, 0.1);
    this.sub.frequency.setTargetAtTime(26 + l * 12, t, 0.3);
  },

  setWater(level) {
    if (!this.ctx) return;
    this.waterRoar.gain.gain.setTargetAtTime(Math.min(1, level) * this.waterRoar.max, this.ctx.currentTime, 0.3);
  },

  setFire(level) {
    if (!this.ctx) return;
    this.fireCrackle.gain.gain.setTargetAtTime(Math.min(1, level) * this.fireCrackle.max, this.ctx.currentTime, 0.4);
  },

  setSiren(on) {
    if (!this.ctx || on === this.sirenOn) return;
    this.sirenOn = on;
    const t = this.ctx.currentTime;
    this.sirenGain.gain.setTargetAtTime(on ? 0.07 : 0, t, 0.6);
  },

  update(time) {
    if (!this.ctx || !this.sirenOn) return;
    const f = 520 + 260 * Math.sin(time * 0.9);
    this.siren.frequency.setTargetAtTime(f, this.ctx.currentTime, 0.05);
  },

  _pan(p) {
    if (this.ctx.createStereoPanner) {
      const n = this.ctx.createStereoPanner();
      n.pan.value = U.clamp(p, -1, 1);
      return n;
    }
    return this.ctx.createGain();
  },

  /* Zawalenie budynku: niski huk + szum gruzu */
  crash(size, pan = 0, dist = 1) {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    if (now - this.lastCrash < 0.06) return;
    this.lastCrash = now;
    const ctx = this.ctx;
    const vol = U.clamp(0.25 + size * 0.75, 0.2, 1) * U.clamp(1.3 - dist, 0.25, 1);
    const p = this._pan(pan);
    p.connect(this.master);

    const src = ctx.createBufferSource();
    src.buffer = this.white;
    src.playbackRate.value = 0.6 + Math.random() * 0.3;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900 + size * 1400, now);
    lp.frequency.exponentialRampToValueAtTime(140, now + 1.2 + size * 2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.55 * vol, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, now + 1.4 + size * 2.4);
    src.connect(lp);
    lp.connect(g);
    g.connect(p);
    src.start(now, Math.random() * 2);
    src.stop(now + 4.5);

    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(70, now);
    o.frequency.exponentialRampToValueAtTime(28, now + 0.9);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, now);
    og.gain.exponentialRampToValueAtTime(0.8 * vol, now + 0.015);
    og.gain.exponentialRampToValueAtTime(0.0008, now + 1.1);
    o.connect(og);
    og.connect(p);
    o.start(now);
    o.stop(now + 1.2);
  },

  /* Pękające szkło */
  glass(pan = 0, vol = 1) {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    if (now - this.lastGlass < 0.12) return;
    this.lastGlass = now;
    const ctx = this.ctx;
    const p = this._pan(pan);
    p.connect(this.master);
    const src = ctx.createBufferSource();
    src.buffer = this.white;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.18 * vol, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0005, now + 0.35);
    src.connect(hp);
    hp.connect(g);
    g.connect(p);
    src.start(now, Math.random() * 3);
    src.stop(now + 0.4);
    for (let i = 0; i < 4; i++) {
      const t0 = now + Math.random() * 0.25;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = 2800 + Math.random() * 4200;
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.0001, t0);
      og.gain.exponentialRampToValueAtTime(0.05 * vol, t0 + 0.003);
      og.gain.exponentialRampToValueAtTime(0.0002, t0 + 0.25);
      o.connect(og);
      og.connect(p);
      o.start(t0);
      o.stop(t0 + 0.3);
    }
  },

  /* Trzeszczenie konstrukcji */
  creak(vol = 1) {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    if (now - this.lastCreak < 0.5) return;
    this.lastCreak = now;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    const f0 = 70 + Math.random() * 80;
    o.frequency.setValueAtTime(f0, now);
    o.frequency.linearRampToValueAtTime(f0 * (0.7 + Math.random() * 0.6), now + 0.6);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 500 + Math.random() * 500;
    bp.Q.value = 6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.09 * vol, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0005, now + 0.7);
    o.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    o.start(now);
    o.stop(now + 0.75);
  },

  /* Krótkie kliknięcie interfejsu */
  click() {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx, now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(900, now);
    o.frequency.exponentialRampToValueAtTime(500, now + 0.05);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.05, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    o.connect(g);
    g.connect(this.master);
    o.start(now);
    o.stop(now + 0.08);
  },

  /* Sygnał systemu wczesnego ostrzegania */
  alert() {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx, now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const t0 = now + i * 0.22;
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = i % 2 ? 880 : 1175;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.06, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
      o.connect(g);
      g.connect(this.master);
      o.start(t0);
      o.stop(t0 + 0.2);
    }
  }
};
