document.addEventListener('DOMContentLoaded', () => {

  /* ===============================
     ELEMENTS
  =============================== */
  const navbar = document.querySelector('.navbar');
  const scrollTopBtn = document.getElementById('scrollTopBtn');

  /* ===============================
     NAVBAR SCROLL BEHAVIOR
  =============================== */
  let lastScrollY = window.scrollY;
  let ticking = false;

  const updateNavbar = () => {
    if (!navbar) return;

    const currentScroll = window.scrollY;

    // Glass effect
    if (currentScroll > 50) {
      navbar.classList.add('scrolled');
      navbar.classList.toggle('fully-scrolled', currentScroll > 200);
    } else {
      navbar.classList.remove('scrolled', 'fully-scrolled');
    }

    // Auto hide on scroll down
    if (currentScroll > lastScrollY && currentScroll > 120) {
      navbar.classList.add('nav-hidden');
    } else {
      navbar.classList.remove('nav-hidden');
    }

    lastScrollY = currentScroll;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateNavbar);
      ticking = true;
    }
  });

  /* ===============================
     SMOOTH SCROLLING
  =============================== */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const targetId = anchor.getAttribute('href');
      if (targetId === "#" || targetId === "#top") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const navbarHeight = navbar ? navbar.offsetHeight : 0;
      const offsetTop = target.offsetTop - navbarHeight + 1;

      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    });
  });

  /* ===============================
     SCROLL TO TOP BUTTON
  =============================== */
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        scrollTopBtn.classList.add('show');
      } else {
        scrollTopBtn.classList.remove('show');
      }
    });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  /* ===============================
     AOS INIT
  =============================== */
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      once: true,
      offset: 120,
      easing: 'ease-in-out'
    });
  }

  /* ===============================
     CONTACT FORM (UI FEEDBACK ONLY)
  =============================== */
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();

      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;

      btn.disabled = true;
      btn.textContent = "Sending Request...";

      setTimeout(() => {
        btn.textContent = "Request Sent ✓";
        btn.classList.replace('btn-primary', 'btn-success');

        setTimeout(() => {
          contactForm.reset();
          btn.classList.replace('btn-success', 'btn-primary');
          btn.textContent = originalText;
          btn.disabled = false;
        }, 2000);

      }, 1200);
    });
  }

  /* ===============================
     BOOTSTRAP TOOLTIPS
  =============================== */
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
      new bootstrap.Tooltip(el);
    });
  }

});
