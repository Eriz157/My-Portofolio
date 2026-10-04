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

/* ---------- RENDER SKILLS ---------- */
$('#skillGrid').innerHTML = SKILLS.map(g => `
  <article class="skill-card${g.learning ? ' learning' : ''}">
    <h3>${esc(g.title)}</h3>
    <ul class="badges">${g.items.map(i => `<li class="badge">${esc(i)}</li>`).join('')}</ul>
  </article>`).join('');

/* ---------- RENDER PROJECTS + FILTER ---------- */
const link = (href, label, ghost) => `<a class="btn btn-sm${ghost ? ' btn-ghost' : ''}" href="${esc(href)}" target="_blank" rel="noopener">${label}</a>`;
function renderProjects(cat = 'All') {
  const list = PROJECTS.map((p, i) => ({ p, i })).filter(x => cat === 'All' || x.p.category === cat);
  $('#projGrid').innerHTML = list.map(({ p, i }) => `
    <article class="proj">
      <img class="proj-img" src="${p.image}" alt="${esc(p.alt)}" loading="lazy">
      <div class="proj-body">
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.description)}</p>
        <ul class="badges">${p.tech.map(t => `<li class="badge">${esc(t)}</li>`).join('')}</ul>
        <div class="proj-actions">
          <button class="btn btn-sm" type="button" data-open="${i}">Details</button>
          ${link(p.github, 'GitHub', true)}
          ${p.demo ? link(p.demo, 'Live Demo', true) : ''}
        </div>
      </div>
    </article>`).join('');
}
const cats = ['All', ...new Set(PROJECTS.map(p => p.category))];
$('#filters').innerHTML = cats.map((c, i) => `<button class="chip" type="button" aria-pressed="${i === 0}" data-cat="${c}">${c}</button>`).join('');
$('#filters').addEventListener('click', e => {
  const b = e.target.closest('[data-cat]'); if (!b) return;
  $$('.chip').forEach(c => c.setAttribute('aria-pressed', c === b));
  renderProjects(b.dataset.cat);
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
