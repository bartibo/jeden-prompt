'use strict';
/* Klawiatura, układy klawiszy obu graczy i rozpoznawanie ruchów specjalnych. */

const BTN = ['LP', 'HP', 'LK', 'HK'];
const BTN_LABEL = { LP: 'LŁ', HP: 'MŁ', LK: 'LK', HK: 'MK' };
const BTN_NAME = { LP: 'lekka łapa', HP: 'mocna łapa', LK: 'lekkie kopnięcie', HK: 'mocne kopnięcie' };

// Kody fizycznych klawiszy (e.code), więc działa na każdym układzie klawiatury
const BINDINGS = [
  { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'],
    LP: ['KeyT'], HP: ['KeyY'], LK: ['KeyG'], HK: ['KeyH'] },
  { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'],
    LP: ['KeyO', 'Numpad4'], HP: ['KeyP', 'Numpad5'], LK: ['KeyL', 'Numpad1'], HK: ['Semicolon', 'Numpad2'] },
];

const KEY_NAMES = {
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Semicolon: ';',
  Numpad1: 'Num1', Numpad2: 'Num2', Numpad4: 'Num4', Numpad5: 'Num5',
  Enter: 'Enter', Escape: 'Esc', Space: 'Spacja',
};
let layoutMap = null;
if (navigator.keyboard && navigator.keyboard.getLayoutMap) {
  navigator.keyboard.getLayoutMap().then(m => { layoutMap = m; if (window.UI) UI.refreshKeyLabels(); }).catch(() => {});
}
function keyName(code) {
  if (KEY_NAMES[code]) return KEY_NAMES[code];
  if (layoutMap && layoutMap.get(code)) return layoutMap.get(code).toUpperCase();
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code;
}

const Keys = {
  down: new Set(),
  hit: new Set(),      // wciśnięte od ostatniego kroku symulacji
  menuHit: [],         // kolejka dla menu
  init() {
    const gameCodes = new Set();
    for (const b of BINDINGS) for (const k in b) b[k].forEach(c => gameCodes.add(c));
    gameCodes.add('Space');
    window.addEventListener('keydown', e => {
      if (gameCodes.has(e.code) || e.code === 'Escape') e.preventDefault();
      if (e.repeat) return;
      this.down.add(e.code);
      this.hit.add(e.code);
      this.menuHit.push(e.code);
      if (window.Sfx) Sfx.unlock();
    });
    window.addEventListener('keyup', e => { this.down.delete(e.code); });
    window.addEventListener('blur', () => { this.down.clear(); });
  },
  endStep() { this.hit.clear(); },
  takeMenu() { const q = this.menuHit; this.menuHit = []; return q; },
};

class KeyboardController {
  constructor(pi) { this.b = BINDINGS[pi]; this.human = true; }
  poll() {
    const held = k => this.b[k].some(c => Keys.down.has(c));
    const out = { l: held('left'), r: held('right'), u: held('up'), d: held('down'), press: [], hold: {} };
    for (const b of BTN) {
      out.hold[b] = held(b);
      if (this.b[b].some(c => Keys.hit.has(c))) out.press.push(b);
    }
    return out;
  }
}

// Manekin treningowy (stoi, kuca, skacze albo blokuje)
class DummyController {
  constructor() { this.mode = 0; this.human = false; }
  poll(me, opp) {
    const out = { l: false, r: false, u: false, d: false, press: [], hold: {} };
    const away = opp && opp.x > me.x ? 'l' : 'r';
    switch (this.mode) {
      case 1: out.d = true; break;
      case 2: out.u = true; break;
      case 3: {
        out[away] = true;
        const m = opp && opp.move;
        if (m && m.hits && m.hits.some(h => h.guard === 'low')) out.d = true;
        break;
      }
    }
    return out;
  }
}
const DUMMY_MODES = ['stoi', 'kuca', 'skacze', 'blokuje', 'komputer'];

// ---------------- Ruchy specjalne ----------------
// Kierunki w notacji klawiatury numerycznej, względem zwrotu postaci:
// 7 8 9 / 4 5 6 / 1 2 3, gdzie 6 = do przodu, 4 = do tyłu, 'n' = cokolwiek bez dołu
const MOTIONS = {
  qcf:  { alts: [[2, 3, 6], [2, 6]], win: 20, glyph: '↓↘→' },
  qcb:  { alts: [[2, 1, 4], [2, 4]], win: 20, glyph: '↓↙←' },
  dp:   { alts: [[6, 2, 3]], win: 20, glyph: '→↓↘' },
  bf:   { alts: [[4, 6]], win: 16, glyph: '←→' },
  dd:   { alts: [[2, 'n', 2]], win: 18, glyph: '↓↓', maxFirst: 12 },
  qcf2: { alts: [[2, 3, 6, 2, 3, 6], [2, 6, 2, 6], [2, 3, 6, 3, 6]], win: 40, glyph: '↓↘→↓↘→' },
};
const DIR_GLYPH = { 1: '↙', 2: '↓', 3: '↘', 4: '←', 5: '•', 6: '→', 7: '↖', 8: '↑', 9: '↗' };

function dirMatch(p, d) {
  if (p === 'n') return d !== 1 && d !== 2 && d !== 3;
  return p === d;
}

// Szuka wzorca jako podciągu w historii kierunków (od najnowszych).
// Zwraca true, gdy ostatni element jest świeży, a cały ruch zmieścił się w oknie czasu.
function matchSeq(hist, pat, now, win, freshness, maxFirst) {
  let i = pat.length - 1;
  let lastEnd = -1, firstEnd = -1, firstDur = 0;
  for (let k = hist.length - 1; k >= 0 && i >= 0; k--) {
    const h = hist[k];
    const end = k + 1 < hist.length ? hist[k + 1].t : now;
    if (now - end > win) break;
    if (dirMatch(pat[i], h.d)) {
      if (i === pat.length - 1) lastEnd = end;
      if (i === 0) { firstEnd = end; firstDur = end - h.t; }
      i--;
    }
  }
  if (i >= 0) return false;
  if (maxFirst && firstDur > maxFirst) return false;
  return now - lastEnd <= freshness && now - firstEnd <= win;
}

function matchMotion(hist, motion, now) {
  const m = typeof motion === 'string' ? MOTIONS[motion] : { alts: [motion], win: 50 };
  const fresh = typeof motion === 'string' ? 8 : 14;
  return m.alts.some(p => matchSeq(hist, p, now, m.win, fresh, m.maxFirst));
}

function motionGlyph(motion) {
  if (typeof motion === 'string') return MOTIONS[motion].glyph;
  return motion.map(d => DIR_GLYPH[d] || '').join('');
}
