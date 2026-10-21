'use strict';
/* Start, pętla gry ze stałym krokiem 60 Hz i rysowanie z dopasowaniem do okna. */

const canvas = $('game');
const ctx = canvas.getContext('2d');

const App = {
  game: null, demo: null, lastFight: null, endWait: 0,

  makeCtrl(p, mode, cpu) {
    if (p === 0) return new KeyboardController(0);
    if (mode === 'versus') return new KeyboardController(1);
    if (mode === 'cpu') return new CpuController(cpu);
    return new DummyController();
  },

  startFight(cfg) {
    this.lastFight = cfg;
    const stage = STAGES[cfg.stage];
    this.game = new Game({
      mode: cfg.mode,
      chars: [CHARACTERS[cfg.chars[0]], CHARACTERS[cfg.chars[1]]],
      ctrls: [this.makeCtrl(0, cfg.mode, cfg.cpu), this.makeCtrl(1, cfg.mode, cfg.cpu)],
      stage,
      winsNeeded: Settings.wins,
      time: Settings.time,
      finishers: Settings.finishers,
      onEnd: () => { this.endWait = 150; },
    });
    this.demo = null;
    this.endWait = 0;
    UI.prev = [];
    UI.show('fight');
    Sfx.muted = false;
    Music.play(stage.music);
  },

  quit() {
    this.game = null;
    UI.prev = [];
    UI.show('menu');
  },

  ensureDemo() {
    if (this.game || this.demo) return;
    const a = randInt(0, CHARACTERS.length - 1);
    let b = randInt(0, CHARACTERS.length - 2); if (b >= a) b++;
    this.demo = new Game({
      mode: 'demo',
      chars: [CHARACTERS[a], CHARACTERS[b]],
      ctrls: [new CpuController(2), new CpuController(2)],
      stage: pick(STAGES), winsNeeded: 1, time: 60, finishers: false,
      onEnd: () => { this.demoEnd = 120; },
    });
  },

  step() {
    const g = this.game;
    if (g) {
      if (UI.screen === 'fight' || UI.screen === 'results') g.tick();
      if (g.over && this.endWait > 0 && --this.endWait === 0) UI.showResults(g.result, g);
    } else if (this.demo) {
      this.demo.tick();
      if (this.demo.over && --this.demoEnd <= 0) { this.demo = null; this.ensureDemo(); }
    }
  },
};

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.round(window.innerWidth * dpr), h = Math.round(window.innerHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
}

function render() {
  resize();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const g = App.game || App.demo;
  if (g) {
    const S = Math.min(canvas.width / VW, canvas.height / VH);
    const ox = (canvas.width - VW * S) / 2, oy = (canvas.height - VH * S) / 2;
    ctx.save();
    ctx.beginPath(); ctx.rect(ox, oy, VW * S, VH * S); ctx.clip();
    g.render(ctx, S, ox, oy, g !== App.demo);
    ctx.restore();
  }
  UI.frame();
}

let last = performance.now(), acc = 0;
const STEP = 1000 / FPS;
function loop(now) {
  acc += Math.min(120, now - last);
  last = now;
  for (const code of Keys.takeMenu()) UI.key(code);
  let n = 0;
  while (acc >= STEP && n < 5) { acc -= STEP; App.step(); Keys.endStep(); n++; }
  if (n === 5) acc = 0;
  render();
  requestAnimationFrame(loop);
}

Keys.init();
Voice.init();
window.addEventListener('pointerdown', () => Sfx.unlock());
document.addEventListener('visibilitychange', () => {
  if (document.hidden && UI.screen === 'fight') UI.pause();
});
UI.init();
App.ensureDemo();
requestAnimationFrame(loop);
