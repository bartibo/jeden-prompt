'use strict';
/* Sejsmogram na żywo: przewijany zapis drgań ze stacji w centrum miasta. */

const Seismo = {
  data: [],
  markers: [],
  win: 9,          // widoczne sekundy
  clock: 0,
  peak: 0,

  init(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    const r = this.cv.getBoundingClientRect();
    const d = Math.min(2, window.devicePixelRatio || 1);
    this.w = Math.max(10, r.width);
    this.h = Math.max(10, r.height);
    this.cv.width = this.w * d;
    this.cv.height = this.h * d;
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
  },

  push(dt, v, h) {
    this.clock += dt;
    const noise = (Math.random() - 0.5) * 0.012 + Math.sin(this.clock * 1.3) * 0.004;
    this.data.push({ t: this.clock, v: v + noise, h });
    const cut = this.clock - this.win - 0.5;
    while (this.data.length && this.data[0].t < cut) this.data.shift();
    while (this.markers.length && this.markers[0].t < cut) this.markers.shift();
  },

  addMarker(t, label, color) {
    this.markers.push({ t, label, color });
    this.markers.sort((a, b) => a.t - b.t);
  },

  draw(accent) {
    const c = this.ctx, w = this.w, h = this.h;
    c.clearRect(0, 0, w, h);
    // siatka
    c.strokeStyle = 'rgba(160,190,230,0.08)';
    c.lineWidth = 1;
    const t0 = this.clock - this.win;
    const px = t => (t - t0) / this.win * w;
    for (let s = Math.ceil(t0); s <= this.clock; s++) {
      const x = px(s);
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke();
    }
    for (let k = 1; k < 4; k++) {
      c.beginPath(); c.moveTo(0, h * k / 4); c.lineTo(w, h * k / 4); c.stroke();
    }
    // znaczniki faz
    c.font = '600 10px "JetBrains Mono", monospace';
    for (const m of this.markers) {
      if (m.t > this.clock + 0.01) continue;
      const x = px(m.t);
      c.strokeStyle = m.color;
      c.globalAlpha = 0.7;
      c.setLineDash([3, 3]);
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke();
      c.setLineDash([]);
      c.globalAlpha = 1;
      c.fillStyle = m.color;
      c.fillText(m.label, x + 3, 11);
    }
    // zapis
    const mid = h / 2, amp = h * 0.46;
    c.lineJoin = 'round';
    for (const pass of [0, 1]) {
      c.beginPath();
      let first = true;
      for (const d of this.data) {
        const x = px(d.t);
        const v = Math.tanh(d.v * 1.25);
        const y = mid - v * amp;
        if (first) { c.moveTo(x, y); first = false; } else c.lineTo(x, y);
      }
      if (pass === 0) {
        c.strokeStyle = accent;
        c.globalAlpha = 0.25;
        c.lineWidth = 4;
      } else {
        c.strokeStyle = accent;
        c.globalAlpha = 1;
        c.lineWidth = 1.3;
      }
      c.stroke();
    }
    c.globalAlpha = 1;
    // pisak
    const last = this.data[this.data.length - 1];
    if (last) {
      const y = mid - Math.tanh(last.v * 1.25) * amp;
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(w - 2, y, 2.6, 0, Math.PI * 2); c.fill();
    }
  }
};
