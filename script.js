document.addEventListener('DOMContentLoaded', () => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior = reduce ? 'auto' : 'smooth';

  /* ---------- Theme: remembers choice, follows system by default ---------- */
  const root = document.documentElement, themeBtn = $('#themeToggle');
  const setTheme = t => {
    root.dataset.theme = t;
    themeBtn.firstElementChild.className = t === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  };
  let saved = null; try { saved = localStorage.getItem('theme'); } catch (e) {}
  setTheme(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  themeBtn.addEventListener('click', () => {
    const t = root.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(t); try { localStorage.setItem('theme', t); } catch (e) {}
  });

  /* ---------- Navbar: glass on scroll, hide on scroll down, back-to-top ---------- */
  const nav = $('.navbar'), menu = $('#nav'), topBtn = $('#scrollTopBtn');
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY, menuOpen = menu.classList.contains('show');
    nav.classList.toggle('scrolled', y > 50);
    nav.classList.toggle('nav-hidden', y > lastY && y > 120 && !menuOpen);
    topBtn.classList.toggle('show', y > 400);
    lastY = y; ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  topBtn.addEventListener('click', () => scrollTo({ top: 0, behavior }));

  /* ---------- Anchor links: offset for fixed navbar, close mobile menu ---------- */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') { e.preventDefault(); return; }
    if (id === '#top') { e.preventDefault(); scrollTo({ top: 0, behavior }); return; }
    const target = $(id); if (!target) return;
    e.preventDefault();
    scrollTo({ top: target.getBoundingClientRect().top + scrollY - nav.offsetHeight + 1, behavior });
    history.replaceState(null, '', id);
    if (menu.classList.contains('show')) bootstrap.Collapse.getInstance(menu)?.hide();
  }));

  /* ---------- Highlight the current section in the navbar ---------- */
  const links = $$('.nav-link[href^="#"]');
  const sections = links.map(l => $(l.getAttribute('href'))).filter(Boolean);
  const scrollObserver = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    links.forEach(l => {
      const on = l.getAttribute('href') === '#' + en.target.id;
      l.classList.toggle('active', on);
      on ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current');
    });
  }), { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => scrollObserver.observe(s));

  /* ---------- Hero typing demo (static text for reduced motion) ---------- */
  const prompts = ['Can you build an app for my shop?', 'How can AI cut my support workload?', 'What would a booking website cost?', 'Can you connect my CRM to my billing system?'];
  const typed = $('#typed');
  if (typed) {
    if (reduce) typed.textContent = prompts[0];
    else {
      let p = 0, c = 0, deleting = false;
      (function loop() {
        const s = prompts[p]; typed.textContent = s.slice(0, c);
        if (!deleting && c === s.length) { deleting = true; return setTimeout(loop, 1800); }
        if (deleting && c === 0) { deleting = false; p = (p + 1) % prompts.length; }
        c += deleting ? -1 : 1;
        setTimeout(loop, deleting ? 25 : 55);
      })();
    }
  }

  /* ---------- Estimator: edit BASE to match your real pricing (in INR) ---------- */
  const BASE = 25000;
  const inr = n => '₹' + (Math.round(n / 1000) * 1000).toLocaleString('en-IN');
  const estimate = () => {
    const m = +$('#estType').value * +$('#estSize').value * +$('#estDesign').value;
    $('#estResult').textContent = `${inr(BASE * m)} to ${inr(BASE * m * 1.5)}`;
  };
  ['#estType', '#estSize', '#estDesign'].forEach(s => $(s).addEventListener('change', estimate));
  estimate();
  $('#estSend').addEventListener('click', () => {
    const label = s => $(s).selectedOptions[0].text;
    $('#message').value = `Estimate request: ${label('#estType')}, ${label('#estSize')}, ${label('#estDesign')}. Range shown: ${$('#estResult').textContent}.\n\nMore details: `;
    setTimeout(() => $('#message').focus({ preventScroll: true }), 600);
  });

  /* ---------- Forms: contact + newsletter send to Formspree ---------- */
  const handleForm = (form, statusEl, okMsg, busyMsg) => {
    if (!form) return;
    const btn = form.querySelector('button[type=submit]');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (/YOUR_/.test(form.action)) { statusEl.textContent = 'This form is not connected yet. Add your Formspree ID in index.html.'; return; }
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = busyMsg; statusEl.textContent = '';
      try {
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(res.status);
        form.reset(); statusEl.textContent = okMsg;
      } catch (err) {
        statusEl.textContent = 'Could not send. Please email info@digitalsolutions.com instead.';
      }
      btn.disabled = false; btn.textContent = label;
    });
  };
  handleForm($('#contactForm'), $('#formStatus'), 'Thanks. We will reply within one working day.', 'Sending...');
  const nl = $('#newsletterForm');
  if (nl) {
    const nlStatus = document.createElement('p');
    nlStatus.setAttribute('role', 'status'); nlStatus.className = 'mt-2 mb-0 small col-12';
    nl.after(nlStatus);
    handleForm(nl, nlStatus, 'You are subscribed. Thank you!', 'Subscribing...');
  }

  /* ---------- Chat assistant: scored keyword matching, no API key needed ---------- */
  const panel = $('#chatPanel'), log = $('#chatLog'), input = $('#chatInput'), fab = $('#chatFab');
  const KB = [
    { k: ['price', 'cost', 'budget', 'quote', 'how much', 'package', 'plan'], a: 'We offer three packages: Launch (business website), Grow (web or mobile app) and Automate (AI and integrations). Use the estimator on this page for a rough range. A fixed quote follows a short call.' },
    { k: ['ai', 'chatbot', 'gpt', 'llm', 'claude', 'automation', 'automate'], a: 'We build support chatbots, document search and workflow automation, and add AI features to existing apps. We usually start with a 2 to 4 week pilot.' },
    { k: ['mobile', 'android', 'ios', 'app'], a: 'We build Android and iOS apps from one codebase, along with the backend and admin panel behind them.' },
    { k: ['website', 'web', 'react', 'mern', 'ecommerce', 'shop'], a: 'We build fast React and MERN websites, web apps and online stores with SEO set up from day one.' },
    { k: ['time', 'long', 'deadline', 'week', 'when', 'delivery'], a: 'Websites take about 2 to 4 weeks. Apps and AI systems take 6 to 12 weeks, with a demo every week.' },
    { k: ['seo', 'google', 'rank', 'traffic', 'analytics'], a: 'We handle technical SEO, structured data and analytics so you can see what brings in customers.' },
    { k: ['own', 'ownership', 'source code', 'code', 'data'], a: 'You own the code, accounts and data. After final payment you receive everything with documentation.' },
    { k: ['support', 'maintenance', 'after launch', 'fix'], a: 'Every package includes free support after launch. Monthly plans cover monitoring, updates and new features.' },
    { k: ['abroad', 'usa', 'uk', 'international', 'remote', 'outside', 'india'], a: 'Yes, we work with clients worldwide through weekly video calls and a shared project board.' },
    { k: ['design', 'ui', 'ux', 'logo', 'brand', 'figma'], a: 'Our designers handle UI/UX in Figma, logos, social creatives and brand kits.' },
    { k: ['cloud', 'aws', 'devops', 'docker', 'deploy', 'server'], a: 'We deploy on AWS with Docker and CI/CD pipelines, with monitoring so releases are safe and easy to roll back.' },
    { k: ['contact', 'call', 'talk', 'hire', 'email', 'phone', 'whatsapp', 'meeting'], a: 'Use the contact form below, email info@digitalsolutions.com, or tap the green WhatsApp button. We reply within one working day.' },
    { k: ['hi', 'hello', 'hey'], a: 'Hello! Ask me about services, pricing, timelines or AI projects.' }
  ];
  const FALLBACK = 'I am not sure about that one. Please send the details through the contact form and a team member will answer.';
  const addMsg = (text, who) => {
    const d = document.createElement('div'); d.className = 'msg ' + who; d.textContent = text;
    log.append(d); log.scrollTop = log.scrollHeight; return d;
  };
  const answer = q => {
    const words = q.toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
    const padded = ' ' + words.replace(/\s+/g, ' ') + ' ';
    let best = null, bestScore = 0;
    KB.forEach(e => {
      const score = e.k.reduce((s, k) => s + (padded.includes(' ' + k + ' ') || (k.length > 3 && words.includes(k)) ? 1 : 0), 0);
      if (score > bestScore) { best = e; bestScore = score; }
    });
    return best ? best.a : FALLBACK;
  };
  const ask = q => {
    addMsg(q, 'me');
    const typing = addMsg('...', 'bot'); typing.setAttribute('aria-label', 'Assistant is typing');
    setTimeout(() => { typing.removeAttribute('aria-label'); typing.textContent = answer(q); log.scrollTop = log.scrollHeight; }, reduce ? 0 : 600);
  };
  ['Pricing', 'AI services', 'Timeline', 'Contact'].forEach(q => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = q;
    b.addEventListener('click', () => ask(q)); $('#chatQuick').append(b);
  });
  const toggleChat = open => {
    panel.hidden = !open; fab.setAttribute('aria-expanded', String(open));
    if (open) { if (!log.children.length) addMsg('Hi! Ask about services, pricing or timelines.', 'bot'); input.focus(); }
  };
  $$('[data-open-chat]').forEach(b => b.addEventListener('click', () => toggleChat(panel.hidden)));
  $('#chatClose').addEventListener('click', () => { toggleChat(false); fab.focus(); });
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') { toggleChat(false); fab.focus(); } });
  $('#chatForm').addEventListener('submit', e => {
    e.preventDefault(); const v = input.value.trim(); if (v) { ask(v); input.value = ''; }
  });
});