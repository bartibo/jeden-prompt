'use strict';
/* Model fal sejsmicznych: fala P, fala S, fale powierzchniowe Rayleigha i Love'a,
   wstrząsy wtórne oraz tsunami. Fale rozchodzą się kołowo od (wirtualnego) epicentrum,
   więc każdy budynek trzęsie się trochę inaczej. */

const Quake = {
  time: 0,
  events: [],
  center: { x: 0, z: -60 },
  E: { x: 0, z: -60 },
  Dv: 300,
  dirFrom: { x: 0, z: 1 },
  res: 1,
  sMin: 0,
  n: 0,
  T: null,
  tsunami: null,
  peakI: 1,
  nowI: 1,
  lastParams: null,
  aftershocks: true,

  init() {
    const N = 1700;
    this.T = {
      dl: new Float32Array(N), dt: new Float32Array(N), dy: new Float32Array(N),
      al: new Float32Array(N), at: new Float32Array(N), ay: new Float32Array(N)
    };
    this.cap = N;
  },

  /* Parametry „prognozy” dla danych ustawień (bez uruchamiania). */
  forecast(p) {
    const I = Seis.mmi(p.M, p.dist, p.depth, p.soil);
    const pga = Seis.pgaG(I);
    const R = Math.sqrt(p.dist * p.dist + p.depth * p.depth);
    return {
      I, pga, R,
      tP: R / 6.0,
      tS: R / 3.5,
      energy: Seis.energyJ(p.M),
      perYear: Seis.perYear(p.M),
      rupture: Seis.ruptureKm(p.M),
      durReal: Seis.durationReal(p.M) * Seis.SOIL[p.soil].dur,
      tsunamiH: Seis.tsunamiHeight(p.M, p.depth, p.dist, p.sea),
      tsunamiMin: p.sea ? Math.max(2, (p.dist * 1000) / 200 / 60) : 0
    };
  },

  makeEvent(p, t0, kind) {
    const soil = Seis.SOIL[p.soil];
    const I = Seis.mmi(p.M, p.dist, p.depth, p.soil);
    const pga = Seis.pgaG(I);
    const A = Seis.visAmp(pga);
    const R = Math.max(4, Math.sqrt(p.dist * p.dist + p.depth * p.depth));
    const M = p.M;
    const fS = U.lerp(3.0, 0.85, U.clamp((M - 2) / 7, 0, 1)) * soil.freq;
    const dur = (1.4 + 2.3 * Math.max(0, M - 2.5)) * soil.dur;
    const surfW = M < 5 ? 0 : U.clamp((M - 5) / 2.5, 0, 1) * U.clamp((75 - p.depth) / 50, 0.25, 1);
    const gapReal = R * (1 / 3.5 - 1 / 6.0);
    const gap = U.clamp(gapReal * 0.45, 0.45, 4.5);
    const cP = 150;
    const lead = 0.35 + Math.min(this.Dv, 420) / cP;
    const fR = U.lerp(0.62, 0.3, U.clamp((M - 5) / 4.5, 0, 1)) * soil.freq;
    const mkPh = (o, freqs, weights) => {
      o.om = freqs.map(f => 2 * Math.PI * f);
      o.w = weights;
      o.ph = freqs.map(() => Math.random() * 6.283);
      o.ph2 = freqs.map(() => Math.random() * 6.283);
      o.bp = Math.random() * 6.283;
      o.end = o.dur + o.decay * 6;
      return o;
    };
    const tPa = lead;
    const tSa = lead + gap;
    const phases = [
      mkPh({ name: 'P', c: cP, tArr: tPa, amp: A * 0.28, rise: 0.08, dur: gap + dur * 0.25, decay: 1.2 + dur * 0.05, l: 1, t: 0.15, y: 0.55, beat: 0.2 },
        [fS * 2.3, fS * 3.7, fS * 5.4], [1, 0.5, 0.25]),
      mkPh({ name: 'S', c: 80, tArr: tSa, amp: A, rise: 0.2 + dur * 0.02, dur: dur, decay: 1.0 + dur * 0.12, l: 0.35, t: 1, y: 0.22, beat: 0.3 },
        [fS, fS * 1.55, fS * 2.35], [1, 0.5, 0.28]),
      mkPh({ name: 'R', c: 42, tArr: tSa + 0.8 + gap * 0.4, amp: A * 1.15 * surfW, rise: 1.0, dur: dur * 0.85, decay: 2.5 + dur * 0.1, l: 0.6, t: 0, y: 1, beat: 0.15, ell: true },
        [fR, fR * 1.45], [1, 0.35]),
      mkPh({ name: 'L', c: 55, tArr: tSa + 0.5 + gap * 0.3, amp: A * 0.8 * surfW, rise: 0.8, dur: dur * 0.8, decay: 2.2 + dur * 0.1, l: 0, t: 1, y: 0, beat: 0.2 },
        [fR * 1.3, fR * 2.1], [1, 0.3])
    ].filter(ph => ph.amp > 1e-5);
    const end = Math.max(...phases.map(ph => ph.tArr + ph.end + 330 / ph.c));
    const calm = Math.max(...phases.map(ph => ph.tArr + ph.dur + ph.decay * 1.5 + 150 / ph.c));
    return {
      kind, M, depth: p.depth, dist: p.dist, soil: p.soil, sea: p.sea,
      I, pga, A, fS, dur, t0, phases, surfW, gapReal, gap, tPa, tSa,
      strongEnd: t0 + tSa + dur, end: t0 + end, calmAt: t0 + calm, label: kind === 'main' ? 'Wstrząs główny' : 'Wstrząs wtórny'
    };
  },

  /* Uruchomienie trzęsienia. Jeśli poprzednie wciąż trwa, nowe nakłada się na nie. */
  trigger(p) {
    this.lastParams = Object.assign({}, p);
    const busy = this.events.length > 0;
    if (!busy) {
      this.time = 0;
      this.peakI = 1;
      // kierunek, z którego nadchodzą fale
      let ang;
      if (p.sea) ang = U.rand(-0.5, 0.5);                       // od morza (+z)
      else ang = U.pick([Math.PI, Math.PI * 0.5, -Math.PI * 0.5, Math.PI * 0.75, -Math.PI * 0.75]) + U.rand(-0.3, 0.3);
      this.dirFrom = { x: Math.sin(ang), z: Math.cos(ang) };
      this.Dv = 70 + p.dist * 22;
      this.E = { x: this.center.x + this.dirFrom.x * this.Dv, z: this.center.z + this.dirFrom.z * this.Dv };
      this.sMin = Math.max(0, this.Dv - 800);
      this.n = Math.min(this.cap, Math.ceil((this.Dv + 800 - this.sMin) / this.res) + 2);
    }
    const t0 = this.time;
    const ev = this.makeEvent(p, t0, 'main');
    this.events.push(ev);
    // wstrząsy wtórne
    if (this.aftershocks && p.M >= 5.5) {
      const n = p.M >= 8 ? 3 : p.M >= 6.8 ? 2 : 1;
      let tt = ev.calmAt + U.rand(3, 7);
      for (let i = 0; i < n; i++) {
        const q = Object.assign({}, p, { M: Math.max(3, p.M - U.rand(1.1, 2.1)), depth: p.depth * U.rand(0.7, 1.2), dist: Math.max(0, p.dist + U.rand(-5, 5)) });
        const a = this.makeEvent(q, tt, 'after');
        a.pending = true;
        this.events.push(a);
        tt = a.calmAt + U.rand(4, 9);
      }
    }
    // tsunami
    const H = Seis.tsunamiHeight(p.M, p.depth, p.dist, p.sea);
    if (H > 0.3 && !this.tsunami) {
      this.tsunami = new Tsunami(H, ev.t0 + ev.tSa + ev.dur * 0.6, p.dist);
    }
    return ev;
  },

  /* czy któryś wstrząs właśnie trwa (bez czekających wstrząsów wtórnych) */
  get shakingNow() {
    return this.events.some(ev => this.time >= ev.t0 && this.time < ev.calmAt);
  },

  get active() {
    return this.events.length > 0 || (this.tsunami && !this.tsunami.done);
  },

  stopAll() {
    this.events.length = 0;
    this.tsunami = null;
    this.nowI = 1;
  },

  update(dt) {
    if (!this.active) {
      this.nowI = 1;
      return;
    }
    this.time += dt;
    const t = this.time;
    for (const ev of this.events) {
      if (ev.pending && t >= ev.t0) {
        ev.pending = false;
        if (this.onEvent) this.onEvent(ev);
      }
    }
    this.events = this.events.filter(ev => t < ev.end);
    if (this.tsunami) {
      this.tsunami.update(t);
      if (this.tsunami.done && this.events.length === 0) this.tsunami = null;
    }
    this.computeTable();
    // intensywność w centrum miasta
    let I = 1;
    for (const ev of this.events) I = Math.max(I, this.IeffEvent(ev, this.Dv));
    this.nowI = I;
    this.peakI = Math.max(this.peakI, I);
  },

  computeTable() {
    const T = this.T, n = this.n, res = this.res, sMin = this.sMin;
    T.dl.fill(0, 0, n); T.dt.fill(0, 0, n); T.dy.fill(0, 0, n);
    T.al.fill(0, 0, n); T.at.fill(0, 0, n); T.ay.fill(0, 0, n);
    const Dv = this.Dv;
    for (const ev of this.events) {
      const te = this.time - ev.t0;
      if (te <= 0) continue;
      for (const ph of ev.phases) {
        // zakres indeksów, w którym faza jest aktywna: 0 < τ < end
        // τ = te - tArr - (s - Dv)/c  ->  s = Dv + c (te - tArr - τ)
        const sHi = Dv + ph.c * (te - ph.tArr);
        const sLo = Dv + ph.c * (te - ph.tArr - ph.end);
        let i0 = Math.max(0, Math.floor((sLo - sMin) / res));
        let i1 = Math.min(n - 1, Math.ceil((sHi - sMin) / res));
        if (i1 < i0) continue;
        const om = ph.om, w = ph.w, p1 = ph.ph, p2 = ph.ph2, nh = om.length;
        for (let i = i0; i <= i1; i++) {
          const s = sMin + i * res;
          const tau = te - ph.tArr - (s - Dv) / ph.c;
          if (tau <= 0) continue;
          const env = this.env(ph, tau) * ph.amp;
          if (env < 1e-6) continue;
          let s1 = 0, s2 = 0, a1 = 0, a2 = 0, c1 = 0, ac1 = 0;
          for (let k = 0; k < nh; k++) {
            const o = om[k];
            const x1 = Math.sin(o * tau + p1[k]) * w[k];
            const x2 = Math.sin(o * tau + p2[k]) * w[k];
            s1 += x1; s2 += x2;
            a1 -= x1 * o * o; a2 -= x2 * o * o;
            if (ph.ell) {
              const y1 = Math.cos(o * tau + p1[k]) * w[k];
              c1 += y1; ac1 -= y1 * o * o;
            }
          }
          if (ph.ell) {
            // Rayleigh: ruch eliptyczny w płaszczyźnie pionowej
            T.dy[i] += env * ph.y * s1; T.ay[i] += env * ph.y * a1;
            T.dl[i] += env * ph.l * c1; T.al[i] += env * ph.l * ac1;
          } else {
            T.dl[i] += env * ph.l * s1; T.al[i] += env * ph.l * a1;
            T.dt[i] += env * ph.t * s2; T.at[i] += env * ph.t * a2;
            T.dy[i] += env * ph.y * (s1 + s2) * 0.5; T.ay[i] += env * ph.y * (a1 + a2) * 0.5;
          }
        }
      }
    }
  },

  env(ph, tau) {
    if (tau <= 0 || tau > ph.end) return 0;
    let e = 1 - Math.exp(-tau / ph.rise);
    if (tau > ph.dur) e *= Math.exp(-(tau - ph.dur) / ph.decay);
    e *= 1 - ph.beat + ph.beat * (0.5 + 0.5 * Math.sin(tau * 1.7 + ph.bp) * Math.sin(tau * 0.63 + ph.bp * 2));
    return e;
  },

  /* Chwilowa intensywność (MMI) wywołana danym wstrząsem w odległości s od epicentrum. */
  IeffEvent(ev, s) {
    const te = this.time - ev.t0;
    if (te <= 0) return 1;
    let sum = 0;
    for (const ph of ev.phases) {
      const tau = te - ph.tArr - (s - this.Dv) / ph.c;
      const e = this.env(ph, tau) * (ph.amp / ev.A) * (ph.name === 'P' ? 0.55 : ph.name === 'L' ? 0.8 : 1);
      sum += e * e;
    }
    const lvl = Math.min(1.12, Math.sqrt(sum));
    if (lvl < 1e-4) return 1;
    return U.clamp(ev.I + 3.66 * Math.log10(lvl), 1, 12);
  },

  distFromE(x, z) {
    const dx = x - this.E.x, dz = z - this.E.z;
    return Math.sqrt(dx * dx + dz * dz);
  },

  /* Próbka ruchu gruntu w punkcie (x,z). out: dx,dy,dz (m), ax,ay,az (m/s²), I (MMI teraz). */
  sample(x, z, out, withI) {
    out.dx = out.dy = out.dz = out.ax = out.ay = out.az = 0;
    out.I = 1;
    if (this.events.length === 0) return out;
    const ex = x - this.E.x, ez = z - this.E.z;
    const s = Math.sqrt(ex * ex + ez * ez) || 1;
    const rx = ex / s, rz = ez / s;
    const f = (s - this.sMin) / this.res;
    const i = Math.floor(f);
    const cr = Math.hypot(x - this.center.x, z - this.center.z);
    const tp = cr < 380 ? 1 : 1 - U.smooth(380, 720, cr);
    if (i >= 0 && i < this.n - 1 && tp > 0) {
      const k = (f - i), T = this.T;
      const dl = T.dl[i] + (T.dl[i + 1] - T.dl[i]) * k;
      const dt = T.dt[i] + (T.dt[i + 1] - T.dt[i]) * k;
      const al = T.al[i] + (T.al[i + 1] - T.al[i]) * k;
      const at = T.at[i] + (T.at[i + 1] - T.at[i]) * k;
      out.dy = T.dy[i] + (T.dy[i + 1] - T.dy[i]) * k;
      out.ay = T.ay[i] + (T.ay[i + 1] - T.ay[i]) * k;
      out.dx = rx * dl - rz * dt;
      out.dz = rz * dl + rx * dt;
      out.ax = rx * al - rz * at;
      out.az = rz * al + rx * at;
      if (tp < 1) { out.dx *= tp; out.dy *= tp; out.dz *= tp; out.ax *= tp; out.ay *= tp; out.az *= tp; }
    }
    if (withI) {
      let I = 1;
      for (const ev of this.events) I = Math.max(I, this.IeffEvent(ev, s));
      out.I = I;
    }
    return out;
  },

  /* Tylko przemieszczenie pionowe – szybka ścieżka dla siatki terenu. */
  dyAt(s) {
    const f = (s - this.sMin) / this.res;
    const i = Math.floor(f);
    if (i < 0 || i >= this.n - 1) return 0;
    const k = f - i, T = this.T.dy;
    return T[i] + (T[i + 1] - T[i]) * k;
  },

  /* Sygnał „sejsmometru” w centrum miasta – składowe znormalizowane. */
  station() {
    const r = { v: 0, h: 0, P: 0, S: 0, Surf: 0 };
    const t = this.time;
    for (const ev of this.events) {
      const te = t - ev.t0;
      if (te <= 0) continue;
      const L = Math.pow((ev.I - 1) / 11, 1.15) * 0.92 + 0.02;
      for (const ph of ev.phases) {
        const tau = te - ph.tArr;
        if (tau <= 0) continue;
        const e = this.env(ph, tau) * (ph.amp / ev.A);
        if (e < 1e-5) continue;
        let s1 = 0, s2 = 0;
        for (let k = 0; k < ph.om.length; k++) {
          s1 += Math.sin(ph.om[k] * tau + ph.ph[k]) * ph.w[k];
          s2 += Math.sin(ph.om[k] * tau + ph.ph2[k]) * ph.w[k];
        }
        const val = e * L * 0.6;
        r.v += val * (ph.name === 'P' ? s1 * 1.0 : ph.name === 'R' ? s1 : s2 * 0.5);
        r.h += val * s2;
        if (ph.name === 'P') r.P = Math.max(r.P, e);
        else if (ph.name === 'S') r.S = Math.max(r.S, e);
        else r.Surf = Math.max(r.Surf, e);
      }
    }
    return r;
  },

  /* Faza trzęsienia do wyświetlenia w interfejsie */
  phaseLabel() {
    if (this.events.length === 0) {
      if (this.tsunami && !this.tsunami.done) return this.tsunami.label();
      return null;
    }
    const t = this.time;
    let best = null;
    for (const ev of this.events) {
      const te = t - ev.t0;
      if (te < 0) continue;
      if (!best || ev.t0 > best.t0) best = ev;
    }
    if (!best) {
      const nxt = this.events.find(e => e.pending);
      if (this.tsunami && !this.tsunami.done && this.tsunami.started(t)) return this.tsunami.label();
      return nxt ? 'Cisza przed wstrząsem wtórnym…' : null;
    }
    const te = t - best.t0;
    const pre = best.kind === 'after' ? 'Wstrząs wtórny · ' : '';
    if (te < best.tPa) return pre + 'Fale biegną od epicentrum…';
    if (te < best.tSa) return pre + 'Fala P (podłużna) – pierwsze drgania';
    if (te < best.tSa + best.dur * 0.9) {
      const surf = best.surfW > 0.2 && te > best.tSa + 1 + best.gap * 0.4;
      return pre + (surf ? 'Fale S i powierzchniowe – najsilniejsze wstrząsy' : 'Fala S (poprzeczna) – najsilniejsze wstrząsy');
    }
    if (this.tsunami && !this.tsunami.done && this.tsunami.started(t)) return this.tsunami.label();
    return pre + 'Wygasanie drgań';
  }
};

/* Tsunami: najpierw morze się cofa, potem nadchodzi fala, zalewa ląd i spływa z powrotem. */
class Tsunami {
  constructor(H, tStart, distKm) {
    this.H = H;
    this.t0 = tStart;
    this.distKm = distKm;
    this.shore = 75;
    this.c = 72;
    this.zStart = 820;
    this.tCrest = 3.5;                       // start fali z horyzontu
    this.tShore = this.tCrest + (this.zStart - this.shore) / this.c;
    this.L = H < 1.5 ? 27 * H / 1.5 : U.clamp((H - 1.5) * 15 + 27, 0, 250);
    this.tRun = Math.max(4, this.L / 11);
    this.tHold = 4;
    this.tBack = 16;
    this.tEnd = this.tShore + this.tRun + this.tHold + this.tBack;
    this.D = Math.min(0.45 * H, 6);
    this.tau = -1;
    this.done = false;
    this.maxDepthCity = 0;
    this.zc = this.zStart;
    this.zf = this.shore;
    this.levelK = 1;
    this.dd = 0;
    this.flowZ = 0;
  }
  started(t) { return t >= this.t0; }
  update(t) {
    const tau = this.tau = t - this.t0;
    if (tau < 0) return;
    if (tau > this.tEnd) { this.done = true; return; }
    // cofanie się morza
    this.dd = this.D * U.smooth(0, 6, tau) * (1 - U.smooth(this.tShore - 4, this.tShore + 0.5, tau));
    // położenie grzbietu fali
    this.zc = tau < this.tCrest ? this.zStart + 400 : this.zStart - this.c * (tau - this.tCrest);
    const tl = tau - this.tShore;
    if (tl < 0) {
      this.zf = this.shore;
      this.levelK = 1;
      this.flowZ = 0;
    } else {
      const p = U.clamp(tl / this.tRun, 0, 1);
      const ease = 1 - Math.pow(1 - p, 2.2);
      this.zf = this.shore - this.L * ease;
      const tb = tl - this.tRun - this.tHold;
      this.levelK = 1 - U.smooth(0, this.tBack, tb);
      if (p < 1) this.flowZ = -(5 + this.H * 0.7) * (1 - p * 0.7);
      else if (tb < 0) this.flowZ = -1;
      else this.flowZ = (3 + this.H * 0.35) * (1 - U.smooth(this.tBack * 0.6, this.tBack, tb));
    }
  }
  label() {
    const tau = this.tau;
    if (tau < 0) return null;
    if (tau < this.tShore - 3) return '⚠ Morze się cofa – nadchodzi tsunami!';
    if (tau < this.tShore + this.tRun) return '🌊 Tsunami uderza w wybrzeże';
    if (tau < this.tShore + this.tRun + this.tHold) return '🌊 Zalanie miasta';
    return 'Woda spływa do morza';
  }
  /* Poziom lustra wody w punkcie; -1000 = brak wody (sucho) */
  level(x, z, base) {
    const tau = this.tau;
    if (tau < 0 || this.done) return null;
    const wob = 12 * Math.sin(x * 0.013 + 1.3) + 7 * Math.sin(x * 0.034 + 0.4);
    const zc = this.zc + wob;
    const A = this.H * (0.32 + 0.68 * U.smooth(700, this.shore, this.zc));
    if (z >= this.shore - 2) {
      // morze
      let eta = -this.dd * Math.exp(-Math.max(0, z - this.shore) / 320);
      const s = z - zc;
      let w;
      if (s < 0) w = Math.exp(-(s / 24) * (s / 24));
      else w = (0.72 + 0.28 * Math.exp(-(s / 80) * (s / 80))) * Math.exp(-s / 1600);
      if (tau < this.tCrest) w = 0;
      eta += A * w * this.levelK;
      return eta;
    }
    // ląd
    if (tau < this.tShore) return null;
    const zf = this.zf + wob * 0.6;
    if (z < zf) return null;
    const span = Math.max(1, this.shore - zf);
    const q = U.clamp((z - zf) / span, 0, 1);
    const Hs = this.H * this.levelK;
    const front = base + 0.05;
    let eta = front + (Hs - front) * Math.pow(q, 0.55);
    eta = Math.min(eta, Hs + 0.3);
    if (eta <= base) return null;
    return eta;
  }
  depthAt(x, z) {
    const base = World.baseHeight(x, z);
    const l = this.level(x, z, base);
    if (l === null) return 0;
    return Math.max(0, l - base);
  }
}
