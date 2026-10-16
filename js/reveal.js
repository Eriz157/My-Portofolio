/* ==========================================================
   CURSOR REVEAL  ("camera flash")
   Hover a portrait (About, Skills) and the area around the cursor swaps to its
   monochrome twin through a soft, feathered spotlight.

     - entering the figure fires a flash: the spotlight springs open, the
       reveal over-exposes and settles, and a small lens-star pops at the cursor
     - the spotlight trails the cursor slightly and swells when you move fast
       (moving fast also re-triggers a softer flash)
     - click / tap = another flash
     - touch: press and drag on the figure; it fades when you let go
     - prefers-reduced-motion: plain feathered reveal, no spring, no flash

   How it is built: for every portrait three decorative copies of the monochrome
   image are stacked on top of the original (alt / rim / flash). Each one is
   clipped by a CSS radial-gradient mask driven by four custom properties on the
   portrait's parent: --mx --my (cursor, px) --rr (radius, px) --rf (flash 0..1).
   The twins have exactly the same silhouette as the originals, so the swap is seamless.
   ========================================================== */
(() => {
  'use strict';

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const TARGETS = [
    { sel: '#about .s-photo',  alt: 'assets/images/profile-cutout-mono.webp',  kind: 'about' },
    { sel: '#skills .edt-photo', alt: 'assets/images/skills-portrait-mono.webp', kind: 'edt'   }
  ];

  /* ---------- the lens-star that pops at the cursor ---------- */
  const star = document.createElement('div');
  star.className = 'rv-star';
  star.setAttribute('aria-hidden', 'true');
  star.innerHTML =
    '<svg viewBox="-50 -50 100 100" focusable="false">' +
    '<path d="M0-48C3-14 14-3 48 0C14 3 3 14 0 48C-3 14-14 3-48 0C-14-3-3-14 0-48Z" fill="#fff"/>' +
    '<path d="M0-30L5-5 30 0 5 5 0 30-5 5-30 0-5-5Z" fill="#fff" transform="rotate(45)" opacity=".85"/>' +
    '<circle r="7" fill="#fff"/></svg>';
  document.body.appendChild(star);
  const popStar = (x, y, big) => {
    if (reduce) return;
    star.style.setProperty('--sx', x + 'px');
    star.style.setProperty('--sy', y + 'px');
    star.style.setProperty('--ss', big ? 1.35 : 1);
    star.classList.remove('go'); void star.offsetWidth; star.classList.add('go');
  };

  /* ---------- build one instance per portrait ---------- */
  const mkLayer = (img, role, src) => {
    const l = new Image();
    l.src = src; l.alt = ''; l.draggable = false; l.decoding = 'async';
    l.setAttribute('aria-hidden', 'true');
    l.className = img.className + ' rv-layer rv-' + role;
    return l;
  };

  const buildMap = img => {            // coarse alpha map for "is the cursor on the figure?"
    try {
      const w = 96, h = Math.max(1, Math.round(w * img.naturalHeight / img.naturalWidth));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(img, 0, 0, w, h);
      const d = x.getImageData(0, 0, w, h).data, a = new Uint8Array(w * h);
      for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3];
      return { w, h, a };
    } catch (e) { return null; }       // e.g. file:// (tainted canvas) -> fall back to the bounding box
  };

  const items = [];
  TARGETS.forEach(t => {
    const img = document.querySelector(t.sel);
    if (!img) return;
    const root = img.parentElement;
    const layers = [mkLayer(img, 'alt', t.alt), mkLayer(img, 'rim', t.alt), mkLayer(img, 'flash', t.alt)];
    img.after(...layers);
    const it = {
      img, root, kind: t.kind, map: null, visible: false,
      active: false, miss: 0, touch: false, release: 0,
      tx: 0, ty: 0, x: 0, y: 0, r: 0, rv: 0, flash: 0, lastFlash: 0, busy: false
    };
    const onload = () => { it.map = buildMap(img); };
    img.complete && img.naturalWidth ? onload() : img.addEventListener('load', onload, { once: true });
    new IntersectionObserver(es => { it.visible = es[0].isIntersecting; if (!it.visible) deactivate(it, true); })
      .observe(root);
    root.style.setProperty('--rr', '0px'); root.style.setProperty('--rf', '0');
    items.push(it);
  });
  if (!items.length) return;

  /* ---------- helpers ---------- */
  const baseRadius = it => it.img.offsetWidth * (it.kind === 'about' ? .36 : .38);

  const hit = (it, cx, cy) => {         // -> {lx, ly} in layout px, or null
    const b = it.img.getBoundingClientRect();
    if (b.width < 20 || cx < b.left || cx > b.right || cy < b.top || cy > b.bottom) return null;
    const u = (cx - b.left) / b.width, v = (cy - b.top) / b.height;
    if (it.map) {                       // dilated alpha test: must be on (or right next to) the figure
      const m = it.map, gx = Math.min(m.w - 1, u * m.w | 0), gy = Math.min(m.h - 1, v * m.h | 0);
      let on = false;
      for (let j = -1; j <= 1 && !on; j++) for (let i = -1; i <= 1; i++) {
        const x = gx + i, y = gy + j;
        if (x >= 0 && y >= 0 && x < m.w && y < m.h && m.a[y * m.w + x] > 40) { on = true; break; }
      }
      if (!on) return null;
    }
    return { lx: u * it.img.offsetWidth, ly: v * it.img.offsetHeight };
  };

  const ready = it => parseFloat(getComputedStyle(it.img).opacity) > .95;   // wait for the entry animation

  function activate(it, p, cx, cy, touch) {
    if (it.active) return;
    it.active = true; it.miss = 0; it.touch = !!touch;
    it.x = it.tx = p.lx; it.y = it.ty = p.ly;
    it.r = reduce ? baseRadius(it) : 0; it.rv = 0;
    it.flash = reduce ? 0 : 1; it.lastFlash = performance.now();
    it.root.setAttribute('data-rv', '1');
    popStar(cx, cy, false);
    kick();
  }
  function deactivate(it, now) {
    if (!it.active && !now) return;
    it.active = false; it.touch = false; it.flash = Math.min(it.flash, .2);   // leaving: cut the flash short
    if (now) { it.r = 0; it.rv = 0; it.flash = 0; paint(it); it.root.removeAttribute('data-rv'); }
  }

  /* ---------- pointer wiring ---------- */
  let px = -1, py = -1, speed = 0, lastT = 0, lastX = 0, lastY = 0, dirty = false;

  const evaluate = e => {
    for (const it of items) {
      if (!it.visible) continue;
      if (it.touch && !e) continue;                 // a touch drag only ends on pointerup / cancel
      const p = hit(it, px, py);
      if (p) {
        if (!it.active && !ready(it)) continue;
        it.miss = 0; it.tx = p.lx; it.ty = p.ly;
        if (!it.active) activate(it, p, px, py, e && e.pointerType === 'touch');
      } else if (it.active && !it.touch && !it.miss) it.miss = performance.now();
    }
    kick();
  };

  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' && !items.some(i => i.touch)) return;
    const now = performance.now(), dt = Math.max(8, now - lastT);
    const inst = Math.hypot(e.clientX - lastX, e.clientY - lastY) / dt * 1000;
    speed = speed * .75 + inst * .25;
    lastT = now; lastX = px = e.clientX; lastY = py = e.clientY;
    evaluate(e);
  }, { passive: true });

  addEventListener('pointerdown', e => {
    px = e.clientX; py = e.clientY;
    if (e.pointerType === 'touch') evaluate(e);
    for (const it of items) if (it.active) {        // click / tap = flash again, bigger burst
      it.flash = 1; it.rv += baseRadius(it) * 5; it.release = 0; popStar(px, py, true);
    }
    kick();
  }, { passive: true });

  const release = () => items.forEach(it => { if (it.touch) it.release = performance.now(); });
  addEventListener('pointerup', e => { if (e.pointerType === 'touch') release(); }, { passive: true });
  addEventListener('pointercancel', release, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => items.forEach(it => deactivate(it)), { passive: true });
  addEventListener('blur', () => items.forEach(it => deactivate(it, true)));
  document.addEventListener('visibilitychange', () => { if (document.hidden) items.forEach(it => deactivate(it, true)); });
  addEventListener('scroll', () => { if (px >= 0 && items.some(i => i.visible)) { dirty = true; kick(); } }, { passive: true });

  /* ---------- paint + animation loop ---------- */
  function paint(it) {
    const s = it.root.style;
    s.setProperty('--mx', it.x.toFixed(1) + 'px');
    s.setProperty('--my', it.y.toFixed(1) + 'px');
    s.setProperty('--rr', Math.max(0, it.r).toFixed(1) + 'px');
    s.setProperty('--rf', it.flash.toFixed(3));
  }

  let raf = 0, prev = 0;
  function kick() { if (!raf) { prev = performance.now(); raf = requestAnimationFrame(frame); } }

  function frame(now) {
    raf = 0;
    const dt = Math.min(.05, (now - prev) / 1000 || .016); prev = now;
    if (dirty) { dirty = false; evaluate(null); }
    speed *= Math.exp(-dt * 5);
    let again = false;

    for (const it of items) {
      if (!it.root.hasAttribute('data-rv') && !it.active) continue;

      if (it.active) {
        if (it.miss && now - it.miss > 110) { deactivate(it); }               // grace period: no flicker at edges
        else if (it.release && now - it.release > 900) { deactivate(it); }
      }

      const base = baseRadius(it);
      const target = it.active ? base * (1 + Math.min(speed / 3200, .32)) : 0;

      if (reduce) {
        it.x = it.tx; it.y = it.ty; it.r = target; it.flash = 0;
      } else {
        const k = 1 - Math.exp(-dt * 15);                                      // trailing follow
        it.x += (it.tx - it.x) * k; it.y += (it.ty - it.y) * k;
        const a = 230 * (target - it.r) - 15.5 * it.rv;                         // underdamped spring -> overshoot
        it.rv += a * dt; it.r += it.rv * dt;
        it.flash *= Math.exp(-dt * (it.active ? 4.6 : 10));                                        // flash decays in ~0.65s
        if (it.active && speed > 1700 && now - it.lastFlash > 750) { it.flash = Math.max(it.flash, .55); it.lastFlash = now; }
        if (it.flash < .004) it.flash = 0;
      }

      paint(it);

      if (!it.active && it.r < .6 && it.flash < .02) {
        it.r = 0; it.rv = 0; it.flash = 0; paint(it); it.root.removeAttribute('data-rv');
      } else again = true;
    }
    if (again || speed > 5) kick();
  }
})();
