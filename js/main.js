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

// Hero mock: filter claims by type
const filters = document.querySelectorAll('.filter');
const claims = document.querySelectorAll('.claim');
filters.forEach((btn) => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.filter;
    filters.forEach((b) => {
      const on = b === btn;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    claims.forEach((c) => {
      c.classList.toggle('is-dim', type !== 'all' && c.dataset.type !== type);
    });
  });
});
