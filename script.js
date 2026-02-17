// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

  /* ===============================
     Common Elements
  =============================== */
  const navbar = document.querySelector('.navbar');
  const backToTopButton = document.querySelector('.back-to-top');
  const navbarHeight = navbar ? navbar.offsetHeight : 0;

  /* ===============================
     Navbar Auto Hide + Scroll Style
  =============================== */
  let lastScrollY = window.scrollY;
  let ticking = false;

  const updateNavbar = () => {
    if (!navbar) return;

    const currentScroll = window.scrollY;

    // Add background + shadow when scrolling
    if (currentScroll > 50) {
      navbar.classList.add('scrolled');
      navbar.classList.toggle('fully-scrolled', currentScroll > 200);
    } else {
      navbar.classList.remove('scrolled', 'fully-scrolled');
    }

    // Hide when scrolling down, show when scrolling up
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
      window.requestAnimationFrame(updateNavbar);
      ticking = true;
    }
  });

  /* ===============================
     Smooth Scrolling Navigation
  =============================== */
  const smoothScrollTo = targetId => {
    const targetElement = document.querySelector(targetId);
    if (!targetElement) return;

    history.pushState(null, null, targetId);

    const offsetTop = targetElement.offsetTop - navbarHeight + 1;
    window.scrollTo({ top: offsetTop, behavior: 'smooth' });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === targetId);
    });
  };

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      smoothScrollTo(anchor.getAttribute('href'));
    });
  });

  /* ===============================
     AOS Animation Init
  =============================== */
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      once: true,
      offset: 120,
      easing: 'ease-in-out-quad'
    });
  }

  /* ===============================
     Typed Text — Hero Section
  =============================== */
  if (document.getElementById('typing-text') && typeof Typed !== 'undefined') {
    new Typed('#typing-text', {
      strings: [
        "Full-Stack Web Development",
        "Enterprise Web Solutions",
        "UI/UX Design Services",
        "SEO & Digital Optimization",
        "Cloud-Ready Applications",
        "End-to-End Digital Solutions"
      ],
      typeSpeed: 45,
      backSpeed: 25,
      startDelay: 300,
      backDelay: 1500,
      loop: true,
      showCursor: true,
      cursorChar: '|',
      smartBackspace: true
    });
  }

  /* ===============================
     Set Current Year in Footer
  =============================== */
  const yearElement = document.getElementById('currentYear');
  if (yearElement) yearElement.textContent = new Date().getFullYear();

  /* ===============================
     Back To Top Button
  =============================== */
  if (backToTopButton) {
    window.addEventListener('scroll', () => {
      backToTopButton.classList.toggle('show', window.scrollY > 300);
    });

    backToTopButton.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ===============================
     Statistics Counter Animation
  =============================== */
  const counters = document.querySelectorAll('.counter');
  const statsSection = document.querySelector('#stats');

  if (counters.length && statsSection) {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        counters.forEach(counter => {
          const target = +counter.getAttribute('data-target');
          const duration = 1500;
          const startTime = performance.now();

          const animateCounter = currentTime => {
            const progress = Math.min((currentTime - startTime) / duration, 1);
            counter.textContent = Math.floor(progress * target);
            if (progress < 1) requestAnimationFrame(animateCounter);
            else counter.textContent = target;
          };

          requestAnimationFrame(animateCounter);
        });
        observer.unobserve(statsSection);
      }
    }, { threshold: 0.5 });

    observer.observe(statsSection);
  }

  /* ===============================
     Contact Form Handling
  =============================== */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const submitText = submitBtn.querySelector('.submit-text') || submitBtn;
      const spinner = submitBtn.querySelector('.spinner-border');

      submitText.textContent = 'Submitting Request...';
      if (spinner) spinner.classList.remove('d-none');
      submitBtn.disabled = true;

      setTimeout(() => {
        submitText.textContent = 'Request Submitted';
        if (spinner) spinner.classList.add('d-none');
        submitBtn.classList.replace('btn-primary', 'btn-success');

        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'success',
            title: 'Thank You',
            text: 'Your inquiry has been received. Our team will contact you shortly.',
            confirmButtonColor: '#0a3d62'
          });
        }

        setTimeout(() => {
          contactForm.reset();
          submitBtn.classList.replace('btn-success', 'btn-primary');
          submitText.textContent = 'Send Message';
          submitBtn.disabled = false;
        }, 2500);

      }, 1500);
    });
  }

  /* ===============================
     Newsletter Form
  =============================== */
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input[type="email"]');

      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'success',
          title: 'Subscription Confirmed',
          text: 'You have successfully subscribed to our updates.',
          confirmButtonColor: '#0a3d62'
        });
      }

      emailInput.value = '';
    });
  }

  /* ===============================
     Bootstrap Tooltips
  =============================== */
  if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
      new bootstrap.Tooltip(el);
    });
  }

});
