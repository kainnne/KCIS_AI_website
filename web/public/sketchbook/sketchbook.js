// Campus sketchbook: each Kang Chiao landmark in its own medium, layered on paper and drawn in order.
// Pencil castle on the ridge, contour-line mountains with the hiking trail, a watercolor lake with the swim route,
// ink cherry branches with watercolor blossoms and falling petals, a watercolor concert hall with an ink piano,
// a risograph archery target, a blueprint library and lab, ink birds. All layers multiply onto the paper.
import * as THREE from './three.module.min.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = matchMedia('(max-width: 760px)').matches;

/* ---------- drawing helpers (Canvas 2D: ink alpha + drawing order) ---------- */
function rng(seed) { return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const lerp = (a, b, t) => a + (b - a) * t;

function sheet(w, h) {
  const ink = Object.assign(document.createElement('canvas'), {width: w, height: h});
  const ord = Object.assign(document.createElement('canvas'), {width: w, height: h});
  const a = ink.getContext('2d'), b = ord.getContext('2d');
  b.fillStyle = '#fff'; b.fillRect(0, 0, w, h);
  for (const c of [a, b]) { c.lineCap = 'round'; c.lineJoin = 'round'; }
  return {w, h, ink, ord, a, b};
}
function maskSheet(w, h) { const c = Object.assign(document.createElement('canvas'), {width: w, height: h}); return {w, h, c, x: c.getContext('2d')}; }

// A hand-drawn line: wobble along the path.
function wob(x1, y1, x2, y2, r, amt = 1.4, step = 9) {
  const L = Math.hypot(x2 - x1, y2 - y1) || 1, n = Math.max(2, Math.ceil(L / step)), nx = -(y2 - y1) / L, ny = (x2 - x1) / L, out = [];
  let w = 0;
  for (let i = 0; i <= n; i++) { const t = i / n; w = (w + (r() - .5) * amt) * .8; out.push([lerp(x1, x2, t) + nx * w, lerp(y1, y2, t) + ny * w]); }
  return out;
}
function bez(p0, p1, p2, p3, n = 28) {
  const out = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]]); }
  return out;
}
function jitter(pts, r, amt) { return pts.map(([x, y]) => [x + (r() - .5) * amt, y + (r() - .5) * amt]); }

// Graphite or ink line: a few loose passes on the ink canvas, the drawing order on the order canvas.
function stroke(s, pts, o0, o1, r, {width = 2.2, alpha = .6, passes = 2, jit = 1.4} = {}) {
  for (let p = 0; p < passes; p++) {
    const q = jitter(pts, r, jit);
    s.a.beginPath(); q.forEach(([x, y], i) => i ? s.a.lineTo(x, y) : s.a.moveTo(x, y));
    s.a.lineWidth = width * (.7 + r() * .5); s.a.strokeStyle = `rgba(0,0,0,${alpha * (.55 + r() * .45)})`; s.a.stroke();
  }
  const n = pts.length - 1; s.b.lineWidth = width * 3 + jit * 3;
  for (let i = 0; i < n; i++) {
    const g = Math.round(Math.min(1, o0 + (o1 - o0) * i / n) * 255);
    s.b.strokeStyle = `rgb(${g},${g},${g})`; s.b.beginPath(); s.b.moveTo(pts[i][0], pts[i][1]); s.b.lineTo(pts[i + 1][0], pts[i + 1][1]); s.b.stroke();
  }
}
const line = (s, x1, y1, x2, y2, o0, o1, r, opt) => stroke(s, wob(x1, y1, x2, y2, r), o0, o1, r, opt);
function rect(s, x, y, w, h, o0, o1, r, opt) {
  const d = (o1 - o0) / 4;
  line(s, x, y, x + w, y, o0, o0 + d, r, opt); line(s, x + w, y, x + w, y + h, o0 + d, o0 + 2*d, r, opt);
  line(s, x + w, y + h, x, y + h, o0 + 2*d, o0 + 3*d, r, opt); line(s, x, y + h, x, y, o0 + 3*d, o1, r, opt);
}
// Parallel hatching clipped to a polygon.
function hatch(s, poly, ang, gap, o0, o1, r, opt = {}) {
  const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const R = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 4;
  for (const c of [s.a, s.b]) { c.save(); c.beginPath(); poly.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.clip(); }
  const dx = Math.cos(ang), dy = Math.sin(ang), n = Math.ceil(2 * R / gap);
  for (let i = 0; i <= n; i++) {
    const o = -R + i * gap + (r() - .5) * gap * .4, px = cx - dy * o, py = cy + dx * o;
    line(s, px - dx * R, py - dy * R, px + dx * R, py + dy * R, lerp(o0, o1, i / n), lerp(o0, o1, i / n) + .04, r, {width: 1.3, alpha: .42, passes: 1, jit: .8, ...opt});
  }
  s.a.restore(); s.b.restore();
}
// Sumi brush: a chain of dabs that tapers, with dry-brush gaps.
function brush(s, pts, w0, w1, o0, o1, r, alpha = .85) {
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], L = Math.hypot(x2 - x1, y2 - y1), k = Math.max(1, Math.ceil(L / 1.5));
    for (let j = 0; j < k; j++) {
      const t = (i + j / k) / n, x = lerp(x1, x2, j / k), y = lerp(y1, y2, j / k), w = lerp(w0, w1, t) * (.85 + r() * .3);
      if (r() < .05 && w < 6) continue;
      s.a.fillStyle = `rgba(0,0,0,${alpha * (.5 + r() * .5)})`; s.a.beginPath(); s.a.arc(x, y, w / 2, 0, 6.283); s.a.fill();
      const g = Math.round((o0 + (o1 - o0) * t) * 255); s.b.fillStyle = `rgb(${g},${g},${g})`; s.b.beginPath(); s.b.arc(x, y, w / 2 + 3, 0, 6.283); s.b.fill();
    }
  }
}
// Watercolor shape: a few uneven fills, so the pigment is already patchy before the shader.
function blob(m, cx, cy, rx, ry, r, {passes = 3, alpha = .55, rough = .14, pts = 48} = {}) {
  for (let p = 0; p < passes; p++) {
    m.x.beginPath();
    const ph = r() * 6.28, f1 = 2 + Math.floor(r() * 3), f2 = 5 + Math.floor(r() * 4);
    for (let i = 0; i <= pts; i++) {
      const a = i / pts * 6.283, k = 1 + rough * (Math.sin(a * f1 + ph) * .6 + Math.sin(a * f2 + ph * 2) * .4) + (r() - .5) * rough * .5;
      const x = cx + Math.cos(a) * rx * k, y = cy + Math.sin(a) * ry * k; i ? m.x.lineTo(x, y) : m.x.moveTo(x, y);
    }
    m.x.fillStyle = `rgba(0,0,0,${alpha * (.6 + r() * .4)})`; m.x.fill();
  }
}
function polyFill(m, poly, alpha = .8, r = Math.random, passes = 3, j = 7) { for (let p = 0; p < passes; p++) { m.x.beginPath(); poly.forEach(([x, y], i) => { const q = [x + (r() - .5) * j, y + (r() - .5) * j]; i ? m.x.lineTo(...q) : m.x.moveTo(...q); }); m.x.closePath(); m.x.fillStyle = `rgba(0,0,0,${alpha / passes * (1.2 + r() * .6)})`; m.x.fill(); } }

/* ---------- the drawings ---------- */
function drawCastle() {
  const s = sheet(1024, 800), r = rng(11);
  // ridges
  const ridge = [...bez([-20, 690], [180, 560], [330, 420], [470, 392]), ...bez([470, 392], [560, 380], [640, 395], [700, 430]).slice(1), ...bez([700, 430], [820, 500], [930, 560], [1044, 600]).slice(1)];
  stroke(s, ridge, 0, .16, r, {width: 2.6, alpha: .7});
  stroke(s, bez([-20, 610], [160, 470], [250, 430], [360, 440]), .04, .14, r, {width: 1.6, alpha: .35});
  stroke(s, bez([760, 470], [860, 430], [950, 450], [1044, 500]), .06, .16, r, {width: 1.6, alpha: .35});
  // trees on the slopes: small scribbled crowns
  for (let i = 0; i < 26; i++) {
    const t = r(), side = r() < .5, x = side ? lerp(60, 400, t) : lerp(720, 990, t);
    const y = side ? lerp(640, 420, t) + 18 + r() * 40 : lerp(445, 590, t) + 16 + r() * 40, h = 16 + r() * 16;
    const crown = []; for (let k = 0; k <= 14; k++) { const a = k / 14 * 6.283 * 1.6; crown.push([x + Math.cos(a) * h * .45 * (1 - k / 22), y - h * .6 + Math.sin(a) * h * .5]); }
    stroke(s, crown, .14 + t * .1, .2 + t * .1, r, {width: 1.2, alpha: .45, passes: 1});
    line(s, x, y - h * .1, x, y + 6, .2, .22, r, {width: 1.2, alpha: .45, passes: 1});
  }
  // walls with battlements
  const wallY = 352, base = 398;
  rect(s, 300, wallY, 420, base - wallY, .24, .36, r);
  for (let x = 304; x < 716; x += 22) { rect(s, x, wallY - 12, 11, 12, .3, .34, r, {width: 1.5, passes: 1}); }
  // towers: [x, y-top, width, height-to-roof-peak]
  const towers = [[324, 286, 40, 70], [394, 246, 50, 92], [470, 196, 108, 120, true], [608, 226, 50, 100], [672, 276, 40, 76]];
  towers.forEach(([x, y, w, hr, keep], i) => {
    const o = .34 + i * .07;
    rect(s, x, y, w, base - y, o, o + .08, r, {width: 2.2});
    const peak = [x + w / 2, y - hr];
    stroke(s, [...wob(x - 6, y, peak[0], peak[1], r, 1)], o + .06, o + .12, r, {width: 2.2});
    stroke(s, [...wob(peak[0], peak[1], x + w + 6, y, r, 1)], o + .08, o + .14, r, {width: 2.2});
    line(s, peak[0], peak[1], peak[0], peak[1] - 26, o + .12, o + .14, r, {width: 1.4});
    stroke(s, [[peak[0], peak[1] - 26], [peak[0] + 16, peak[1] - 21], [peak[0], peak[1] - 15]], o + .13, o + .15, r, {width: 1.4});
    // windows
    const rows = keep ? 3 : 2, cols = keep ? 3 : 1;
    for (let a = 0; a < rows; a++) for (let b = 0; b < cols; b++) {
      const wx = x + (b + .5) * w / cols - 5, wy = y + 22 + a * 30;
      stroke(s, [[wx, wy + 16], [wx, wy + 5], ...bez([wx, wy + 5], [wx, wy - 2], [wx + 10, wy - 2], [wx + 10, wy + 5], 6).slice(1), [wx + 10, wy + 16]], .74 + a * .02, .8, r, {width: 1.5, passes: 1});
    }
    // shade: right side and right half of the roof
    hatch(s, [[x + w * .62, y], [x + w, y], [x + w, base], [x + w * .62, base]], 1.25, 7, .82, .92, r);
    hatch(s, [[peak[0], peak[1]], [x + w + 6, y], [peak[0], y]], .5, 6, .86, .96, r);
  });
  // gate
  stroke(s, [[505, base], [505, 360], ...bez([505, 360], [505, 334], [545, 334], [545, 360], 8).slice(1), [545, base]], .7, .76, r, {width: 2});
  hatch(s, [[508, base], [508, 362], [542, 362], [542, base]], 1.57, 5, .9, .98, r);
  return s;
}
function drawTrail() {
  const s = sheet(1024, 800), r = rng(5);
  const path = [...bez([40, 780], [160, 700], [120, 620], [250, 590]), ...bez([250, 590], [380, 560], [300, 470], [420, 440]).slice(1), ...bez([420, 440], [470, 425], [500, 410], [525, 400]).slice(1)];
  for (let i = 0; i < path.length - 2; i += 3) stroke(s, [path[i], path[i + 1]], i / path.length, i / path.length + .03, r, {width: 3, alpha: .8, passes: 1, jit: .6});
  // a small summit flag
  stroke(s, [[250, 590], [250, 560], [266, 566], [250, 572]], .5, .56, r, {width: 2, alpha: .8, passes: 1});
  return s;
}
function drawLake() {
  const m = maskSheet(768, 300), r = rng(3);
  blob(m, 384, 150, 340, 105, r, {passes: 4, alpha: .5, rough: .1, pts: 64});
  blob(m, 300, 140, 200, 60, r, {passes: 2, alpha: .35, rough: .2});
  return m;
}
function drawSwim() {
  const s = sheet(768, 300), r = rng(9);
  const arc = bez([110, 190], [260, 90], [500, 90], [660, 170], 40);
  for (let i = 0; i < arc.length - 1; i += 2) stroke(s, [arc[i], arc[i + 1]], i / arc.length, i / arc.length + .02, r, {width: 2.2, alpha: .8, passes: 1, jit: .5});
  [[.3, 0], [.48, 1], [.62, 0]].forEach(([t, k], i) => {
    const [x, y] = arc[Math.round(t * 40)];
    s.a.fillStyle = 'rgba(0,0,0,.85)'; s.a.beginPath(); s.a.arc(x, y - 4, 6, 0, 6.283); s.a.fill();
    const g = Math.round((t + .05) * 255); s.b.fillStyle = `rgb(${g},${g},${g})`; s.b.beginPath(); s.b.arc(x, y - 4, 10, 0, 6.283); s.b.fill();
    stroke(s, [[x - 14, y + 6], [x - 4, y + 3], [x + 6, y + 6], [x + 15, y + 3]], t + .05, t + .08, r, {width: 1.4, alpha: .6, passes: 1});
  });
  return s;
}
function drawCherry() {
  const s = sheet(900, 800), m = maskSheet(900, 800), r = rng(21), tips = [];
  function branch(x, y, ang, len, w, depth, o) {
    const pts = []; let cx = x, cy = y, a = ang;
    const n = 7;
    for (let i = 0; i <= n; i++) { pts.push([cx, cy]); a += (r() - .5) * .35; cx += Math.cos(a) * len / n; cy += Math.sin(a) * len / n; }
    brush(s, pts, w, w * .55, o, o + .12, r);
    if (depth >= 4 || w < 3) { tips.push([cx, cy]); return; }
    const k = depth < 2 ? 3 : 2;
    for (let i = 0; i < k; i++) {
      const at = pts[Math.floor(lerp(3, n, (i + 1) / k))];
      branch(at[0], at[1], a + (r() - .5) * 1.3 + (i % 2 ? .45 : -.45), len * (.55 + r() * .2), w * .6, depth + 1, o + .12);
    }
  }
  branch(930, 150, 2.8, 330, 32, 0, 0);
  branch(930, 420, 3.25, 250, 20, 1, .1);
  // blossoms: clusters at the tips and along the outer branches
  for (const [x, y] of tips) for (let i = 0; i < 7; i++) {
    const a = r() * 6.283, d = r() * 38; blob(m, Math.min(870, Math.max(60, x + Math.cos(a) * d)), Math.min(770, Math.max(40, y + Math.sin(a) * d)), 12 + r() * 16, 11 + r() * 14, r, {passes: 2, alpha: .45, rough: .25, pts: 20});
  }
  // the monkey on the lower branch: a small ink silhouette
  const mx = 640, my = 452;
  brush(s, [[mx, my], [mx + 2, my - 26]], 30, 24, .92, .96, r, .9);
  brush(s, [[mx + 2, my - 34], [mx + 2, my - 36]], 20, 20, .95, .97, r, .9);
  brush(s, bez([mx + 12, my + 4], [mx + 40, my + 10], [mx + 42, my + 40], [mx + 24, my + 46], 10), 6, 3, .96, 1, r, .85);
  return {s, m, tips};
}
function drawHall() {
  const m = maskSheet(800, 640), r = rng(31);
  const path = [...bez([120, 640], [110, 420], [110, 300], [150, 220], 18), ...bez([150, 220], [240, 60], [560, 60], [650, 220], 30).slice(1), ...bez([650, 220], [690, 300], [690, 420], [680, 640], 18).slice(1)];
  for (const [x, y] of path) blob(m, x + (r() - .5) * 10, y + (r() - .5) * 10, 34 + r() * 16, 30 + r() * 14, r, {passes: 1, alpha: .22, rough: .3, pts: 18});
  for (const side of [0, 1]) for (let i = 0; i < 3; i++) {
    const x0 = side ? 610 - i * 30 : 190 + i * 30, dir = side ? -1 : 1;
    const drape = bez([x0, 250], [x0 + dir * 36, 400], [x0 + dir * 6, 520], [x0 + dir * 26, 610], 16);
    for (const [x, y] of drape) blob(m, x, y, 12 + r() * 6, 14, r, {passes: 1, alpha: .12, rough: .3, pts: 14});
  }
  blob(m, 400, 605, 300, 34, r, {passes: 3, alpha: .25, rough: .12});
  return m;
}
function drawPiano(shade = false) {
  const m = maskSheet(800, 640), s = sheet(800, 640), r = rng(41);
  const body = [[220, 470], ...bez([220, 470], [220, 380], [300, 360], [420, 372], 16).slice(1), ...bez([420, 372], [520, 382], [560, 330], [600, 380], 12).slice(1), [610, 470]];
  polyFill(m, [...body, [610, 492], [220, 492]], .7, r, 3, 5);
  polyFill(m, [[240, 372], [520, 250], [540, 262], [300, 372]], .4, r, 2, 4);
  // ink: outline, lid and prop, legs, keys, pedals
  stroke(s, body, .05, .3, r, {width: 2.6, alpha: .85});
  if (shade) { hatch(s, [...body, [610, 492], [220, 492]], .9, 7, .3, .62, r); hatch(s, [[240, 372], [520, 250], [540, 262], [300, 372]], -.5, 6, .5, .7, r); }
  line(s, 610, 470, 610, 492, .3, .32, r, {width: 2.6, alpha: .85});
  line(s, 220, 492, 610, 492, .32, .4, r, {width: 2.6, alpha: .85});
  line(s, 240, 372, 520, 252, .4, .5, r, {width: 2.4, alpha: .85});
  line(s, 400, 312, 410, 380, .5, .54, r, {width: 1.6, alpha: .8});
  for (const x of [240, 420, 590]) line(s, x, 492, x - 4 + (x > 400 ? 8 : 0), 590, .54, .62, r, {width: 3, alpha: .85});
  line(s, 404, 560, 436, 560, .62, .64, r, {width: 2, alpha: .8});
  for (let i = 0; i < 22; i++) line(s, 150 + i * 3.4, 470, 150 + i * 3.4, 492, .64 + i * .004, .66 + i * .004, r, {width: 1, alpha: .6, passes: 1});
  stroke(s, [[150, 470], [220, 470]], .64, .7, r, {width: 2, alpha: .85});
  // the staff flowing out of the piano, with notes
  for (let k = 0; k < 5; k++) {
    const y = 300 - k * 11;
    stroke(s, bez([560, y + 40], [640, y - 20], [700, y - 110], [790, y - 150], 30), .7 + k * .01, .86 + k * .01, r, {width: 1.2, alpha: .55, passes: 1});
  }
  [[610, 290], [650, 248], [690, 216], [735, 172], [770, 150]].forEach(([x, y], i) => {
    const o = .86 + i * .025;
    s.a.fillStyle = 'rgba(0,0,0,.85)'; s.a.beginPath(); s.a.ellipse(x, y, 7, 5, -.4, 0, 6.283); s.a.fill();
    const g = Math.round(o * 255); s.b.fillStyle = `rgb(${g},${g},${g})`; s.b.beginPath(); s.b.arc(x, y, 10, 0, 6.283); s.b.fill();
    line(s, x + 6, y - 2, x + 6, y - 34, o, o + .02, r, {width: 1.6, alpha: .85, passes: 1});
  });
  return {m, s};
}
function drawTarget() {
  const m = maskSheet(400, 400), s = sheet(400, 400), r = rng(51);
  for (let i = 5; i >= 1; i--) { m.x.beginPath(); m.x.arc(200, 200, i * 34, 0, 6.283); m.x.fillStyle = '#fff'; m.x.globalCompositeOperation = 'destination-out'; m.x.fill(); m.x.globalCompositeOperation = 'source-over'; m.x.fillStyle = i % 2 ? 'rgba(0,0,0,.9)' : 'rgba(0,0,0,.18)'; m.x.fill(); }
  // stand
  line(s, 120, 330, 92, 398, 0, .2, r, {width: 3, alpha: .8});
  line(s, 280, 330, 308, 398, .2, .4, r, {width: 3, alpha: .8});
  // two arrows
  for (const [x, y, a] of [[212, 190, -.5], [170, 236, -.25]]) {
    const ex = x + Math.cos(a + 3.3) * 150, ey = y + Math.sin(a + 3.3) * 150;
    line(s, x, y, ex, ey, .6, .8, r, {width: 2.2, alpha: .9});
    stroke(s, [[ex, ey], [ex - 14, ey - 10]], .8, .9, r, {width: 2, alpha: .8});
    stroke(s, [[ex, ey], [ex - 4, ey - 18]], .85, .95, r, {width: 2, alpha: .8});
  }
  return {m, s};
}
function drawLibrary() {
  const m = maskSheet(520, 420), s = sheet(520, 420), r = rng(61);
  blob(m, 260, 210, 230, 170, r, {passes: 3, alpha: .4, rough: .08});
  // book stack
  const books = [[60, 330, 210, 34], [76, 296, 178, 34], [52, 262, 196, 34], [84, 228, 150, 34]];
  books.forEach(([x, y, w, h], i) => { rect(s, x, y, w, h, i * .1, i * .1 + .1, r, {width: 2}); line(s, x + 16, y + 6, x + 16, y + h - 6, i * .1 + .08, i * .1 + .1, r, {width: 1.4}); line(s, x + w - 30, y + 10, x + w - 12, y + 10, i * .1 + .08, i * .1 + .1, r, {width: 1.4}); });
  // flask with bubbles
  stroke(s, [[350, 120], [350, 190], [292, 330], ...bez([292, 330], [286, 352], [300, 362], [318, 362], 6).slice(1), [430, 362], ...bez([430, 362], [448, 362], [460, 352], [454, 330], 6).slice(1), [398, 190], [398, 120]], .45, .75, r, {width: 2.2});
  line(s, 340, 120, 408, 120, .75, .78, r, {width: 2});
  line(s, 312, 300, 434, 300, .78, .82, r, {width: 1.6});
  [[350, 270, 10], [382, 240, 7], [366, 210, 5], [395, 284, 8]].forEach(([x, y, rr], i) => { const c = []; for (let k = 0; k <= 16; k++) c.push([x + Math.cos(k / 16 * 6.283) * rr, y + Math.sin(k / 16 * 6.283) * rr]); stroke(s, c, .84 + i * .04, .88 + i * .04, r, {width: 1.4, passes: 1}); });
  return {m, s};
}
function drawGarden() {
  const s = sheet(420, 220), r = rng(71);
  for (let row = 0; row < 2; row++) {
    const y = 96 + row * 76;
    line(s, 24 + row * 14, y + 34, 396 - row * 14, y + 34, row * .3, row * .3 + .2, r, {width: 1.6, alpha: .5, passes: 1});
    for (let x = 60 + row * 26; x < 380 - row * 10; x += 64) {
      const o = row * .3 + (x / 420) * .3 + .15, h = 30 + r() * 10;
      line(s, x, y + 32, x + 2, y + 32 - h, o, o + .05, r, {width: 2, passes: 1});
      stroke(s, bez([x + 1, y + 34 - h * .7], [x - 8, y + 6 - h * .9], [x - 30, y + 8 - h * .8], [x - 34, y + 22 - h * .7], 10), o + .04, o + .1, r, {width: 1.8, passes: 2});
      stroke(s, bez([x + 2, y + 34 - h * .55], [x + 12, y + 8 - h * .8], [x + 32, y + 12 - h * .7], [x + 36, y + 26 - h * .6], 10), o + .06, o + .12, r, {width: 1.8, passes: 2});
    }
  }
  return s;
}
function drawSplash() {
  const m = maskSheet(256, 256), r = rng(81);
  blob(m, 128, 128, 90, 82, r, {passes: 4, alpha: .45, rough: .22});
  for (let i = 0; i < 7; i++) { const a = r() * 6.283, d = 92 + r() * 22; blob(m, 128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 5 + r() * 8, 5 + r() * 7, r, {passes: 1, alpha: .5, rough: .3, pts: 14}); }
  return m;
}


// Castle as a filled silhouette, for a watercolor wash.
function drawCastleMask() {
  const m = maskSheet(1024, 800), r = rng(13);
  polyFill(m, [[-20, 700], ...bez([-20, 690], [180, 560], [330, 420], [470, 392]), ...bez([470, 392], [560, 380], [640, 395], [700, 430]).slice(1), ...bez([700, 430], [820, 500], [930, 560], [1044, 600]).slice(1), [1044, 800], [-20, 800]], .32, r, 3, 12);
  polyFill(m, [[300, 352], [720, 352], [720, 400], [300, 400]], .7, r, 3, 5);
  for (const [x, y, w, hr] of [[324, 286, 40, 70], [394, 246, 50, 92], [470, 196, 108, 120], [608, 226, 50, 100], [672, 276, 40, 76]]) {
    polyFill(m, [[x, y], [x + w, y], [x + w, 400], [x, 400]], .75, r, 3, 4);
    polyFill(m, [[x - 6, y], [x + w / 2, y - hr], [x + w + 6, y]], .9, r, 3, 4);
  }
  return m;
}
// Lake as ink ripples: wobbly rings drawn outward from the middle.
function drawLakeLines() {
  const s = sheet(768, 300), r = rng(17);
  for (let k = 0; k < 7; k++) {
    const rx = 70 + k * 46, ry = 22 + k * 15, pts = [];
    for (let i = 0; i <= 64; i++) { const a = i / 64 * 6.283; pts.push([384 + Math.cos(a) * rx * (1 + (r() - .5) * .04), 150 + Math.sin(a) * ry * (1 + (r() - .5) * .06)]); }
    stroke(s, pts, k / 7 * .8, k / 7 * .8 + .2, r, {width: 1.6, alpha: .7 - k * .06, passes: 1, jit: 1});
  }
  for (let i = 0; i < 14; i++) { const x = 90 + r() * 590, y = 60 + r() * 180; line(s, x, y, x + 26 + r() * 30, y, .6 + i * .02, .64 + i * .02, r, {width: 1.2, alpha: .5, passes: 1}); }
  return s;
}

/* ---------- shaders ---------- */
const NOISE = `
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*vn(p);p*=2.03;a*=.5;}return s;}`;
const VERT = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const MULTIPLY = {blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, transparent: true, depthTest: false, depthWrite: false};

const PENCIL = `${NOISE}
uniform sampler2D uInk,uOrd; uniform vec3 uCol; uniform float uProg,uOpacity,uGrain; varying vec2 vUv;
void main(){
  float a=texture2D(uInk,vUv).a; if(a<.004) discard;
  float o=texture2D(uOrd,vUv).r;
  float vis=smoothstep(o-.02,o,uProg*1.03);
  float g=vn(vUv*vec2(760.,540.));
  a*=vis*mix(1.,.5+.7*g,uGrain);
  a=clamp(a*uOpacity,0.,1.);
  gl_FragColor=vec4(mix(vec3(1.),uCol,a),1.);
}`;
const WATER = `${NOISE}
uniform sampler2D uMask; uniform vec3 uA,uB; uniform vec2 uSeed; uniform float uProg,uOpacity,uTime,uTexel; uniform vec3 uRip; varying vec2 vUv;
void main(){
  float m=texture2D(uMask,vUv).a; if(m<.003) discard;
  float mb=0.; for(int i=0;i<8;i++){float a=float(i)*.7854; mb+=texture2D(uMask,vUv+vec2(cos(a),sin(a))*uTexel*7.).a;} mb/=8.;
  float edge=clamp((m-mb)*3.5,0.,1.);
  float d=length(vUv-uSeed)+(fbm(vUv*4.+uSeed*7.)-.5)*.4;
  float front=uProg*1.3;
  float vis=1.-smoothstep(front-.07,front,d);
  float wet=smoothstep(front-.18,front-.02,d)*vis*(1.-step(.999,uProg));
  float g=vn(vUv*240.);
  float pig=m*(.38+.4*fbm(vUv*5.+uSeed*3.)+.6*edge+.4*wet)*(.84+.3*g);
  if(uRip.z>.001){float rd=length((vUv-uRip.xy)*vec2(2.6,1.));pig+=m*uRip.z*.18*sin(rd*70.-uTime*4.)*exp(-rd*7.);}
  vec3 col=mix(uA,uB,smoothstep(.25,.8,fbm(vUv*2.2+uSeed)));
  float a=clamp(pig*vis*uOpacity,0.,1.);
  gl_FragColor=vec4(mix(vec3(1.),col,a),1.);
}`;
const RISO = `
uniform sampler2D uMask; uniform vec3 uA,uB; uniform float uOpacity,uFreq,uDot; varying vec2 vUv;
float dots(vec2 uv,vec2 off,float ang){
  mat2 R=mat2(cos(ang),-sin(ang),sin(ang),cos(ang));
  vec2 g=R*(uv+off)*uFreq, c=floor(g)+.5;
  vec2 cu=transpose(R)*(c/uFreq)-off;
  float m=texture2D(uMask,clamp(cu,0.,1.)).a;
  float rad=sqrt(m)*uDot, d=length(fract(g)-.5);
  return smoothstep(rad,rad-.12,d)*step(.02,m);
}
void main(){
  float a1=dots(vUv,vec2(0.),.26)*uOpacity, a2=dots(vUv,vec2(.006,-.004),.79)*uOpacity*.85;
  if(a1+a2<.002) discard;
  gl_FragColor=vec4(mix(vec3(1.),uA,a1)*mix(vec3(1.),uB,a2),1.);
}`;
const CONTOUR = `${NOISE}
uniform float uProg; uniform vec2 uAspect,uPeak; varying vec2 vUv;
void main(){
  vec2 p=(vUv-.5)*uAspect;
  float h=fbm(p*.9+vec2(3.,7.))*.7+exp(-dot(p-uPeak,p-uPeak)*1.4)*.9;
  float k=h*13., f=abs(fract(k)-.5), w=fwidth(k);
  float l=1.-smoothstep(w*.5,w*1.5,f);
  float major=step(4.5,mod(floor(k+.5),5.));
  float vis=smoothstep(h-.05,h,uProg*1.7-.15);
  float a=l*(.11+.09*major)*vis;
  gl_FragColor=vec4(mix(vec3(1.),vec3(.52,.36,.62),a),1.);
}`;
const PAPER = `${NOISE}
uniform vec2 uAspect; varying vec2 vUv;
void main(){
  vec2 p=vUv*uAspect;
  float fib=vn(p*vec2(900.,70.))*.5+vn(p*vec2(70.,900.))*.5;
  float n=fbm(p*2.5);
  vec3 base=mix(vec3(.995,.962,.975),vec3(.968,.948,.99),smoothstep(.2,.9,vUv.x+n*.35-vUv.y*.2));
  base*=1.-.03*fib; base*=1.-.035*fbm(p*16.);
  base*=1.-.1*smoothstep(.45,.95,length(vUv-.5));
  gl_FragColor=vec4(base,1.);
}`;
const PETAL = `${NOISE}
varying vec2 vUv; varying float vTint;
void main(){
  vec2 p=vUv*2.-1.;
  float w=.62*(1.-p.y*p.y*.5)*(p.y>0.?1.-p.y*.35:1.);
  float d=length(vec2(p.x/w,p.y));
  float notch=1.-smoothstep(.0,.14,length(p-vec2(0.,1.02))-.12);
  float a=(1.-smoothstep(.82,1.,d))*(1.-notch);
  if(a<.01) discard;
  vec3 col=mix(vec3(.95,.66,.8),vec3(.88,.62,.9),vTint);
  a*=.55+.35*(1.-d)+.2*vn(vUv*40.);
  gl_FragColor=vec4(mix(vec3(1.),col,clamp(a,0.,1.)),1.);
}`;
const PETAL_V = `attribute float aTint; varying vec2 vUv; varying float vTint;
void main(){vUv=uv;vTint=aTint;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`;
const BIRD = `
uniform float uTime; varying vec2 vUv; varying float vPhase;
void main(){
  vec2 p=vUv*2.-1.;
  float flap=sin(uTime*7.+vPhase);
  float y0=pow(abs(p.x),.75)*(.25+.45*flap)-.05;
  float th=.16*(1.-abs(p.x))+.02;
  float a=(1.-smoothstep(th*.5,th,abs(p.y-y0)))*step(abs(p.x),.96);
  if(a<.02) discard;
  gl_FragColor=vec4(mix(vec3(1.),vec3(.2,.13,.25),a*.85),1.);
}`;
const BIRD_V = `attribute float aPhase; varying vec2 vUv; varying float vPhase;
void main(){vUv=uv;vPhase=aPhase;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`;

/* ---------- scene ---------- */
/* ---------- variants ---------- */
// entry: kcis.kainnne.com, words and cards on the left, the sketchbook on the right.
// tools: ai-tools.kcis.kainnne.com, cards in the middle, landmarks framing them, each in a different medium.
function buildEntry(k) {
  const {add, pencil, water, riso} = k;
  const castle = drawCastle(), trail = drawTrail(), lake = drawLake(), swim = drawSwim(), cherry = drawCherry(), hall = drawHall(), piano = drawPiano(), target = drawTarget(), lib = drawLibrary(), garden = drawGarden();
  const L = {
    castle: add(pencil(castle, '#3b2a45'), 'castle', -1.6, 1024 / 800),
    trail: add(pencil(trail, '#c2457e', {grain: .4}), 'castle', -1.55, 1024 / 800),
    garden: add(pencil(garden, '#5f8a62', {grain: .5, opacity: 1.6}), 'garden', -1.2, 420 / 220),
    lake: add(water(lake, '#b3abee', '#d9bdf0', [.2, .5], .72), 'lake', -1.1, 768 / 300),
    swim: add(pencil(swim, '#7b3fbf', {grain: .3}), 'lake', -1.05, 768 / 300),
    hall: add(water(hall, '#ddd0f6', '#f7c6da', [.5, .1], .55), 'hall', -.6, 800 / 640),
    pianoWash: add(water(piano.m, '#a77bb5', '#d07fa8', [.3, .7], .7), 'hall', -.55, 800 / 640),
    piano: add(pencil(piano.s, '#2a1830', {grain: .2}), 'hall', -.5, 800 / 640),
    target: add(riso(target.m, '#f07aac', '#8f78e0', 34), 'target', -.9, 1),
    arrows: add(pencil(target.s, '#2a1830', {grain: .3}), 'target', -.88, 1),
    libWash: add(water(lib.m, '#b8c4f4', '#cbbcf3', [.5, .5], .6), 'lib', -.7, 520 / 420),
    lib: add(pencil(lib.s, '#283a8a', {grain: .6}), 'lib', -.68, 520 / 420),
    branch: add(pencil(cherry.s, '#2b1b30', {grain: .35}), 'cherry', -.32, 900 / 800),
    blossom: add(water(cherry.m, '#f5b0cf', '#ec98c0', [.9, .2], .85), 'cherry', -.3, 900 / 800),
  };
  const timeline = [
    [L.castle, .15, 2.6], [L.lake, .7, 1.8], [L.hall, .9, 1.6], [L.branch, 1.0, 1.4], [L.pianoWash, 1.3, 1.3], [L.trail, 1.5, 1.4],
    [L.piano, 1.6, 1.6], [L.libWash, 1.7, 1.2], [L.lib, 1.9, 1.5], [L.blossom, 2.0, 1.5], [L.swim, 2.1, 1.3], [L.garden, 2.2, 1.2],
    [L.target, 2.4, .35, 'stamp'], [L.arrows, 2.7, .8],
  ];
  function place(portrait, h) {
    if (!portrait) return {P: {castle: [.19, .15, .36], lake: [.25, -.22, .34], cherry: [.4, .3, .28], hall: [.065, -.27, .19], target: [.42, -.02, .062], lib: [.43, -.36, .1], garden: [.32, -.05, .1]}, hide: []};
    // fit the sketchbook into the gap between the words and the cards
    const ib = document.querySelector('.intro').getBoundingClientRect().bottom, ct = document.querySelector('.cards').getBoundingClientRect().top;
    const yTop = .5 - ib / h, yBot = .5 - ct / h, band = Math.max(.18, yTop - yBot), a = k.aspect();
    const castleW = Math.min(.86, band * .62 * 1024 / 800 / a), lakeW = Math.min(.95, castleW * 1.15);
    return {P: {castle: [.02, yTop - band * .34, castleW], lake: [0, yBot + band * .2, lakeW], cherry: [.36, .34, .5],
      hall: [-.3, yBot + band * .12, .36], target: [.37, yBot + band * .55, .13], lib: [.34, yBot + band * .1, .2], garden: [-.3, yTop - band * .6, .22]},
      hide: band < .34 ? ['hall', 'target', 'lib', 'garden'] : []};
  }
  return {L, timeline, place, lake: L.lake};
}
function buildTools(k) {
  const {add, pencil, water, riso} = k;
  const castle = drawCastleMask(), trail = drawTrail(), lake = drawLakeLines(), swim = drawSwim(), cherry = drawCherry(), hall = drawHall(), piano = drawPiano(true), target = drawTarget(), lib = drawLibrary(), garden = drawGarden();
  const L = {
    castle: add(water(castle, '#cdb9f1', '#f2b6d2', [.5, .25], .8), 'castle', -1.6, 1024 / 800),
    trail: add(pencil(trail, '#b0407a', {grain: .4}), 'castle', -1.55, 1024 / 800),
    garden: add(pencil(garden, '#5f8a62', {grain: .5, opacity: 1.6}), 'garden', -1.2, 420 / 220),
    lake: add(pencil(lake, '#4d3d9a', {grain: .5}), 'lake', -1.1, 768 / 300),
    swim: add(pencil(swim, '#c2457e', {grain: .3}), 'lake', -1.05, 768 / 300),
    hall: add(riso(hall, '#d6c6f6', '#f6bcd5', 30, .3), 'hall', -.6, 800 / 640),
    piano: add(pencil(piano.s, '#33223d', {grain: 1}), 'hall', -.5, 800 / 640),
    target: add(water(target.m, '#f2a0c4', '#c7a8f0', [.5, .5], .85), 'target', -.9, 1),
    arrows: add(pencil(target.s, '#2a1830', {grain: .3}), 'target', -.88, 1),
    lib: add(pencil(lib.s, '#2b1b30', {grain: .15}), 'lib', -.68, 520 / 420),
    branch: add(pencil(cherry.s, '#4a3a52', {grain: 1}), 'cherry', -.32, 900 / 800),
    blossom: add(riso(cherry.m, '#f29cc3', '#b9a4ef', 44, .3), 'cherry', -.3, 900 / 800),
  };
  const timeline = [
    [L.castle, .15, 1.9], [L.lake, .5, 2.0], [L.branch, .8, 1.4], [L.trail, 1.1, 1.4], [L.piano, 1.2, 2.0], [L.hall, 1.6, .4, 'stamp'],
    [L.target, 1.7, 1.4], [L.lib, 1.8, 1.4], [L.swim, 2.0, 1.3], [L.garden, 2.1, 1.2], [L.blossom, 2.2, .4, 'stamp'], [L.arrows, 2.6, .8],
  ];
  function place(portrait) {
    if (!portrait) return {P: {castle: [-.33, .24, .3], cherry: [.38, .3, .3], lake: [-.3, -.31, .34], hall: [.34, -.25, .2], target: [-.445, -.02, .055], lib: [.445, .06, .085], garden: [.44, -.1, .085]}, hide: []};
    // portrait: the cards cover the middle, so the landmarks sit above, below and show through the glass
    return {P: {castle: [-.04, .24, .92], cherry: [.34, .4, .64], target: [.36, -.38, .22], lake: [-.04, -.72, .98], hall: [.06, -1.12, .62], lib: [-.26, -1.5, .4], garden: [.24, -1.82, .44]}, hide: [], scroll: .6};
  }
  return {L, timeline, place, lake: null};
}

export function mount(canvas, {variant = 'entry'} = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: 'high-performance'}); } catch { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 2));
  const scene = new THREE.Scene(), D = 10;
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 50); camera.position.set(0, 0, D);
  const H0 = 2 * D * Math.tan(15 * Math.PI / 180);
  const tex = c => { const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; };
  const plane = new THREE.PlaneGeometry(1, 1);
  const layers = [];
  let order = 0;
  const add = (mat, name, z, aspect) => { const mesh = new THREE.Mesh(plane, mat); mesh.renderOrder = order++; mesh.userData = {name, z, aspect}; scene.add(mesh); layers.push(mesh); return mesh; };
  const pencil = (s, col, {grain = 1, opacity = 1} = {}) => new THREE.ShaderMaterial({vertexShader: VERT, fragmentShader: PENCIL, ...MULTIPLY,
    uniforms: {uInk: {value: tex(s.ink)}, uOrd: {value: tex(s.ord)}, uCol: {value: new THREE.Color(col)}, uProg: {value: 0}, uOpacity: {value: opacity}, uGrain: {value: grain}}});
  const water = (m, a, b, seed, opacity = 1) => new THREE.ShaderMaterial({vertexShader: VERT, fragmentShader: WATER, ...MULTIPLY,
    uniforms: {uMask: {value: tex(m.c)}, uA: {value: new THREE.Color(a)}, uB: {value: new THREE.Color(b)}, uSeed: {value: new THREE.Vector2(...seed)}, uProg: {value: 0}, uOpacity: {value: opacity}, uTime: {value: 0}, uTexel: {value: 1 / m.w}, uRip: {value: new THREE.Vector3()}}});
  const riso = (m, a, b, freq, dot = .44) => new THREE.ShaderMaterial({vertexShader: VERT, fragmentShader: RISO, ...MULTIPLY,
    uniforms: {uMask: {value: tex(m.c)}, uA: {value: new THREE.Color(a)}, uB: {value: new THREE.Color(b)}, uOpacity: {value: 0}, uFreq: {value: freq}, uDot: {value: dot}}});

  // paper and contours fill the view behind everything
  const paper = new THREE.Mesh(plane, new THREE.ShaderMaterial({vertexShader: VERT, fragmentShader: PAPER, uniforms: {uAspect: {value: new THREE.Vector2(1, 1)}}, depthTest: false, depthWrite: false}));
  paper.renderOrder = -2; paper.position.z = -4; scene.add(paper);
  const contour = new THREE.Mesh(plane, new THREE.ShaderMaterial({vertexShader: VERT, fragmentShader: CONTOUR, ...MULTIPLY, uniforms: {uProg: {value: 0}, uAspect: {value: new THREE.Vector2(1, 1)}, uPeak: {value: new THREE.Vector2(.3, .15)}}}));
  contour.renderOrder = -1; contour.position.z = -3; scene.add(contour);

  const kit = {add, pencil, water, riso, aspect: () => camera.aspect};
  const V = (variant === 'tools' ? buildTools : buildEntry)(kit);
  const {L} = V;
  V.timeline.unshift([contour, 0, 2.2]);
  L.blossom.renderOrder = L.branch.renderOrder + .5;

  // petals and birds
  const PN = small ? 46 : 110, petals = new THREE.InstancedMesh(plane.clone(), new THREE.ShaderMaterial({vertexShader: PETAL_V, fragmentShader: PETAL, ...MULTIPLY}), PN);
  petals.geometry.setAttribute('aTint', new THREE.InstancedBufferAttribute(new Float32Array(PN).map(() => Math.random()), 1));
  petals.renderOrder = 50; petals.frustumCulled = false; scene.add(petals);
  const BN = small ? 5 : 9, birds = new THREE.InstancedMesh(plane.clone(), new THREE.ShaderMaterial({vertexShader: BIRD_V, fragmentShader: BIRD, ...MULTIPLY, uniforms: {uTime: {value: 0}}}), BN);
  birds.geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(new Float32Array(BN).map(() => Math.random() * 6.28), 1));
  birds.renderOrder = 49; birds.frustumCulled = false; scene.add(birds);

  // click on the paper: a watercolor drop
  const splash = drawSplash(), splashTex = tex(splash.c), drops = [];
  const dropColors = [['#f3a3c6', '#d98fd0'], ['#b9a6ee', '#9fb0ee'], ['#e88bb5', '#c9a3e3']];
  for (let i = 0; i < 6; i++) {
    const mat = water(splash, ...dropColors[i % 3], [.5, .5]); mat.uniforms.uMask.value = splashTex;
    const mesh = new THREE.Mesh(plane, mat); mesh.visible = false; mesh.renderOrder = 40 + i * .01; scene.add(mesh); drops.push({mesh, born: -99});
  }

  // layout in screen units; z-depth is compensated so placement reads as screen position
  let W = H0, H = H0, scrollF = 0, base = 0;
  const spots = {};
  function layout() {
    const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    H = H0; W = H0 * camera.aspect;
    const {P, hide, scroll = 0} = V.place(w / h < 1, h); scrollF = scroll;
    Object.assign(spots, P);
    for (const m of layers) {
      const [fx, fy, fw] = P[m.userData.name], z = m.userData.z, kz = (D - z) / D, w2 = fw * W; m.visible = !hide.includes(m.userData.name);
      m.position.set(fx * W * kz, fy * H * kz, z); m.scale.set(w2 * kz, w2 / m.userData.aspect * kz, 1); m.userData.w0 = w2 * kz;
    }
    const kp = (D + 4) / D; paper.scale.set(W * kp * 1.15, H * kp * 1.15, 1); paper.material.uniforms.uAspect.value.set(camera.aspect, 1);
    const kc = (D + 3) / D; contour.scale.set(W * kc * 1.12, H * kc * 1.12, 1); contour.material.uniforms.uAspect.value.set(camera.aspect, 1);
    contour.material.uniforms.uPeak.value.set(P.castle[0] * camera.aspect * .9, P.castle[1] + .05);
  }
  layout(); addEventListener('resize', layout); document.fonts?.ready.then(layout);

  // pointer: parallax, lake ripples, wind for petals, birds keep away
  const ptr = {x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0, wx: 0, wy: 0};
  const toWorld = (cx, cy, z) => { const nx = cx / innerWidth * 2 - 1, ny = 1 - cy / innerHeight * 2, kz = (D - z) / D; return [nx * W / 2 * kz + camera.position.x * (1 - kz), base + ny * H / 2 * kz + (camera.position.y - base) * (1 - kz)]; };
  let lastMove = 0;
  addEventListener('pointermove', e => {
    const nx = e.clientX / innerWidth * 2 - 1, ny = 1 - e.clientY / innerHeight * 2;
    ptr.vx = nx - ptr.tx; ptr.vy = ny - ptr.ty; ptr.tx = nx; ptr.ty = ny; lastMove = performance.now();
    [ptr.wx, ptr.wy] = toWorld(e.clientX, e.clientY, 0);
  }, {passive: true});
  addEventListener('pointerdown', e => {
    if (e.target.closest('a, button, input, textarea, select, label, [role="button"], .card, .lang, [class*="card"]')) return;
    const d = drops.reduce((a, b) => a.born < b.born ? a : b), [x, y] = toWorld(e.clientX, e.clientY, .4);
    d.born = performance.now() / 1000; d.mesh.visible = true; const s = (small ? .55 : .8) * (.8 + Math.random() * .5);
    d.mesh.position.set(x, y, .4); d.mesh.scale.set(s, s, 1); d.mesh.rotation.z = Math.random() * 6.28;
  }, {passive: true});

  const petal = Array.from({length: PN}, () => ({}));
  function spawnPetal(p, initial) {
    const [cx, cy, cw] = spots.cherry;
    p.x = (cx + (Math.random() - .3) * cw * .9) * W; p.y = (cy + (Math.random() - .4) * cw * .5) * H;
    if (scrollF) { p.x = (Math.random() - .2) * W * .7; p.y = base + H * (.5 + Math.random() * .15); }
    if (initial) { p.x = (Math.random() - .5) * W; p.y = base + (Math.random() - .5) * H; }
    p.z = .2 + Math.random() * 1.2; p.vx = -.12 - Math.random() * .2; p.vy = -.18 - Math.random() * .15;
    p.rx = Math.random() * 6; p.ry = Math.random() * 6; p.rz = Math.random() * 6; p.s = (small ? .07 : .08) * (.6 + Math.random() * .7); p.ph = Math.random() * 6.28;
  }
  petal.forEach(p => spawnPetal(p, true));
  const bird = Array.from({length: BN}, (_, i) => ({x: -W / 2 - Math.random() * W, dy: H * (.28 + Math.random() * .16), z: .6 + Math.random() * .6, v: .25 + Math.random() * .2, s: .12 + Math.random() * .08, ph: Math.random() * 6.28, enter: 3 + i * .35}));
  const dummy = new THREE.Object3D();

  const t0 = performance.now() / 1000;
  let prev = t0, running = !document.hidden;
  const ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
  function frame() {
    if (!running) return;
    const now = performance.now() / 1000, dt = Math.min(.05, now - prev), t = reduce ? 99 : now - t0; prev = now;
    for (const [mesh, s, d, mode] of V.timeline) {
      const p = ease((t - s) / d), u = mesh.material.uniforms;
      if (mode === 'stamp') { u.uOpacity.value = p; const ts = 1 + (1 - p) * .25; mesh.scale.set(mesh.userData.w0 * ts, mesh.userData.w0 / mesh.userData.aspect * ts, 1); }
      else u.uProg.value = p;
    }
    // parallax
    ptr.x += (ptr.tx - ptr.x) * .05; ptr.y += (ptr.ty - ptr.y) * .05;
    base = scrollF ? -(scrollY / innerHeight) * H * scrollF : 0;
    camera.position.x = reduce ? 0 : ptr.x * .35; camera.position.y = base + (reduce ? 0 : ptr.y * .22); camera.lookAt(0, base, 0);
    paper.position.y = base; contour.position.y = base;
    // lake ripple (watercolor lakes only)
    if (V.lake) {
      const lu = V.lake, rip = lu.material.uniforms.uRip.value, still = now * 1000 - lastMove > 1400;
      const lx = (ptr.wx * (D - lu.position.z) / D - lu.position.x) / lu.scale.x + .5, ly = (ptr.wy * (D - lu.position.z) / D - lu.position.y) / lu.scale.y + .5;
      if (lx > 0 && lx < 1 && ly > 0 && ly < 1 && !still) rip.set(lx, ly, Math.min(1, rip.z + dt * 2)); else rip.z = Math.max(0, rip.z - dt * .8);
      lu.material.uniforms.uTime.value = now;
    }
    // petals
    if (t > 2.4) {
      const wind = Math.hypot(ptr.vx, ptr.vy) * 40; ptr.vx *= .9; ptr.vy *= .9;
      petal.forEach((p, i) => {
        if (!reduce) {
          p.ph += dt; const sway = Math.sin(p.ph * 1.7) * .25;
          let ax = 0, ay = 0; const dx = p.x - ptr.wx, dy = p.y - ptr.wy, dd = dx * dx + dy * dy;
          if (wind > .02 && dd < .6) { const f = wind * .9 / (dd + .08); ax = dx * f; ay = dy * f; }
          p.vx += (ax - (p.vx + .18) * .4) * dt; p.vy += (ay - (p.vy + .22) * .4) * dt;
          p.x += (p.vx + sway * .3) * dt; p.y += p.vy * dt; p.rx += dt * 1.3; p.ry += dt * .9; p.rz += dt * .5;
          if (p.y < base - H * .62 || p.x < -W * .62) spawnPetal(p, false);
        }
        const kz = (D - p.z) / D; dummy.position.set(p.x * kz, base + (p.y - base) * kz, p.z); dummy.rotation.set(p.rx, p.ry, p.rz); dummy.scale.setScalar(p.s * Math.min(1, (t - 2.4) * .8)); dummy.updateMatrix(); petals.setMatrixAt(i, dummy.matrix);
      });
      petals.instanceMatrix.needsUpdate = true; petals.visible = true;
    } else petals.visible = false;
    // birds
    birds.material.uniforms.uTime.value = now;
    bird.forEach((b, i) => {
      if (t > b.enter && !reduce) {
        b.y = base + b.dy; const dx = b.x - ptr.wx, dy = b.y - ptr.wy, near = dx * dx + dy * dy < .5 ? 1.8 : 1;
        b.x += b.v * near * dt; b.dy += Math.sin(now * .6 + b.ph) * .03 * dt + (near > 1 ? Math.sign(dy || 1) * .15 * dt : 0);
        if (b.x > W * .62) { b.x = -W * .62; b.dy = H * (.26 + Math.random() * .18); }
      }
      b.y = base + b.dy; const kz = (D - b.z) / D; dummy.position.set(b.x * kz, base + (b.y - base) * kz, b.z); dummy.rotation.set(0, 0, Math.sin(now + b.ph) * .08); dummy.scale.set(b.s, b.s * .6, 1); dummy.updateMatrix(); birds.setMatrixAt(i, dummy.matrix);
    });
    birds.instanceMatrix.needsUpdate = true; birds.visible = t > 3;
    // drops: bloom, then fade
    for (const d of drops) if (d.mesh.visible) {
      const age = now - d.born, u = d.mesh.material.uniforms; u.uProg.value = ease(age / 1.6); u.uOpacity.value = age < 6 ? .75 : Math.max(0, .75 * (1 - (age - 6) / 4));
      if (u.uOpacity.value <= 0) d.mesh.visible = false;
    }
    renderer.render(scene, camera);
    if (!reduce) requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => { running = !document.hidden; prev = performance.now() / 1000; if (running && !reduce) requestAnimationFrame(frame); });
  requestAnimationFrame(() => { frame(); canvas.classList.add('ready'); });
  if (reduce) addEventListener('resize', () => requestAnimationFrame(frame));
  return {relayout: layout};
}
