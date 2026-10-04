
/* =========================================================
   LAYOUT — murni matematika (bisa diuji tanpa browser)
   Ukuran kartu mengikuti wireframe: tengah terbesar,
   mengecil simetris ke kiri & kanan.
   ========================================================= */
/*LAYOUT-START*/
const KW = [318, 206, 147, 92, 60, 38];     // lebar kartu pada jarak 0,1,2,3,4,5 dari tengah
const KH = [435, 372, 303, 240, 190, 150];  // tinggi kartu
const lerpK = (arr, d) => {
  d = Math.min(Math.abs(d), arr.length - 1);
  const i = Math.min(Math.floor(d), arr.length - 2);
  return arr[i] + (arr[i + 1] - arr[i]) * (d - i);
};
function galLayout(p, n, k, cx) {
  const gap = Math.max(8, 14 * k), S = lerpK(KW, 0.5) * k + gap;
  const kc = Math.min(n - 1, Math.max(0, Math.round(p)));
  const w = [], h = [], x = new Array(n);
  for (let i = 0; i < n; i++) { w[i] = lerpK(KW, i - p) * k; h[i] = lerpK(KH, i - p) * k; }
  x[kc] = cx + (kc - p) * S;
  for (let i = kc + 1; i < n; i++) x[i] = x[i - 1] + w[i - 1] / 2 + gap + w[i] / 2;
  for (let i = kc - 1; i >= 0; i--) x[i] = x[i + 1] - w[i + 1] / 2 - gap - w[i] / 2;
  return { x, w, h, S, gap };
}
/*LAYOUT-END*/

(() => {
  /* ---------- UBAH DI SINI ---------- */
  const GALLERY = {
    title: "Gallery",
    wheel: "smart",      // "smart" = scroll mouse menggeser galeri, lepas di ujung | "horizontal" = hanya geser horizontal | "off"
    tabs: [
      {
        id: "skill", label: "My Side Skill", unit: "karya", start: 2,
        desc: "Di sela kuliah dan ngoding, saya menggambar. Dari potret dengan pensil sampai karakter anime dengan tinta dan arsiran, semuanya lahir langsung di atas kertas. Latihan sabar, teliti, dan peka terhadap detail — kebiasaan yang ikut menajamkan cara saya merancang tampilan.",
        items: [
          { src: "assets/images/galeri/draw-1.jpg", title: "Go Youn Jung", meta: "Pensil di atas kertas", alt: "Sketsa pensil potret seorang wanita berambut diikat yang menatap ke atas" },
          { src: "assets/images/galeri/draw-2.jpg", title: "Sukuna", meta: "Fan art · Tinta", pos: "72% 50%", alt: "Gambar tinta hitam-putih karakter bertato wajah dengan ekspresi menyeringai lebar" },
          { src: "assets/images/galeri/draw-3.jpg", title: "Reze", meta: "Pensil & pulpen", alt: "Sketsa pensil gadis berambut pendek dengan pita di kerah dan senyum malu" },
          { src: "assets/images/galeri/draw-4.jpg", title: "Shinra · Fire Force", meta: "Fan art · Tinta & arsiran", pos: "68% 50%", alt: "Gambar tinta karakter berhelm pemadam kebakaran dengan tangan terkepal dan api kecil" },
          { src: "assets/images/galeri/draw-5.jpg", title: "Denji and Reze", meta: "Pensil · Studi bayangan", alt: "Sketsa pensil dua karakter, satu menyandar sambil kepalanya disentuh dari belakang" },
          { src: "assets/images/galeri/draw-6.jpg", title: "Wall·E", meta: "Sketsa pulpen", alt: "Sketsa pulpen robot Wall-E yang mengangkat setangkai bunga" }
        ]
      }
    ]
  };
  /* ---------------------------------- */

  const $ = id => document.getElementById(id);
  const root = $('galeri'), stage = $('gal-stage'), track = $('gal-track');
  const tabsEl = $('gal-tabs'), ind = $('gal-ind'), descEl = $('gal-desc'), dotsEl = $('gal-dots');
  const capT = $('gal-cap-title'), capM = $('gal-cap-meta');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  let tabIdx = 0, items = [], cards = [], p = 0, target = 0, enter = 0, curIdx = -1;
  let stageW = 0, stageH = 0, k = 1, Sx = 280;
  let raf = 0, last = 0;
  let dragging = false, moved = false, sx = 0, sp = 0, lastX = 0, lastT = 0, vel = 0, pid = null, tapIdx = -1;
  let snapT = 0;

  $('gal-title').textContent = GALLERY.title;

  /* ---------- tab ---------- */
  GALLERY.tabs.forEach((t, i) => {
    const b = document.createElement('button');
    b.className = 'gal-tab'; b.type = 'button'; b.role = 'tab';
    b.id = 'gal-tab-' + i;
    b.innerHTML = `${t.label}<i>${String(t.items.length).padStart(2, '0')}</i>`;
    b.addEventListener('click', () => { if (i !== tabIdx) setTab(i); });
    tabsEl.appendChild(b);
  });
  const tabBtns = [...tabsEl.querySelectorAll('.gal-tab')];
  tabsEl.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const ni = (tabIdx + (e.key === 'ArrowRight' ? 1 : -1) + tabBtns.length) % tabBtns.length;
      setTab(ni); tabBtns[ni].focus();
    }
  });
  function moveIndicator() {
    const b = tabBtns[tabIdx];
    ind.style.width = b.offsetWidth + 'px';
    ind.style.transform = `translateX(${b.offsetLeft}px)`;
    tabBtns.forEach((x, i) => { x.setAttribute('aria-selected', i === tabIdx); x.tabIndex = i === tabIdx ? 0 : -1; });
  }

  /* ---------- kartu ---------- */
  function buildCards() {
    track.innerHTML = '';
    cards = items.map((it, i) => {
      const f = document.createElement('figure');
      f.className = 'gal-card'; f.dataset.i = i;
      f.innerHTML = `<img src="${it.src}" alt="${it.alt || it.title}" draggable="false" decoding="async"${it.pos ? ` style="object-position:${it.pos}"` : ''}><span class="gal-dim"></span><span class="gal-ring"></span>`;
      f.style.visibility = 'hidden';
      track.appendChild(f);
      return f;
    });
    dotsEl.innerHTML = '';
    items.forEach((it, i) => {
      const d = document.createElement('button');
      d.className = 'gal-dot'; d.type = 'button'; d.setAttribute('aria-label', `${it.title} (${i + 1})`);
      d.addEventListener('click', () => go(i));
      dotsEl.appendChild(d);
    });
    $('gal-total').textContent = String(items.length).padStart(2, '0');
  }

  function setTab(i) {
    tabIdx = i;
    const t = GALLERY.tabs[i];
    items = t.items;
    $('gal-eyebrow').textContent = `${String(items.length).padStart(2, '0')} ${t.unit}`;
    descEl.classList.add('swap');
    setTimeout(() => { descEl.textContent = t.desc; descEl.classList.remove('swap'); }, descEl.textContent ? 260 : 0);
    buildCards();
    p = target = clamp(t.start ?? Math.floor(items.length / 2), 0, items.length - 1);
    enter = 0; curIdx = -1;
    moveIndicator(); measure(); kick();
  }

  function setCurrent(i) {
    curIdx = i;
    const it = items[i];
    $('gal-cur').textContent = String(i + 1).padStart(2, '0');
    capT.textContent = it.title; capM.textContent = it.meta;
    [capT, capM].forEach(el => { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); });
    [...dotsEl.children].forEach((d, j) => d.setAttribute('aria-current', j === i));
    $('gal-prev').disabled = i === 0; $('gal-next').disabled = i === items.length - 1;
  }

  /* ---------- ukuran ---------- */
  function measure() {
    stageW = stage.clientWidth;
    k = clamp(stageW / 1300, 0.62, 1.12);
    stageH = Math.round(KH[0] * k + 36);
    stage.style.height = stageH + 'px';
    root.style.setProperty('--gal-r', (20 * k).toFixed(1) + 'px');
    Sx = galLayout(p, Math.max(items.length, 1), k, stageW / 2).S;
    moveIndicator(); render();
  }
  new ResizeObserver(() => measure()).observe(stage);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);

  /* ---------- render ---------- */
  function render() {
    const n = items.length; if (!n) return;
    const L = galLayout(p, n, k, stageW / 2);
    for (let i = 0; i < n; i++) {
      const el = cards[i], ad = Math.abs(i - p);
      let o = clamp(1 - (ad - 3.2) / 1.4, 0, 1);
      const te = reduce ? 1 : clamp(enter * 1.7 - ad * 0.16, 0, 1), ease = 1 - Math.pow(1 - te, 3);
      o *= ease;
      if (o < 0.003) { el.style.visibility = 'hidden'; continue; }
      const w = L.w[i], h = L.h[i] * (0.9 + 0.1 * ease), y = (stageH - h) / 2 + (1 - ease) * 38;
      el.style.visibility = 'visible';
      el.style.width = w.toFixed(1) + 'px'; el.style.height = h.toFixed(1) + 'px';
      el.style.transform = `translate3d(${(L.x[i] - w / 2).toFixed(1)}px,${y.toFixed(1)}px,0)`;
      el.style.opacity = o.toFixed(3);
      el.style.zIndex = 100 - Math.round(ad * 10);
      el.style.setProperty('--f', clamp(1 - ad * 1.5, 0, 1).toFixed(3));
      el.style.setProperty('--dim', clamp(ad * 0.2, 0, 0.6).toFixed(3));
      el.style.cursor = ad < 0.4 ? 'zoom-in' : 'pointer';
    }
    Sx = L.S;
    const idx = clamp(Math.round(p), 0, n - 1);
    if (idx !== curIdx) setCurrent(idx);
  }

  /* ---------- animasi ---------- */
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
  function tick(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    let moving = false;
    if (dragging) moving = true;
    else {
      p += (target - p) * (1 - Math.exp(-dt * (reduce ? 30 : 9)));
      if (Math.abs(target - p) > 0.0008) moving = true; else p = target;
    }
    if (enter >= 0 && enter < 1) { enter = Math.min(1, enter + dt / (reduce ? 0.01 : 1.05)); moving = true; }
    render();
    if (moving) raf = requestAnimationFrame(tick);
  }
  function go(i) { target = clamp(i, 0, items.length - 1); kick(); }

  /* ---------- seret / sentuh ---------- */
  stage.addEventListener('pointerdown', e => {
    if (e.button !== 0 || lbOpen) return;
    dragging = true; moved = false; sx = lastX = e.clientX; sp = p; vel = 0; lastT = performance.now(); pid = e.pointerId;
    const c = e.target.closest('.gal-card'); tapIdx = c ? +c.dataset.i : -1;
    stage.setPointerCapture(pid); stage.classList.add('is-drag'); kick();
  });
  stage.addEventListener('pointermove', e => {
    if (!dragging || e.pointerId !== pid) return;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 6) moved = true;
    if (!moved) return;
    const n = items.length, raw = sp - dx / Sx;
    p = raw < 0 ? raw * 0.35 : raw > n - 1 ? (n - 1) + (raw - (n - 1)) * 0.35 : raw;
    target = p;
    const now = performance.now(), dt = (now - lastT) / 1000;
    if (dt > 0) vel = 0.75 * vel + 0.25 * (-(e.clientX - lastX) / Sx / dt);
    lastX = e.clientX; lastT = now;
  });
  function endDrag(cancel) {
    if (!dragging) return;
    dragging = false; stage.classList.remove('is-drag');
    try { stage.releasePointerCapture(pid); } catch (_) {}
    const n = items.length;
    if (!moved && !cancel) {
      if (tapIdx >= 0) {
        if (tapIdx === curIdx && Math.abs(p - curIdx) < 0.35) openLB(tapIdx); else go(tapIdx);
      }
    } else {
      if (performance.now() - lastT > 90) vel = 0;
      go(Math.round(clamp(p + vel * 0.22, 0, n - 1)));
    }
    kick();
  }
  stage.addEventListener('pointerup', () => endDrag(false));
  stage.addEventListener('pointercancel', () => endDrag(true));

  /* ---------- scroll mouse / trackpad ---------- */
  stage.addEventListener('wheel', e => {
    if (GALLERY.wheel === 'off' || dragging) return;
    const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    if (GALLERY.wheel === 'horizontal' && !horiz) return;
    let d = horiz ? e.deltaX : e.deltaY;
    if (e.deltaMode === 1) d *= 16;
    const n = items.length;
    if ((target <= 0.001 && d < 0) || (target >= n - 1 - 0.001 && d > 0)) return;   // di ujung: biarkan halaman scroll
    e.preventDefault();
    target = clamp(target + d / 260, 0, n - 1);
    clearTimeout(snapT);
    snapT = setTimeout(() => { target = Math.round(target); kick(); }, 140);
    kick();
  }, { passive: false });

  /* ---------- keyboard & tombol ---------- */
  stage.addEventListener('keydown', e => {
    const c = Math.round(target);
    if (e.key === 'ArrowRight') { go(c + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { go(c - 1); e.preventDefault(); }
    else if (e.key === 'Home') { go(0); e.preventDefault(); }
    else if (e.key === 'End') { go(items.length - 1); e.preventDefault(); }
    else if (e.key === 'Enter' || e.key === ' ') { openLB(curIdx); e.preventDefault(); }
  });
  $('gal-prev').addEventListener('click', () => go(Math.round(target) - 1));
  $('gal-next').addEventListener('click', () => go(Math.round(target) + 1));

  /* ---------- lightbox ---------- */
  const lb = $('gal-lb'); let lbOpen = false, lbIdx = 0;
  function fillLB(i) {
    lbIdx = (i + items.length) % items.length;
    const it = items[lbIdx];
    $('lb-img').src = it.src; $('lb-img').alt = it.alt || it.title;
    $('lb-t').textContent = it.title; $('lb-m').textContent = it.meta;
    go(lbIdx);
  }
  function openLB(i) {
    if (i < 0) return;
    fillLB(i); lbOpen = true; lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden'; $('lb-x').focus();
  }
  function closeLB() {
    lbOpen = false; lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = ''; stage.focus({ preventScroll: true });
  }
  $('lb-x').addEventListener('click', closeLB);
  $('lb-p').addEventListener('click', () => fillLB(lbIdx - 1));
  $('lb-n').addEventListener('click', () => fillLB(lbIdx + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLB(); });
  document.addEventListener('keydown', e => {
    if (!lbOpen) return;
    if (e.key === 'Escape') closeLB();
    else if (e.key === 'ArrowLeft') fillLB(lbIdx - 1);
    else if (e.key === 'ArrowRight') fillLB(lbIdx + 1);
  });

  /* ---------- mulai: animasi masuk saat section terlihat ---------- */
  setTab(0);
  enter = 0;
  if ('IntersectionObserver' in window && !reduce) {
    let started = false; enter = -1;                       // tahan animasi sampai terlihat
    const io = new IntersectionObserver(es => {
      if (es[0].isIntersecting && !started) { started = true; enter = 0; kick(); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(stage); kick();
  }
})();

/* Ikuti tema terang/gelap situs */
(() => {
  const g = document.getElementById('galeri'), h = document.documentElement;
  const sync = () => { g.dataset.theme = h.dataset.theme === 'dark' ? 'dark' : 'light'; };
  sync(); new MutationObserver(sync).observe(h, { attributes: true, attributeFilter: ['data-theme'] });
})();
