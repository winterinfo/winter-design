(function () {
  'use strict';

  const header = document.getElementById('header');
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.nav__link');
  const reveals = document.querySelectorAll('.reveal');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  const contactForm = document.getElementById('contactForm');
  const statNums = document.querySelectorAll('.stat__num[data-count]');

  let statsAnimated = false;

  function handleScroll() {
    header.classList.toggle('scrolled', window.scrollY > 50);
    updateActiveNav();
  }

  function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = window.scrollY + 120;

    sections.forEach(function (section) {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      const link = document.querySelector('.nav__link[href="#' + id + '"]');

      if (link && scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(function (l) { l.classList.remove('active'); });
        link.classList.add('active');
      }
    });
  }

  function setMenuState(isOpen) {
    nav.classList.toggle('open', isOpen);
    burger.classList.toggle('active', isOpen);
    header.classList.toggle('menu-open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function toggleMenu() {
    setMenuState(!nav.classList.contains('open'));
  }

  function closeMenu() {
    setMenuState(false);
  }

  burger.addEventListener('click', toggleMenu);

  navLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      closeMenu();
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 768 && nav.classList.contains('open')) {
      closeMenu();
    }
  });

  function initReveal() {
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

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function initCounters() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !statsAnimated) {
          statsAnimated = true;
          statNums.forEach(animateCounter);
          observer.disconnect();
        }
      });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero__stats');
    if (heroStats) observer.observe(heroStats);
  }

  function filterProjects(category) {
    filterBtns.forEach(function (btn) {
      const isActive = btn.dataset.filter === category;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });

    projectCards.forEach(function (card) {
      const match = category === 'all' || card.dataset.category === category;
      card.classList.toggle('hidden', !match);
    });
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterProjects(btn.dataset.filter);
    });
  });

  function initPointerDepth() {
    const hero = document.getElementById('hero');
    const heroVisual = document.querySelector('.hero__visual');
    const depthMedia = window.matchMedia(
      '(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
    );

    if (!hero || !heroVisual) return;

    let frameId = null;
    const pendingStates = new Set();
    const pointerStates = [];

    function clamp(value) {
      return Math.max(-1, Math.min(1, value));
    }

    function flushDepth() {
      pendingStates.forEach(function (state) {
        state.render(state.x, state.y);
      });
      pendingStates.clear();
      frameId = null;
    }

    function queueDepth(state) {
      pendingStates.add(state);
      if (frameId === null) {
        frameId = requestAnimationFrame(flushDepth);
      }
    }

    function createPointerState(element, render) {
      const state = {
        rect: null,
        x: 0,
        y: 0,
        render: render
      };

      pointerStates.push(state);

      element.addEventListener('pointerenter', function (event) {
        if (!depthMedia.matches || event.pointerType !== 'mouse') return;
        state.rect = element.getBoundingClientRect();
      });

      element.addEventListener('pointermove', function (event) {
        if (!depthMedia.matches || event.pointerType !== 'mouse') return;
        if (!state.rect) state.rect = element.getBoundingClientRect();

        state.x = clamp(((event.clientX - state.rect.left) / state.rect.width) * 2 - 1);
        state.y = clamp(((event.clientY - state.rect.top) / state.rect.height) * 2 - 1);
        queueDepth(state);
      }, { passive: true });

      element.addEventListener('pointerleave', function () {
        state.rect = null;
        state.x = 0;
        state.y = 0;
        queueDepth(state);
      });

      return state;
    }

    createPointerState(hero, function (x, y) {
      heroVisual.style.setProperty('--hero-front-depth-x', (x * 2).toFixed(2) + 'px');
      heroVisual.style.setProperty('--hero-front-depth-y', (y * 1.5).toFixed(2) + 'px');
      heroVisual.style.setProperty('--hero-back-depth-x', (x * -3).toFixed(2) + 'px');
      heroVisual.style.setProperty('--hero-back-depth-y', (y * -2.25).toFixed(2) + 'px');
    });

    projectCards.forEach(function (card) {
      createPointerState(card, function (x, y) {
        card.style.setProperty('--project-image-depth-x', (x * 2).toFixed(2) + 'px');
        card.style.setProperty('--project-image-depth-y', (y * 2).toFixed(2) + 'px');
      });
    });

    function resetPointerDepth() {
      pointerStates.forEach(function (state) {
        state.rect = null;
        state.x = 0;
        state.y = 0;
        queueDepth(state);
      });
    }

    depthMedia.addEventListener('change', resetPointerDepth);
    window.addEventListener('resize', resetPointerDepth);
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showError(id, message) {
    const input = document.getElementById(id);
    const error = document.getElementById(id + 'Error');
    input.classList.add('error');
    error.textContent = message;
  }

  function clearErrors() {
    contactForm.querySelectorAll('input, textarea').forEach(function (el) {
      el.classList.remove('error');
    });
    contactForm.querySelectorAll('.form-error').forEach(function (el) {
      el.textContent = '';
    });
  }

  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrors();

    var formError = document.getElementById('formError');
    var formSuccess = document.getElementById('formSuccess');
    var submitBtn = document.getElementById('formSubmitBtn');

    if (formError) { formError.hidden = true; formError.textContent = ''; }
    if (formSuccess) { formSuccess.hidden = true; }

    var name = document.getElementById('name').value.trim();
    var email = document.getElementById('email').value.trim();
    var message = document.getElementById('message').value.trim();
    var valid = true;

    if (!name) {
      showError('name', 'Введите имя');
      valid = false;
    }

    if (!email) {
      showError('email', 'Введите email');
      valid = false;
    } else if (!validateEmail(email)) {
      showError('email', 'Некорректный email');
      valid = false;
    }

    if (!message) {
      showError('message', 'Введите сообщение');
      valid = false;
    } else if (message.length < 10) {
      showError('message', 'Минимум 10 символов');
      valid = false;
    }

    if (!valid) return;

    var submitErrorText = 'Не удалось отправить заявку. Попробуйте ещё раз или напишите мне напрямую.';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправляем…';
    }

    fetch('https://formspree.io/f/mbdngydp', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(contactForm)
    })
      .then(function (response) {
        if (response.ok) {
          if (formSuccess) { formSuccess.hidden = false; }
          contactForm.reset();
          reachGoal('project_request');
          setTimeout(function () {
            if (formSuccess) { formSuccess.hidden = true; }
          }, 6000);
        } else {
          if (formError) {
            formError.textContent = submitErrorText;
            formError.hidden = false;
          }
        }
      })
      .catch(function () {
        if (formError) {
          formError.textContent = submitErrorText;
          formError.hidden = false;
        }
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Отправить';
        }
      });
  });

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

      if (/projects\/[^?#]+\.html/i.test(href) || link.classList.contains('project-card__btn')) {
        reachGoal('case_open');
        return;
      }

      if (href === '#portfolio' || /#portfolio(?:$|[?#])/.test(href)) {
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
  initCounters();
  initPointerDepth();
  initMetrikaGoals();
})();
