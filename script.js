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
    setTheme(t); saved = t; try { localStorage.setItem('theme', t); } catch (e) {}
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => { if (!saved) setTheme(e.matches ? 'dark' : 'light'); });

  /* ---------- Images: remove broken logos/photos so the text fallback shows (replaces inline onerror) ---------- */
  const dropBroken = img => img.remove();
  $$('img.brand-logo, .avatar img, .legal-header img').forEach(img => {
    if (img.complete && img.naturalWidth === 0) dropBroken(img);
    else img.addEventListener('error', () => dropBroken(img), { once: true });
  });

  /* ---------- Placeholder links: "View live site" with href="#" is shown as coming soon ---------- */
  $$('a.btn[href="#"][target="_blank"]').forEach(a => {
    a.classList.add('is-pending'); a.setAttribute('aria-disabled', 'true'); a.removeAttribute('target');
    a.title = 'Live link coming soon'; a.textContent = 'Live link coming soon';
  });

  /* ---------- Navbar: glass on scroll, hide on scroll down, back-to-top ---------- */
  const nav = $('.navbar'), menu = $('#nav'), topBtn = $('#scrollTopBtn');
  const links = $$('.nav-link[href^="#"]');
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY, menuOpen = menu.classList.contains('show');
    nav.classList.toggle('scrolled', y > 50);
    nav.classList.toggle('nav-hidden', y > lastY && y > 120 && !menuOpen);
    topBtn.classList.toggle('show', y > 400);
    if (y < 150) links.forEach(l => { l.classList.remove('active'); l.removeAttribute('aria-current'); });
    lastY = y; ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  nav.addEventListener('focusin', () => nav.classList.remove('nav-hidden'));
  topBtn.addEventListener('click', () => scrollTo({ top: 0, behavior }));

  /* ---------- Anchor links: offset for fixed navbar, close mobile menu ---------- */
  const goTo = id => {
    if (id === '#top') { scrollTo({ top: 0, behavior }); return true; }
    const target = id.length > 1 ? $(id) : null; if (!target) return false;
    scrollTo({ top: target.getBoundingClientRect().top + scrollY - nav.offsetHeight + 1, behavior });
    history.replaceState(null, '', id);
    if (menu.classList.contains('show') && window.bootstrap) bootstrap.Collapse.getInstance(menu)?.hide();
    return true;
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') { e.preventDefault(); return; }
    if (goTo(id)) e.preventDefault();
  }));

  /* ---------- Highlight the current section in the navbar ---------- */
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

  /* ---------- Reviews slider: stop auto-advance when the visitor prefers reduced motion ---------- */
  const reviews = $('#reviewCarousel');
  if (reviews && reduce && window.bootstrap) bootstrap.Carousel.getOrCreateInstance(reviews).pause();

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
    $('#estResult').value = `${inr(BASE * m)} to ${inr(BASE * m * 1.5)}`;
  };
  ['#estType', '#estSize', '#estDesign'].forEach(s => $(s).addEventListener('change', estimate));
  estimate();
  $('#estSend').addEventListener('click', () => {
    const label = s => $(s).selectedOptions[0].text;
    $('#message').value = `Estimate request: ${label('#estType')}, ${label('#estSize')}, ${label('#estDesign')}. Range shown: ${$('#estResult').value}.\n\nI'd like to discuss my requirements further. Please get in touch with me. `;
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

  /* ---------- Chat assistant (Phase 1): knowledge base, quick replies, lead capture, WhatsApp handoff ---------- */
  const panel = $('#chatPanel'), log = $('#chatLog'), input = $('#chatInput'), fab = $('#chatFab');
  const quick = $('#chatQuick'), statusEl = $('#chatStatus'), waFoot = $('#chatWa');
  const INPUT_HINT = 'Type your question';

  /* KB-START */
  const EMAIL = 'info@digitalsolutions.com';
  const MAPS = 'https://www.google.com/maps?q=Polisetty+Enclave+Sarpavaram';
  /* The WhatsApp number is read from the green WhatsApp button, so you only change it in index.html. */
  const waNumber = ((($('.whatsapp-float') || {}).href) || '').replace(/\D/g, '');
  const waUrl = text => `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
  let hist = [];            // saved conversation (never contains details typed in the lead form)
  let lead = null;          // active lead-capture state, or null
  let misses = 0;           // consecutive questions the bot could not answer

  /* Team hours: Monday to Saturday, 9:30 to 18:30 IST */
  const isOpenNow = () => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    const mins = (+get('hour') % 24) * 60 + +get('minute');
    return get('weekday') !== 'Sun' && mins >= 570 && mins < 1110;
  };
  const rng = m => `${inr(BASE * m)} to ${inr(BASE * m * 1.5)}`;
  const waText = d => {
    const asked = hist.filter(m => m.who === 'me' && !m.miss).slice(-3).map(m => m.text.slice(0, 60));
    let s = 'Hi Digital Solutions Team, I was chatting with your website assistant.';
    if (asked.length) s += ` I asked about: ${asked.join('; ')}.`;
    if (d) s += ` My name is ${d.name}. Project: ${d.project.slice(0, 200)}`;
    return s;
  };
  const WA = () => ({ label: 'Chat on WhatsApp', href: waUrl(waText(lead && lead.data.project ? lead.data : null)) });
  const MAIL = { label: 'Email us', href: `mailto:${EMAIL}` };

  /* Lower-case, strip punctuation, drop a trailing "s" so "services" matches "service" */
  const norm = s => ' ' + s.toLowerCase().replace(/e[- ]?commerce/g, 'ecommerce').replace(/[^a-z0-9]+/g, ' ').trim()
    .split(' ').map(w => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w)).join(' ') + ' ';

  /* Each entry: id, label (quick-reply text), k (keywords; longer phrases score higher), a (answer), next (follow-up quick replies), actions */
  const KB = [
    { id: 'services', label: 'Our services', k: ['service', 'what do you do', 'what can you do', 'offer', 'provide', 'solution', 'capability', 'do you build', 'do you make'],
      a: 'We build:\n• Websites and web apps (React, Node.js, MERN)\n• Online stores\n• Android and iOS apps\n• AI chatbots, document search and automation\n• UI/UX design and branding\n• Cloud and DevOps (AWS, Docker, CI/CD)\n• Enterprise integration (SnapLogic)\n• SEO and analytics\n\nWhich one are you interested in?',
      next: ['web', 'ecommerce', 'mobile', 'ai', 'pricing', 'lead'], actions: [{ label: 'See all services', href: '#services' }] },
    { id: 'pricing', label: 'Pricing', k: ['price', 'pricing', 'cost', 'budget', 'quote', 'how much', 'package', 'plan', 'charge', 'rate', 'fee', 'affordable', 'cheap', 'expensive'],
      a: () => `Every project gets a fixed written quote after a short call. Rough starting ranges for a small project when you already have designs:\n\n• Business website: ${rng(1)}\n• Web app or online store: ${rng(2)}\n• Mobile app: ${rng(3)}\n• AI chatbot or automation: ${rng(2.5)}\n\nNeeding UI/UX design adds about 30%. Larger projects cost more.`,
      next: ['estimate', 'timeline', 'payment', 'lead'], actions: [{ label: 'Open the estimator', href: '#estimator' }] },
    { id: 'estimate', label: 'Get an estimate', k: ['estimate', 'estimator', 'calculate', 'calculator', 'rough range', 'ballpark', 'how much will'],
      a: 'Use the estimator on this page. Choose the project type, size and design, and you get an instant range. One click sends it to our team.',
      next: ['pricing', 'timeline', 'lead'], actions: [{ label: 'Open the estimator', href: '#estimator' }] },
    { id: 'web', label: 'Websites', k: ['website', 'web', 'web development', 'web app', 'react', 'mern', 'node', 'landing page', 'business website', 'wordpress', 'frontend', 'backend'],
      a: 'We build fast React and MERN (MongoDB, Express, React, Node.js) websites and web apps that your team can maintain, with technical SEO set up from day one. A business website usually takes 2 to 4 weeks.',
      next: ['pricing', 'timeline', 'portfolio', 'lead'] },
    { id: 'ecommerce', label: 'Online stores', k: ['ecommerce', 'online store', 'shop', 'store', 'cart', 'payment gateway', 'sell online', 'selling', 'product catalog', 'razorpay', 'stripe', 'inventory'],
      a: 'Our online stores include a product catalog, secure payments, order tracking and an admin panel to manage inventory. We can also add a mobile shopping app, like the one we built for Kadiyam Flora.',
      next: ['pricing', 'mobile', 'portfolio', 'lead'] },
    { id: 'mobile', label: 'Mobile apps', k: ['mobile', 'android', 'ios', 'app', 'iphone', 'flutter', 'react native', 'play store', 'app store', 'cross platform'],
      a: 'We build Android and iOS apps from one cross-platform codebase, with the backend and admin panel behind them, and publish them to both stores. Apps usually take 6 to 12 weeks, with a demo every week.',
      next: ['pricing', 'timeline', 'portfolio', 'lead'] },
    { id: 'ai', label: 'AI solutions', k: ['ai', 'chatbot', 'chat bot', 'bot', 'gpt', 'chatgpt', 'llm', 'claude', 'openai', 'gemini', 'automation', 'automate', 'artificial intelligence', 'document search', 'machine learning'],
      a: 'We build support chatbots, document search with sources shown, workflow automation (invoices, lead routing, reports) and AI features inside apps you already run. We work with Claude, OpenAI and Gemini APIs, add human handoff and usage limits, and start with a 2 to 4 week pilot so you see results before committing.',
      next: ['pricing', 'integration', 'timeline', 'lead'] },
    { id: 'design', label: 'UI/UX and branding', k: ['design', 'ui', 'ux', 'figma', 'logo', 'brand', 'branding', 'graphic', 'creative', 'poster', 'social media', 'prototype'],
      a: 'Our designers create UI/UX in Figma with a clickable prototype you approve before development starts. We also make logos, social creatives and brand kits that look consistent everywhere.',
      next: ['pricing', 'process', 'portfolio', 'lead'] },
    { id: 'cloud', label: 'Cloud and DevOps', k: ['cloud', 'aws', 'devops', 'docker', 'deploy', 'deployment', 'hosting', 'server', 'ci cd', 'pipeline', 'kubernetes'],
      a: 'We deploy on AWS with Docker and CI/CD pipelines, with monitoring so releases are routine, safe and easy to roll back.',
      next: ['pricing', 'support', 'lead'] },
    { id: 'integration', label: 'System integration', k: ['integration', 'integrate', 'snaplogic', 'crm', 'erp', 'etl', 'api', 'connect', 'sync', 'billing system'],
      a: 'We connect CRMs, ERPs and databases (SnapLogic, ETL and APIs) so data flows between your systems without manual copying.',
      next: ['ai', 'pricing', 'lead'] },
    { id: 'seo', label: 'SEO and analytics', k: ['seo', 'google', 'rank', 'ranking', 'traffic', 'analytics', 'ga4', 'marketing', 'visibility'],
      a: 'We handle technical SEO, structured data and GA4 analytics, with reports that show what brings in customers. We cannot promise a particular ranking, but we make sure your site is built to be found.',
      next: ['pricing', 'web', 'lead'] },
    { id: 'timeline', label: 'Timeline', k: ['how long', 'time', 'timeline', 'deadline', 'duration', 'week', 'day', 'delivery', 'when', 'fast', 'quick', 'turnaround', 'urgent'],
      a: 'Websites take about 2 to 4 weeks. Apps and AI systems take 6 to 12 weeks, with a demo at the end of each step. The exact dates go into your written quote.',
      next: ['process', 'pricing', 'lead'] },
    { id: 'process', label: 'How we work', k: ['process', 'step', 'how do you work', 'how it work', 'approach', 'methodology', 'stage', 'workflow'],
      a: 'A project runs in five steps:\n1. Discover (days 1 to 3): a 30-minute call and a written scope\n2. Design (weeks 1 to 2): wireframes and a clickable prototype\n3. Build (weeks 2 to 8): weekly demos on a staging link\n4. Launch: testing, deployment and handover\n5. Support: monitoring and fixes on a monthly plan',
      next: ['timeline', 'pricing', 'lead'], actions: [{ label: 'See the process', href: '#process' }] },
    { id: 'ownership', label: 'Who owns the code?', k: ['own', 'ownership', 'source code', 'code', 'data', 'rights', 'copyright', 'intellectual property', 'handover'],
      a: 'You do. After final payment you receive the full source code, accounts, data and documentation.',
      next: ['payment', 'support', 'lead'], actions: [{ label: 'Read the Terms', href: 'terms.html' }] },
    { id: 'support', label: 'Support after launch', k: ['support', 'maintenance', 'after launch', 'post launch', 'fix', 'bug', 'warranty', 'monthly plan', 'update', 'maintain'],
      a: 'Every package includes free support after launch (2 weeks for Launch, 1 month for Grow). Monthly plans cover monitoring, updates and new features.',
      next: ['pricing', 'ownership', 'lead'] },
    { id: 'payment', label: 'Payment terms', k: ['payment', 'pay', 'advance', 'invoice', 'milestone', 'gst', 'refund', 'installment', 'terms', 'upfront', 'deposit'],
      a: 'Each project has a fixed written quote with milestones and a payment schedule. Invoices are due within 7 days unless the quote says otherwise, and the final files are handed over after the final payment.',
      next: ['pricing', 'ownership', 'lead'], actions: [{ label: 'Read the Terms', href: 'terms.html' }] },
    { id: 'privacy', label: 'Privacy and security', k: ['privacy', 'confidential', 'nda', 'secure', 'security', 'gdpr', 'safe', 'private'],
      a: 'We use your details only to reply to your enquiry and we do not sell them. Our Terms include a confidentiality clause, and you can ask us about a separate NDA for sensitive projects.',
      next: ['ownership', 'lead'], actions: [{ label: 'Privacy Policy', href: 'privacy.html' }] },
    { id: 'location', label: 'Location', k: ['where', 'location', 'address', 'office', 'located', 'based', 'sarpavaram', 'andhra', 'map', 'visit'],
      a: 'Our office is at Door No. 70-1-4/4, 2nd floor, Polisetty Enclave, Sarpavaram, Andhra Pradesh 533005, India. We work with clients worldwide.',
      next: ['hours', 'abroad', 'contact'], actions: [{ label: 'Open in Maps', href: MAPS }] },
    { id: 'hours', label: 'Business hours', k: ['hour', 'open', 'timing', 'working hour', 'available', 'availability', 'closed', 'saturday', 'sunday', 'office time'],
      a: () => `We work Monday to Saturday, 9:30 AM to 6:30 PM IST. ${isOpenNow() ? 'The team is online right now.' : 'The team is offline right now, so we will reply on the next working day.'} I am an automated assistant and answer any time.`,
      next: ['contact', 'location', 'lead'] },
    { id: 'abroad', label: 'Clients abroad', k: ['abroad', 'usa', 'uk', 'international', 'overseas', 'outside india', 'worldwide', 'global', 'australia', 'dubai', 'europe', 'canada', 'work with client', 'timezone', 'time zone'],
      a: 'Yes. We work with clients worldwide through weekly video calls and a shared project board.',
      next: ['pricing', 'process', 'contact'] },
    { id: 'contact', label: 'Contact us', k: ['contact', 'call', 'phone', 'number', 'email', 'mail', 'reach', 'whatsapp', 'meeting', 'book', 'schedule', 'appointment', 'consultation'],
      a: () => `You can reach us by WhatsApp, email (${EMAIL}) or the contact form on this page. We reply within one working day. ${isOpenNow() ? 'The team is online now.' : 'The team is offline now.'}`,
      next: ['lead', 'hours', 'location'], actions: () => [WA(), MAIL, { label: 'Contact form', href: '#contact' }] },
    { id: 'team', label: 'The team', k: ['team', 'who', 'founder', 'developer', 'people', 'sriram', 'experience', 'member', 'staff', 'engineer', 'designer'],
      a: 'Six specialists work together daily: a founder and director, an integration architect, a software developer, a DevOps engineer, an SEO and marketing specialist and a senior graphic designer.',
      next: ['portfolio', 'services', 'lead'], actions: [{ label: 'Meet the team', href: '#team' }] },
    { id: 'portfolio', label: 'Our work', k: ['portfolio', 'work', 'project', 'example', 'previous', 'case study', 'talentorigin', 'talent origin', 'kadiyam', 'sample', 'past work', 'reference'],
      a: 'Recent work includes TalentOrigin (a hiring platform), Kadiyam Flora (a plant shopping app), Workspace Finder (a coworking directory) and an investor pitch deck with project reports for the Shape-Shifting Electric Jeep.',
      next: ['services', 'pricing', 'lead'], actions: [{ label: 'See selected work', href: '#projects' }] },
    { id: 'tools', label: 'Tools we use', k: ['tool', 'tech', 'stack', 'technology', 'language', 'framework', 'database', 'mongodb', 'mysql', 'python', 'javascript'],
      a: 'Frontend and design: React, JavaScript, Bootstrap, Figma.\nBackend and data: Node.js, Express, MongoDB, MySQL, Python, REST APIs.\nCloud: AWS, Docker, Git, CI/CD.\nAlso: SnapLogic, LLM APIs, vector search, WordPress and Stripe.',
      next: ['services', 'pricing', 'lead'] },
    { id: 'human', label: 'Talk to the team', k: ['human', 'agent', 'real person', 'representative', 'talk to team', 'talk to the team', 'speak to the team', 'talk to someone', 'speak to', 'someone', 'person', 'manager', 'owner'],
      a: () => `Of course. Message the team on WhatsApp or email, or leave your details here and we will reply within one working day. ${isOpenNow() ? 'The team is online now.' : 'The team is offline now, so expect a reply on the next working day.'}`,
      next: ['lead', 'contact'], actions: () => [WA(), MAIL] },
    { id: 'lead', label: 'Leave my details', k: ['leave my detail', 'start a project', 'get started', 'hire', 'contact me', 'call me back', 'interested', 'proposal', 'book a call', 'free call', 'callback', 'start project'],
      run: () => startLead() },
    { id: 'thanks', label: 'Thanks', k: ['thank', 'thanks', 'thank you', 'great', 'ok', 'okay', 'cool', 'awesome', 'nice', 'perfect'],
      a: 'You are welcome! Is there anything else I can help with?', next: ['services', 'pricing', 'lead'] },
    { id: 'bye', label: 'Bye', k: ['bye', 'goodbye', 'see you', 'later'], a: 'Goodbye! Message us any time if you have more questions.', next: [] },
    { id: 'greeting', label: 'Hello', k: ['hi', 'hello', 'hey', 'hii', 'namaste', 'good morning', 'good afternoon', 'good evening'],
      a: 'Hello! Ask me about our services, pricing, timelines or AI projects.', next: ['services', 'pricing', 'timeline', 'ai', 'portfolio', 'human'] }
  ];
  const MENU = ['services', 'pricing', 'timeline', 'ai', 'portfolio', 'human'];
  const byId = Object.fromEntries(KB.map(e => [e.id, e]));
  const LABEL = Object.assign(Object.fromEntries(KB.map(e => [e.id, e.label])), { cancel: 'Cancel' });
  KB.forEach(e => { e.nk = (e.k || []).map(k => ({ t: norm(k), w: k.trim().split(/\s+/).length })); });

  /* Pick the entry whose keywords score highest (earlier entries win ties, so "hi" never beats a real topic) */
  const match = q => {
    const text = norm(q);
    let best = null, top = 0;
    KB.forEach(e => {
      const s = e.nk.reduce((sum, k) => sum + (text.includes(k.t) ? k.w : 0), 0);
      if (s > top) { best = e; top = s; }
    });
    return best;
  };
  /* KB-END */

  /* ----- saved conversation (sessionStorage: cleared when the tab closes) ----- */
  const SAFE_HREF = /^(https:\/\/|mailto:|#|[\w.-]+\.html$)/;
  try {
    const s = JSON.parse(sessionStorage.getItem('dst-chat') || '[]');
    if (Array.isArray(s)) hist = s.filter(m => m && (m.who === 'me' || m.who === 'bot') && typeof m.text === 'string')
      .map(m => ({ who: m.who, text: m.text.slice(0, 1200), miss: !!m.miss, actions: (Array.isArray(m.actions) ? m.actions : []).filter(a => a && typeof a.label === 'string' && SAFE_HREF.test(String(a.href))) }));
  } catch (e) { hist = []; }
  const saveHist = () => { try { sessionStorage.setItem('dst-chat', JSON.stringify(hist.slice(-40))); } catch (e) {} };

  /* ----- rendering ----- */
  const toEnd = () => { log.scrollTop = log.scrollHeight; };
  const addMsg = (text, who, { actions = [], persist = true } = {}) => {
    const d = document.createElement('div'); d.className = 'msg ' + who; d.textContent = text;
    if (actions.length) {
      const box = document.createElement('div'); box.className = 'msg-actions';
      actions.forEach(a => {
        const l = document.createElement('a'); l.className = 'chat-action' + (/wa\.me/.test(a.href) ? ' wa' : ''); l.textContent = a.label; l.href = a.href;
        if (/^https:/.test(a.href)) { l.target = '_blank'; l.rel = 'noopener noreferrer'; }
        else if (a.href.startsWith('#')) l.addEventListener('click', e => { e.preventDefault(); if (innerWidth < 768) toggleChat(false); goTo(a.href); });
        box.append(l);
      });
      d.append(box);
    }
    log.append(d); toEnd();
    if (persist) { hist.push({ who, text, actions }); saveHist(); }
    return d;
  };
  const setChips = ids => {
    quick.replaceChildren();
    (ids || []).forEach(id => {
      if (!LABEL[id]) return;
      const b = document.createElement('button'); b.type = 'button'; b.textContent = LABEL[id];
      b.addEventListener('click', () => { if (id === 'cancel') return cancelLead(); if (!lead) ask(LABEL[id], id); });
      quick.append(b);
    });
  };
  const typing = () => {
    const d = document.createElement('div'); d.className = 'msg bot typing'; d.setAttribute('aria-label', 'Assistant is typing');
    d.innerHTML = '<span></span><span></span><span></span>'; log.append(d); toEnd(); return d;
  };
  const botSay = (text, { actions = [], chips = [], persist = true } = {}) => new Promise(done => {
    const t = typing(); setChips([]);
    setTimeout(() => { t.remove(); addMsg(text, 'bot', { actions, persist }); setChips(chips); done(); }, reduce ? 0 : Math.min(350 + text.length * 4, 1000));
  });
  const updateStatus = () => {
    statusEl.textContent = isOpenNow() ? 'Instant answers · team online now' : 'Instant answers · team replies next working day';
  };

  /* ----- answering ----- */
  const respond = e => {
    misses = 0;
    if (e.run) return e.run();
    const text = typeof e.a === 'function' ? e.a() : e.a;
    const actions = typeof e.actions === 'function' ? e.actions() : (e.actions || []);
    return botSay(text, { actions, chips: e.next });
  };
  const fallback = () => {
    misses++;
    if (misses < 2) return botSay('I am not sure about that one. Pick a topic below, or leave your details and the team will answer personally.', { chips: ['services', 'pricing', 'lead', 'human'] });
    return botSay('I could not find a good answer, and I do not want to guess. A team member can help you directly.', { actions: [WA(), MAIL], chips: ['lead', 'services'] });
  };
  const ask = (q, id) => {
    addMsg(q, 'me');
    const e = id ? byId[id] : match(q);
    if (!e) { hist[hist.length - 1].miss = true; saveHist(); }
    return e ? respond(e) : fallback();
  };

  /* ----- lead capture: name, then email or phone, then project; sent through your Formspree contact form ----- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const endLead = () => { lead = null; input.placeholder = INPUT_HINT; input.maxLength = 300; };
  const cancelLead = () => { endLead(); botSay('No problem. Ask me anything else, or reach the team on WhatsApp whenever you like.', { actions: [WA()], chips: MENU }); };
  const startLead = () => {
    lead = { step: 'name', data: {} }; input.placeholder = 'Your name';
    return botSay('Happy to help. What is your name?', { chips: ['cancel'], persist: false });
  };
  const sendLead = async d => {
    const form = $('#contactForm');
    const fd = new FormData();
    fd.append('name', d.name);
    if (d.email) fd.append('email', d.email);
    if (d.phone) fd.append('phone', d.phone);
    const asked = hist.filter(m => m.who === 'me' && !m.miss).slice(-5).map(m => m.text.slice(0, 60)).join('; ');
    fd.append('message', `${d.project}\n\n(Sent from the website chat assistant. Topics asked: ${asked || 'none'}.)`);
    fd.append('_subject', 'New lead from the website chat assistant');
    fd.append('source', 'chat assistant');
    if (!form || /YOUR_/.test(form.action)) throw new Error('form not connected');
    const res = await fetch(form.action, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(res.status);
  };
  const leadStep = async text => {
    addMsg(text, 'me', { persist: false });
    if (/^(cancel|stop|exit|no)$/i.test(text)) return cancelLead();
    const d = lead.data;
    if (lead.step === 'name') {
      if (text.length < 2) return botSay('Please type your name so we know who to reply to.', { chips: ['cancel'], persist: false });
      d.name = text.slice(0, 60); lead.step = 'contact'; input.placeholder = 'Email or phone number';
      return botSay(`Thanks, ${d.name}. What is the best email or phone number (WhatsApp is fine) to reach you?`, { chips: ['cancel'], persist: false });
    }
    if (lead.step === 'contact') {
      const digits = text.replace(/\D/g, '');
      if (EMAIL_RE.test(text)) d.email = text;
      else if (digits.length >= 8 && digits.length <= 15) d.phone = text.slice(0, 30);
      else return botSay('That does not look like an email or phone number. Please try again, for example name@company.com or +91 98765 43210.', { chips: ['cancel'], persist: false });
      lead.step = 'project'; input.placeholder = 'Describe your project';
      return botSay('Great. Tell me a little about your project: what you want to build and by when.', { chips: ['cancel'], persist: false });
    }
    if (text.length < 10) return botSay('Could you add a bit more detail (at least a sentence) so the team can prepare a useful reply?', { chips: ['cancel'], persist: false });
    d.project = text.slice(0, 600);
    const snapshot = { ...d };
    endLead(); input.disabled = true;
    const t = typing(); setChips([]);
    try {
      await sendLead(snapshot);
      t.remove(); input.disabled = false;
      await botSay(`Thank you, ${snapshot.name}. Your request is with the team. We reply within one working day. ${isOpenNow() ? 'The team is online now, so it may be sooner.' : ''}\n\nWant a faster answer? Continue on WhatsApp and your details come pre-filled.`.trim(), { actions: [{ label: 'Continue on WhatsApp', href: waUrl(waText(snapshot)) }], chips: MENU, persist: false });
    } catch (err) {
      t.remove(); input.disabled = false;
      await botSay('I could not send that just now. Please use WhatsApp or email so we do not miss you.', { actions: [{ label: 'Continue on WhatsApp', href: waUrl(waText(snapshot)) }, MAIL], chips: MENU, persist: false });
    }
    input.focus({ preventScroll: true });
  };

  /* ----- open, close, reset ----- */
  const welcome = () => botSay(`Hi! I am the Digital Solutions assistant, an automated bot. Ask me about services, pricing, timelines or AI projects, or tap a topic below.`, { chips: MENU });
  const restore = () => {
    hist.forEach(m => { addMsg(m.text, m.who, { actions: m.actions, persist: false }); });
    setChips(MENU);
  };
  const resetChat = () => {
    endLead(); misses = 0; hist = []; saveHist(); log.replaceChildren(); setChips([]); welcome(); input.focus({ preventScroll: true });
  };
  const toggleChat = open => {
    panel.hidden = !open; fab.setAttribute('aria-expanded', String(open));
    if (!open) return;
    updateStatus();
    if (!log.children.length) { if (hist.length) restore(); else welcome(); }
    input.focus({ preventScroll: true });
  };
  $$('[data-open-chat]').forEach(b => b.addEventListener('click', () => toggleChat(panel.hidden)));
  $('#chatClose').addEventListener('click', () => { toggleChat(false); fab.focus(); });
  $('#chatReset').addEventListener('click', resetChat);
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') { toggleChat(false); fab.focus(); } });
  /* Footer WhatsApp link carries the conversation topics each time it is clicked */
  waFoot.addEventListener('click', () => { waFoot.href = waUrl(waText(lead && lead.data.project ? lead.data : null)); });
  $('#chatForm').addEventListener('submit', e => {
    e.preventDefault();
    const v = input.value.trim(); if (!v) return;
    input.value = '';
    lead ? leadStep(v) : ask(v);
  });
});
