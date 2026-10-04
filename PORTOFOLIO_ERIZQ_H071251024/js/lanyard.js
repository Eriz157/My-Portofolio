
/*PHYSICS-START*/
/* =========================================================
   FISIKA — tali (Verlet / position based) + kartu kaku
   ========================================================= */
function createWorld(P, dropIt) {
  const M = P.M, R = M + 1, A = M + 2, B = M + 3, C = M + 4, D = M + 5, n = M + 6;
  const X = new Float64Array(n), Y = new Float64Array(n);
  const OX = new Float64Array(n), OY = new Float64Array(n), IM = new Float64Array(n);
  const IM_ROPE = 1, IM_CARD = 0.18;
  for (let i = 0; i <= M; i++) IM[i] = IM_ROPE;
  IM[0] = 0; IM[R] = IM_ROPE;
  IM[A] = IM[B] = IM[C] = IM[D] = IM_CARD;

  // posisi lokal sudut kartu terhadap lubang gantung (R)
  const loc = [
    [-P.w / 2, -P.pivot], [P.w / 2, -P.pivot],
    [P.w / 2, P.h - P.pivot], [-P.w / 2, P.h - P.pivot]
  ];
  const cardIdx = [A, B, C, D];

  // ---- pose awal
  let rx, ry, tilt;
  if (dropIt) { rx = P.ax + P.side * P.dx; ry = -P.h - 12; tilt = -P.side * 0.32; }
  else { rx = P.ax; ry = P.rest; tilt = 0; }
  X[R] = rx; Y[R] = ry;
  const cs = Math.cos(tilt), sn = Math.sin(tilt);
  for (let k = 0; k < 4; k++) {
    const lx = loc[k][0], ly = loc[k][1];
    X[cardIdx[k]] = rx + lx * cs - ly * sn;
    Y[cardIdx[k]] = ry + lx * sn + ly * cs;
  }
  const cx = rx, cy = ry - P.clip;           // ujung tali (crimp) tepat di atas klip
  if (dropIt) {
    const dx = cx - P.ax, dy = cy - P.ay, dist = Math.hypot(dx, dy) || 1;
    const nx = -dy / dist, ny = dx / dist;
    for (let i = 0; i <= M; i++) {
      const t = i / M, bulge = 0.12 * dist * Math.sin(Math.PI * t) * P.side;
      X[i] = P.ax + dx * t + nx * bulge;
      Y[i] = P.ay + dy * t + ny * bulge;
    }
  } else {
    for (let i = 0; i <= M; i++) { X[i] = P.ax; Y[i] = P.ay + i * P.seg; }
  }
  X[0] = P.ax; Y[0] = P.ay;
  OX.set(X); OY.set(Y);

  // ---- constraint
  const cons = [];
  for (let i = 0; i < M; i++) cons.push({ i, j: i + 1, len: P.seg, t: 0 });            // tali (tarik saja)
  for (let i = 0; i < M - 1; i++) cons.push({ i, j: i + 2, len: P.seg * 2, t: 2 });    // kekakuan tekuk
  cons.push({ i: M, j: R, len: P.clip, t: 1 });                                         // klip kaku
  for (let a = 0; a < 4; a++) {
    for (let b = a + 1; b < 4; b++) {
      cons.push({ i: cardIdx[a], j: cardIdx[b], len: Math.hypot(loc[a][0] - loc[b][0], loc[a][1] - loc[b][1]), t: 1 });
    }
    cons.push({ i: R, j: cardIdx[a], len: Math.hypot(loc[a][0], loc[a][1]), t: 1 });
  }

  const STRETCH = 1.0, COMPRESS = 0.12, BEND = 0.14;
  const drag = { active: false, u: .5, v: .5, x: 0, y: 0, k: 0.7 };

  function solve(c) {
    const i = c.i, j = c.j;
    const dx = X[j] - X[i], dy = Y[j] - Y[i];
    const d = Math.hypot(dx, dy) || 1e-6;
    let diff = d - c.len;
    if (c.t === 0) diff *= diff > 0 ? STRETCH : COMPRESS;
    else if (c.t === 2) { if (diff >= 0) return; diff *= BEND; }
    const w = IM[i] + IM[j];
    if (w === 0) return;
    const k = diff / d / w;
    X[i] += dx * k * IM[i]; Y[i] += dy * k * IM[i];
    X[j] -= dx * k * IM[j]; Y[j] -= dy * k * IM[j];
  }

  function applyDrag() {
    const u = drag.u, v = drag.v;
    const wA = (1 - u) * (1 - v), wB = u * (1 - v), wC = u * v, wD = (1 - u) * v;
    const sx = wA * X[A] + wB * X[B] + wC * X[C] + wD * X[D];
    const sy = wA * Y[A] + wB * Y[B] + wC * Y[C] + wD * Y[D];
    const dx = drag.x - sx, dy = drag.y - sy;
    const den = IM[A] * wA * wA + IM[B] * wB * wB + IM[C] * wC * wC + IM[D] * wD * wD || 1e-9;
    const k = drag.k / den;
    X[A] += dx * IM[A] * wA * k; Y[A] += dy * IM[A] * wA * k;
    X[B] += dx * IM[B] * wB * k; Y[B] += dy * IM[B] * wB * k;
    X[C] += dx * IM[C] * wC * k; Y[C] += dy * IM[C] * wC * k;
    X[D] += dx * IM[D] * wD * k; Y[D] += dy * IM[D] * wD * k;
  }

  const ITER = 8;
  function step(h) {
    const damp = Math.pow(P.damp, h), gg = P.g * h * h;
    for (let i = 0; i < n; i++) {
      if (IM[i] === 0) continue;
      const vx = (X[i] - OX[i]) * damp, vy = (Y[i] - OY[i]) * damp;
      OX[i] = X[i]; OY[i] = Y[i];
      X[i] += vx; Y[i] += vy + gg;
    }
    for (let it = 0; it < ITER; it++) {
      X[0] = P.ax; Y[0] = P.ay;
      for (let k = 0; k < cons.length; k++) solve(cons[k]);
      if (drag.active) applyDrag();
    }
  }

  return { X, Y, OX, OY, M, R, A, B, C, D, step, drag, P };
}
/*PHYSICS-END*/

/* =========================================================
   TAMPILAN & INTERAKSI
   ========================================================= */
(() => {
  /* ---------- UBAH DI SINI ---------- */
  const CONFIG = {
    photo: "assets/images/profile.jpg",                                   // contoh: "foto-saya.jpg"  (kosong = siluet placeholder)
    name: "Erizq A. Nursin",
    role: "Information Systems Student",
    rows: [["Campus", "Universitas Hasanuddin"], ["Batch", "2025"]],
    badge: "Always learning",                // kosongkan "" untuk menyembunyikan
    cardId: "PORTFOLIO PASS · 2026",
    backTitle: "Thanks for stopping by",
    backSub: "Scroll down to see my projects.",
    strapText: "ERIZQ  •  PORTFOLIO  •  2026  •  ",
    cardScale: 0.68,                             // ukuran kartu: 1 = asli, makin kecil makin mungil
    ropeRatio: 0.85,                             // panjang tali relatif tinggi kartu: makin kecil makin pendek
    get anchorX() { return innerWidth < 960 ? 0.5 : 0.66; },
    dropDelay: 450,                              // jeda (ms) sebelum lanyard jatuh
    particles: false,
    showControls: false                           // false = sembunyikan tombol demo
  };
  /* ---------------------------------- */

  const root = document.getElementById('lanyard-hero');
  const cv = document.getElementById('lanyard-canvas');
  const ctx = cv.getContext('2d');
  const hint = document.getElementById('lanyard-hint');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let dpr = 1, cw = 0, ch = 0, L = null, world = null;
  let texF = null, texB = null, photoImg = null;
  let twist = 0, twistV = 0, pcx = 0, pcy = 0, pvx = 0, pvy = 0, hasPrev = false, lastKick = 0;
  let simStart = 0, lastT = 0, acc = 0, dragging = false, ptrVx = 0, lastPx = 0;
  let particles = [], hintShown = false;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- layout ---------- */
  function computeLayout() {
    const s = Math.min(clamp(ch * 0.54, 300, 540) / 470, cw * 0.78 / 300) * CONFIG.cardScale;
    const w = 300 * s, h = 470 * s, pivot = 26 * s, clip = 46 * s;
    const rest = Math.max(150, Math.min(ch - 48 - (h - pivot), h * CONFIG.ropeRatio));
    const U = Math.max(70, (h + 10 - 0.85 * rest) / 1.85 + 30);
    const ay = -U, Ltot = rest + U, ropeLen = Ltot - clip, M = 26;
    return {
      s, w, h, pivot, clip, rest, ay, ax: cw * CONFIG.anchorX,
      M, seg: ropeLen / M, sw: w * 0.092,
      g: clamp(17 * rest, 3500, 9500), damp: 0.74,
      dx: Math.min(w * 0.45, cw * 0.3), side: Math.random() < 0.5 ? -1 : 1
    };
  }

  function build(dropIt) {
    L = computeLayout();
    world = createWorld(L, dropIt);
    twist = 0; twistV = dropIt ? 0 : 1.2; hasPrev = false; acc = 0;
    simStart = performance.now() + (dropIt ? CONFIG.dropDelay : 0);
    renderTextures();
  }

  /* ---------- tekstur kartu ---------- */
  const rr = (c, x, y, w, h, r) => {
    c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  };
  function spaced(c, text, x, y, sp, align) {
    const chars = [...text]; let total = 0;
    const ws = chars.map(ch2 => { const w = c.measureText(ch2).width; total += w + sp; return w; });
    total -= sp;
    let sx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    c.textAlign = 'left';
    chars.forEach((ch2, i) => { c.fillText(ch2, sx, y); sx += ws[i] + sp; });
  }
  function wrap(c, text, maxW) {
    const words = text.split(' '), lines = []; let line = '';
    words.forEach(wd => {
      const t = line ? line + ' ' + wd : wd;
      if (c.measureText(t).width > maxW && line) { lines.push(line); line = wd; } else line = t;
    });
    if (line) lines.push(line);
    return lines;
  }
  function radial(c, x, y, r, col) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function slot(c) {
    rr(c, 128, 20, 44, 12, 6); c.fillStyle = 'rgba(12,6,50,.62)'; c.fill();
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1; c.stroke();
  }

  function paintFront(c, K) {
    const W = 300, H = 470;
    c.save(); rr(c, 0, 0, W, H, 24); c.clip();
    let g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ffffff'); g.addColorStop(.55, '#f2efff'); g.addColorStop(1, '#e3ddfb');
    c.fillStyle = g; c.fillRect(0, 0, W, H);

    // header
    c.save(); c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, 168);
    c.quadraticCurveTo(W / 2, 232, 0, 168); c.closePath(); c.clip();
    g = c.createLinearGradient(0, 0, W, 210);
    g.addColorStop(0, '#2d1fd0'); g.addColorStop(.5, '#7c3aed'); g.addColorStop(1, '#f0489b');
    c.fillStyle = g; c.fillRect(0, 0, W, 240);
    radial(c, 250, 30, 160, 'rgba(255,255,255,.34)');
    radial(c, 20, 205, 150, 'rgba(34,211,238,.6)');
    radial(c, 150, 120, 120, 'rgba(255,170,250,.26)');
    c.strokeStyle = 'rgba(255,255,255,.13)'; c.lineWidth = 1.2;
    [54, 84, 114, 144].forEach(r => { c.beginPath(); c.arc(262, 34, r, 0, 7); c.stroke(); });
    c.restore();

    slot(c);
    c.fillStyle = 'rgba(255,255,255,.82)'; c.font = '600 9px Inter, sans-serif';
    spaced(c, 'PORTFOLIO PASS', 150, 60, 3.2, 'center');

    // foto
    c.save();
    c.shadowColor = 'rgba(36,16,110,.4)'; c.shadowBlur = 26 * K; c.shadowOffsetY = 12 * K;
    rr(c, 46, 76, 208, 224, 30); c.fillStyle = '#fff'; c.fill(); c.restore();
    g = c.createLinearGradient(46, 76, 254, 300);
    g.addColorStop(0, '#a78bfa'); g.addColorStop(.5, '#22d3ee'); g.addColorStop(1, '#f472b6');
    rr(c, 46, 76, 208, 224, 30); c.strokeStyle = g; c.lineWidth = 2; c.stroke();

    c.save(); rr(c, 52, 82, 196, 212, 25); c.clip();
    if (photoImg) {
      const sc = Math.max(196 / photoImg.naturalWidth, 212 / photoImg.naturalHeight);
      const dw = photoImg.naturalWidth * sc, dh = photoImg.naturalHeight * sc;
      c.drawImage(photoImg, 52 + (196 - dw) / 2, 82 + (212 - dh) / 2, dw, dh);
    } else {
      g = c.createLinearGradient(52, 82, 248, 294);
      g.addColorStop(0, '#c7b8ff'); g.addColorStop(.55, '#f5b8ee'); g.addColorStop(1, '#8ee9ff');
      c.fillStyle = g; c.fillRect(52, 82, 196, 212);
      c.fillStyle = 'rgba(255,255,255,.92)';
      c.beginPath(); c.arc(150, 168, 38, 0, 7); c.fill();
      c.beginPath(); c.ellipse(150, 306, 86, 80, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(70,35,150,.62)'; c.font = '600 8px Inter, sans-serif';
      spaced(c, 'FOTO ANDA DI SINI', 150, 112, 2.2, 'center');
    }
    g = c.createLinearGradient(52, 82, 150, 230);
    g.addColorStop(0, 'rgba(255,255,255,.26)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(52, 82, 196, 212);
    c.restore();

    // badge
    if (CONFIG.badge) {
      c.font = '700 8.5px Inter, sans-serif';
      const tw = c.measureText(CONFIG.badge).width, bw = tw + 32, bx = 62, by = 268;
      c.save(); c.shadowColor = 'rgba(30,10,90,.35)'; c.shadowBlur = 12 * K; c.shadowOffsetY = 4 * K;
      rr(c, bx, by, bw, 22, 11); c.fillStyle = 'rgba(255,255,255,.95)'; c.fill(); c.restore();
      c.fillStyle = '#22c55e'; c.beginPath(); c.arc(bx + 12, by + 11, 3.4, 0, 7); c.fill();
      c.fillStyle = 'rgba(34,197,94,.25)'; c.beginPath(); c.arc(bx + 12, by + 11, 6.4, 0, 7); c.fill();
      c.fillStyle = '#1f1458'; c.textAlign = 'left'; c.fillText(CONFIG.badge, bx + 22, by + 14.2);
    }

    // nama & peran
    let fs = 29; c.font = `800 ${fs}px Sora, Inter, sans-serif`;
    while (c.measureText(CONFIG.name).width > 220 && fs > 14) { fs -= 1; c.font = `800 ${fs}px Sora, Inter, sans-serif`; }
    g = c.createLinearGradient(46, 0, 254, 0); g.addColorStop(0, '#1b1252'); g.addColorStop(1, '#5b21b6');
    c.fillStyle = g; c.textAlign = 'center'; c.fillText(CONFIG.name, 150, 338);
    c.fillStyle = '#6d3df0'; c.font = '600 12.5px Inter, sans-serif';
    spaced(c, CONFIG.role, 150, 360, .5, 'center');

    c.setLineDash([3, 4]); c.strokeStyle = 'rgba(76,29,149,.26)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(34, 378); c.lineTo(266, 378); c.stroke(); c.setLineDash([]);

    CONFIG.rows.slice(0, 2).forEach((r, i) => {
      const x = i === 0 ? 34 : 266, al = i === 0 ? 'left' : 'right';
      c.fillStyle = '#8d86b8'; c.font = '600 7.5px Inter, sans-serif'; spaced(c, r[0].toUpperCase(), x, 397, 1.8, al);
      c.fillStyle = '#241a5e'; c.font = '600 11.5px Inter, sans-serif'; spaced(c, r[1], x, 412, 0, al);
    });

    // barcode
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    c.fillStyle = 'rgba(27,18,82,.88)';
    for (let x = 34; x < 266;) { const bw = 1 + Math.floor(rnd() * 3); c.fillRect(x, 430, bw, 22); x += bw + 1 + Math.floor(rnd() * 3); }
    c.fillStyle = '#8d86b8'; c.font = '600 6.5px Inter, sans-serif';
    spaced(c, CONFIG.cardId, 150, 465, 2.4, 'center');
    c.restore();

    rr(c, .75, .75, W - 1.5, H - 1.5, 23.5); c.strokeStyle = 'rgba(90,60,200,.28)'; c.lineWidth = 1.5; c.stroke();
  }

  function paintBack(c, K) {
    const W = 300, H = 470;
    c.save(); rr(c, 0, 0, W, H, 24); c.clip();
    let g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#150d48'); g.addColorStop(.5, '#2b1779'); g.addColorStop(1, '#0d0830');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    radial(c, 245, 60, 170, 'rgba(236,72,153,.42)');
    radial(c, 40, 430, 200, 'rgba(34,211,238,.36)');
    radial(c, 150, 235, 160, 'rgba(124,58,237,.38)');
    c.strokeStyle = 'rgba(255,255,255,.06)'; c.lineWidth = 1.2;
    [70, 100, 130, 160, 190, 220].forEach(r => { c.beginPath(); c.arc(150, 235, r, 0, 7); c.stroke(); });
    slot(c);

    g = c.createLinearGradient(88, 138, 212, 262);
    g.addColorStop(0, '#8b5cf6'); g.addColorStop(1, '#ec4899');
    c.save(); c.shadowColor = 'rgba(236,72,153,.5)'; c.shadowBlur = 30 * K;
    c.beginPath(); c.arc(150, 200, 62, 0, 7); c.fillStyle = g; c.fill(); c.restore();
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 2; c.beginPath(); c.arc(150, 200, 62, 0, 7); c.stroke();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '800 66px Sora, Inter, sans-serif';
    c.fillText((CONFIG.name[0] || 'L').toUpperCase(), 150, 224);

    c.font = '700 18px Sora, Inter, sans-serif'; c.fillStyle = '#fff';
    wrap(c, CONFIG.backTitle, 230).forEach((t, i) => c.fillText(t, 150, 306 + i * 24));
    c.font = '500 11px Inter, sans-serif'; c.fillStyle = 'rgba(255,255,255,.7)';
    wrap(c, CONFIG.backSub, 210).forEach((t, i) => c.fillText(t, 150, 346 + i * 16));
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(130, 416, 40, 1.5);
    c.fillStyle = 'rgba(255,255,255,.6)'; c.font = '700 9px Inter, sans-serif';
    spaced(c, CONFIG.name.toUpperCase(), 150, 440, 4, 'center');
    c.restore();
    rr(c, .75, .75, W - 1.5, H - 1.5, 23.5); c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1.5; c.stroke();
  }

  function renderTextures() {
    if (!L) return;
    const ts = Math.max(dpr, 1) * 1.5, K = L.s * ts;
    const mk = paint => {
      const t = document.createElement('canvas');
      t.width = Math.ceil(L.w * ts); t.height = Math.ceil(L.h * ts);
      const c = t.getContext('2d'); c.scale(K, K); paint(c, K); return t;
    };
    texF = mk(paintFront); texB = mk(paintBack);
  }

  /* ---------- gambar ---------- */
  function drawParticles(t) {
    if (!CONFIG.particles) return;
    for (const p of particles) {
      p.y -= p.v; if (p.y < -4) { p.y = ch + 4; p.x = Math.random() * cw; }
      const a = (0.25 + 0.75 * Math.abs(Math.sin(t * p.f + p.ph))) * p.a;
      ctx.fillStyle = `rgba(${p.c},${a})`;
      ctx.beginPath(); ctx.arc(p.x + Math.sin(t * .3 + p.ph) * 6, p.y, p.r, 0, 7); ctx.fill();
    }
  }

  function strapPath(X, Y, M) {
    ctx.beginPath(); ctx.moveTo(X[0], Y[0]);
    for (let i = 1; i < M; i++) ctx.quadraticCurveTo(X[i], Y[i], (X[i] + X[i + 1]) / 2, (Y[i] + Y[i + 1]) / 2);
    ctx.lineTo(X[M], Y[M]);
  }

  let glyphCache = null;
  function getGlyphs(fs) {
    if (glyphCache && glyphCache.fs === fs && glyphCache.txt === CONFIG.strapText) return glyphCache;
    ctx.save(); ctx.font = `700 ${fs}px Inter, sans-serif`;
    const chars = [...CONFIG.strapText], sp = fs * 0.16;
    const ws = chars.map(c2 => ctx.measureText(c2).width + sp);
    ctx.restore();
    glyphCache = { fs, txt: CONFIG.strapText, chars, ws, total: ws.reduce((a, b) => a + b, 0) };
    return glyphCache;
  }

  function drawStrap() {
    const { X, Y, M } = world, sw = L.sw;
    // tangen & normal
    const nx = new Float64Array(M + 1), ny = new Float64Array(M + 1), S = new Float64Array(M + 1);
    for (let i = 0; i <= M; i++) {
      const a = Math.max(0, i - 1), b = Math.min(M, i + 1);
      let tx = X[b] - X[a], ty = Y[b] - Y[a]; const d = Math.hypot(tx, ty) || 1;
      tx /= d; ty /= d; nx[i] = -ty; ny[i] = tx;
      if (i > 0) S[i] = S[i - 1] + Math.hypot(X[i] - X[i - 1], Y[i] - Y[i - 1]);
    }
    ctx.lineJoin = 'round'; ctx.lineCap = 'butt';

    ctx.save();
    ctx.shadowColor = 'rgba(4,2,24,.55)'; ctx.shadowBlur = 18 * dpr; ctx.shadowOffsetY = 9 * dpr; ctx.shadowOffsetX = 3 * dpr;
    strapPath(X, Y, M); ctx.strokeStyle = 'rgba(20,10,74,.95)'; ctx.lineWidth = sw + 2.4; ctx.stroke();
    ctx.restore();

    const g = ctx.createLinearGradient(X[0], Y[0], X[M], Y[M]);
    g.addColorStop(0, '#7c3aed'); g.addColorStop(.55, '#4f46e5'); g.addColorStop(1, '#0ea5e9');
    strapPath(X, Y, M); ctx.strokeStyle = g; ctx.lineWidth = sw; ctx.stroke();
    strapPath(X, Y, M); ctx.strokeStyle = 'rgba(255,255,255,.11)'; ctx.lineWidth = sw * 0.3; ctx.stroke();

    // jahitan tepi
    ctx.setLineDash([3.5, 3.5]); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.4)';
    for (const sgn of [1, -1]) {
      const off = sgn * (sw / 2 - 3.6);
      ctx.beginPath();
      for (let i = 0; i <= M; i++) { const px = X[i] + nx[i] * off, py = Y[i] + ny[i] * off; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // teks di sepanjang tali
    const fs = Math.max(8, sw * 0.4), gl = getGlyphs(fs);
    ctx.font = `700 ${fs}px Inter, sans-serif`; ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let s = L.seg * 3, k = 0, gi = 0; const end = S[M] - 20;
    while (s < end) {
      const wdt = gl.ws[gi % gl.chars.length], mid = s + wdt / 2;
      while (k < M - 1 && S[k + 1] < mid) k++;
      const seglen = S[k + 1] - S[k] || 1, t = clamp((mid - S[k]) / seglen, 0, 1);
      const px = X[k] + (X[k + 1] - X[k]) * t, py = Y[k] + (Y[k + 1] - Y[k]) * t;
      if (py > -20 && py < ch + 20 && gl.chars[gi % gl.chars.length] !== ' ') {
        ctx.save(); ctx.translate(px, py); ctx.rotate(Math.atan2(Y[k + 1] - Y[k], X[k + 1] - X[k]));
        ctx.fillText(gl.chars[gi % gl.chars.length], 0, 0); ctx.restore();
      }
      s += wdt; gi++;
      if (k > 0 && S[k] > mid) k = 0;
    }
    ctx.textBaseline = 'alphabetic';
  }

  function drawCard() {
    const { X, Y, A, B, D } = world, w = L.w, h = L.h, s = L.s;
    const bx = X[B] - X[A], by = Y[B] - Y[A], dx = X[D] - X[A], dy = Y[D] - Y[A];
    const el = Math.hypot(bx, by) || 1, fl = Math.hypot(dx, dy) || 1;
    const ang = Math.atan2(by, bx);
    const c = Math.cos(twist), sx = Math.max(Math.abs(c), 0.025);
    ctx.save();
    ctx.setTransform(dpr * bx / el, dpr * by / el, dpr * dx / fl, dpr * dy / fl, dpr * X[A], dpr * Y[A]);
    ctx.translate(w / 2, 0); ctx.scale(sx, 1); ctx.translate(-w / 2, 0);

    ctx.save();
    ctx.shadowColor = 'rgba(6,2,30,.6)'; ctx.shadowBlur = 38 * dpr; ctx.shadowOffsetY = 24 * dpr; ctx.shadowOffsetX = 6 * dpr;
    ctx.drawImage(c >= 0 ? texF : texB, 0, 0, w, h);
    ctx.restore();

    ctx.save(); rr(ctx, 0, 0, w, h, 24 * s); ctx.clip();
    if (c >= 0) {
      // kilau holografik mengikuti sudut kartu
      const pos = 0.5 + ang * 1.5 + Math.sin(twist) * 0.6;
      let g = ctx.createLinearGradient(w * (pos - 0.7), 0, w * (pos + 0.7), h * 0.6);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.30, 'rgba(255,140,220,0)');
      g.addColorStop(.38, 'rgba(255,150,230,.20)'); g.addColorStop(.46, 'rgba(120,230,255,.26)');
      g.addColorStop(.54, 'rgba(170,255,200,.22)'); g.addColorStop(.62, 'rgba(255,240,150,.18)');
      g.addColorStop(.70, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      g = ctx.createLinearGradient(w * (pos - 0.35), 0, w * (pos + 0.35), h * 0.4);
      g.addColorStop(.42, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.5)'); g.addColorStop(.58, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    ctx.fillStyle = `rgba(10,5,44,${(1 - sx) * 0.55})`; ctx.fillRect(0, 0, w, h);
    ctx.restore();
    ctx.restore();
  }

  function drawHardware() {
    const { X, Y, M, R } = world, sw = L.sw, len = L.clip;
    const x1 = X[M], y1 = Y[M], ang = Math.atan2(Y[R] - y1, X[R] - x1);
    ctx.save(); ctx.translate(x1, y1); ctx.rotate(ang - Math.PI / 2);
    const gold = ctx.createLinearGradient(-9, 0, 9, 0);
    gold.addColorStop(0, '#a8701a'); gold.addColorStop(.25, '#ffeaa6'); gold.addColorStop(.5, '#f5c248');
    gold.addColorStop(.8, '#c68a2a'); gold.addColorStop(1, '#8a5512');
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 6 * dpr; ctx.shadowOffsetY = 3 * dpr;
    rr(ctx, -(sw + 8) / 2, -4, sw + 8, 16, 4); ctx.fillStyle = gold; ctx.fill();          // crimp
    rr(ctx, -7, 8, 14, len + 2, 7); ctx.fill();                                            // badan klip
    ctx.shadowColor = 'transparent';
    rr(ctx, -2.8, 18, 5.6, len - 12, 2.8); ctx.fillStyle = 'rgba(60,30,0,.55)'; ctx.fill(); // celah
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-5.2, 12, 1.6, len - 6);
    ctx.fillStyle = 'rgba(80,40,0,.4)'; ctx.beginPath(); ctx.arc(0, 12, 2.2, 0, 7); ctx.fill();
    // cincin menembus lubang kartu
    ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 6 * dpr; ctx.shadowOffsetY = 3 * dpr;
    ctx.beginPath(); ctx.arc(0, len, 10.5, 0, 7); ctx.strokeStyle = gold; ctx.lineWidth = 4.2; ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.beginPath(); ctx.arc(0, len, 10.5, 3.6, 4.9); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.restore();
  }

  function draw(now) {
    const t = now / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, cw, ch);
    drawParticles(t);
    if (!world || now < simStart) return;
    const { X, Y, A, B, C, D } = world;
    const gx = (X[A] + X[B] + X[C] + X[D]) / 4, gy = (Y[A] + Y[B] + Y[C] + Y[D]) / 4;
    const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, L.h * 0.95);
    gr.addColorStop(0, 'rgba(139,92,246,.30)'); gr.addColorStop(.5, 'rgba(34,211,238,.07)'); gr.addColorStop(1, 'rgba(34,211,238,0)');
    ctx.fillStyle = gr; ctx.fillRect(gx - L.h, gy - L.h, L.h * 2, L.h * 2);
    drawStrap(); drawCard(); drawHardware();
  }

  /* ---------- puntiran kartu (efek 3D) ---------- */
  function updateTwist(dt, now) {
    const { X, Y, A, B, C, D } = world;
    const cx = (X[A] + X[B] + X[C] + X[D]) / 4, cy = (Y[A] + Y[B] + Y[C] + Y[D]) / 4;
    if (hasPrev && dt > 0) {
      const vx = (cx - pcx) / dt, vy = (cy - pcy) / dt;
      const dv = Math.hypot(vx - pvx, vy - pvy);
      if (dv > 1100 && now - lastKick > 220 && !dragging) {
        lastKick = now; twistV += (Math.random() < .5 ? -1 : 1) * Math.min(dv * 0.0024, 8);
      }
      const ax = clamp((vx - pvx) / dt, -90000, 90000);
      const acc2 = -34 * twist - 1.7 * twistV - clamp(ax * 0.0004, -40, 40);
      twistV += acc2 * dt; twist = clamp(twist + twistV * dt, -3.3, 3.3);
      pvx = vx; pvy = vy;
    }
    pcx = cx; pcy = cy; hasPrev = true;
  }

  /* ---------- loop ---------- */
  let dragX = 0, dragY = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!world) return;
    const dt = Math.min(0.033, (now - lastT) / 1000 || 0.016); lastT = now;
    if (now >= simStart) {
      if (dragging) {
        dragX += (world.drag.tx - dragX) * 0.55; dragY += (world.drag.ty - dragY) * 0.55;
        world.drag.x = dragX; world.drag.y = dragY;
      }
      acc += dt; let n = 0; const h = 1 / 480;
      while (acc >= h && n < 24) { world.step(h); acc -= h; n++; }
      if (n === 24) acc = 0;
      updateTwist(dt, now);
      if (!hintShown && now - simStart > 2600) { hint.classList.add('show'); hintShown = true; setTimeout(() => hint.classList.remove('show'), 6500); }
    }
    draw(now);
  }

  /* ---------- pointer ---------- */
  function hit(px, py) {
    const { X, Y, A, B, D } = world;
    const abx = X[B] - X[A], aby = Y[B] - Y[A], adx = X[D] - X[A], ady = Y[D] - Y[A];
    const rx = px - X[A], ry = py - Y[A];
    let u = (rx * abx + ry * aby) / (abx * abx + aby * aby), v = (rx * adx + ry * ady) / (adx * adx + ady * ady);
    u = 0.5 + (u - 0.5) / Math.max(Math.abs(Math.cos(twist)), 0.25);
    return (u >= 0 && u <= 1 && v >= 0 && v <= 1) ? { u: clamp(u, 0, 1), v: clamp(v, 0, 1) } : null;
  }
  const local = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

  window.addEventListener('pointerdown', e => {
    if (!world || performance.now() < simStart) return;
    const [px, py] = local(e), h = hit(px, py);
    if (!h) return;
    dragging = true; document.body.style.cursor = 'grabbing';
    Object.assign(world.drag, { active: true, u: h.u, v: h.v, tx: px, ty: py, x: px, y: py });
    dragX = px; dragY = py; lastPx = px; ptrVx = 0; hint.classList.remove('show'); hintShown = true;
    e.preventDefault();
  });
  window.addEventListener('pointermove', e => {
    if (!world) return;
    const [px, py] = local(e);
    if (dragging) { world.drag.tx = px; world.drag.ty = py; ptrVx = px - lastPx; lastPx = px; }
    else document.body.style.cursor = (performance.now() >= simStart && hit(px, py)) ? 'grab' : '';
  });
  const release = () => {
    if (!dragging) return;
    dragging = false; world.drag.active = false; document.body.style.cursor = '';
    twistV += clamp(ptrVx * 0.18, -9, 9);
  };
  window.addEventListener('pointerup', release); window.addEventListener('pointercancel', release);

  /* ---------- foto ---------- */
  function loadPhoto(src) {
    if (!src) return;
    const im = new Image();
    im.onload = () => { photoImg = im; renderTextures(); };
    im.src = src;
  }
  const ui = document.getElementById('lanyard-ui');
  if (!CONFIG.showControls) ui.style.display = 'none';
  document.getElementById('lanyard-replay').onclick = () => build(true);
  const fileIn = document.getElementById('lanyard-photo-input');
  document.getElementById('lanyard-photo-btn').onclick = () => fileIn.click();
  fileIn.onchange = () => { const f = fileIn.files[0]; if (f) loadPhoto(URL.createObjectURL(f)); };

  /* ---------- ukuran & mulai ---------- */
  function resize(first) {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = root.getBoundingClientRect(), nw = Math.round(r.width), nh = Math.round(r.height);
    if (!first && nw === cw && nh === ch) return;
    cw = nw; ch = nh; cv.width = cw * dpr; cv.height = ch * dpr;
    particles = Array.from({ length: CONFIG.particles ? Math.round(cw * ch / 16000) : 0 }, () => ({
      x: Math.random() * cw, y: Math.random() * ch, r: Math.random() * 1.5 + .4, v: Math.random() * .25 + .05,
      f: Math.random() * 1.5 + .5, ph: Math.random() * 6, a: Math.random() * .55 + .2,
      c: ['255,255,255', '196,181,253', '103,232,249', '249,168,212'][Math.floor(Math.random() * 4)]
    }));
    if (!first) build(false);
  }
  let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => resize(false), 140); }).observe(root);

  function start() {
    resize(true); build(!reduceMotion); loadPhoto(CONFIG.photo);
    document.body.style.cursor = ''; requestAnimationFrame(frame);
  }
  const fontsReady = Promise.race([
    Promise.all([document.fonts.load('800 29px Sora'), document.fonts.load('600 12px Inter'), document.fonts.load('700 10px Inter')]),
    new Promise(res => setTimeout(res, 1500))
  ]).catch(() => {});
  fontsReady.then(start);
})();
