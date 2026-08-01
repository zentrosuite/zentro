/* Zentro marketing site — theme, nav, tabs, reveal.
   No dependencies: the whole page is four small behaviours. */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ── theme ─────────────────────────────────────────────────────────────
     The stored choice wins over the OS preference, and only follows the OS
     while the visitor has never chosen — otherwise changing your system
     theme would silently undo an explicit click.                          */
  var toggle = document.getElementById('theme');
  var mq = window.matchMedia('(prefers-color-scheme: dark)');

  function setTheme(mode, remember) {
    root.dataset.theme = mode;
    if (remember) {
      try { localStorage.setItem('zentro-theme', mode); } catch (e) {}
    }
    if (toggle) {
      toggle.setAttribute('aria-label',
        mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
    // Hand playback to whichever tour video the new theme reveals. Without this the
    // hidden one keeps decoding frames and the visible one sits on its poster.
    document.querySelectorAll('.video video').forEach(function (v) {
      if (v.offsetParent === null) { v.pause(); }
      else if (v.autoplay && v.paused) { var p = v.play(); if (p) { p.catch(function () {}); } }
    });
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
    });
  }
  mq.addEventListener('change', function (e) {
    var stored = null;
    try { stored = localStorage.getItem('zentro-theme'); } catch (err) {}
    if (!stored) { setTheme(e.matches ? 'dark' : 'light', false); }
  });
  setTheme(root.dataset.theme || 'light', false);

  /* ── mobile nav ─────────────────────────────────────────────────────── */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── suite dropdown ─────────────────────────────────────────────────── */
  document.querySelectorAll('[data-dd]').forEach(function (dd) {
    var btn = dd.querySelector('.dd__btn');
    var open = function (state) {
      dd.setAttribute('aria-expanded', String(state));
      btn.setAttribute('aria-expanded', String(state));
    };
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      open(dd.getAttribute('aria-expanded') !== 'true');
    });
    dd.addEventListener('mouseenter', function () { open(true); });
    dd.addEventListener('mouseleave', function () { open(false); });
    document.addEventListener('click', function () { open(false); });
    dd.addEventListener('keydown', function (e) { if (e.key === 'Escape') { open(false); btn.focus(); } });
  });

  /* ── feature tabs ───────────────────────────────────────────────────── */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));

  function show(name) {
    tabs.forEach(function (t) {
      t.setAttribute('aria-selected', String(t.dataset.tab === name));
    });
    panels.forEach(function (p) {
      if (p.dataset.panel === name) { p.setAttribute('data-active', ''); }
      else { p.removeAttribute('data-active'); }
    });
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(t.dataset.tab); });
    t.addEventListener('keydown', function (e) {
      var step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!step) { return; }
      e.preventDefault();
      var next = tabs[(i + step + tabs.length) % tabs.length];
      next.focus();
      show(next.dataset.tab);
    });
  });

  /* ── tour video: only play it while it is on screen ───────────────────
     It autoplays muted, but decoding a 30-second loop for a visitor who has
     scrolled past it is wasted battery.                                    */
  var tour = document.querySelectorAll('.video video');
  if (tour.length && window.IntersectionObserver) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && v.offsetParent !== null) {
          var p = v.play(); if (p) { p.catch(function () {}); }
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { threshold: 0.25 });
    tour.forEach(function (v) { vio.observe(v); });
  }

  /* ── FAQ: one answer at a time ───────────────────────────────────────
     Without this every answer a visitor opens stays open, and by the ninth
     question the section is several screens tall.                        */
  var answers = Array.prototype.slice.call(document.querySelectorAll('.faq details'));
  answers.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) { return; }
      answers.forEach(function (other) { if (other !== d) { other.open = false; } });
    });
  });

  /* ── contact form ─────────────────────────────────────────────────────
     The form posts to Formspree on its own with JavaScript off. Everything
     here is enhancement: guessing the location, and submitting without
     navigating the visitor away from the page.                            */
  var form = document.getElementById('contact-form');

  if (form) {
    var locWrap = document.getElementById('loc-wrap');
    var locInput = document.getElementById('loc-input');
    var locGuess = document.getElementById('loc-guess');
    var locName = document.getElementById('loc-name');
    var locChange = document.getElementById('loc-change');

    // Guess from the IP, but never trap anyone in a wrong guess: "Change?" swaps the
    // sentence for the plain input, which is what actually gets posted either way.
    //
    // Two providers, tried in order. The free tiers rate-limit per IP, and a shop on a
    // shared office connection will hit that — one provider alone means the guess quietly
    // stops working for exactly the visitors you most want to hear from.
    var geoSources = [
      { url: 'https://ipwho.is/?fields=city,region,country,success',
        read: function (d) { return d && d.success !== false ? [d.city, d.region, d.country] : null; } },
      { url: 'https://get.geojs.io/v1/ip/geo.json',
        read: function (d) { return d ? [d.city, d.region, d.country] : null; } },
    ];

    function showGuess(parts) {
      parts = (parts || []).filter(Boolean);
      if (parts.length < 2) { return false; }
      locInput.value = parts.join(', ');
      locName.textContent = parts.slice(-2).join(', ');
      locGuess.hidden = false;
      locWrap.setAttribute('data-guessed', '');
      return true;
    }

    (function tryGeo(i) {
      if (i >= geoSources.length) { return; }
      var src = geoSources[i];
      fetch(src.url)
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function (d) { if (!showGuess(src.read(d))) { tryGeo(i + 1); } })
        .catch(function () { tryGeo(i + 1); });
    })(0);

    locChange.addEventListener('click', function () {
      locWrap.removeAttribute('data-guessed');
      locGuess.hidden = true;
      locInput.focus();
      locInput.select();
    });

    var status = document.getElementById('form-status');
    var submit = document.getElementById('form-submit');

    form.addEventListener('submit', function (e) {
      if (!window.fetch || !form.reportValidity()) { return; }
      e.preventDefault();
      submit.disabled = true;
      submit.textContent = 'Sending…';
      status.textContent = '';
      status.removeAttribute('data-state');

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      }).then(function (res) {
        if (!res.ok) { throw new Error('rejected'); }
        form.reset();
        locWrap.removeAttribute('data-guessed');
        locGuess.hidden = true;
        status.textContent = 'Thanks — that reached us. We will reply to your email.';
        status.setAttribute('data-state', 'ok');
      }).catch(function () {
        status.textContent = 'That did not send. Email hello@zentro.example and we will pick it up.';
        status.setAttribute('data-state', 'err');
      }).then(function () {
        submit.disabled = false;
        submit.textContent = 'Send enquiry';
      });
    });
  }

  /* ── reveal on scroll ───────────────────────────────────────────────── */
  var rise = document.querySelectorAll('.rise');
  if (!window.IntersectionObserver || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    rise.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    rise.forEach(function (el) { io.observe(el); });
  }
})();
