(function () {
  'use strict';

  const header = document.getElementById('header');
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.nav__link');
  const reveals = document.querySelectorAll('.reveal');

  function handleScroll() {
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 50);
    }
  }

  function toggleMenu() {
    const isOpen = nav.classList.toggle('open');
    burger.classList.toggle('active');
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function closeMenu() {
    nav.classList.remove('open');
    burger.classList.remove('active');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (burger && nav) {
    burger.addEventListener('click', toggleMenu);

    navLinks.forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        closeMenu();
      }
    });
  }

  function initReveal() {
    if (!reveals.length) return;

    if (!('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

    reveals.forEach(function (el) { observer.observe(el); });
  }

  function reachGoal(name) {
    if (typeof ym === 'function') {
      ym(110789592, 'reachGoal', name);
    }
  }

  function initMetrikaGoals() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;

      var href = link.getAttribute('href') || '';

      if (/^mailto:/i.test(href)) {
        reachGoal('email_click');
        return;
      }

      if (/t\.me\//i.test(href) || /telegram\.me\//i.test(href)) {
        reachGoal('telegram_click');
        return;
      }

      if (
        href === '#portfolio' ||
        href.indexOf('index.html#portfolio') !== -1 ||
        /#portfolio(?:$|[?#])/.test(href)
      ) {
        reachGoal('portfolio_open');
        return;
      }

      if (
        href === '#contact' ||
        /#contact(?:$|[?#])/.test(href) ||
        link.classList.contains('nav__link--cta')
      ) {
        reachGoal('contact_click');
      }
    });
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
  initReveal();
  initMetrikaGoals();
})();
