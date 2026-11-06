/* Q/A canvas — mountMorph from sample/imdb-datamining-presentation.html, palette → deck green */
(function(){
"use strict";
const SVG_TICK = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 200 200"><path d="M30 108 L78 156 L172 44" fill="none" stroke="#000" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SVG_QUESTION = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 200 200"><path d="M60 70 C60 28 140 24 140 72 C140 106 100 108 100 140" fill="none" stroke="#000" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/><circle cx="100" cy="176" r="17" fill="#000"/></svg>';
const SVG_COMMENT = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 200 200"><rect x="12" y="16" width="124" height="88" rx="22" fill="#000"/><path d="M34 98 L32 134 L70 100 Z" fill="#000" stroke="#000" stroke-width="6" stroke-linejoin="round"/><rect x="32" y="42" width="76" height="9" rx="4.5" fill="#fff"/><rect x="32" y="62" width="52" height="9" rx="4.5" fill="#fff"/><path d="M158 158 L170 196 L128 162 Z" fill="#000"/><rect x="64" y="80" width="124" height="88" rx="22" fill="#000" stroke="#fff" stroke-width="8"/><circle cx="98" cy="124" r="10" fill="#fff"/><circle cx="126" cy="124" r="10" fill="#fff"/><circle cx="154" cy="124" r="10" fill="#fff"/></svg>';

function mountMorph(opt){
const DEFS = opt.defs;
const SIZE = opt.size, N = opt.n, HOLD = opt.hold, MORPH = opt.morph;
const R1 = opt.r1 || 3.2, R2 = opt.r2 || 1.55;

const cv = document.getElementById(opt.id);
if (!cv) return;
cv.width = cv.height = SIZE;
const ctx = cv.getContext("2d");
const host = cv.closest(".slide");

const zs = new Float32Array(N);
for (let i = 0; i < N; i++) zs[i] = (Math.random() - 0.5) * 0.2;

const scr = new Float32Array(N * 2);
let shapes = [], cur = null, from = null, to = null;
let dl = new Float32Array(N), du = new Float32Array(N);
let idx = 0, morphAt = -1e9, lastSwitch = -1e9;

function raster(svg){
  return new Promise(function(res){
    const c = document.createElement("canvas");
    c.width = c.height = SIZE;
    const g = c.getContext("2d", { willReadFrequently: true });
    const img = new Image();
    img.onload = function(){
      const iw = img.naturalWidth || SIZE, ih = img.naturalHeight || SIZE;
      const k = Math.min(SIZE / iw, SIZE / ih) * 0.92;
      const w = iw * k, h = ih * k;
      g.clearRect(0, 0, SIZE, SIZE);
      g.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
      res(c);
    };
    img.onerror = function(){ res(null); };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

function sample(c){
  const g = c.getContext("2d");
  let d;
  try { d = g.getImageData(0, 0, SIZE, SIZE).data; } catch (e) { return null; }
  const mask = new Uint8Array(SIZE * SIZE), px = [];
  let minX = SIZE, maxX = 0, minY = SIZE, maxY = 0;
  for (let y = 0; y < SIZE; y++){
    for (let x = 0; x < SIZE; x++){
      const i = (y * SIZE + x) * 4;
      if (d[i + 3] > 80 && (d[i] + d[i + 1] + d[i + 2]) / 3 < 235){
        mask[y * SIZE + x] = 1;
        px.push(x, y);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (px.length < 400) return null;
  const R = 2, edge = [], fill = [];
  for (let k = 0; k < px.length; k += 2){
    const x = px[k], y = px[k + 1];
    const e = x < R || y < R || x >= SIZE - R || y >= SIZE - R ||
      !mask[y * SIZE + x - R] || !mask[y * SIZE + x + R] ||
      !mask[(y - R) * SIZE + x] || !mask[(y + R) * SIZE + x];
    (e ? edge : fill).push(x, y);
  }
  const dim = Math.max(maxX - minX, maxY - minY, 1);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const out = new Float32Array(N * 2);
  for (let i = 0; i < N; i++){
    const src = (edge.length && (!fill.length || Math.random() < 0.45)) ? edge : fill;
    const j = (Math.random() * src.length / 2) | 0;
    out[i * 2]     = (src[j * 2] - cx) / dim * 2;
    out[i * 2 + 1] = -(src[j * 2 + 1] - cy) / dim * 2;
  }
  return out;
}

function draw(now){
  const a = Math.sin(now * 0.00028) * 0.26;
  const ca = Math.cos(a), sa = Math.sin(a);
  const S = SIZE * 0.425, ox = SIZE / 2, oy = SIZE / 2;
  ctx.clearRect(0, 0, SIZE, SIZE);
  for (let i = 0; i < N; i++){
    const x = cur[i * 2], y = cur[i * 2 + 1];
    scr[i * 2]     = ox + (x * ca + zs[i] * sa) * S;
    scr[i * 2 + 1] = oy - y * S;
  }
  ctx.beginPath();
  for (let i = 0; i < N; i++){
    const sx = scr[i * 2], sy = scr[i * 2 + 1];
    ctx.moveTo(sx + R1, sy);
    ctx.arc(sx, sy, R1, 0, 6.2832);
  }
  ctx.fillStyle = "rgba(167,227,191,0.45)";
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i < N; i++){
    const sx = scr[i * 2], sy = scr[i * 2 + 1];
    ctx.moveTo(sx + R2, sy);
    ctx.arc(sx, sy, R2, 0, 6.2832);
  }
  ctx.fillStyle = "rgba(4,120,87,0.78)";
  ctx.fill();
}

function loop(now){
  requestAnimationFrame(loop);
  if (!cur) return;
  if (host && !host.classList.contains("on")) return;
  if (shapes.length > 1 && now - lastSwitch > HOLD + MORPH){
    lastSwitch = now;
    from = new Float32Array(cur);
    idx = (idx + 1) % shapes.length;
    to = shapes[idx];
    for (let i = 0; i < N; i++){
      dl[i] = Math.random() * MORPH * 0.35;
      du[i] = MORPH * (0.55 + Math.random() * 0.45);
    }
    morphAt = now;
  }
  const el = now - morphAt;
  for (let i = 0; i < N; i++){
    let t = (el - dl[i]) / du[i];
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const e = 1 - Math.pow(1 - t, 3);
    cur[i * 2]     = from[i * 2]     + (to[i * 2]     - from[i * 2])     * e;
    cur[i * 2 + 1] = from[i * 2 + 1] + (to[i * 2 + 1] - from[i * 2 + 1]) * e;
  }
  draw(now);
}

(function boot(){
  let i = 0;
  (function next(){
    if (i >= DEFS.length){
      if (!shapes.length){
        const f = new Float32Array(N * 2);
        for (let k = 0; k < N; k++){
          const ang = k / N * Math.PI * 2 * 9, rr = 0.55 + 0.35 * Math.random();
          f[k * 2] = Math.cos(ang) * rr;
          f[k * 2 + 1] = Math.sin(ang) * rr;
        }
        shapes.push(f);
      }
      cur = new Float32Array(shapes[0]);
      from = new Float32Array(shapes[0]);
      to = shapes[0];
      lastSwitch = performance.now();
      draw(lastSwitch);
      requestAnimationFrame(loop);
      return;
    }
    raster(DEFS[i]).then(function(c){
      const p = c && sample(c);
      if (p) shapes.push(p);
      i++;
      next();
    });
  })();
})();
}

mountMorph({ id:"pc20", defs:[SVG_TICK, SVG_QUESTION, SVG_COMMENT], size:440, n:1500, hold:3600, morph:1200, r1:2.7, r2:1.35 });
})();
