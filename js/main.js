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

/* ── Génesis Chatbot Widget ─────────────────────────────── */
(function() {
  const root = document.getElementById('gx-chat');
  if (!root) return;

  const endpoint = root.dataset.endpoint;
  const toggle   = document.getElementById('gx-chat-toggle');
  const closeBtn = document.getElementById('gx-chat-close');
  const msgs     = document.getElementById('gx-chat-msgs');
  const form     = document.getElementById('gx-chat-form');
  const input    = document.getElementById('gx-chat-input');
  const send     = document.getElementById('gx-chat-send');

  let history = [];
  let isOpen  = false;
  let isBusy  = false;

  const waFloat = document.querySelector('.wa-float');

  function openPanel() {
    root.classList.add('open');
    root.querySelector('.gx-chat-panel').setAttribute('aria-hidden', 'false');
    isOpen = true;
    if (waFloat) waFloat.style.display = 'none';
    if (history.length === 0) greet();
    setTimeout(() => input.focus(), 250);
  }
  function closePanel() {
    root.classList.remove('open');
    root.querySelector('.gx-chat-panel').setAttribute('aria-hidden', 'true');
    isOpen = false;
    if (waFloat) waFloat.style.display = '';
  }
  toggle.addEventListener('click', () => isOpen ? closePanel() : openPanel());
  closeBtn.addEventListener('click', closePanel);

  function escape(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function addMsg(role, text, isTyping) {
    const div = document.createElement('div');
    div.className = `gx-msg ${role}`;
    div.innerHTML = `<div class="gx-msg-body">${
      isTyping
        ? '<div class="gx-typing"><span></span><span></span><span></span></div>'
        : escape(text)
    }</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function greet() {
    addMsg('bot', '¡Hola! Soy el asistente de Génesis. ¿En qué te ayudo?');
  }

  async function ask(text) {
    history.push({ role: 'user', content: text });
    const typing = addMsg('bot', '', true);
    isBusy = true; send.disabled = true;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      const data = await res.json();
      typing.remove();

      if (!res.ok || data.error) {
        addMsg('bot', '⚠ Hubo un problema. Probá escribirnos directamente al WhatsApp: +595 981 118 297');
        return;
      }
      const reply = data.reply || '(sin respuesta)';
      history.push({ role: 'assistant', content: reply });
      addMsg('bot', reply);
    } catch (e) {
      typing.remove();
      addMsg('bot', '⚠ No pude conectar. Probá el WhatsApp: +595 981 118 297');
    } finally {
      isBusy = false; send.disabled = false;
      input.focus();
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (isBusy) return;
    const text = input.value.trim();
    if (!text) return;
    addMsg('user', text);
    input.value = '';
    ask(text);
  });
})();
