// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile navigation
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(open));
});
nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
});

// Walkthrough: click a step to show its screen
const tabs = document.querySelectorAll('.walk-steps [role="tab"]');
const panels = document.querySelectorAll('.wv[data-panel]');
function showStep(n) {
  tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.step === n)));
  panels.forEach((p) => { p.hidden = p.dataset.panel !== n; });
}
tabs.forEach((t) => {
  t.addEventListener('click', () => showStep(t.dataset.step));
  t.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const i = [...tabs].indexOf(t) + (e.key === 'ArrowDown' ? 1 : -1);
    const next = tabs[(i + tabs.length) % tabs.length];
    next.focus();
    showStep(next.dataset.step);
  });
});

// Hero: switch between product stages
const stageTabs = document.querySelectorAll('.stage-tabs [role="tab"]');
const stagePanels = document.querySelectorAll('[data-stage-panel]');
stageTabs.forEach((t) => t.addEventListener('click', () => {
  stageTabs.forEach((x) => x.setAttribute('aria-selected', String(x === t)));
  stagePanels.forEach((p) => { p.hidden = p.dataset.stagePanel !== t.dataset.stage; });
}));
