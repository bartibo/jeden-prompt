'use strict';
/* Ciosy wspólne dla wszystkich kapibar: normalne, z kierunkiem, w powietrzu, rzut i przerywnik.
   Hitbox: [x do przodu od środka, y – wysokość środka nad ziemią, szerokość, wysokość]. */

// Klatki kluczowe: [klatka, częściowa poza] względem pozy bazowej
function K(base, list) { return list.map(([f, o]) => [f, mkPose(o || {}, base)]); }

const HIT_DEFAULTS = { dmg: 30, hs: 14, bs: 10, kb: 4, guard: 'mid', lvl: 'L', jp: 1 };
function H(o) { return Object.assign({}, HIT_DEFAULTS, o); }

function defMove(o) {
  const m = Object.assign({ type: 'normal', str: 1, cancel: true, hits: [], vel: [], sfx: [] }, o);
  m.hits = m.hits.map(H);
  m.firstActive = m.hits.length ? Math.min(...m.hits.map(h => h.f[0])) : m.total;
  m.lastActive = m.hits.length ? Math.max(...m.hits.map(h => h.f[1])) : 0;
  return m;
}

const S = STANCE, C = POSES.crouch, J = POSES.jumpFall;

const NORMALS = {
  's.LP': defMove({
    name: 'Szybka łapa', btn: 'LP', str: 1, total: 14,
    poses: K(S, [[0], [2, { torso: 12, aF: [18, -8] }], [4, { hx: 6, torso: 16, head: -2, aF: [62, -4], as: 1.1, eye: 2, mouth: 1 }],
      [8, { hx: 6, torso: 16, head: -2, aF: [60, -4], as: 1.1, eye: 2 }], [14]]),
    hits: [{ f: [4, 6], box: [86, 123, 48, 30], dmg: 30, hs: 13, bs: 9 }],
    sfx: [[3, 'swingL']],
  }),
  's.HP': defMove({
    name: 'Prosty z łapy', btn: 'HP', str: 3, total: 24,
    poses: K(S, [[0], [4, { hx: -6, torso: 0, head: -6, aF: [10, -4], aB: [30, -16] }],
      [7, { hx: 18, torso: 24, head: 4, aF: [66, -10], as: 1.25, eye: 2, mouth: 1, lF: [34, 0] }],
      [11, { hx: 18, torso: 24, head: 4, aF: [64, -8], as: 1.25, eye: 2, lF: [34, 0] }], [24]]),
    hits: [{ f: [7, 9], box: [110, 124, 56, 34], dmg: 70, hs: 18, bs: 13, kb: 6, lvl: 'M' }],
    vel: [[5, 3]], sfx: [[5, 'swingH']],
  }),
  's.LK': defMove({
    name: 'Kopniak w kolanko', btn: 'LK', str: 2, total: 16,
    poses: K(S, [[0], [3, { lF: [30, -40], torso: 4, aF: [26, -24] }],
      [5, { hx: -4, torso: -6, lF: [78, -50], ls: 1.15, aF: [24, -26], aB: [20, -20], eye: 2 }],
      [9, { hx: -4, torso: -6, lF: [76, -48], ls: 1.15, aF: [24, -26], aB: [20, -20] }], [16]]),
    hits: [{ f: [5, 7], box: [80, 52, 52, 32], dmg: 35, hs: 14, bs: 10 }],
    sfx: [[4, 'swingL']],
  }),
  's.HK': defMove({
    name: 'Kopniak z obrotu bioder', btn: 'HK', str: 4, total: 28,
    poses: K(S, [[0], [5, { torso: 2, hx: -2, lF: [28, -56], aF: [22, -24], aB: [24, -18] }],
      [9, { hx: 4, hy: -66, torso: -24, head: -14, lF: [96, -116], ls: 1.3, aF: [10, -30], aB: [-6, -20], eye: 2, mouth: 1 }],
      [14, { hx: 4, hy: -66, torso: -22, head: -14, lF: [94, -112], ls: 1.3, aF: [10, -30], aB: [-6, -20], eye: 2 }], [28]]),
    hits: [{ f: [9, 12], box: [88, 106, 64, 46], dmg: 85, hs: 20, bs: 14, kb: 7, lvl: 'H' }],
    sfx: [[7, 'swingH']],
  }),
  'c.LP': defMove({
    name: 'Łapa z kucnięcia', btn: 'LP', str: 1, total: 13, crouch: true,
    poses: K(C, [[0], [2, { aF: [20, -6] }], [4, { hx: 10, aF: [52, 2], as: 1.1, eye: 2 }], [7, { hx: 10, aF: [52, 2], as: 1.1 }], [13]]),
    hits: [{ f: [4, 6], box: [96, 86, 46, 28], dmg: 28, hs: 12, bs: 9 }],
    sfx: [[3, 'swingL']],
  }),
  'c.HP': defMove({
    name: 'Wyrzut w górę', btn: 'HP', str: 3, total: 32, crouch: true, jc: true,
    poses: K(C, [[0], [4, { hy: -30, torso: 34, aF: [16, 22], aB: [20, 10] }],
      [7, { hy: -68, hx: 8, torso: 4, head: -18, aF: [22, -74], as: 1.25, aB: [20, -10], lF: [26, 0], eye: 2, mouth: 1 }],
      [13, { hy: -68, hx: 8, torso: 4, head: -18, aF: [22, -72], as: 1.25, aB: [20, -10], lF: [26, 0], eye: 2 }], [32]]),
    hits: [{ f: [7, 11], box: [54, 165, 66, 104], dmg: 65, hs: 22, bs: 14, kb: 3, lvl: 'M', launch: [2.2, 16.5], jp: 0 }],
    sfx: [[6, 'swingH']],
  }),
  'c.LK': defMove({
    name: 'Podcięcie łapki', btn: 'LK', str: 2, total: 15, crouch: true,
    poses: K(C, [[0], [3, { lF: [44, -14] }], [5, { hx: -2, torso: 34, lF: [86, -6], ls: 1.2, eye: 2 }], [8, { hx: -2, torso: 34, lF: [86, -6], ls: 1.2 }], [15]]),
    hits: [{ f: [5, 7], box: [84, 12, 56, 26], dmg: 26, hs: 14, bs: 9, guard: 'low' }],
    sfx: [[4, 'swingL']],
  }),
  'c.HK': defMove({
    name: 'Zamiatacz', btn: 'HK', str: 4, total: 34, crouch: true,
    poses: K(C, [[0], [4, { hy: -28, torso: 40, head: -20, hx: -6, lF: [36, -8], aF: [30, 20] }],
      [8, { hy: -26, torso: 44, hx: -10, lF: [104, -4], ls: 1.45, aF: [34, 24], aB: [-20, 18], eye: 2, mouth: 1 }],
      [13, { hy: -26, torso: 44, hx: -10, lF: [102, -4], ls: 1.45, aF: [34, 24], aB: [-20, 18], eye: 2 }], [34]]),
    hits: [{ f: [8, 11], box: [94, 12, 84, 26], dmg: 70, hs: 20, bs: 14, kb: 5, guard: 'low', lvl: 'H', kd: true }],
    sfx: [[6, 'swingH']],
  }),
  'j.LP': defMove({
    name: 'Łapa w locie', btn: 'LP', str: 1, total: 20, air: true,
    poses: K(J, [[0], [3, { torso: 18, aF: [50, 26], as: 1.1, eye: 2, lF: [20, -30], lB: [-12, -26] }],
      [12, { torso: 18, aF: [50, 26], as: 1.1, eye: 2, lF: [20, -30], lB: [-12, -26] }], [20]]),
    hits: [{ f: [3, 10], box: [70, 98, 50, 42], dmg: 35, hs: 15, bs: 10, kb: 3, guard: 'high', airLaunch: [1.4, 6.5] }],
    sfx: [[2, 'swingL']],
  }),
  'j.LK': defMove({
    name: 'Kopniak w locie', btn: 'LK', str: 2, total: 20, air: true,
    poses: K(J, [[0], [3, { lF: [64, -14], ls: 1.1, torso: 2, lB: [-10, -34], eye: 2 }], [12, { lF: [64, -14], ls: 1.1, torso: 2, lB: [-10, -34], eye: 2 }], [20]]),
    hits: [{ f: [3, 11], box: [62, 24, 54, 42], dmg: 40, hs: 15, bs: 10, kb: 3, guard: 'high', airLaunch: [1.4, 7] }],
    sfx: [[2, 'swingL']],
  }),
  'j.HP': defMove({
    name: 'Młot z góry', btn: 'HP', str: 3, total: 24, air: true,
    poses: K(J, [[0], [3, { torso: -6, aF: [20, -50], aB: [10, -40] }],
      [6, { torso: 28, head: 6, aF: [46, 40], as: 1.2, aB: [30, 30], lF: [18, -34], lB: [-16, -30], eye: 2, mouth: 1 }],
      [13, { torso: 28, head: 6, aF: [46, 40], as: 1.2, aB: [30, 30], lF: [18, -34], lB: [-16, -30], eye: 2 }], [24]]),
    hits: [{ f: [6, 11], box: [78, 84, 62, 50], dmg: 70, hs: 18, bs: 12, kb: 4, guard: 'high', lvl: 'M', airLaunch: [1.6, 7.5] }],
    sfx: [[5, 'swingH']],
  }),
  'j.HK': defMove({
    name: 'Latający kopniak', btn: 'HK', str: 4, total: 26, air: true,
    poses: K(J, [[0], [2, { torso: -4, lF: [30, -52], lB: [-10, -30] }],
      [5, { torso: -20, hx: -6, lF: [96, -34], ls: 1.35, lB: [-14, -26], aF: [10, -40], aB: [-10, -30], eye: 2, mouth: 1 }],
      [14, { torso: -20, hx: -6, lF: [96, -34], ls: 1.35, lB: [-14, -26], aF: [10, -40], aB: [-10, -30], eye: 2 }], [26]]),
    hits: [{ f: [5, 12], box: [84, 38, 70, 44], dmg: 80, hs: 18, bs: 12, kb: 5, guard: 'high', lvl: 'H', airLaunch: [3, -10], gb: true }],
    sfx: [[4, 'swingH']],
  }),
  'f.HP': defMove({
    name: 'Główka z rozpędu', btn: 'HP', str: 5, total: 38,
    poses: K(S, [[0], [10, { hx: -12, torso: -22, head: -24, aF: [0, -30], aB: [-10, -24], eye: 2 }],
      [18, { hx: 22, torso: 48, head: 22, aF: [30, 10], aB: [24, 16], mouth: 1, eye: 1, lF: [40, 0] }],
      [23, { hx: 22, torso: 48, head: 22, aF: [30, 10], aB: [24, 16], mouth: 1, eye: 1, lF: [40, 0] }], [38]]),
    hits: [{ f: [18, 21], box: [128, 98, 74, 66], dmg: 70, hs: 20, bs: 12, kb: 6, guard: 'high', lvl: 'H' }],
    vel: [[12, 5]], sfx: [[14, 'swingH']],
  }),
  'b.HK': defMove({
    name: 'Kopniak z półobrotu', btn: 'HK', str: 5, total: 32,
    poses: K(S, [[0], [6, { fx: -1, torso: 20, hx: 4, lF: [-10, -40], aF: [20, -20], aB: [16, -20] }],
      [10, { fx: -1, torso: 30, head: 10, hx: 10, hy: -64, lF: [-104, -92], ls: 1.35, aF: [-10, -20], aB: [0, -20], eye: 2, mouth: 1 }],
      [15, { fx: -1, torso: 30, head: 10, hx: 10, hy: -64, lF: [-100, -88], ls: 1.35, aF: [-10, -20], aB: [0, -20], eye: 2 }], [32]]),
    hits: [{ f: [10, 13], box: [94, 90, 66, 46], dmg: 90, hs: 22, bs: 14, kb: 11, lvl: 'H', airLaunch: [6, 8] }],
    vel: [[4, 2]], sfx: [[3, 'spin'], [8, 'swingH']],
  }),
};

// Rzut: łapa lekka + kopnięcie lekkie z bliska (z ← rzuca za siebie)
const THROW = defMove({
  id: 'throw', name: 'Bagienny rzut', type: 'throw', str: 9, total: 28, cancel: false,
  poses: K(S, [[0], [3, POSES.grab], [9, POSES.grab], [28]]),
  grab: { f: [3, 4], range: 112, dmg: 110 },
});

// Przerywnik: mocna łapa + mocne kopnięcie w trakcie obrywania (1 pasek)
const BREAKER = defMove({
  id: 'breaker', name: 'Przerywnik', type: 'breaker', str: 9, total: 34, cancel: false, invul: [0, 30],
  poses: K(S, [[0, { hy: -40, torso: 30, aF: [10, 20], aB: [6, 22], sq: 0.1, eye: 1 }],
    [6, { hy: -66, torso: -14, head: -24, aF: [40, -50], aB: [-30, -50], as: 1.2, lF: [40, 0], lB: [-40, 0], eye: 2, mouth: 1 }],
    [20, { hy: -66, torso: -14, head: -24, aF: [40, -50], aB: [-30, -50], as: 1.2, lF: [40, 0], lB: [-40, 0], eye: 2, mouth: 1 }], [34]]),
  hits: [{ f: [5, 9], box: [0, 110, 300, 260], dmg: 0, hs: 30, bs: 20, kb: 12, guard: 'unblock', lvl: 'H', launch: [9, 9], jp: 0, noCombo: true }],
});

// Opis ruchów wspólnych do listy ciosów
const COMMON_MOVES = [
  ['Ruch', [
    ['Chodzenie / kucanie / skok', '← → / ↓ / ↑ ↖ ↗'],
    ['Doskok i odskok', '→→ / ←←'],
    ['Blok wysoki (stojąc)', '← (od rywala)'],
    ['Blok niski (kucając)', '↙'],
  ]],
  ['Ciosy podstawowe', [
    ['Szybka łapa · Prosty z łapy', 'LŁ · MŁ'],
    ['Kopniak w kolanko · Kopniak z obrotu', 'LK · MK'],
    ['Łapa z kucnięcia · Wyrzut w górę', '↓+LŁ · ↓+MŁ'],
    ['Podcięcie (nisko) · Zamiatacz (przewraca)', '↓+LK · ↓+MK'],
    ['Ciosy w powietrzu (blok tylko stojąc)', '↑ potem LŁ/MŁ/LK/MK'],
  ]],
  ['Ciosy z kierunkiem', [
    ['Główka z rozpędu (z góry – blok tylko stojąc)', '→+MŁ'],
    ['Kopniak z półobrotu (odrzuca)', '←+MK'],
  ]],
  ['Rzuty i obrona', [
    ['Bagienny rzut (z bliska)', 'LŁ+LK'],
    ['Rzut za siebie', '←+LŁ+LK'],
    ['Wyrwanie się z rzutu', 'LŁ+LK zaraz po złapaniu'],
    ['Przerywnik combo (1 pasek)', 'MŁ+MK w trakcie obrywania'],
  ]],
  ['Super (2 paski)', [
    ['Super cios postaci', '↓↘→↓↘→+Ł  lub  MŁ+MK'],
  ]],
  ['Zasady combo', [
    ['Łańcuch: lżejszy → mocniejszy cios', 'LŁ → LK → MŁ → MK'],
    ['Lekki cios można powtórzyć', 'LŁ, LŁ, LŁ'],
    ['Każdy cios naziemny → cios specjalny', 'trafienie lub blok'],
    ['Cios specjalny → super', 'gdy masz 2 paski'],
    ['Wyrzut, potem super skok i combo w powietrzu', '↓+MŁ, ↑, LŁ, LK, MŁ, MK'],
    ['Latający kopniak w combo odbija rywala od ziemi', 'można dalej bić'],
  ]],
];
