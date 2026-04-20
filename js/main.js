/* ── Nav scroll ─────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  if (window.scrollY > 40) navbar.classList.add('scrolled');
  else navbar.classList.remove('scrolled');

  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 120) current = sec.getAttribute('id');
  });
  navLinks.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
  });
}, { passive: true });

/* ── Mobile hamburger ───────────────────────────────────── */
const hamburger = document.querySelector('.hamburger');
hamburger?.addEventListener('click', () => {
  navbar.classList.toggle('nav-open');
});
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => navbar.classList.remove('nav-open'));
});

/* ── Reveal on scroll ───────────────────────────────────── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* ── Counter animation ──────────────────────────────────── */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix || '';
  const duration = 1600;
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCounter(e.target);
      counterObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-number[data-target]').forEach(el => counterObserver.observe(el));

/* ── Typewriter effect ──────────────────────────────────── */
function typewriter(el, words, speed = 90, pause = 2200) {
  let wi = 0, ci = 0, deleting = false;
  const tick = () => {
    const word = words[wi];
    if (deleting) {
      el.textContent = word.substring(0, --ci);
      if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
      setTimeout(tick, speed / 2);
    } else {
      el.textContent = word.substring(0, ++ci);
      if (ci === word.length) { deleting = true; setTimeout(tick, pause); return; }
      setTimeout(tick, speed);
    }
  };
  tick();
}
const twEl = document.querySelector('.typewriter');
if (twEl) typewriter(twEl, twEl.dataset.words.split('|'));

/* ── Contact form ───────────────────────────────────────── */
const form = document.getElementById('contact-form');
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = form.querySelector('.form-submit');
  const success = form.querySelector('.form-success');

  btn.disabled = true;
  btn.textContent = 'Enviando...';

  // Simulate async send (replace with actual fetch to your backend)
  setTimeout(() => {
    form.reset();
    btn.disabled = false;
    btn.textContent = 'Enviar Mensaje';
    success.style.display = 'block';
    setTimeout(() => { success.style.display = 'none'; }, 5000);
  }, 1200);
});

/* ── Smooth anchor scroll ───────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ── Init shader ─────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  new AuroraShader('shader-canvas');
});
