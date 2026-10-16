/* ==========================================================
   Erizq Portfolio - project-deck.js
   Scroll-driven "card deck" for #projects.

   Idea: the visitor never scrolls sideways. The section is a tall track with a
   sticky (pinned) stage inside. While the track scrolls past, every project card
   waits off-screen on the right; each bit of vertical scroll slides the next one in
   and lays it on top of the previous one, which steps back to the left like a
   stack of folders (its coloured spine stays visible, and clicking a spine jumps back).

   Performance rules (this is why it does not lag):
     - one passive scroll listener, work is batched into a single requestAnimationFrame
     - only transform / opacity are written, nothing triggers layout
     - one layout read per frame (track.getBoundingClientRect), then writes only
     - work stops entirely while the section is far away from the viewport
     - cached strings: a style is only written when its value actually changed

   Tune the feel with the CONFIG block below.
   Reduced motion / very short screens fall back to a plain grid (.is-static).
   ========================================================== */
(() => {
  'use strict';

  /* ---------- CONFIG ---------- */
  const CONFIG = {
    stepVh: 0.9,        // scroll distance per project, in screen heights (desktop)
    stepVhMobile: 0.78, // same, on phones (a flick should move about one card)
    enter: 0.62,        // how much of one step is spent sliding a card in (rest = it rests, fully readable)
    intro: 0.85,        // first card slides in while the section scrolls into view (screen heights)
    tail: 0.45,         // extra rest after the last card, in steps, before the page continues
    depth: 3,           // how many covered cards stay visible behind the top one
    shrink: 0.045,      // scale lost per covered card
    shade: 0.17,        // darkness added per covered card
    tilt: 7,            // degrees of tilt while a card flies in
    minHeight: 500      // below this window height the deck becomes a normal grid
  };

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  const sec = $('#projects'), track = $('#pjTrack'), stage = $('#pjStage'), deck = $('#projGrid');
  if (!sec || !track || !stage || !deck) return;
  const countBox = $('#pjCount'), bar = $('#pjBar'), rail = $('#pjRail');
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');

  let cards = [], n = 0;
  let step = 0, intro = 0, enterLen = 0, peek = 0, off = 0, stageH = 0;
  let isStatic = false, near = false, raf = 0, active = -1;
  const cache = [];

  /* ---------- measure everything that only changes on resize / re-render ---------- */
  function measure() {
    isStatic = reduceMQ.matches || innerHeight < CONFIG.minHeight;
    sec.classList.toggle('is-static', isStatic);
    cards = $$('.pj', deck); n = cards.length;
    stage.style.setProperty('--n', n);
    cards.forEach(c => { $('.pj-main', c).inert = false; });
    cache.length = 0; active = -1;
    if (isStatic || !n) { track.style.height = ''; cards.forEach(c => { c.style.transform = ''; c.style.opacity = ''; }); return; }

    stageH = stage.offsetHeight;
    const mobile = innerWidth <= 960;
    step = Math.round(stageH * (mobile ? CONFIG.stepVhMobile : CONFIG.stepVh));
    enterLen = Math.round(step * CONFIG.enter);
    intro = Math.round(stageH * CONFIG.intro);
    peek = parseFloat(getComputedStyle(deck).getPropertyValue('--peek')) || 40;

    // distance that parks a card fully beyond the right edge: its resting left edge -> viewport edge, plus shadow
    const restLeft = deck.getBoundingClientRect().left + peek * CONFIG.depth;
    off = Math.round(stage.clientWidth - restLeft + 80);

    track.style.height = (stageH + (n - 1) * step + Math.round(step * CONFIG.tail)) + 'px';
  }

  /* ---------- the per-frame choreography ---------- */
  function frame() {
    raf = 0;
    if (isStatic || !n) return;
    const s = -track.getBoundingClientRect().top;        // px scrolled past the moment the stage pins

    // 1) how far has each card travelled in? (0 = parked right, 1 = landed)
    const e = new Array(n);
    let top = 0;
    for (let i = 0; i < n; i++) {
      const len = i === 0 ? intro : enterLen;
      e[i] = easeOut(clamp((s - (i * step - len)) / len, 0, 1));
      if (e[i] >= 0.5) top = i;
    }

    // 2) place every card: flight-in + how deep it is buried under the cards above it
    for (let i = 0; i < n; i++) {
      let d = 0;                                          // burial depth, continuous
      for (let j = i + 1; j < n; j++) d += e[j];
      const k = 1 - e[i];                                 // 1 parked, 0 landed
      const dd = Math.min(d, CONFIG.depth);
      const x = k * off - dd * peek;
      const y = k * 34;
      const rot = k * CONFIG.tilt + (i % 2 ? 1 : -1) * dd * 0.9;
      const sc = 1 - dd * CONFIG.shrink;
      const op = d > CONFIG.depth ? clamp(CONFIG.depth + 1 - d, 0, 1) : 1;

      const t = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      const c = cache[i] || (cache[i] = {});
      if (c.t !== t) { cards[i].style.transform = t; c.t = t; }
      const o = op.toFixed(2);
      if (c.o !== o) { cards[i].style.opacity = o; c.o = o; }
      const sh = (dd * CONFIG.shade).toFixed(3);
      if (c.s !== sh) { (c.shade || (c.shade = $('.pj-shade', cards[i]))).style.opacity = sh; c.s = sh; }
      // the screenshot glides a little inside its frame while the card lands
      const img = c.img || (c.img = $('.pj-img img', cards[i]));
      const p = (-k * 9).toFixed(2) + '%';
      if (c.p !== p) { img.style.translate = p + ' 0'; c.p = p; }
    }

    // 3) HUD: counter, progress bar, rail, hint, glow colour
    const prog = n > 1 ? clamp(s / ((n - 1) * step), 0, 1) : 1;
    bar.style.transform = `scaleX(${prog.toFixed(4)})`;
    stage.classList.toggle('is-moving', s > 40);
    if (top !== active) setActive(top);
  }

  function setActive(i) {
    active = i;
    countBox.style.setProperty('--i', i);
    stage.dataset.now = i % 5;                       // CSS maps 0..4 to the card colours (follows light/dark)
    stage.classList.toggle('is-last', i === n - 1);
    $$('.pj-rail-item', rail).forEach((b, j) => {
      b.classList.toggle('is-on', j === i);
      b.classList.toggle('is-done', j < i);
      if (j === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
    // only the top card is reachable with the keyboard; the spines stay clickable
    cards.forEach((c, j) => { $('.pj-main', c).inert = j !== i; });
  }

  const request = () => { if (!raf) raf = requestAnimationFrame(frame); };

  /* ---------- jump to a project (rail + spines) ---------- */
  function goTo(i) {
    const trackTop = track.getBoundingClientRect().top + scrollY;
    scrollTo({ top: Math.round(trackTop + i * step), behavior: reduceMQ.matches ? 'auto' : 'smooth' });
  }
  stage.addEventListener('click', e => {
    const b = e.target.closest('[data-go]'); if (!b || isStatic) return;
    goTo(+b.dataset.go);
  });

  /* ---------- lifecycle ---------- */
  function refresh(opts = {}) {
    measure();
    if (opts.reset && !isStatic) {
      const top = track.getBoundingClientRect().top + scrollY;
      if (scrollY > top) scrollTo({ top, behavior: 'instant' });
    }
    request();
  }
  window.ProjectDeck = { refresh };

  // work only while the section is anywhere near the screen
  new IntersectionObserver(es => { near = es[0].isIntersecting; if (near) request(); }, { rootMargin: '30% 0px 30% 0px' }).observe(track);
  // squiggle under the title + arrow doodle draw in once the section is on screen
  new IntersectionObserver(es => sec.classList.toggle('in', es[0].isIntersecting), { threshold: 0.05 }).observe(sec);

  addEventListener('scroll', () => { if (near) request(); }, { passive: true });
  let rt = 0;
  addEventListener('resize', () => { cancelAnimationFrame(rt); rt = requestAnimationFrame(() => refresh()); }, { passive: true });
  reduceMQ.addEventListener?.('change', () => refresh());
  addEventListener('load', () => refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => refresh());

  refresh();
})();
