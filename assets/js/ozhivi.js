(function () {
  'use strict';

  var demo = document.querySelector('.ozhivi-hero-demo');
  if (demo) {
    var staticLayer = demo.querySelector('.ozhivi-hero-demo__screen-layer--static');
    var liveLayer = demo.querySelector('.ozhivi-hero-demo__screen-layer--live');
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var showLive = false;

    function setHeroState(live) {
      demo.classList.toggle('is-state-static', !live);
      demo.classList.toggle('is-state-live', live);
      if (staticLayer && liveLayer) {
        staticLayer.classList.toggle('is-active', !live);
        liveLayer.classList.toggle('is-active', live);
      }
    }

    setHeroState(false);

    if (!prefersReduced) {
      window.setInterval(function () {
        showLive = !showLive;
        setHeroState(showLive);
      }, 4200);
    } else if (staticLayer && liveLayer) {
      staticLayer.classList.add('is-active');
      liveLayer.classList.remove('is-active');
    }
  }

  var lightbox = document.getElementById('ozhiviLightbox');
  if (!lightbox) return;

  var lightboxImg = lightbox.querySelector('.ozhivi-lightbox__img');
  var lightboxCaption = lightbox.querySelector('.ozhivi-lightbox__caption');
  var closeBtn = lightbox.querySelector('.ozhivi-lightbox__close');
  var lightboxDialog = lightbox.querySelector('.ozhivi-lightbox__dialog');
  var lastFocus = null;

  function openLightbox(src, alt, caption, asScheme) {
    lastFocus = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightboxCaption.textContent = caption || '';
    if (lightboxDialog) {
      lightboxDialog.classList.toggle('ozhivi-lightbox__dialog--scheme', !!asScheme);
    }
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.removeAttribute('src');
    if (lightboxDialog) {
      lightboxDialog.classList.remove('ozhivi-lightbox__dialog--scheme');
    }
    document.body.style.overflow = '';
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
  }

  document.querySelectorAll('.ozhivi-gallery__item').forEach(function (button) {
    button.addEventListener('click', function () {
      var img = button.querySelector('img');
      if (!img) return;
      openLightbox(img.currentSrc || img.src, img.alt, button.dataset.caption || img.alt, false);
    });
  });

  document.querySelectorAll('.ozhivi-scheme__open').forEach(function (button) {
    button.addEventListener('click', function () {
      var src = button.getAttribute('data-ozhivi-scheme-src');
      var alt = button.getAttribute('data-ozhivi-scheme-alt') || '';
      var caption = button.getAttribute('data-ozhivi-scheme-caption') || alt;
      if (!src) {
        var frameImg = document.querySelector('.ozhivi-scheme__frame img');
        if (frameImg) {
          src = frameImg.currentSrc || frameImg.src;
          alt = frameImg.alt || alt;
        }
      }
      if (!src) return;
      openLightbox(src, alt, caption, true);
    });
  });

  closeBtn.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', function (event) {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && lightbox.classList.contains('is-open')) {
      closeLightbox();
    }
  });
})();
