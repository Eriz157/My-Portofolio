/* ==========================================================
   Erizq Portfolio - script.js
   Edit the DATA block to change skills & projects.
   Anything written like [PLACEHOLDER] is not filled in yet.
   ========================================================== */

/* ---------- DATA: SKILLS ---------- */
const SKILLS = [
  { title: 'Programming', items: ['Java', 'Python', 'SQL', 'HTML', 'CSS', 'JavaScript'] },
  { title: 'Database', items: ['PostgreSQL', 'MySQL', 'Database Design', 'SQL Query'] },
  { title: 'Tools', items: ['Git', 'GitHub', 'IntelliJ IDEA', 'VS Code', 'pgAdmin', 'Cisco Packet Tracer'] },
  { title: 'Currently Learning', learning: true, items: ['Artificial Intelligence', 'Data Science', 'Cloud Computing', 'Web Development'] }
];

/* ---------- DATA: PROJECTS ----------
   image: thumbnail/large screenshot | shots: extra screenshots (optional)
   github / demo: leave demo '' if there is no live demo */
const CONTRIB = ['[DESCRIBE_MY_CONTRIBUTION]'];
const PROJECTS = [
  {
    name: 'Java Marketplace Application', category: 'Java', image: 'assets/images/marketplace.jpg',
    alt: 'Purchase history page of the marketplace application for a customer account',
    description: 'A simple marketplace application developed using Java and JavaFX. The application provides different interfaces and functionalities for customers, sellers, and administrators.',
    tech: ['Java', 'JavaFX', 'Gradle'],
    features: ['Customer product purchasing', 'Seller product management', 'Admin account management', 'Product CRUD', 'Role-based functionality'],
    contribution: CONTRIB, shots: [], github: '[PROJECT_1_GITHUB_URL]', demo: '[PROJECT_1_DEMO_URL]'
  },
  {
    name: 'Student Management Database', category: 'Database', image: 'assets/images/placeholder-database.svg',
    alt: 'Illustration of linked database tables (placeholder, no screenshot yet)',
    description: 'A relational database project designed to manage student-related information and practice SQL querying and database management.',
    tech: ['PostgreSQL', 'SQL', 'pgAdmin'],
    features: ['Relational database design', 'JOIN', 'GROUP BY', 'CASE WHEN', 'Aggregate functions', 'Date and time functions'],
    contribution: CONTRIB, shots: [], github: '[PROJECT_2_GITHUB_URL]', demo: ''
  },
  {
    name: 'Computer Network Simulation', category: 'Network', image: 'assets/images/placeholder-network.svg',
    alt: 'Illustration of three connected routers (placeholder, no screenshot yet)',
    description: 'A computer network simulation created using Cisco Packet Tracer to practice routing, IP addressing, and network connectivity.',
    tech: ['Cisco Packet Tracer', 'RIP', 'OSPF', 'IP Addressing'],
    features: ['Multi-router network', 'Network topology', 'Routing configuration', 'Connectivity testing'],
    contribution: CONTRIB, shots: [], github: '[PROJECT_3_GITHUB_URL]', demo: ''
  },
  {
    name: 'Anging Mammiri - Local Business Website', category: 'Web', image: 'assets/images/umkm-anging-mammiri.jpg',
    alt: 'Landing page of Anging Mammiri, a Makassar food stall website with dark brown and yellow theme',
    description: 'A landing page for a local Makassar food business (UMKM), built with plain HTML and CSS.',
    tech: ['HTML', 'CSS'],
    features: ['Navigation with Home, About, Menu, Testimonials, and Contact sections', 'Hero section with menu and reservation buttons'],
    contribution: CONTRIB, shots: [], github: '[PROJECT_4_GITHUB_URL]', demo: '[PROJECT_4_DEMO_URL]'
  },
  {
    name: 'Dapur Daeng Aso - Makassar Culinary Showcase', category: 'Web', image: 'assets/images/pameran-dapur-daeng-aso.jpg',
    alt: 'Home page of Dapur Daeng Aso with a pastel gradient header and a traditional food logo',
    description: 'A showcase website for a Makassar culinary exhibition, featuring traditional dishes. Built with HTML and CSS.',
    tech: ['HTML', 'CSS'],
    features: ['Navigation with Home, Products, Gallery, and Contact', 'Welcome section with brand logo'],
    contribution: CONTRIB, shots: [], github: '[PROJECT_5_GITHUB_URL]', demo: '[PROJECT_5_DEMO_URL]'
  }
];

/* ---------- HELPERS ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const isPlaceholder = v => !v || v.startsWith('[');
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- RENDER SKILLS (#skillGrid lives inside the merged #skills section) ---------- */
const pad2 = n => String(n).padStart(2, '0');
$('#skillGrid').innerHTML = SKILLS.map((g, gi) => `
  <article class="skill-card sk-${gi + 1}${g.learning ? ' learning' : ''}" style="--k:${gi}">
    <header class="sk-head">
      <span class="sk-no" aria-hidden="true">${pad2(gi + 1)}</span>
      <h3>${esc(g.title)}</h3>
      <span class="sk-count">${pad2(g.items.length)}<small> items</small></span>
    </header>
    <ul class="sk-list">${g.items.map((i, ii) => `<li class="sk-item" style="--b:${ii}">${esc(i)}</li>`).join('')}</ul>
  </article>`).join('');

/* ---------- RENDER PROJECTS (card deck) + FILTER ----------
   Each project becomes one stacked card. The scroll choreography lives in js/project-deck.js;
   this file only produces the markup and re-renders it when a filter chip is pressed. */
const link = (href, label, ghost) => `<a class="btn btn-sm${ghost ? ' btn-ghost' : ''}" href="${esc(href)}" target="_blank" rel="noopener">${label}</a>`;
const PJ_COLORS = [['var(--accent)', 'var(--accent-ink)'], ['var(--lime)', 'var(--ink-d)'], ['var(--pink)', 'var(--ink-d)'], ['var(--blue)', 'var(--ink-d)'], ['var(--yellow)', 'var(--ink-d)']];
const slug = t => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function renderProjects(cat = 'All') {
  const list = PROJECTS.map((p, i) => ({ p, i })).filter(x => cat === 'All' || x.p.category === cat);
  const total = list.length;
  $('#projGrid').innerHTML = list.map(({ p, i }, n) => {
    const [c, ink] = PJ_COLORS[n % PJ_COLORS.length];
    return `
    <article class="pj" data-n="${n}" style="--pc:${c};--pc-ink:${ink}" aria-label="Project ${n + 1} of ${total}: ${esc(p.name)}">
      <button class="pj-spine" type="button" data-go="${n}" tabindex="-1" aria-label="Go to project ${n + 1}: ${esc(p.name)}" title="${esc(p.name)}">
        <b>${pad2(n + 1)}</b><span>${esc(p.name)}</span>
      </button>
      <div class="pj-main">
        <div class="pj-left">
          <div class="pj-shot">
            <div class="pj-bar" aria-hidden="true"><i></i><i></i><i></i><em>~/projects/${esc(slug(p.name))}</em></div>
            <button class="pj-img" type="button" data-open="${i}" aria-label="Open details: ${esc(p.name)}">
              <img src="${p.image}" alt="${esc(p.alt)}" decoding="async" draggable="false">
              <span class="pj-peek" aria-hidden="true">View details</span>
            </button>
            <span class="pj-cat" aria-hidden="true">${esc(p.category)}</span>
          </div>
          <p class="pj-lbl" aria-hidden="true">What it does</p>
          <ul class="pj-feats">${p.features.slice(0, 3).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
        </div>
        <div class="pj-body">
          <span class="pj-ghost" aria-hidden="true">${pad2(n + 1)}</span>
          <p class="pj-no">Project <b>${pad2(n + 1)}</b> / ${pad2(total)}</p>
          <h3><span>${esc(p.name)}</span></h3>
          <p class="pj-desc">${esc(p.description)}</p>
          <ul class="badges">${p.tech.map(t => `<li class="badge">${esc(t)}</li>`).join('')}</ul>
          <dl class="pj-meta">
            <div><dt>Type</dt><dd>${esc(p.category)}</dd></div>
            <div><dt>Stack</dt><dd>${pad2(p.tech.length)} tools</dd></div>
            <div><dt>Features</dt><dd>${pad2(p.features.length)}</dd></div>
          </dl>
          <div class="proj-actions">
            <button class="btn btn-sm" type="button" data-open="${i}">Details</button>
            ${link(p.github, 'GitHub', true)}
            ${p.demo ? link(p.demo, 'Live Demo', true) : ''}
          </div>
        </div>
      </div>
      <span class="pj-shade" aria-hidden="true"></span>
    </article>`;
  }).join('');

  $('#pjRail').innerHTML = list.map(({ p }, n) =>
    `<li><button type="button" class="pj-rail-item" data-go="${n}"><i>${pad2(n + 1)}</i><span>${esc(p.name)}</span></button></li>`).join('');
  $('#pjCol').innerHTML = list.map((_, n) => `<span>${pad2(n + 1)}</span>`).join('');
  $('#pjTotal').textContent = pad2(total);
}
const cats = ['All', ...new Set(PROJECTS.map(p => p.category))];
$('#filters').innerHTML = cats.map((c, i) => `<button class="chip" type="button" aria-pressed="${i === 0}" data-cat="${c}">${c}</button>`).join('');
$('#filters').addEventListener('click', e => {
  const b = e.target.closest('[data-cat]'); if (!b) return;
  $$('.chip').forEach(c => c.setAttribute('aria-pressed', c === b));
  renderProjects(b.dataset.cat);
  if (window.ProjectDeck) ProjectDeck.refresh({ reset: true });
});
renderProjects();

/* ---------- PROJECT DETAIL MODAL ---------- */
const modal = $('#modal'); let lastFocus = null;
function openModal(i) {
  const p = PROJECTS[i]; lastFocus = document.activeElement;
  const ul = a => `<ul class="list">${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  $('#modalBody').innerHTML = `
    <h2 id="mTitle">${esc(p.name)}</h2>
    <img class="m-img" src="${p.image}" alt="${esc(p.alt)}">
    <p>${esc(p.description)}</p>
    <h3>Tech Stack</h3><ul class="badges">${p.tech.map(t => `<li class="badge">${esc(t)}</li>`).join('')}</ul>
    <h3>Key Features</h3>${ul(p.features)}
    <h3>My Contribution</h3>${ul(p.contribution)}
    ${p.shots.length ? `<h3>Additional Screenshots</h3><div class="m-shots">${p.shots.map(s => `<img src="${s.src}" alt="${esc(s.alt)}" loading="lazy">`).join('')}</div>` : ''}
    <h3>Links</h3><div class="proj-actions">${link(p.github, 'GitHub Repository')}${p.demo ? link(p.demo, 'Live Demo', true) : ''}</div>`;
  modal.hidden = false; document.body.style.overflow = 'hidden'; $('#modalX').focus();
}
function closeModal() { modal.hidden = true; document.body.style.overflow = ''; lastFocus && lastFocus.focus(); }
$('#projGrid').addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openModal(+b.dataset.open); });
$('#modalX').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

/* ---------- PLACEHOLDER LINKS: do not navigate, tell the owner ---------- */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="["], a[href^="mailto:["]'); if (!a) return;
  e.preventDefault(); toast('This link is still a placeholder. Replace it in the code.');
});

/* ---------- NAVBAR: scroll style, mobile menu, active link ---------- */
const nav = $('#nav'), menu = $('#menu'), burger = $('#burger'), toTop = $('#toTop');
const setMenu = open => { menu.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); };
burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', scrollY > 10);
  toTop.classList.toggle('show', scrollY > 600);
}, { passive: true });
toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
const secObs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) $$('.menu a:not(.btn)').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
$$('main > section[id]').forEach(s => secObs.observe(s));

/* ---------- SECTION ANIMATION: replays every time a section enters/leaves view ---------- */
$$('.reveal .wrap, .hero-text').forEach(w => [...w.children].forEach((c, i) => c.style.setProperty('--i', i)));
const revObs = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('in', e.isIntersecting)), { threshold: .12 });
$$('.reveal').forEach(el => revObs.observe(el));
addEventListener('scroll', () => { $('#progress').style.width = (scrollY / (document.documentElement.scrollHeight - innerHeight) * 100) + '%'; }, { passive: true });

/* ---------- SECTION-CHANGE TRANSITION: curtain wipe on anchor clicks ---------- */
const curtain = $('#curtain'), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]'); if (!a || a.getAttribute('href').length < 2) return;
  const target = $(a.getAttribute('href')); if (!target) return;
  e.preventDefault();
  if (reduce || curtain.dataset.busy) { target.scrollIntoView(); return; }
  curtain.dataset.busy = 1;
  const h2 = target.querySelector('h2');
  curtain.firstElementChild.textContent = h2 ? h2.textContent : 'Home';
  curtain.className = 'curtain cover';
  setTimeout(() => {
    target.scrollIntoView({ behavior: 'instant' });
    curtain.className = 'curtain leave';
    setTimeout(() => { curtain.className = 'curtain'; delete curtain.dataset.busy; }, 560);
  }, 520);
});

/* ---------- THEME TOGGLE (saved in localStorage) ---------- */
$('#themeBtn').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
});

/* ---------- DYNAMIC GREETING ---------- */
const hr = new Date().getHours();
$('#greeting').textContent = hr < 11 ? 'Good morning' : hr < 15 ? 'Good afternoon' : hr < 19 ? 'Good evening' : 'Good night';

/* ---------- CONTACT FORM: validation + localStorage ----------
   No backend yet: messages are only saved in THIS browser.
   To send for real, POST the `entry` object to your service
   (Formspree, EmailJS, own API) inside the marked spot below. */
const form = $('#contactForm');
const fields = [['cName', 'eName', v => v.trim().length >= 2 || 'Please enter your name.'],
  ['cEmail', 'eEmail', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Please enter a valid email address.'],
  ['cMsg', 'eMsg', v => v.trim().length >= 10 || 'Message must be at least 10 characters.']];
form.addEventListener('submit', e => {
  e.preventDefault(); let ok = true;
  fields.forEach(([id, errId, rule]) => {
    const el = $('#' + id), r = rule(el.value);
    $('#' + errId).textContent = r === true ? '' : r; el.classList.toggle('invalid', r !== true);
    if (r !== true) ok = false;
  });
  if (!ok) return;
  const entry = { name: $('#cName').value.trim(), email: $('#cEmail').value.trim(), message: $('#cMsg').value.trim(), date: new Date().toISOString() };
  try {
    const all = JSON.parse(localStorage.getItem('contactMessages') || '[]'); all.push(entry);
    localStorage.setItem('contactMessages', JSON.stringify(all));
  } catch (err) { /* storage unavailable */ }
  // >>> CONNECT BACKEND HERE: fetch('YOUR_ENDPOINT', { method: 'POST', body: JSON.stringify(entry) })
  $('#formStatus').textContent = 'Saved in this browser only. The message has not been emailed because no email service is connected yet.';
  form.reset();
});

/* ---------- QUOTE: words sharpen as the section scrolls into view ---------- */
(() => {
  const sec = $('#quote'), words = $$('.qw', sec), sub = $('#qSub'), n = words.length;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const update = () => {
    const r = sec.getBoundingClientRect();
    const p = reduce ? 1 : clamp((innerHeight * 0.92 - r.top) / (innerHeight * 0.5), 0, 1);
    words.forEach((w, i) => w.style.setProperty('--o', clamp(p * (n + 1.2) - i, 0.12, 1).toFixed(3)));
    sub.style.setProperty('--so', clamp(p * (n + 1.2) - n, 0, 1).toFixed(3));
  };
  addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); update();
})();

/* ---------- DOODLES: scroll-linked spin, hero parallax, cursor sparkles, click confetti ----------
   Purely decorative. Nothing here touches the existing features; all of it is skipped
   when the visitor prefers reduced motion (the static ornaments still show). */
(() => {
  const root = document.documentElement;
  const foot = $('.foot');
  if (foot) new IntersectionObserver(es => es.forEach(e => foot.classList.toggle('in', e.isIntersecting)), { threshold: .2 }).observe(foot);
  if (reduce) return;

  /* --sy (scroll position) is only read by the spinning ring in the quote section. It used to be written on <html>,
     which made the browser re-style the whole page on every scroll frame (a big source of scroll lag).
     Now it is written on the ring itself, and only while the ring is on screen. */
  let queued = false, ringOn = false;
  const ring = $('.spin-ring');
  const setSy = () => { if (ring) ring.style.setProperty('--sy', Math.round(scrollY)); queued = false; };
  if (ring) new IntersectionObserver(es => { ringOn = es[0].isIntersecting; if (ringOn) setSy(); }, { rootMargin: '20% 0px' }).observe(ring);
  addEventListener('scroll', () => { if (ringOn && !queued) { queued = true; requestAnimationFrame(setSy); } }, { passive: true });
  setSy();

  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!fine) return;

  /* hero: ornaments drift gently against the pointer (depth set per ornament by --d) */
  const hero = $('.hero');
  if (hero) {
    let raf = 0, mx = 0, my = 0;
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - .5) * 2; my = ((e.clientY - r.top) / r.height - .5) * 2;
      if (!raf) raf = requestAnimationFrame(() => { hero.style.setProperty('--mx', mx.toFixed(3)); hero.style.setProperty('--my', my.toFixed(3)); raf = 0; });
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { hero.style.setProperty('--mx', 0); hero.style.setProperty('--my', 0); });
  }

  /* particles layer (cursor sparkles + click confetti) */
  const layer = document.createElement('div');
  layer.className = 'fx'; layer.setAttribute('aria-hidden', 'true'); document.body.appendChild(layer);
  const COLORS = ['var(--lime)', 'var(--accent)', 'var(--blue)', 'var(--pink)', 'var(--yellow)'];
  let ci = 0;
  const particle = (x, y, size, to, opts, round) => {
    if (layer.childElementCount > 40) return;
    const el = document.createElement('i');
    if (round) el.className = 'dot';
    el.style.cssText = `--c:${COLORS[ci++ % COLORS.length]};width:${size}px;height:${size}px`;
    layer.appendChild(el);
    const h = size / 2;
    el.animate([
      { transform: `translate(${x - h}px,${y - h}px) scale(${opts.from}) rotate(0deg)`, opacity: .95 },
      { transform: `translate(${x - h + to.x}px,${y - h + to.y}px) scale(${opts.end}) rotate(${to.r}deg)`, opacity: 0 }
    ], { duration: opts.ms, easing: opts.ease }).onfinish = () => el.remove();
  };

  let lx = -99, ly = -99, last = 0;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || e.target.closest('#skills')) return;   // keep the editorial section calm
    const now = performance.now();
    if (now - last < 45 || Math.hypot(e.clientX - lx, e.clientY - ly) < 28) return;
    last = now; lx = e.clientX; ly = e.clientY;
    particle(lx, ly, 8 + Math.random() * 9, { x: (Math.random() - .5) * 30, y: 14 + Math.random() * 26, r: (Math.random() - .5) * 160 }, { from: 1, end: .1, ms: 650 + Math.random() * 250, ease: 'ease-out' });
  }, { passive: true });

  document.addEventListener('pointerdown', e => {
    if (!e.target.closest('.btn, .chip, .icon-btn, .social a, .totop')) return;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.random() * .5, d = 34 + Math.random() * 46;
      particle(e.clientX, e.clientY, 7 + Math.random() * 8, { x: Math.cos(a) * d, y: Math.sin(a) * d, r: (Math.random() - .5) * 300 }, { from: .4, end: 1, ms: 620, ease: 'cubic-bezier(.2,.8,.3,1)' }, i % 3 === 0);
    }
  }, { passive: true });
})();

/* ---------- EDITORIAL SECTION (#skills): entry animation, plays once when first visible ----------
   Pure CSS does the work; JS only arms the hidden state (.edt--anim) and flips .is-in.
   With reduced motion nothing is armed, so the static layout is shown. */
(() => {
  const sec = $('#skills');
  if (!sec || reduce) return;
  sec.classList.add('edt--anim');
  new IntersectionObserver((es, o) => { if (es.some(e => e.isIntersecting)) { sec.classList.add('is-in'); o.disconnect(); } }, { threshold: .15 }).observe(sec);

})();

/* ---------- EDITORIAL SECTION: gentle depth parallax for the layered portrait ----------
   Sets --edt-p (-1..1) on #skills; CSS moves disc, ring and photo at different speeds. */
(() => {
  const sec = $('#skills');
  if (!sec || reduce || !sec.querySelector('.edt-figure')) return;
  let raf = 0, on = false;
  const tick = () => {
    raf = 0;
    const r = sec.getBoundingClientRect(), vh = innerHeight;
    const p = ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2);
    sec.style.setProperty('--edt-p', Math.max(-1, Math.min(1, p)).toFixed(3));
  };
  const req = () => { if (!raf) raf = requestAnimationFrame(tick); };
  new IntersectionObserver(es => { on = es[0].isIntersecting; if (on) req(); }).observe(sec);
  addEventListener('scroll', () => { if (on) req(); }, { passive: true });
  addEventListener('resize', req, { passive: true });
})();
