'use strict';
/* Proceduralna kapibara: szkielet z odwrotną kinematyką kończyn, pozy i ich płynne przejścia.
   Układ lokalny: postać patrzy w prawo, (0,0) to ziemia pod środkiem, y rośnie w dół. */

const LIMB = { th: 33, sh: 32, ua: 29, fa: 27 };

// Pozy: hx,hy – biodra; torso/head – pochylenie (stopnie); aF/aB – cel łapy przedniej/tylnej
// względem barku; lF/lB – cel stopy względem ziemi; rot – obrót całej postaci wokół bioder;
// fx – odbicie w poziomie (obroty); sq – spłaszczenie; ls/as – rozciągnięcie nóg/łap.
const POSE_KEYS = ['hx', 'hy', 'torso', 'head', 'rot', 'fx', 'sq', 'ls', 'as'];
const POSE_VEC = ['aF', 'aB', 'lF', 'lB'];

const STANCE = {
  hx: 0, hy: -58, torso: 10, head: -4, aF: [36, 2], aB: [32, 8], lF: [24, 0], lB: [-26, 0],
  rot: 0, fx: 1, sq: 0, ls: 1, as: 1, eye: 0, mouth: 0,
};

function mkPose(o, base = STANCE) {
  const p = Object.assign({}, base, o);
  for (const k of POSE_VEC) p[k] = (o && o[k] ? o[k] : base[k]).slice();
  return p;
}

function lerpPose(a, b, t, out = {}) {
  for (const k of POSE_KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  for (const k of POSE_VEC) {
    const v = out[k] || (out[k] = [0, 0]);
    v[0] = a[k][0] + (b[k][0] - a[k][0]) * t;
    v[1] = a[k][1] + (b[k][1] - a[k][1]) * t;
  }
  out.eye = t < 0.5 ? a.eye : b.eye;
  out.mouth = t < 0.5 ? a.mouth : b.mouth;
  return out;
}

function clonePose(p) { return lerpPose(p, p, 0); }

// Interpolacja klatek kluczowych [[klatka, poza], ...]
function keyPose(keys, f, out) {
  if (f <= keys[0][0]) return lerpPose(keys[0][1], keys[0][1], 0, out);
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, p0] = keys[i], [f1, p1] = keys[i + 1];
    if (f < f1) {
      const t = (f - f0) / (f1 - f0);
      return lerpPose(p0, p1, easeOut(t), out);
    }
  }
  const last = keys[keys.length - 1][1];
  return lerpPose(last, last, 0, out);
}

const POSES = {};
POSES.stance = STANCE;
POSES.crouch = mkPose({ hx: 6, hy: -36, torso: 30, head: -16, aF: [30, -12], aB: [26, -6], lF: [30, 0], lB: [-30, 0] });
POSES.jumpUp = mkPose({ hy: -70, torso: 4, head: -6, aF: [26, -26], aB: [22, -22], lF: [22, -34], lB: [-14, -28] });
POSES.jumpFall = mkPose({ hy: -66, torso: 8, head: 0, aF: [32, -8], aB: [20, -2], lF: [20, -8], lB: [-22, -14] });
POSES.tuck = mkPose({ hy: -82, torso: 34, head: -22, aF: [24, 12], aB: [18, 14], lF: [26, -52], lB: [4, -48] });
POSES.preJump = mkPose({ hy: -44, torso: 18, head: -8, aF: [30, -4], aB: [24, 2], lF: [26, 0], lB: [-28, 0], sq: 0.08 });
POSES.land = mkPose({ hy: -46, torso: 16, head: -6, aF: [34, -2], aB: [26, 4], lF: [28, 0], lB: [-30, 0], sq: 0.06 });
POSES.block = mkPose({ hx: -6, torso: 0, head: -12, aF: [20, -32], aB: [18, -26], lF: [22, 0], lB: [-30, 0], eye: 2, mouth: 3 });
POSES.blockCr = mkPose({ hx: 0, hy: -36, torso: 22, head: -20, aF: [20, -28], aB: [16, -22], lF: [30, 0], lB: [-30, 0], eye: 2, mouth: 3 });
POSES.hurtHigh = mkPose({ hx: -12, torso: -18, head: -24, aF: [8, 22], aB: [-2, 24], lF: [22, 0], lB: [-30, 0], eye: 3, mouth: 1 });
POSES.hurtLow = mkPose({ hx: -6, hy: -52, torso: 36, head: 12, aF: [14, 26], aB: [8, 28], lF: [24, 0], lB: [-28, 0], eye: 3, mouth: 1 });
POSES.hurtCr = mkPose({ hx: -6, hy: -34, torso: 8, head: -26, aF: [14, 20], aB: [6, 22], lF: [30, 0], lB: [-30, 0], eye: 3, mouth: 1 });
POSES.airHit = mkPose({ hy: -60, torso: -24, head: -30, rot: -30, aF: [-10, -30], aB: [-18, -32], lF: [34, -30], lB: [18, -22], eye: 3, mouth: 1 });
POSES.lying = mkPose({ hx: 0, hy: -24, torso: 0, head: -10, rot: -88, aF: [22, 18], aB: [10, 22], lF: [14, 34], lB: [-6, 36], eye: 1, mouth: 1 });
POSES.dashF = mkPose({ hx: 8, hy: -54, torso: 30, head: -10, aF: [24, 6], aB: [-10, 12], lF: [34, -10], lB: [-34, -4] });
POSES.dashB = mkPose({ hx: -8, hy: -60, torso: -10, head: -8, aF: [26, -20], aB: [20, -14], lF: [16, -16], lB: [-26, 0] });
POSES.grab = mkPose({ hx: 12, torso: 22, head: -4, aF: [52, -6], aB: [48, 0], as: 1.1, eye: 2, mouth: 3 });
POSES.lift = mkPose({ hx: 0, hy: -62, torso: -12, head: -20, aF: [16, -58], aB: [10, -52], as: 1.15, eye: 2, mouth: 1 });
POSES.toss = mkPose({ hx: 16, torso: 34, head: 6, aF: [62, -18], aB: [58, -12], lF: [40, 0], as: 1.15, eye: 2, mouth: 1 });
POSES.dizzy = mkPose({ hx: -4, hy: -56, torso: -6, head: 10, aF: [10, 26], aB: [4, 28], lF: [18, 0], lB: [-22, 0], eye: 4, mouth: 1 });
POSES.win = mkPose({ hx: 0, hy: -60, torso: 2, head: -14, aF: [12, -62], aB: [26, 6], lF: [20, 0], lB: [-24, 0], as: 1.1, eye: 1, mouth: 2 });
POSES.sit = mkPose({ hx: -6, hy: -24, torso: -2, head: -4, aF: [26, 22], aB: [22, 24], lF: [40, -6], lB: [30, -4], eye: 1, mouth: 2 });
POSES.point = mkPose({ torso: 0, head: -24, aF: [18, -58], aB: [24, 4], as: 1.1, eye: 2, mouth: 2 });

// ---------------- Rysowanie ----------------
function ik(sx, sy, tx, ty, l1, l2, bend) {
  let dx = tx - sx, dy = ty - sy;
  let d = Math.hypot(dx, dy);
  const max = l1 + l2 - 0.01;
  if (d > max) { const k = max / d; dx *= k; dy *= k; d = max; }
  if (d < 0.5) { dx = 0.5; d = 0.5; }
  const a = Math.atan2(dy, dx);
  const c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const a1 = a + bend * Math.acos(c);
  return [sx + Math.cos(a1) * l1, sy + Math.sin(a1) * l1, sx + dx, sy + dy];
}

function strokeLimb(ctx, pts, w, col, ol) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = ol; ctx.lineWidth = w + 6;
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.lineTo(pts[2], pts[3]); ctx.lineTo(pts[4], pts[5]); ctx.stroke();
}
function fillSeg(ctx, x0, y0, x1, y1, w, col) {
  ctx.strokeStyle = col; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
}

function drawLeg(ctx, L, hip, target, ls, back) {
  const [kx, ky, fx, fy] = ik(hip[0], hip[1], target[0], target[1], LIMB.th * ls, LIMB.sh * ls, -1);
  const fur = back ? L.furBack : L.fur;
  const ol = L.outline;
  strokeLimb(ctx, [hip[0], hip[1], kx, ky, fx, fy], 24, fur, ol);
  // stopa: prostopadle do goleni, palcami do przodu
  const sa = Math.atan2(fy - ky, fx - kx) - Math.PI / 2;
  ctx.save();
  ctx.translate(fx + Math.cos(sa) * 5, fy + Math.sin(sa) * 5);
  ctx.rotate(sa);
  ellipse(ctx, 0, 0, 15, 9);
  ctx.fillStyle = back ? shade(L.paw, -0.2) : L.paw; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = ol; ctx.stroke();
  ctx.restore();
  fillSeg(ctx, hip[0], hip[1], kx, ky, 24, L.thigh ? (back ? shade(L.thigh, -0.18) : L.thigh) : fur);
  fillSeg(ctx, kx, ky, fx, fy, 19, L.shin ? (back ? shade(L.shin, -0.18) : L.shin) : fur);
  return [fx, fy];
}

function drawArm(ctx, L, sh, target, as, back) {
  const [ex, ey, px, py] = ik(sh[0], sh[1], sh[0] + target[0], sh[1] + target[1], LIMB.ua * as, LIMB.fa * as, 1);
  const ol = L.outline;
  const up = L.upperArm ? (back ? shade(L.upperArm, -0.18) : L.upperArm) : (back ? L.furBack : L.fur);
  const fo = L.forearm ? (back ? shade(L.forearm, -0.18) : L.forearm) : (back ? L.furBack : L.fur);
  strokeLimb(ctx, [sh[0], sh[1], ex, ey, px, py], 18, up, ol);
  fillSeg(ctx, sh[0], sh[1], ex, ey, 18, up);
  fillSeg(ctx, ex, ey, px, py, 15, fo);
  ellipse(ctx, px, py, 10.5, 10);
  ctx.fillStyle = back ? shade(L.paw, -0.2) : L.paw; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = ol; ctx.stroke();
  if (L.wrist) {
    ctx.lineWidth = 6; ctx.strokeStyle = L.wrist;
    const k = 0.78;
    ctx.beginPath(); ctx.moveTo(lerp(ex, px, k) - 6, lerp(ey, py, k)); ctx.lineTo(lerp(ex, px, k) + 6, lerp(ey, py, k)); ctx.stroke();
  }
  return [px, py];
}

function headPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(-24, -4);
  ctx.bezierCurveTo(-34, -28, -24, -50, 0, -52);
  ctx.bezierCurveTo(22, -54, 50, -50, 66, -40);
  ctx.bezierCurveTo(80, -32, 85, -18, 83, -6);
  ctx.bezierCurveTo(81, 8, 70, 14, 56, 14);
  ctx.bezierCurveTo(40, 17, 20, 19, 6, 16);
  ctx.bezierCurveTo(-8, 14, -18, 8, -24, -4);
  ctx.closePath();
}

function drawHead(ctx, L, p, o) {
  const ol = L.outline;
  // ucho
  ctx.save();
  ctx.translate(-8, -48);
  ctx.rotate(-0.35 + (o.earTwitch || 0));
  ellipse(ctx, 0, -2, 8.5, 10.5);
  ctx.fillStyle = L.furDark; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = ol; ctx.stroke();
  ellipse(ctx, 1, 0, 4, 6); ctx.fillStyle = shade(L.paw, 0.15); ctx.fill();
  ctx.restore();
  if (L.headBack) L.headBack(ctx, o);

  headPath(ctx);
  const g = ctx.createLinearGradient(0, -52, 0, 18);
  g.addColorStop(0, L.furDark); g.addColorStop(0.45, L.fur); g.addColorStop(1, L.belly);
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 3.5; ctx.strokeStyle = ol; ctx.stroke();

  // policzek i fałd sierści
  ctx.strokeStyle = rgba(L.outline, 0.35); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(38, -18); ctx.quadraticCurveTo(46, -2, 40, 12); ctx.stroke();
  if (L.blush) { ellipse(ctx, 34, -4, 9, 5); ctx.fillStyle = rgba(L.blush, 0.55); ctx.fill(); }

  // nos
  ellipse(ctx, 72, -26, 13, 10, -0.2); ctx.fillStyle = L.nose; ctx.fill();
  ellipse(ctx, 77, -29, 3.2, 2, -0.4); ctx.fillStyle = '#1a0f08'; ctx.fill();
  ellipse(ctx, 68, -32, 4, 2, -0.2); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();

  // pyszczek
  ctx.strokeStyle = ol; ctx.lineWidth = 2.6;
  const m = p.mouth;
  if (m === 1 || m === 3) {
    ctx.beginPath();
    ctx.moveTo(80, 0); ctx.quadraticCurveTo(70, m === 1 ? 20 : 12, 56, 6); ctx.quadraticCurveTo(68, 2, 80, 0);
    ctx.fillStyle = '#3a1410'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff6dc';
    ctx.fillRect(72, -1, 5, 6); ctx.strokeRect(72, -1, 5, 6);
    if (m === 3) { ctx.fillRect(66, 0, 5, 5); ctx.strokeRect(66, 0, 5, 5); }
  } else if (m === 2) {
    ctx.beginPath(); ctx.moveTo(80, -2); ctx.quadraticCurveTo(70, 10, 58, 2); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(80, -1); ctx.quadraticCurveTo(72, 5, 62, 3); ctx.stroke();
  }
  // wąsy
  ctx.strokeStyle = rgba('#1a0f08', 0.55); ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(70, -14 + i * 4); ctx.lineTo(92, -18 + i * 7); ctx.stroke();
  }

  // oko
  const ex = 22, ey = -33;
  const e = o.blink && p.eye === 0 ? 1 : p.eye;
  ctx.strokeStyle = '#120a05'; ctx.fillStyle = '#120a05'; ctx.lineWidth = 3;
  if (e === 1) {
    ctx.beginPath(); ctx.arc(ex, ey + 3, 6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  } else if (e === 3) {
    ctx.beginPath(); ctx.moveTo(ex - 6, ey - 5); ctx.lineTo(ex + 5, ey); ctx.lineTo(ex - 6, ey + 5); ctx.stroke();
  } else if (e === 4) {
    ctx.lineWidth = 1.8; ctx.beginPath();
    for (let a = 0; a < 12; a += 0.4) ctx.lineTo(ex + Math.cos(a + o.t * 0.3) * a * 0.6, ey + Math.sin(a + o.t * 0.3) * a * 0.6);
    ctx.stroke();
  } else {
    ellipse(ctx, ex, ey, 5.2, 6); ctx.fill();
    ellipse(ctx, ex + 1.8, ey - 2.2, 1.8, 1.8); ctx.fillStyle = '#fff'; ctx.fill();
    if (e === 2) {
      ctx.strokeStyle = '#120a05'; ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(ex - 9, ey - 13); ctx.lineTo(ex + 9, ey - 7); ctx.stroke();
    }
  }
  if (L.headDeco) L.headDeco(ctx, o);
}

// Główna funkcja rysująca kapibarę. o: {t, blink, vx, flash, look}
function drawCapy(ctx, L, p, o) {
  const ol = L.outline;
  ctx.save();
  ctx.scale(L.scale, L.scale);
  const hx = p.hx, hy = p.hy;
  if (p.rot || p.fx !== 1) {
    ctx.translate(hx, hy);
    if (p.rot) ctx.rotate(p.rot * DEG);
    if (p.fx !== 1) ctx.scale(Math.abs(p.fx) < 0.08 ? 0.08 * sign(p.fx || 1) : p.fx, 1);
    ctx.translate(-hx, -hy);
  }
  const tor = p.torso * DEG;
  const tdx = Math.sin(tor), tdy = -Math.cos(tor);   // w górę wzdłuż tułowia
  const ux = Math.cos(tor), uy = Math.sin(tor);      // do przodu, prostopadle
  const sq = p.sq;
  const TL = 68 * L.torsoLen * (1 - sq * 0.6);
  const sx = hx + tdx * TL, sy = hy + tdy * TL;
  const shF = [sx + ux * 4 - tdx * 10, sy + uy * 4 - tdy * 10];
  const shB = [sx - ux * 9 - tdx * 8, sy - uy * 9 - tdy * 8];
  const hipF = [hx + 8, hy + 4], hipB = [hx - 10, hy + 4];
  const G = { hx, hy, tor, tdx, tdy, ux, uy, sx, sy, t: o.t, vx: o.vx || 0, p };
  G.bcx = hx + tdx * 30 * L.torsoLen + ux * 5;
  G.bcy = hy + tdy * 30 * L.torsoLen + uy * 5;
  G.rx = 46 * L.girth * (1 + sq * 0.5);
  G.ry = 58 * L.torsoLen * (1 - sq * 0.4);

  if (L.backDeco) L.backDeco(ctx, G);
  drawLeg(ctx, L, hipB, p.lB, p.ls, true);
  drawArm(ctx, L, shB, p.aB, p.as, true);

  // tułów
  ctx.save();
  ctx.translate(G.bcx, G.bcy);
  ctx.rotate(tor);
  ellipse(ctx, 0, 0, G.rx, G.ry);
  const bg = ctx.createLinearGradient(-G.rx, 0, G.rx, 0);
  bg.addColorStop(0, L.furDark); bg.addColorStop(0.55, L.fur); bg.addColorStop(1, L.belly);
  ctx.fillStyle = bg; ctx.fill();
  ctx.save(); ctx.clip();
  ellipse(ctx, G.rx * 0.55, G.ry * 0.15, G.rx * 0.55, G.ry * 0.75);
  ctx.fillStyle = rgba(L.belly, 0.7); ctx.fill();
  // smużki sierści
  ctx.strokeStyle = rgba(L.outline, 0.18); ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.moveTo(-G.rx * 0.6 + i * 6, -G.ry * 0.5 + i * 18); ctx.lineTo(-G.rx * 0.3 + i * 6, -G.ry * 0.4 + i * 18); ctx.stroke();
  }
  if (L.bodyDeco) L.bodyDeco(ctx, G);
  ctx.restore();
  ellipse(ctx, 0, 0, G.rx, G.ry);
  ctx.lineWidth = 3.5; ctx.strokeStyle = ol; ctx.stroke();
  if (L.bodyOver) L.bodyOver(ctx, G);
  ctx.restore();

  drawLeg(ctx, L, hipF, p.lF, p.ls, false);
  if (L.hipDeco) L.hipDeco(ctx, G);

  // głowa
  const ha = tor * 0.5 + p.head * DEG;
  const nx = sx + ux * 10 + tdx * 14, ny = sy + uy * 10 + tdy * 14;
  ctx.save();
  ctx.translate(nx, ny);
  ctx.rotate(ha);
  ctx.scale(L.head, L.head);
  drawHead(ctx, L, p, o);
  ctx.restore();

  drawArm(ctx, L, shF, p.aF, p.as, false);
  ctx.restore();
}

// Sama głowa (portrety w HUD i menu)
function drawCapyHead(ctx, L, x, y, s, flip, o = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  const p = mkPose({ eye: o.eye || 0, mouth: o.mouth || 0 });
  drawHead(ctx, L, p, { t: o.t || 0, blink: false });
  ctx.restore();
}
