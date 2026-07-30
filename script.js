/* ============================================================
   MANYATTA GRILL — Global Script
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── MOBILE NAV TOGGLE ── */
  const hamburger = document.getElementById('hamburger');
  const mainNav   = document.getElementById('main-nav');

  if (hamburger && mainNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    // Close nav when a link is clicked
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    // Close nav on outside click
    document.addEventListener('click', e => {
      if (!mainNav.contains(e.target) && !hamburger.contains(e.target)) {
        mainNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── MENU TABS ── */
  const tabs = document.querySelectorAll('.menu-tab');
  if (tabs.length) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        // Filter logic can hook into data-category attributes
        const category = tab.textContent.trim();
        const cards    = document.querySelectorAll('.menu-card');
        cards.forEach(card => {
          if (category === 'All' || !card.dataset.category) {
            card.style.display = '';
          } else {
            card.style.display =
              card.dataset.category === category ? '' : 'none';
          }
        });
      });
    });
  }

  /* ── RESERVATION FORM ── */
  const resForm = document.getElementById('reservation-form');
  if (resForm) {
    // Set min date to today
    const dateInput = resForm.querySelector('input[type="date"]');
    if (dateInput) {
      dateInput.min = new Date().toISOString().split('T')[0];
    }

    resForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = resForm.querySelector('button[type="submit"]');
      btn.textContent = '✓ Reservation Received!';
      btn.style.background = '#2a7a3b';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Confirm Reservation →';
        btn.style.background = '';
        btn.disabled = false;
        resForm.reset();
      }, 4000);
    });
  }

  /* ── CONTACT FORM ── */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      btn.textContent = '✓ Message Sent!';
      btn.style.background = '#2a7a3b';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Send Message →';
        btn.style.background = '';
        btn.disabled = false;
        contactForm.reset();
      }, 4000);
    });
  }

  /* ── SCROLL FADE-IN ── */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(
    '.menu-card, .review-card, .value-item, .event-item, .contact-item'
  ).forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity .45s ${i * 0.07}s ease, transform .45s ${i * 0.07}s ease`;
    observer.observe(el);
  });

  document.addEventListener('animationend', () => {}, { once: true });

  // When intersection fires, apply visible state
  const style = document.createElement('style');
  style.textContent = `.visible { opacity: 1 !important; transform: none !important; }`;
  document.head.appendChild(style);

});