// nav scroll
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

// mobile hamburger
const hamburger = document.querySelector('.hamburger');
hamburger?.addEventListener('click', () => {
  navbar.classList.toggle('nav-open');
});
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => navbar.classList.remove('nav-open'));
});

// reveal on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// counter animation
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

// typewriter effect
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

// contact form → whatsapp
const form = document.getElementById('contact-form');
form?.addEventListener('submit', (e) => {
  e.preventDefault();

  const nombre = form.nombre.value.trim();
  const telefono = form.telefono.value.trim();
  const email = form.email.value.trim();
  const descripcion = form.descripcion.value.trim();

  if (!nombre || !email || !descripcion) {
    form.reportValidity();
    return;
  }

  const msg =
    `Hola, soy *${nombre}*.\n\n` +
    `*Correo:* ${email}\n` +
    (telefono ? `*Teléfono:* ${telefono}\n` : '') +
    `\n*Proyecto:*\n${descripcion}`;

  const url = `https://wa.me/595981118297?text=${encodeURIComponent(msg)}`;

  // Fallback robusto: <a target="_blank"> simulado evita bloqueos de popup
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// smooth anchor scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  });
});

// init shader
window.addEventListener('DOMContentLoaded', () => {
  new AuroraShader('shader-canvas');
});
