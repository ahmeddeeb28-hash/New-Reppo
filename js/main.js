// Scopeline landing page interactions. Every section renders a complete state without JS.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
$('#year').textContent = new Date().getFullYear();

/* ---------- 1. Hero demo: plays when visible, replayable ---------- */
const demo = $('#demo');
let timers = [];
function playDemo() {
  if (!demo || reduceMotion) return;
  timers.forEach(clearTimeout); timers = [];
  const steps = $$('[data-t]', demo);
  const proposal = $('.proposal', demo);
  const ready = $('#demo-ready b');
  demo.classList.add('playing');
  steps.forEach((el) => el.classList.remove('in'));
  proposal.classList.remove('fixed');
  $$('.d-tools li', demo).forEach((li) => li.classList.add('busy'));
  ready.textContent = '0';
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  const show = (t) => $$(`[data-t="${t}"]`, demo).forEach((el) => el.classList.add('in'));
  show(0);
  [1, 2, 3].forEach((t, i) => {
    at(700 + i * 700, () => show(t));
    at(1300 + i * 700, () => $(`[data-t="${t}"]`, demo).classList.remove('busy'));
  });
  at(3300, () => show(4));
  [5, 6, 7].forEach((t, i) => at(3900 + i * 650, () => { show(t); ready.textContent = String(i + 1); }));
  at(6000, () => show(8));
  at(7600, () => { proposal.classList.add('fixed'); ready.textContent = '4'; });
  at(8400, () => show(9));
}
if (demo) {
  $('#replay').addEventListener('click', playDemo);
  let played = false;
  new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting && !played) { played = true; playDemo(); } });
  }, { threshold: 0.35 }).observe(demo);
}

/* ---------- 2. Claim labeller (local heuristics, no network) ---------- */
const EXAMPLES = [
  'Most customers reorder the same basket every month, so one-tap reorder will lift repeat purchases by 20%. What happens when an item is out of stock?',
  'According to October support tickets, customers rebuild baskets by hand. Saved carts will cut checkout time in half. We decided carts expire after 30 days.',
  'Users hate re-adding items. Engineering says prices must be re-checked at checkout. Should guests be able to save a cart? 3 of 5 interviewees asked for it, per the interview notes.',
];
const textEl = $('#lab-text');
const listEl = $('#lab-claims');
const SOURCE_RE = /\b(according to|per the|source:|from the (survey|interviews?|tickets|data|analytics)|support tickets|interview notes|analytics shows?|data shows?)\b/i;
const DECISION_RE = /\b(we decided|we agreed|decision:|we will not|we won't|is out of scope|agreed to)\b/i;
const CAUSAL_RE = /\b(will|lift|boost|increase|reduce|cut|drive|improve|cause|lead to)\b/i;
const NUM_RE = /\d+(?:[.,]\d+)?\s?%?|\b(half|double|twice|triple)\b/gi;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function classify(sentence) {
  const s = sentence.trim();
  const numbers = s.match(NUM_RE) || [];
  const sourced = SOURCE_RE.test(s);
  if (s.endsWith('?')) return { kind: 'qu', label: 'Open question', s, notes: ['Assign it to the role that can answer it.'] };
  if (DECISION_RE.test(s)) return { kind: 'dc', label: 'Decision', s, notes: ['Record who decided and why.'], numbers: sourced ? [] : numbers };
  if (sourced && !CAUSAL_RE.test(s)) return { kind: 'ev', label: 'Evidence', s, notes: ['Linked to the source it names.'] };
  const notes = [];
  if (CAUSAL_RE.test(s)) notes.push('States an outcome as fact. Needs an owner and a test.');
  else notes.push('No source named, so it stays an assumption.');
  return { kind: 'as', label: 'Assumption', s, notes, numbers: sourced ? [] : numbers };
}
function bump(id, n) {
  const el = $(id); if (el.textContent !== String(n)) { el.textContent = n; el.parentElement.classList.remove('bump'); void el.offsetWidth; el.parentElement.classList.add('bump'); }
}
function label() {
  const text = textEl.value;
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).map((x) => x.trim()).filter((x) => x.length > 2);
  const claims = sentences.map(classify);
  const cls = { ev: 'co-ev', as: 'co-as', qu: 'co-qu', dc: 'co-dc' };
  let flags = 0;
  listEl.innerHTML = claims.length ? claims.map((c) => {
    let body = esc(c.s);
    const nums = (c.numbers || []).filter(Boolean);
    nums.forEach((n) => { body = body.replace(esc(n), `<mark class="bad">${esc(n)}</mark>`); });
    flags += nums.length;
    const notes = c.notes.map((n) => `<span class="lab-note">${n}</span>`).join('') + (nums.length ? `<span class="lab-note warn">${nums.length === 1 ? 'This number has' : 'These numbers have'} no source. Scopeline leaves it blank until someone adds one.</span>` : '');
    return `<li class="callout ${cls[c.kind]}"><span class="co-tag">${c.label}</span>${body}${notes}</li>`;
  }).join('') : '<li class="lab-empty">Type or paste a sentence from a spec.</li>';
  const count = (k) => claims.filter((c) => c.kind === k).length;
  bump('#n-ev', count('ev')); bump('#n-as', count('as')); bump('#n-qu', count('qu')); bump('#n-dc', count('dc')); bump('#n-flag', flags);
}
if (textEl) {
  const chips = $$('.chip-btn');
  const pick = (i) => { textEl.value = EXAMPLES[i]; chips.forEach((c, j) => c.classList.toggle('on', i === j)); label(); };
  chips.forEach((c, i) => c.addEventListener('click', () => pick(i)));
  textEl.addEventListener('input', () => { chips.forEach((c) => c.classList.remove('on')); label(); });
  pick(0);
}

/* ---------- 3. Gaps: fix each one, watch readiness fill ---------- */
const gapItems = $$('[data-gap]');
const meter = $('#gap-meter'), agreedEl = $('#gap-agreed'), badge = $('#gap-badge');
const readyBox = $('#ready-state'), resetBtn = $('#gap-reset'), card = $('#gaps-card');
function burst(el) {
  if (reduceMotion) return;
  const r = el.getBoundingClientRect(), c = card.getBoundingClientRect();
  const colors = ['#3ccf91', '#f5b748', '#7d8cff', '#ff8fa6'];
  for (let i = 0; i < 14; i++) {
    const b = document.createElement('i'); b.className = 'burst';
    b.style.left = (r.left - c.left + r.width / 2) + 'px'; b.style.top = (r.top - c.top + r.height / 2) + 'px';
    b.style.background = colors[i % 4];
    b.style.setProperty('--dx', (Math.cos(i / 14 * 6.28) * (40 + Math.random() * 50)) + 'px');
    b.style.setProperty('--dy', (Math.sin(i / 14 * 6.28) * (40 + Math.random() * 50)) + 'px');
    card.appendChild(b); setTimeout(() => b.remove(), 950);
  }
}
function updateGaps() {
  const open = gapItems.filter((li) => !li.classList.contains('fixed')).length;
  const ready = 11 - open;
  meter.style.width = Math.round(ready / 11 * 100) + '%';
  agreedEl.textContent = ready;
  badge.textContent = open ? `${open} open` : 'None open';
  badge.classList.toggle('ok', !open);
  readyBox.hidden = open > 0;
  resetBtn.hidden = open === 4;
}
gapItems.forEach((li) => $('button', li).addEventListener('click', (e) => {
  li.classList.add('fixed'); $('button', li).textContent = 'Fixed'; burst(e.currentTarget); updateGaps();
}));
$('#agree-all')?.addEventListener('click', (e) => {
  card.classList.add('agreed'); readyBox.innerHTML = '<b>Agreed by PM, Design, Growth and Eng</b><span>Saved with every reason. Ready to share as a summary and a brief.</span>'; burst(e.currentTarget);
});
resetBtn?.addEventListener('click', () => {
  gapItems.forEach((li) => { li.classList.remove('fixed'); $('button', li).textContent = 'Fix'; });
  card.classList.remove('agreed');
  readyBox.innerHTML = '<b>Ready to agree</b><span>Every section has content and nothing is missing.</span><button type="button" class="pill pill-dark pill-small" id="agree-all">Mark all agreed</button>';
  $('#agree-all').addEventListener('click', (e) => { card.classList.add('agreed'); readyBox.innerHTML = '<b>Agreed by PM, Design, Growth and Eng</b><span>Saved with every reason. Ready to share as a summary and a brief.</span>'; burst(e.currentTarget); });
  updateGaps();
});

/* ---------- 4. Roles: each role's questions on the same definition ---------- */
const ROLE_QS = {
  design: { name: 'Design', qs: [
    ['What if an item in the basket is out of stock?', ['Hide it', 'Show it, excluded from the total', 'Block the reorder']],
    ['Where does reorder start?', ['Order history', 'Home screen card', 'Both']]] },
  growth: { name: 'Growth', qs: [
    ['Do we have a repeat-order baseline?', ['Yes, in analytics', 'No, needs instrumentation']],
    ['How will we know it worked?', ['Holdout on eligible cohort', 'Before-and-after only']]] },
  eng: { name: 'Engineering', qs: [
    ['When are prices re-checked?', ['When the basket is rebuilt', 'At payment']],
    ['Any dependency on the catalogue team?', ['Yes, variant mapping', 'No']]] },
  pm: { name: 'Product', qs: [
    ['Who is v1 for?', ['Customers with 2+ past orders', 'Everyone']],
    ['What does v1 leave out?', ['Scheduled reorders', 'Editing past orders']]] },
};
let role = 'design', qi = 0;
const doc = $('.role-doc');
function renderRole() {
  const r = ROLE_QS[role];
  $$('.rd-sec', doc).forEach((s) => s.classList.toggle('lit', s.dataset.for.split(' ').includes(role)));
  $('#res-title').textContent = `${r.name} · ${r.qs.length} questions`;
  const optsEl = $('#res-opts');
  if (qi >= r.qs.length) {
    $('#res-step').textContent = 'Done';
    $('#res-q').textContent = '';
    optsEl.innerHTML = `<div class="res-done">${r.name}'s questions are answered and saved as decisions with reasons.</div>`;
    return;
  }
  const [q, opts] = r.qs[qi];
  $('#res-step').textContent = `${qi + 1} / ${r.qs.length}`;
  $('#res-q').textContent = q;
  optsEl.innerHTML = opts.map((o) => `<button type="button">${esc(o)}</button>`).join('');
  $$('button', optsEl).forEach((b) => b.addEventListener('click', () => {
    b.classList.add('on'); setTimeout(() => { qi++; renderRole(); }, reduceMotion ? 0 : 450);
  }));
}
$$('.roles [role="tab"]').forEach((t) => t.addEventListener('click', () => {
  $$('.roles [role="tab"]').forEach((x) => x.setAttribute('aria-selected', String(x === t)));
  role = t.dataset.role; qi = 0; renderRole();
}));
if (doc) renderRole();

/* ---------- 5. Stage tabs ---------- */
$$('.stage-tabs [role="tab"]').forEach((t) => t.addEventListener('click', () => {
  $$('.stage-tabs [role="tab"]').forEach((x) => x.setAttribute('aria-selected', String(x === t)));
  $$('.stage-panel').forEach((p) => { p.hidden = p.dataset.panel !== t.dataset.stage; });
}));

/* ---------- Progress rail: where you are in the story ---------- */
const railLinks = $$('.rail a');
const order = railLinks.map((a) => a.dataset.rail);
const seen = new Set();
const sections = order.map((id) => document.getElementById(id)).filter(Boolean);
function setActive(id) {
  const idx = order.indexOf(id);
  railLinks.forEach((a, i) => { a.classList.toggle('on', i === idx); a.classList.toggle('done', i < idx); });
}
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { seen.add(e.target.id); setActive(e.target.id); } });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach((s) => io.observe(s));
setActive('top');
