/* ==========================================================
   Pashé · site script (plain JS, no build)
   ========================================================== */
(() => {
'use strict';

const NS = 'http://www.w3.org/2000/svg';
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smoothstep = (p, e0, e1) => { const t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const easeOut = t => 1 - Math.pow(1 - t, 3);
function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const RM = matchMedia('(prefers-reduced-motion: reduce)');

/* ----------------------------------------------------------
   1. The pizza, drawn once, then driven by progress p (0..1)
   ---------------------------------------------------------- */
const svg = document.getElementById('pizza');
const R = rng(395);
const rr = (a, b) => a + R() * (b - a);

function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function curve(pts, closed) {
  const n = pts.length, f = v => v.toFixed(1);
  const P = i => closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}
function blob(r, jit, n, sy = 1, cx = 0, cy = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, q = r * (1 + (R() * 2 - 1) * jit);
    pts.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q * sy]);
  }
  return curve(pts, true);
}
function scatter(count, rMax, minDist, existing = []) {
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < 4000) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * rMax;
    const x = Math.cos(a) * d, y = Math.sin(a) * d;
    if ([...out, ...existing].every(o => Math.hypot(o.x - x, o.y - y) > minDist)) out.push({ x, y });
  }
  return out;
}
function grad(type, id, stops, attrs = {}) {
  const g = el(type, { id, ...attrs }, defs);
  stops.forEach(([o, c, a = 1]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g));
}

const defs = el('defs', {}, svg);
grad('radialGradient', 'pzGlow', [[0, '#F59A45', .75], [.55, '#F08A3C', .28], [1, '#F08A3C', 0]]);
grad('radialGradient', 'pzShadow', [[.7, '#46280F', .30], [1, '#46280F', 0]]);
grad('radialGradient', 'pzPlate', [[0, '#FFFDF9'], [.85, '#F7F0E6'], [1, '#EADFCF']]);
grad('radialGradient', 'pzCrust', [[0, '#F3D9A6'], [.8, '#F1D29A'], [.88, '#EEBF78'], [.95, '#E0A15A'], [1, '#C98440']], { gradientUnits: 'userSpaceOnUse', cx: 0, cy: 0, r: 405 });
grad('radialGradient', 'pzBase', [[0, '#F7E4BE'], [.8, '#F1D6A2'], [1, '#E8C285']], { gradientUnits: 'userSpaceOnUse', cx: 0, cy: 0, r: 340 });
grad('radialGradient', 'pzChar', [[0, '#25130A', .95], [.55, '#4A2814', .7], [1, '#6B3A1A', 0]]);
grad('radialGradient', 'pzCream', [[0, '#FFFDF7'], [.75, '#FCF5E8'], [1, '#F1E3CB']]);
grad('radialGradient', 'pzMozz', [[0, '#FFFFFF'], [.65, '#FFF9EC'], [1, '#EFDDBC']]);
grad('radialGradient', 'pzBlister', [[0, '#C9832F', .85], [.6, '#E3A64E', .5], [1, '#E3A64E', 0]]);
grad('linearGradient', 'pzSmoked', [[0, '#F2C46A'], [.6, '#DDA048'], [1, '#B8772C']], { x1: 0, y1: 0, x2: .4, y2: 1 });
grad('linearGradient', 'pzHam', [[0, '#E08A92'], [.5, '#CC5E6B'], [1, '#B14457']], { x1: 0, y1: 0, x2: 1, y2: 1 });

const glow = el('circle', { r: 640, fill: 'url(#pzGlow)', opacity: 0 }, svg);
el('ellipse', { cx: 10, cy: 42, rx: 505, ry: 495, fill: 'url(#pzShadow)' }, svg);
el('circle', { r: 470, fill: 'url(#pzPlate)' }, svg);
el('circle', { r: 459, fill: 'none', stroke: '#EE8A3A', 'stroke-width': 20 }, svg);
el('circle', { r: 446, fill: 'none', stroke: 'rgba(120,80,40,.12)', 'stroke-width': 2 }, svg);

const pz = el('g', {}, svg);
el('path', { d: blob(404, .012, 52), fill: 'url(#pzCrust)' }, pz);
for (let i = 0; i < 16; i++) {                      // puffy rim highlights
  const a = R() * Math.PI * 2, d = rr(372, 392);
  el('ellipse', { cx: Math.cos(a) * d, cy: Math.sin(a) * d, rx: rr(14, 30), ry: rr(6, 10), transform: `rotate(${(a * 180 / Math.PI + 90).toFixed(1)} ${(Math.cos(a) * d).toFixed(1)} ${(Math.sin(a) * d).toFixed(1)})`, fill: '#FFF3D9', opacity: .5 }, pz);
}
const basePath = blob(338, .022, 40);
el('path', { d: basePath, fill: 'url(#pzBase)' }, pz);
el('path', { d: basePath, fill: 'none', stroke: 'rgba(170,110,50,.28)', 'stroke-width': 9 }, pz);

const charG = el('g', { opacity: 0 }, pz);           // leopard spots from the oven
for (let i = 0; i < 46; i++) {
  const a = R() * Math.PI * 2, d = i < 40 ? rr(350, 398) : rr(250, 330);
  const x = Math.cos(a) * d, y = Math.sin(a) * d, s = i < 40 ? rr(.6, 1.4) : rr(.4, .7);
  el('ellipse', { cx: x.toFixed(1), cy: y.toFixed(1), rx: (12 * s).toFixed(1), ry: (8 * s).toFixed(1), fill: 'url(#pzChar)', transform: `rotate(${rr(0, 180).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})` }, charG);
}
const flourG = el('g', { opacity: 1 }, pz);
for (let i = 0; i < 70; i++) {
  const a = R() * Math.PI * 2, d = Math.sqrt(R()) * 410;
  el('circle', { cx: (Math.cos(a) * d).toFixed(1), cy: (Math.sin(a) * d).toFixed(1), r: rr(1.4, 3.6).toFixed(1), fill: '#FFFDF8', opacity: rr(.5, .95).toFixed(2) }, flourG);
}

const maskBase = el('path', { d: blob(318, .06, 26), fill: 'url(#pzCream)', opacity: 0 }, pz);

const items = [];   // everything that falls
function faller(layer, i, n, w0, w1, pos, spin = 0) {
  const g = el('g', { opacity: 0 }, layer);
  const span = w1 - w0;
  const it = { g, x: pos.x, y: pos.y, rot0: rr(0, 360), spin, w0, delay: (i / n) * span * .58 + R() * span * .06, dur: span * .36, sc: 1, last: '' };
  items.push(it);
  return it;
}

const dollopG = el('g', {}, pz);
const dollops = scatter(8, 230, 120).map((p, i, a) => {
  const it = faller(dollopG, i, a.length, .21, .30, p);
  const r = rr(40, 58);
  el('path', { d: blob(r, .24, 9), fill: 'url(#pzCream)' }, it.g);
  el('path', { d: `M${(-r * .45).toFixed(0)},0 a${(r * .45).toFixed(0)},${(r * .35).toFixed(0)} 0 1 1 ${(r * .5).toFixed(0)},${(r * .2).toFixed(0)}`, fill: 'none', stroke: '#EEDFC4', 'stroke-width': 4, 'stroke-linecap': 'round' }, it.g);
  it.kind = 'dollop';
  return it;
});

const mozzG = el('g', {}, pz);
const mozzPos = scatter(10, 255, 110);
const mozz = mozzPos.map((p, i, a) => {
  const it = faller(mozzG, i, a.length, .30, .40, p);
  const d = blob(rr(44, 66), .3, 11);
  el('path', { d, fill: 'rgba(150,95,40,.16)', transform: 'translate(5 8)' }, it.g);
  el('path', { d, fill: 'url(#pzMozz)', stroke: '#EAD7B6', 'stroke-width': 2 }, it.g);
  it.kind = 'mozz';
  return it;
});
const blistG = el('g', { opacity: 0 }, pz);
mozzPos.forEach(p => {
  for (let k = 0; k < 2; k++) el('ellipse', { cx: (p.x + rr(-22, 22)).toFixed(1), cy: (p.y + rr(-18, 18)).toFixed(1), rx: rr(9, 18).toFixed(1), ry: rr(6, 12).toFixed(1), fill: 'url(#pzBlister)' }, blistG);
});

const smokedG = el('g', {}, pz);
scatter(18, 285, 52).forEach((p, i, a) => {
  const it = faller(smokedG, i, a.length, .42, .51, p, rr(-160, 160));
  const r = rr(15, 23), d = blob(r, .2, 7);
  el('path', { d, fill: 'rgba(110,60,20,.22)', transform: 'translate(3 5)' }, it.g);
  el('path', { d, fill: 'url(#pzSmoked)', stroke: '#A86A22', 'stroke-width': 1.5 }, it.g);
  el('ellipse', { cx: -r * .25, cy: -r * .3, rx: r * .35, ry: r * .18, fill: '#FBE2A8', opacity: .7 }, it.g);
  it.kind = 'smoked';
});

const hamG = el('g', {}, pz);
scatter(7, 220, 125).forEach((p, i, a) => {
  const it = faller(hamG, i, a.length, .50, .60, p, rr(-120, 120));
  const rx = rr(70, 92), ry = rr(40, 56);
  const pts = [];
  for (let k = 0; k < 18; k++) { const t = k / 18 * Math.PI * 2, q = 1 + (R() * 2 - 1) * .13 + (k % 2 ? .05 : -.04); pts.push([Math.cos(t) * rx * q, Math.sin(t) * ry * q]); }
  el('path', { d: curve(pts, true), fill: 'rgba(110,40,30,.18)', transform: 'translate(6 9)' }, it.g);
  el('path', { d: curve(pts, true), fill: 'url(#pzHam)', stroke: '#A5404F', 'stroke-width': 2.5 }, it.g);
  el('path', { d: curve([[-rx * .7, -ry * .1], [-rx * .2, -ry * .45], [rx * .3, -ry * .2], [rx * .65, -ry * .4]], false), fill: 'none', stroke: '#F5D3CF', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: .85 }, it.g);
  el('path', { d: curve([[-rx * .55, ry * .35], [-rx * .1, ry * .15], [rx * .4, ry * .38]], false), fill: 'none', stroke: '#F5D3CF', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: .7 }, it.g);
  el('path', { d: curve([[-rx * .8, ry * .05], [0, ry * .02], [rx * .8, -ry * .05]], false), fill: 'none', stroke: 'rgba(120,30,45,.28)', 'stroke-width': 3, 'stroke-linecap': 'round' }, it.g);
  it.kind = 'ham';
});

/* raspberry drizzle: a zigzag laid across the pizza */
const raspPts = [];
for (let i = 0; i <= 8; i++) {
  const t = i / 8, x = -255 + t * 510 + rr(-26, 26), y = (i % 2 ? -1 : 1) * rr(95, 175) * Math.sin(Math.PI * (.15 + t * .7)) + rr(-30, 30);
  raspPts.push([x, y]);
}
const raspD = curve(raspPts, false);
const raspG = el('g', { transform: 'rotate(-28)' }, pz);
const rasp1 = el('path', { d: raspD, pathLength: 1, fill: 'none', stroke: '#8E0F33', 'stroke-width': 13, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, raspG);
const rasp2 = el('path', { d: raspD, pathLength: 1, fill: 'none', stroke: '#D84B73', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': 1, 'stroke-dashoffset': 1, opacity: .85, transform: 'translate(-2 -3)' }, raspG);
const drops = raspPts.filter((_, i) => i % 2 === 0 && i > 0).map((p, k) => {
  const x = p[0] + rr(-14, 14), y = p[1] + rr(-14, 14);
  const g = el('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(0)` }, raspG);
  const r = rr(7, 12);
  el('circle', { r, fill: '#9E1238' }, g);
  el('circle', { cx: -r * .3, cy: -r * .35, r: r * .3, fill: '#E36A8C' }, g);
  return { g, x, y, thr: .70 + k * .012 };
});

const cache = new Map();
const setA = (node, attr, val) => {
  const key = node; let c = cache.get(key);
  if (!c) { c = {}; cache.set(key, c); }
  if (c[attr] !== val) { c[attr] = val; node.setAttribute(attr, val); }
};

function renderPizza(p) {
  const rot = -24 * p, s = .93 + .07 * easeOut(p);
  setA(pz, 'transform', `rotate(${rot.toFixed(2)}) scale(${s.toFixed(4)})`);
  const th = rot * Math.PI / 180, ux = -Math.sin(th), uy = -Math.cos(th);
  const oven = smoothstep(p, .82, .95);
  const spread = smoothstep(p, .28, .37);
  for (const it of items) {
    const t = clamp((p - it.w0 - it.delay) / it.dur, 0, 1);
    const e = easeOut(t), D = 1500 * (1 - e) / s;
    let sc = 1, op = t > 0 ? 1 : 0;
    if (it.kind === 'dollop') { sc = 1 + .45 * spread; op = t > 0 ? 1 - .45 * spread : 0; }
    if (it.kind === 'mozz') sc = 1 + .12 * oven;
    const r = it.rot0 + it.spin * (1 - e);
    setA(it.g, 'opacity', op.toFixed(3));
    if (op > 0) setA(it.g, 'transform', `translate(${(it.x + ux * D).toFixed(1)} ${(it.y + uy * D).toFixed(1)}) rotate(${r.toFixed(1)}) scale(${sc.toFixed(3)})`);
  }
  setA(maskBase, 'opacity', smoothstep(p, .27, .36).toFixed(3));
  const dr = smoothstep(p, .62, .76);
  setA(rasp1, 'stroke-dashoffset', (1 - dr).toFixed(4));
  setA(rasp2, 'stroke-dashoffset', (1 - dr).toFixed(4));
  for (const d of drops) {
    const k = easeOut(clamp((p - d.thr) / .03, 0, 1));
    setA(d.g, 'transform', `translate(${d.x.toFixed(1)} ${d.y.toFixed(1)}) scale(${k.toFixed(3)})`);
  }
  setA(charG, 'opacity', oven.toFixed(3));
  setA(blistG, 'opacity', oven.toFixed(3));
  setA(flourG, 'opacity', (1 - .55 * smoothstep(p, .2, .4) - .45 * oven).toFixed(3));
  setA(glow, 'opacity', (.9 * oven * (1 - .55 * smoothstep(p, .93, 1))).toFixed(3));
}

/* ----------------------------------------------------------
   2. Hero bands: split text once, drive opacity and --k
   ---------------------------------------------------------- */
const T = rng(17);
document.querySelectorAll('[data-split]').forEach(node => {
  const full = node.textContent.replace(/\s+/g, ' ').trim();
  const mode = node.dataset.split;
  const words = full.split(' ');
  let ci = 0;
  const total = full.replace(/ /g, '').length;
  const parent = node.closest('.band');
  const isPunch = parent && parent.classList.contains('fx-punch');
  const html = words.map((w, wi) => {
    if (mode === 'c') {
      const chars = [...w].map(ch => {
        const th = (ci / total) * .5 + T() * .05;
        const jy = (ci % 2 ? 1 : -1) * (28 + T() * 26);
        ci++;
        return `<span class="c" style="--th:${th.toFixed(3)};--jy:${jy.toFixed(0)}px">${ch}</span>`;
      }).join('');
      return `<span class="w">${chars}</span>`;
    }
    const th = isPunch ? wi * .14 : wi / words.length * .35 + T() * .05;
    const jr = (T() * 2 - 1) * 9;
    return `<span class="w" style="--th:${th.toFixed(3)};--jr:${jr.toFixed(1)}deg">${w}</span>`;
  }).join(' ');
  node.innerHTML = `<span class="sr">${full}</span><span aria-hidden="true">${html}</span>`;
});

const hero = document.querySelector('.hero');
const bandEls = [...document.querySelectorAll('.band')];
const bands = bandEls.map((el, i) => ({
  el, a: +el.dataset.a, b: +el.dataset.b, ramp: +(el.dataset.ramp || 0),
  first: i === 0, last: i === bandEls.length - 1, op: -1, k: -1, vis: null
}));
const cue = document.querySelector('.cue');
let loadK = 0, cueOp = -1;

function updateCaptions(p) {
  for (const B of bands) {
    const f = Math.min(.02, (B.b - B.a) / 3);
    const inE = B.first ? 1 : smoothstep(p, B.a, B.a + f);
    const outE = B.last ? 1 : 1 - smoothstep(p, B.b - f, B.b);
    let op = (B.first && p < B.a) ? 1 : inE * outE;
    if (!B.first && p < B.a) op = 0;
    if (!B.last && p > B.b) op = 0;
    let k = clamp((p - B.a) / (B.ramp || Math.min(.025, (B.b - B.a) * .35)), 0, 1);
    if (B.first) k = Math.max(k, loadK);
    op = Math.round(op * 1000) / 1000;
    if (Math.abs(op - B.op) > .003 || (op === 0 || op === 1) && op !== B.op) { B.op = op; B.el.style.opacity = op; }
    const vis = op > .02;
    if (vis !== B.vis) { B.vis = vis; B.el.style.visibility = vis ? 'visible' : 'hidden'; }
    if (Math.abs(k - B.k) > .008 || (k === 0 || k === 1) && k !== B.k) { B.k = k; B.el.style.setProperty('--k', k.toFixed(3)); }
  }
  const co = Math.round((1 - smoothstep(p, .05, .12)) * 100) / 100;
  if (co !== cueOp && cue) { cueOp = co; cue.style.opacity = co; }
}

/* ----------------------------------------------------------
   3. Scroll drive: lerped, resting rAF loop
   ---------------------------------------------------------- */
let heroTop = 0, heroRange = 1;
function measure() { heroTop = hero.offsetTop; heroRange = Math.max(1, hero.offsetHeight - innerHeight); }
const heroProgress = () => clamp((scrollY - heroTop) / heroRange, 0, 1);

let target = 0, shown = 0, rafId = null, lastTick = 0, heroOnScreen = true, scrubOn = false;
function tick(now) {
  const dt = Math.min(100, now - (lastTick || now));
  lastTick = now;
  shown += (target - shown) * (1 - Math.pow(1 - .14, dt / 16.667));
  if (Math.abs(target - shown) < .0005) { shown = target; rafId = null; lastTick = 0; }
  else rafId = requestAnimationFrame(tick);
  renderPizza(shown);
  updateCaptions(shown);
}
function onScroll() {
  target = heroProgress();
  if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick);
}
new IntersectionObserver(es => { heroOnScreen = es[0].isIntersecting; if (heroOnScreen && scrubOn) onScroll(); }).observe(hero);

/* band one assembles itself on load, then hands over to scroll */
function loadRamp() {
  const t0 = performance.now();
  const step = now => {
    loadK = easeOut(clamp((now - t0 - 250) / 1100, 0, 1));
    if (scrubOn) updateCaptions(shown);
    if (loadK < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* five static-hero gates, identical to the CSS */
const GATES = [
  '(max-width: 720px)',
  '(orientation: portrait) and (max-width: 1024px)',
  '(orientation: portrait) and (pointer: coarse)',
  '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
  '(prefers-reduced-motion: reduce)'
];
const MQLS = GATES.map(q => matchMedia(q));
function enableScrub() {
  if (scrubOn) return; scrubOn = true;
  measure();
  addEventListener('scroll', onScroll, { passive: true });
  bands.forEach(b => { b.op = -1; b.k = -1; b.vis = null; });
  cueOp = -1;
  shown = target = heroProgress();
  renderPizza(shown);
  updateCaptions(shown);
  onScroll();
}
function disableScrub() {
  if (scrubOn) {
    scrubOn = false;
    removeEventListener('scroll', onScroll);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  }
  bands.forEach(b => { b.el.style.opacity = ''; b.el.style.visibility = ''; });
  renderPizza(1);
}
function applyHeroMode() {
  if (MQLS.some(m => m.matches)) disableScrub(); else enableScrub();
}
MQLS.forEach(m => m.addEventListener('change', applyHeroMode));
addEventListener('resize', () => { if (scrubOn) { measure(); onScroll(); } });
applyHeroMode();
loadRamp();

/* ----------------------------------------------------------
   4. Entrances, living elements, pause on hidden tab
   ---------------------------------------------------------- */
const revealIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  revealIO.unobserve(e.target);
  setTimeout(() => e.target.classList.add('done'), 1800);
}), { threshold: .18 });
document.querySelectorAll('[data-reveal]').forEach(n => revealIO.observe(n));

const liveIO = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('live', e.isIntersecting)), { rootMargin: '10% 0px' });
document.querySelectorAll('.live-scope').forEach(n => liveIO.observe(n));

document.addEventListener('visibilitychange', () => document.body.classList.toggle('paused', document.hidden));

/* ----------------------------------------------------------
   5. Rotating pizzas
   ---------------------------------------------------------- */
const PIZZAS = [
  { id: 'pashe-pizza', name: 'Pashe pizza', words: ['Maskarpone.', 'Suvi vrat.', 'Malina.'], ing: 'Maskarpone, mocarela, dimljeni sir, suvi vrat, sos od maline', price: '1.760' },
  { id: 'capricciosa', name: 'Capricciosa', words: ['Šunka.', 'Šampinjoni.', 'Masline.'], ing: 'Pelat, mocarela, šunka, šampinjoni, masline', price: '1.490' },
  { id: 'margherita', name: 'Margherita', words: ['Pelat.', 'Mocarela.', 'Bosiljak.'], ing: 'Pelat, mocarela, parmezan, bosiljak', price: '1.260' },
  { id: 'mortadela-pistac', name: 'Mortadela pistać', words: ['Mortadela.', 'Rikota.', 'Pistać.'], ing: 'Mortadela, rikota, mocarela, pistać', price: '1.560' },
  { id: 'dolce-fumo', name: 'Dollce fumo', words: ['Suvi vrat.', 'Gorgonzola.', 'Pesto.'], ing: 'Pelat, mocarela, suvi vrat, gorgonzola, paradajz, domaći pesto sos', price: '1.860' },
  { id: 'bosco-croccante', name: 'Bosco croccante', words: ['Gorgonzola.', 'Pančeta.', 'Lešnik.'], ing: 'Gorgonzola, mocarela, pančeta, lešnik, bosiljak', price: '1.630' },
  { id: 'angel-peperoni', name: 'Angel peperoni', words: ['Pikantna salama.', 'Jalapeño.'], ing: 'Pelat, dimljeni sir, pikantna salama, jalapeño, parmezan', price: '1.640' },
  { id: 'alfredo-di-carne', name: 'Alfredo di Carne', words: ['Kulen.', 'Pančeta.', 'Alfredo sos.'], ing: 'Pelat, mocarela, šunka, kulen, pančeta, suvi vrat, Alfredo sos', price: '1.860' }
];
const rot = document.querySelector('.rot');
if (rot) {
  const wordsBox = rot.querySelector('.rot-words'), stage = rot.querySelector('.rot-stage');
  const nameEl = rot.querySelector('.rot-name'), ingEl = rot.querySelector('.rot-ing'), priceEl = rot.querySelector('.rot-price'), countEl = rot.querySelector('.rot-count');
  const wordEls = PIZZAS.map((pz, i) => {
    const p = document.createElement('p');
    p.className = 'rw' + (i === 0 ? ' on' : '');
    p.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    p.innerHTML = pz.words.map(w => `<span class="w">${w}</span>`).join(' ');
    wordsBox.appendChild(p);
    return p;
  });
  const imgEls = PIZZAS.map((pz, i) => {
    const d = document.createElement('div');
    d.className = 'rot-img' + (i === 0 ? ' on' : '');
    d.innerHTML = `<img src="assets/img/pz-${pz.id}.jpg" width="900" height="900" alt="${pz.name}, pogled odozgo" ${i ? 'loading="lazy"' : ''}>`;
    stage.appendChild(d);
    return d;
  });
  let cur = 0, timer = null, hover = false;
  const pad = n => String(n).padStart(2, '0');
  function go(n) {
    const prev = cur;
    cur = (n + PIZZAS.length) % PIZZAS.length;
    if (prev === cur) return;
    wordEls[prev].classList.remove('on'); wordEls[prev].classList.add('off'); wordEls[prev].setAttribute('aria-hidden', 'true');
    imgEls[prev].classList.remove('on'); imgEls[prev].classList.add('off');
    setTimeout(() => { wordEls[prev].classList.remove('off'); imgEls[prev].classList.remove('off'); }, 1100);
    wordEls[cur].classList.add('on'); wordEls[cur].setAttribute('aria-hidden', 'false');
    imgEls[cur].classList.add('on');
    const pz = PIZZAS[cur];
    nameEl.textContent = pz.name; ingEl.textContent = pz.ing; priceEl.textContent = pz.price + ' din';
    countEl.textContent = `${pad(cur + 1)} / ${pad(PIZZAS.length)}`;
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (RM.matches || hover || !rot.classList.contains('live')) return;
    timer = setTimeout(() => go(cur + 1), 4800);
  }
  rot.querySelector('.rot-next').addEventListener('click', () => go(cur + 1));
  rot.querySelector('.rot-prev').addEventListener('click', () => go(cur - 1));
  rot.addEventListener('pointerenter', () => { hover = true; clearTimeout(timer); });
  rot.addEventListener('pointerleave', () => { hover = false; schedule(); });
  rot.addEventListener('focusin', () => { hover = true; clearTimeout(timer); });
  rot.addEventListener('focusout', () => { hover = false; schedule(); });
  new MutationObserver(schedule).observe(rot, { attributes: true, attributeFilter: ['class'] });
  countEl.textContent = `01 / ${pad(PIZZAS.length)}`;
  RM.addEventListener('change', schedule);
}

/* ----------------------------------------------------------
   6. Menu tabs + photo peek
   ---------------------------------------------------------- */
const tabs = [...document.querySelectorAll('.tab')];
function selectTab(t, focus) {
  tabs.forEach(x => {
    const on = x === t;
    x.setAttribute('aria-selected', on ? 'true' : 'false');
    x.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(x.getAttribute('aria-controls'));
    panel.hidden = !on;
    panel.classList.toggle('show', on);
  });
  if (focus) t.focus();
  t.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: RM.matches ? 'auto' : 'smooth' });
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', e => {
    let j = null;
    if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
    if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') j = 0;
    if (e.key === 'End') j = tabs.length - 1;
    if (j !== null) { e.preventDefault(); selectTab(tabs[j], true); }
  });
});
document.querySelectorAll('.panel').forEach(p => [...p.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 14))));

const peek = document.querySelector('.peek');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
if (peek) {
  const pimg = peek.querySelector('img');
  let px = 0, py = 0, pr = null, curImg = '';
  const place = () => { pr = null; peek.style.transform = `translate(${px}px,${py}px)`; };
  document.querySelector('.panels').addEventListener('pointermove', e => {
    if (!fine.matches) return;
    const item = e.target.closest('.item[data-img]');
    if (!item) { peek.classList.remove('on'); return; }
    const src = `assets/img/${item.dataset.img}.jpg`;
    if (src !== curImg) { curImg = src; pimg.src = src; }
    peek.classList.add('on');
    px = e.clientX; py = e.clientY;
    if (pr === null) pr = requestAnimationFrame(place);
  });
  document.querySelector('.panels').addEventListener('pointerleave', () => peek.classList.remove('on'));
  addEventListener('scroll', () => peek.classList.remove('on'), { passive: true });
}

/* ----------------------------------------------------------
   7. "Baci parče": slices with a little physics
   ---------------------------------------------------------- */
const cvs = document.getElementById('slices');
const ctx = cvs.getContext('2d');
const sprite = document.createElement('canvas');
(function drawSprite() {
  const S = 128; sprite.width = sprite.height = S;
  const c = sprite.getContext('2d');
  c.translate(S / 2, S / 2);
  c.beginPath(); c.moveTo(-42, -34); c.quadraticCurveTo(0, -60, 42, -34); c.lineTo(3, 56); c.quadraticCurveTo(0, 60, -3, 56); c.closePath();
  c.fillStyle = '#F7DB97'; c.fill();
  c.lineWidth = 12; c.lineCap = 'round'; c.strokeStyle = '#D9893C';
  c.beginPath(); c.moveTo(-42, -34); c.quadraticCurveTo(0, -60, 42, -34); c.stroke();
  c.lineWidth = 7; c.strokeStyle = '#E9A95C';
  c.beginPath(); c.moveTo(-36, -36); c.quadraticCurveTo(0, -56, 36, -36); c.stroke();
  [[-14, -14, 10], [14, -8, 9], [-2, 14, 8], [6, 34, 5]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = '#C55B66'; c.fill(); c.beginPath(); c.arc(x - r * .3, y - r * .3, r * .3, 0, 7); c.fillStyle = '#F2B5B8'; c.fill(); });
  c.lineWidth = 4; c.strokeStyle = '#A5133E'; c.beginPath(); c.moveTo(-26, -22); c.bezierCurveTo(-10, -4, 0, -30, 18, -18); c.bezierCurveTo(28, -10, 10, 8, 4, 22); c.stroke();
})();

const bodies = [];
let dropped = 0, simRaf = null, simLast = 0, W = 0, H = 0;
const countEl = document.querySelector('.drop-count');
function sizeCanvas() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  cvs.width = W * dpr; cvs.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
sizeCanvas();
addEventListener('resize', sizeCanvas);
function dropSlice() {
  if (RM.matches) return;
  if (bodies.length >= 40) bodies.shift();
  bodies.push({ x: W * (.12 + Math.random() * .76), y: -70, vx: (Math.random() * 2 - 1) * 140, vy: Math.random() * 120, a: Math.random() * 6.28, va: (Math.random() * 2 - 1) * 5, age: 0, alpha: 1 });
  dropped++;
  if (countEl) countEl.textContent = 'Bačeno: ' + dropped;
  if (simRaf === null) { simLast = 0; simRaf = requestAnimationFrame(sim); }
}
const RAD = 38, G = 2400;
function sim(now) {
  const dt = Math.min(.033, (now - (simLast || now)) / 1000); simLast = now;
  const sub = 3, h = dt / sub;
  for (let s = 0; s < sub; s++) {
    for (const b of bodies) {
      b.vy += G * h; b.x += b.vx * h; b.y += b.vy * h; b.a += b.va * h;
      const floor = H - RAD * 1.25;
      if (b.y > floor) { b.y = floor; if (b.vy > 0) b.vy *= -.25; b.vx *= .9; b.va = b.va * .8 + b.vx / RAD * .05; }
      if (b.x < RAD) { b.x = RAD; b.vx = Math.abs(b.vx) * .5; }
      if (b.x > W - RAD) { b.x = W - RAD; b.vx = -Math.abs(b.vx) * .5; }
    }
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const A = bodies[i], B = bodies[j];
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || .01, min = RAD * 1.7;
      if (d < min) {
        const nx = dx / d, ny = dy / d, push = (min - d) / 2;
        A.x -= nx * push; A.y -= ny * push; B.x += nx * push; B.y += ny * push;
        const rv = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
        if (rv < 0) { const j2 = -(1.2) * rv / 2; A.vx -= j2 * nx; A.vy -= j2 * ny; B.vx += j2 * nx; B.vy += j2 * ny; A.va += rv * .004; B.va -= rv * .004; }
      }
    }
  }
  ctx.clearRect(0, 0, W, H);
  for (let i = bodies.length - 1; i >= 0; i--) {
    const b = bodies[i];
    b.age += dt;
    if (b.age > 9) b.alpha -= dt / 1.2;
    if (b.alpha <= 0) { bodies.splice(i, 1); continue; }
    ctx.save(); ctx.globalAlpha = b.alpha; ctx.translate(b.x, b.y); ctx.rotate(b.a);
    ctx.drawImage(sprite, -48, -48, 96, 96);
    ctx.restore();
  }
  simRaf = bodies.length ? requestAnimationFrame(sim) : null;
  if (!bodies.length) ctx.clearRect(0, 0, W, H);
}
document.querySelectorAll('[data-drop]').forEach(b => b.addEventListener('click', dropSlice));

/* ----------------------------------------------------------
   8. Open now? (Belgrade time)
   ---------------------------------------------------------- */
function openState() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Belgrade', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const get = t => parts.find(p => p.type === t).value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  const m = +get('hour') * 60 + +get('minute');
  if (m >= 480) return { open: true, until: (day === 5 || day === 6) ? '01:00' : '00:00' };
  if (m < 60 && (day === 6 || day === 0)) return { open: true, until: '01:00' };
  return { open: false };
}
const statusBox = document.querySelector('.status'), statusTxt = document.querySelector('[data-status]'), nowEl = document.querySelector('[data-now]');
let lastStatus = '';
function paintStatus() {
  const s = openState();
  const txt = s.open ? `Sada radimo · do ${s.until}` : 'Sada ne radimo · otvaramo u 08:00';
  if (txt === lastStatus) return;
  lastStatus = txt;
  statusTxt.textContent = txt;
  statusBox.classList.toggle('closed', !s.open);
  if (nowEl) { nowEl.hidden = false; nowEl.textContent = txt; }
}
paintStatus();
setInterval(paintStatus, 60000);

/* ----------------------------------------------------------
   9. Pill nav, current section, light/dark chrome
   ---------------------------------------------------------- */
const pill = document.querySelector('.pill');
setTimeout(() => pill.classList.add('up'), 700);
const links = [...pill.querySelectorAll('a[href^="#"]')];
const secIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  links.forEach(a => {
    if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
}), { rootMargin: '-45% 0px -50% 0px' });
['pice', 'meni', 'dan', 'utisci', 'lokal', 'kontakt'].forEach(id => { const n = document.getElementById(id); if (n) secIO.observe(n); });

const darkIO = new IntersectionObserver(es => {
  es.forEach(e => e.target._dark = e.isIntersecting);
  document.body.classList.toggle('on-dark', [...document.querySelectorAll('.day,.place')].some(n => n._dark));
}, { rootMargin: '-92% 0px 0px 0px' });
document.querySelectorAll('.day,.place').forEach(n => darkIO.observe(n));

/* ----------------------------------------------------------
   10. Reduced motion, honored live in both directions
   ---------------------------------------------------------- */
function pinToFinalStates() {
  document.body.classList.add('pinned');
  bodies.length = 0; ctx.clearRect(0, 0, W, H);
  renderPizza(1);
}
RM.addEventListener('change', e => {
  if (e.matches) pinToFinalStates();
  else { document.body.classList.remove('pinned'); applyHeroMode(); }
});
if (RM.matches) pinToFinalStates();

})();
